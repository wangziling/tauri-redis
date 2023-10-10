use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::utils::config::get_redis_connection_timeout;
use fred::interfaces::ClientLike;
use fred::tracing::Level;
use fred::types::{
    Blocking, Builder, RedisConfig, RedisValue, RespVersion, ServerConfig, TracingConfig,
};
use once_cell::sync::Lazy;
use serde::Serialize;
use std::collections::{hash_map, HashMap};
use std::ops::{Deref, DerefMut};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::command::{CommandArg, CommandItem};
use tauri::{InvokeError, Runtime};

static PENDING_REDIS_CONNECTION_TASKS: Lazy<Arc<Mutex<Vec<Guid>>>> =
    Lazy::new(|| Arc::new(Mutex::new(vec![])));

pub struct RedisInfoDict {
    map: HashMap<String, RedisValue>,
}

// Inspired from https://github.com/redis-rs/redis-rs/blob/d8c5436ea8fe19f10efefd55cbc1f9d36700e8df/redis/src/types.rs#L687
// Thanks a lot.
#[allow(dead_code)]
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

// impl From<RedisValue> for RedisInfoDict {
//     fn from(value: RedisValue) -> Self {
//         Self::new(String::from_value(value).unwrap())
//     }
// }

#[allow(dead_code)]
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

pub struct RedisClient {
    manager: fred::clients::RedisClient,
}

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

        Ok(Self { manager: client })
    }

    pub fn conn(&mut self) -> Result<&mut fred::clients::RedisClient> {
        Ok(&mut self.manager)
    }
}

#[allow(dead_code)]
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
