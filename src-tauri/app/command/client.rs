use crate::features::client::RedisClientManager;
use crate::features::command::Guid;
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use redis::{cmd, ConnectionLike, FromRedisValue};
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

    let res = conn
        .req_command(&cmd("INFO"))
        .map_err(Error::RedisInternalError)?;

    let res = String::from_redis_value(&res).map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(res), None))
}
