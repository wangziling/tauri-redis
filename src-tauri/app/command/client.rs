use crate::features::client::{RedisKeyType, REDIS_CLIENT_MANAGER};
use crate::features::command::{Guid, TTL};
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use redis::{cmd, AsyncCommands, FromRedisValue, InfoDict};
use std::collections::HashMap;

#[tauri::command]
pub async fn list_client_metrics(guid: Guid) -> Result<Response<HashMap<String, String>>> {
    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
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
    guid: Guid,
    condition_part: Option<String>,
) -> Result<Response<Vec<String>>> {
    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
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

#[tauri::command]
pub async fn create_new_key(
    guid: Guid,
    key_name: String,
    key_type: RedisKeyType,
) -> Result<Response<()>> {
    if !key_type.is_valid() {
        return Err(Error::InvalidRedisKeyType);
    }

    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;

    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    match key_type {
        RedisKeyType::String => {
            conn.set(key_name, "".to_string())
                .await
                .map_err(Error::RedisInternalError)?;
        }
        RedisKeyType::Hash => {
            conn.hset(key_name, "New field", "New Value")
                .await
                .map_err(Error::RedisInternalError)?;
        }
        _ => {}
    }

    Ok(Response::default())
}

#[tauri::command]
pub async fn remove_key(guid: Guid, key_name: String) -> Result<Response<()>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.del(key_name)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn get_key_type(guid: Guid, key_name: String) -> Result<Response<RedisKeyType>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let key_type: String = conn
        .key_type(key_name)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(RedisKeyType::from(key_type)), None))
}

#[tauri::command]
pub async fn get_key_ttl(guid: Guid, key_name: String) -> Result<Response<TTL>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let ttl: TTL = conn
        .ttl(key_name)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(ttl), None))
}

#[tauri::command]
pub async fn set_key_ttl(guid: Guid, key_name: String, ttl: TTL) -> Result<Response<()>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.expire(key_name, {
        if ttl < 0 {
            0
        } else {
            ttl as usize
        }
    })
    .await
    .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn get_key_content_type_string(guid: Guid, key_name: String) -> Result<Response<String>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let content: String = conn
        .get(key_name)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(content), None))
}

#[tauri::command]
pub async fn set_key_content_type_string(
    guid: Guid,
    key_name: String,
    content: String,
) -> Result<Response<()>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = REDIS_CLIENT_MANAGER.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.set(key_name, content)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}
