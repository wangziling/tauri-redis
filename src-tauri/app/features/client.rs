use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::utils::config::{get_redis_connection_timeout, get_reds_max_pool_size};
use redis::IntoConnectionInfo;
use std::collections::{hash_map, HashMap};
use std::ops::{Deref, DerefMut};
use std::time::Duration;

#[derive(Default, Debug)]
pub struct RedisClientConnectionPayload {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,

    pub guid: Guid,
}

pub struct RedisClient {
    pub pool: r2d2::Pool<redis::Client>,
}

#[derive(Default)]
pub struct RedisClientManager {
    inner: HashMap<Guid, RedisClient>,
}

impl RedisClient {
    pub fn new(payload: RedisClientConnectionPayload) -> Result<Self> {
        let max_pool_size = get_reds_max_pool_size().unwrap_or(5_u8);
        let connection_timeout = get_redis_connection_timeout().unwrap_or(10_u8);

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

        let pool = r2d2::Pool::builder()
            .max_size(max_pool_size as u32)
            .connection_timeout(Duration::from_secs(connection_timeout as u64))
            .build(redis_client)
            .map_err(Error::R2d2InternalError)?;

        Ok(Self { pool })
    }

    pub fn conn(&self) -> Result<r2d2::PooledConnection<redis::Client>> {
        self.pool
            .get_timeout(Duration::from_secs(
                get_redis_connection_timeout().unwrap_or(10_u8) as u64,
            ))
            .map_err(Error::R2d2InternalError)
    }
}

impl RedisClientManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_client(
        &mut self,
        payload: RedisClientConnectionPayload,
    ) -> Result<&mut RedisClient> {
        return match self.entry(payload.guid.clone()) {
            hash_map::Entry::Occupied(matched) => Ok(matched.into_mut()),
            hash_map::Entry::Vacant(map_self) => Ok(map_self.insert(RedisClient::new(payload)?)),
        };
    }
}

impl Deref for RedisClient {
    type Target = r2d2::Pool<redis::Client>;

    fn deref(&self) -> &Self::Target {
        &self.pool
    }
}

impl DerefMut for RedisClient {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.pool
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
