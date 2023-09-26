use crate::features::client::RedisClientManager;
use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use redis::{cmd, FromRedisValue, InfoDict};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn list_client_metrics(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
) -> Result<Response<HashMap<String, String>>> {
    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    // See: https://github.com/redis-rs/redis-rs/pull/661
    let res = conn
        .send_packed_command(&cmd("INFO"))
        .await
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

    Ok(Response::success(Some(result), None))
}

#[tauri::command]
pub async fn list_all_keys(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    condition_part: Option<String>,
) -> Result<Response<Vec<String>>> {
    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let res = conn
        .send_packed_command(
            &cmd("KEYS").arg(
                condition_part
                    .and_then(|part| if part.is_empty() { None } else { Some(part) })
                    .map_or_else(|| "*".to_string(), |part| "*".to_string() + &part + "*"),
            ),
        )
        .await
        .map_err(Error::RedisInternalError)?;

    let res: Vec<String> = Vec::from_redis_value(&res).map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(res), None))
}
