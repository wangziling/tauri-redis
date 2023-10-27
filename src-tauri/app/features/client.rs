#![allow(dead_code)]

use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::utils::config::get_redis_connection_timeout;
use fred::interfaces::ClientLike;
use fred::tracing::Level;
use fred::types::{
    Blocking, Builder, RedisConfig, RedisKey, RedisValue, RespVersion, ScanType, Scanner,
    ServerConfig, TracingConfig,
};
use futures::StreamExt;
use once_cell::sync::Lazy;
use serde::Serialize;
use std::collections::{hash_map, HashMap};
use std::ops::{Deref, DerefMut};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::command::{CommandArg, CommandItem};
use tauri::{InvokeError, Runtime};
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver};
use tokio::task::JoinHandle;

static PENDING_REDIS_CONNECTION_TASKS: Lazy<Arc<std::sync::Mutex<Vec<Guid>>>> =
    Lazy::new(|| Arc::new(std::sync::Mutex::new(vec![])));

pub struct RedisInfoDict {
    map: HashMap<String, RedisValue>,
}

// Inspired from https://github.com/redis-rs/redis-rs/blob/d8c5436ea8fe19f10efefd55cbc1f9d36700e8df/redis/src/types.rs#L687
// Thanks a lot.
impl RedisInfoDict {
    pub fn new(info_str: impl Into<String>) -> Self {
        let mut map = HashMap::new();

        for line in info_str.into().lines() {
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let mut p = line.splitn(2, ':');
            let key = p.next();
            if key.is_none() {
                continue;
            }
            let value = p.next();
            if value.is_none() {
                continue;
            }

            let key = key.unwrap().to_string();
            let value = value.unwrap().to_string();

            map.insert(key, RedisValue::String(value.into()));
        }

        Self { map }
    }

    /// Looks up a key in the info dict.
    pub fn find(&self, key: impl Into<String>) -> Option<&RedisValue> {
        self.map.get(&key.into())
    }

    /// Checks if a key is contained in the info dicf.
    pub fn contains_key(&self, key: impl Into<String>) -> bool {
        self.find(&key.into()).is_some()
    }

    /// Returns the size of the info dict.
    pub fn len(&self) -> usize {
        self.map.len()
    }

    /// Checks if the dict is empty.
    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }
}

impl Deref for RedisInfoDict {
    type Target = HashMap<String, RedisValue>;

    fn deref(&self) -> &Self::Target {
        &self.map
    }
}

#[derive(PartialEq, Debug, Serialize)]
pub enum RedisKeyType {
    String,
    Hash,
    Unknown,
}

impl<T> From<T> for RedisKeyType
where
    T: Into<String>,
{
    fn from(value: T) -> Self {
        let value = value.into();

        match value.to_lowercase().as_str() {
            "hash" => RedisKeyType::Hash,
            "string" => RedisKeyType::String,
            _ => RedisKeyType::Unknown,
        }
    }
}

impl RedisKeyType {
    pub fn is_valid(&self) -> bool {
        *self != RedisKeyType::Unknown
    }
}

impl<'de, R: Runtime> CommandArg<'de, R> for RedisKeyType {
    fn from_command(command: CommandItem<'de, R>) -> std::result::Result<Self, InvokeError> {
        Ok(command
            .message
            .payload()
            .get(command.key)
            .unwrap()
            .as_str()
            .unwrap()
            .into())
    }
}

#[derive(Default, Debug)]
pub struct RedisClientConnectionPayload {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,

    pub guid: Guid,
}

#[derive(Debug)]
pub struct RedisScannerResult {
    keys: Vec<RedisKey>,
    can_continue: bool,
}

impl RedisScannerResult {
    pub fn keys(&self) -> &Vec<RedisKey> {
        &self.keys
    }
    pub fn can_continue(&self) -> bool {
        self.can_continue
    }
}

impl Default for RedisScannerResult {
    fn default() -> Self {
        Self {
            keys: Default::default(),
            can_continue: true,
        }
    }
}

pub struct RedisScanner {
    pattern: String,
    iter_count: u32,
    r#type: Option<ScanType>,
    rx: UnboundedReceiver<Result<RedisScannerResult>>,
    signal: Arc<AtomicBool>,
    handler: Option<JoinHandle<()>>,
    scanned_count: Arc<AtomicU32>,
}

pub struct RedisClient {
    manager: fred::clients::RedisClient,
    scanner: Option<RedisScanner>,
}

pub type RedisClientManagerState = Arc<tauri::async_runtime::Mutex<RedisClientManager>>;

