use crate::features::client::RedisClientManager;
use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use redis::{cmd, ConnectionLike, FromRedisValue, InfoDict};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

#[tauri::command]
pub async fn list_client_metrics(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
) -> Result<Response<String>> {
    let mut lock = redis_client_manager.lock().unwrap();
    let mut conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    // See: https://github.com/redis-rs/redis-rs/pull/661
    let res = conn
        .req_command(&cmd("INFO"))
        .map_err(Error::RedisInternalError)?;
    let res = InfoDict::from_redis_value(&res).map_err(Error::RedisInternalError)?;

    // Transform the redisValue to String
    let mut result: HashMap<String, String> = Default::default();
    res.iter().for_each(|(key, value)| {
        result.insert(
            key.clone(),
            String::from_redis_value(value).unwrap_or_else(|_| "".to_string()),
        );
    });

    // Then serialize the HashMap to string.
    // The data is a string not an object. So the frontend side may need to parse it.
    Ok(Response::success(
        Some(serde_json::to_string(&result).map_err(Error::SerdeJsonError)?),
        None,
    ))
}
