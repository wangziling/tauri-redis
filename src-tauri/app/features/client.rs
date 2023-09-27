use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::utils::config::get_redis_connection_timeout;
use once_cell::sync::Lazy;
use redis::IntoConnectionInfo;
use std::collections::{hash_map, HashMap};
use std::ops::{Deref, DerefMut};
use std::sync::{Arc, Mutex};

static PENDING_REDIS_CONNECTION_TASKS: Lazy<Arc<Mutex<Vec<Guid>>>> =
    Lazy::new(|| Arc::new(Mutex::new(vec![])));

#[derive(Default, Debug)]
pub struct RedisClientConnectionPayload {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,

    pub guid: Guid,
}

pub struct RedisClient {
    manager: redis::aio::ConnectionManager,
}

#[derive(Default)]
pub struct RedisClientManager {
    inner: HashMap<Guid, RedisClient>,
}

impl RedisClient {
    pub async fn new(payload: RedisClientConnectionPayload) -> Result<Self> {
        let _connection_timeout = get_redis_connection_timeout().unwrap_or(10_u8);

        let redis_client = redis::Client::open({
            let mut connection_info = (payload.host, payload.port)
                .into_connection_info()
                .map_err(Error::RedisInternalError)?;

            connection_info.redis.username = payload.username.and_then(|username| {
                if username.is_empty() {
                    None
                } else {
                    Some(username)
                }
            });
            connection_info.redis.password = payload.password.and_then(|password| {
                if password.is_empty() {
                    None
                } else {
                    Some(password)
                }
            });

            connection_info
        })
        .map_err(Error::RedisInternalError)?;

        let manager = redis::aio::ConnectionManager::new(redis_client).await?;

        Ok(Self { manager })
    }

    pub fn conn(&mut self) -> Result<&mut redis::aio::ConnectionManager> {
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
}

impl Deref for RedisClient {
    type Target = redis::aio::ConnectionManager;

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