#[derive(Default)]
pub struct RedisClientManager {
    inner: HashMap<Guid, RedisClient>,
}

impl RedisClient {
    pub async fn new(payload: RedisClientConnectionPayload) -> Result<Self> {
        let config = RedisConfig {
            fail_fast: true,
            server: ServerConfig::new_centralized(payload.host, payload.port),
            blocking: Blocking::Block,
            username: {
                payload
                    .username
                    .and_then(|un| if un.is_empty() { None } else { Some(un) })
            },
            password: {
                payload
                    .password
                    .and_then(|ps| if ps.is_empty() { None } else { Some(ps) })
            },
            version: RespVersion::RESP2,
            database: None,
            tracing: TracingConfig {
                enabled: true,
                default_tracing_level: Level::INFO,
                full_tracing_level: Level::DEBUG,
            },
        };

        let client = Builder::from_config(config)
            .with_connection_config(|config| {
                config.connection_timeout =
                    Duration::from_secs(get_redis_connection_timeout().unwrap().into());
                config.internal_command_timeout =
                    Duration::from_secs(get_redis_connection_timeout().unwrap().into());
            })
            .build()
            .map_err(Error::RedisInternalError)?;

        // Connect.
        client.connect();

        client
            .wait_for_connect()
            .await
            .map_err(Error::RedisInternalError)?;

        Ok(Self {
            manager: client,
            scanner: None,
        })
    }

    pub fn conn(&mut self) -> Result<&mut fred::clients::RedisClient> {
        Ok(&mut self.manager)
    }

    async fn _invoke_new_scan(
        &mut self,
        pattern: String,
        iter_count: u32,
        needed_count: u32,
        r#type: Option<ScanType>,
    ) -> Result<()> {
        let (sx, rx) = unbounded_channel::<Result<RedisScannerResult>>();

        let signal = Arc::new(AtomicBool::new(true));
        let scanned_count = Arc::new(AtomicU32::new(0));

        let old = self.scanner.replace(RedisScanner {
            rx,
            pattern: pattern.clone(),
            iter_count,
            r#type: r#type.clone(),
            signal: signal.clone(),
            handler: None,
            scanned_count: scanned_count.clone(),
        });

        drop(old);

        let conn = self.conn()?;
        let mut stream = conn.scan(pattern, Some(iter_count), r#type);
        let signal = signal.clone();
        let scanned_count = scanned_count.clone();
        let old = self
            .scanner
            .as_mut()
            .unwrap()
            .handler
            .replace(tokio::spawn(async move {
                loop {
                    if signal.load(Ordering::Relaxed) {
                        signal.fetch_and(false, Ordering::Relaxed);

                        let mut sent = false;
                        let mut keys = Vec::with_capacity(iter_count as usize);
                        while let Some(result) = stream.next().await {
                            let result = result.map_err(Error::RedisInternalError);
                            if result.is_err() {
                                sx.send(Err(result.err().unwrap())).unwrap();
                                sent = true;

                                // End `next` loop.
                                // Means we only request once.
                                break;
                            }

                            let mut value = result.unwrap();
                            let can_continue = value.has_more();
                            let mut scanned_keys = value.take_results().unwrap_or_default();

                            // Append
                            keys.append(&mut scanned_keys);

                            // Record scanned count.
                            // Use keys.len() to use the `.with_capacity` related functionality.
                            scanned_count.fetch_add(keys.len() as u32, Ordering::Relaxed);

                            // If we scanned enough items
                            // or cannot scan anymore.
                            let scanned_count_raw = scanned_count.load(Ordering::Relaxed);
                            let scanned_enough = scanned_count_raw >= needed_count || !can_continue;
                            if scanned_enough {
                                sx.send(Ok(RedisScannerResult { keys, can_continue }))
                                    .unwrap();
                                sent = true;

                                // Must use this, continue scanning.
                                // Otherwise we will always got the previous result.
                                let _ = value.next();

                                // End `next` loop.
                                break;
                            }

                            // Continue scanning.
                            let _ = value.next();
                        }

                        if !sent {
                            sx.send(Ok(Default::default())).unwrap();
                        }
                    } else {
                        tokio::time::sleep(Duration::from_millis(500)).await;
                    }
                }
            }));

        drop(old);

        Ok(())
    }

    pub async fn scan(
        &mut self,
        pattern: String,
        iter_count: u32,
        needed_count: u32,
        r#type: Option<ScanType>,
    ) -> Result<RedisScannerResult> {
        let iter_count = iter_count.max(needed_count);

        if self.scanner.is_some() {
            let scanner = self.scanner.as_mut().unwrap();

            if scanner.pattern != pattern
                || scanner.iter_count != iter_count
                || scanner.r#type != r#type
            {
                self._invoke_new_scan(pattern, iter_count, needed_count, r#type)
                    .await?;
            }
        } else {
            self._invoke_new_scan(pattern, iter_count, needed_count, r#type)
                .await?;
        }

        // Continue scan.
        let scanner = self.scanner.as_mut().unwrap();
        scanner.signal.fetch_or(true, Ordering::Relaxed);

        while let Some(result) = scanner.rx.recv().await {
            return result;
        }

        Err(Error::FailedToGetRedisScanResult)
    }

    pub async fn refresh_scan(
        &mut self,
        pattern: String,
        iter_count: u32,
        offset: Option<u32>,
        r#type: Option<ScanType>,
    ) -> Result<RedisScannerResult> {
        let needed_count = if self.scanner.is_some() {
            self.scanner
                .as_ref()
                .unwrap()
                .scanned_count
                .load(Ordering::Relaxed)
        } else {
            iter_count
        };

        self._invoke_new_scan(
            pattern,
            iter_count,
            // Add offset until reaching the maximum num.
            needed_count.saturating_add(offset.unwrap_or_default()),
            r#type,
        )
        .await?;

        // Continue scan.
        let scanner = self.scanner.as_mut().unwrap();
        scanner.signal.fetch_or(true, Ordering::Relaxed);

        while let Some(result) = scanner.rx.recv().await {
            return result;
        }

        Err(Error::FailedToGetRedisScanResult)
    }
}

impl RedisClientManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn judge_pending(guid: &Guid) -> bool {
        PENDING_REDIS_CONNECTION_TASKS
            .lock()
            .unwrap()
            .contains(guid)
    }

    pub fn mark_as_pending(guid: &Guid) -> () {
        if RedisClientManager::judge_pending(guid) {
            return;
        }

        PENDING_REDIS_CONNECTION_TASKS
            .lock()
            .unwrap()
            .push(guid.clone());
    }

    pub fn release_pending(guid: &Guid) -> () {
        if !RedisClientManager::judge_pending(guid) {
            return;
        }

        let guid = guid.clone();
        let mut lock = PENDING_REDIS_CONNECTION_TASKS.lock().unwrap();
        let index = lock.iter().position(|t| *t == guid);
        if index.is_none() {
            return;
        }

        lock.remove(index.unwrap());
    }

    pub async fn invoke_new_client(payload: RedisClientConnectionPayload) -> Result<RedisClient> {
        if RedisClientManager::judge_pending(&payload.guid) {
            return Err(Error::AlreadyAPendingRedisConnection);
        }

        RedisClientManager::mark_as_pending(&payload.guid);

        let guid = payload.guid.clone();
        let result = RedisClient::new(payload).await;

        RedisClientManager::release_pending(&guid);
        result
    }

    pub async fn new_client(
        &mut self,
        payload: RedisClientConnectionPayload,
    ) -> Result<&mut RedisClient> {
        return match self.entry(payload.guid.clone()) {
            hash_map::Entry::Occupied(matched) => Ok(matched.into_mut()),
            hash_map::Entry::Vacant(map_self) => {
                Ok(map_self.insert(RedisClientManager::invoke_new_client(payload).await?))
            }
        };
    }

    pub fn record_new_client(
        &mut self,
        guid: Guid,
        client: RedisClient,
    ) -> Result<&mut RedisClient> {
        return match self.entry(guid) {
            hash_map::Entry::Occupied(matched) => Ok(matched.into_mut()),
            hash_map::Entry::Vacant(map_self) => Ok(map_self.insert(client)),
        };
    }

    pub async fn release_client(&mut self, guid: &Guid) -> Result<()> {
        let found_client = self.get(guid);
        let client = found_client.ok_or_else(|| Error::FailedToFindExistedRedisConnection)?;

        client
            .manager
            .quit()
            .await
            .map_err(Error::RedisInternalError)?;
        self.remove(guid);

        Ok(())
    }
}

impl Deref for RedisClient {
    type Target = fred::clients::RedisClient;

    fn deref(&self) -> &Self::Target {
        &self.manager
    }
}

impl DerefMut for RedisClient {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.manager
    }
}

impl Deref for RedisClientManager {
    type Target = HashMap<Guid, RedisClient>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for RedisClientManager {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}
