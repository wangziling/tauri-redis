use crate::features::client::{RedisClientManager, RedisInfoDict, RedisKeyType};
use crate::features::command::{Guid, TTL};
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use fred::interfaces::{ClientLike, HashesInterface, KeysInterface};
use fred::types::{CustomCommand, InfoKind, RedisValue};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tauri_plugin_tauri_redis_setting::SettingsManager;
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

    let result: String = conn
        .info(Some(InfoKind::All))
        .await
        .map_err(Error::RedisInternalError)?;

    let res = RedisInfoDict::new(result);
    // Transform the redisValue to String
    let mut result: HashMap<String, String> = Default::default();
    res.iter().for_each(|(key, value)| {
        result.insert(
            key.clone(),
            value
                .as_str()
                .unwrap_or_else(|| Default::default())
                .to_string(),
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

    // Here may be contains non RedisValue::String value.
    // Such as RedisValue::Bytes.
    // And the Type Conversion may throw errors.
    // let res: Vec<String> = conn
    let res: RedisValue = conn
        .custom(
            CustomCommand::new("KEYS", None, false),
            vec![condition_part
                .and_then(|part| if part.is_empty() { None } else { Some(part) })
                .map_or_else(|| "*".to_string(), |part| "*".to_string() + &part + "*")],
        )
        .await
        .map_err(Error::RedisInternalError)?;

    // let non_string_vec: Vec<RedisValue> = res.into_array().into_iter().filter(|r| !r.is_string()).collect();
    // dbg!(&non_string_vec);

    let result: Vec<String> = res
        .into_array()
        .into_iter()
        .filter_map(|item| item.into_string())
        .collect();

    Ok(Response::success(Some(result), None))
}

#[tauri::command]
pub async fn scan_all_keys(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    settings_manager: State<'_, SettingsManager>,
    guid: Guid,
    condition_part: Option<String>,
) -> Result<Response<Vec<String>>> {
    let mut lock = redis_client_manager.lock().await;

    let manager = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?;

    let pattern = condition_part
        .and_then(|part| if part.is_empty() { None } else { Some(part) })
        .map_or_else(|| "*".to_string(), |part| "*".to_string() + &part + "*");

    let settings_lock = settings_manager.read().await;
    let redis_each_scan_count: u32 = settings_lock.get_de("redisEachScanCount").unwrap();

    let scan_result = manager
        .scan(pattern, redis_each_scan_count, redis_each_scan_count, None)
        .await?;

    let result = scan_result
        .keys()
        .iter()
        .filter_map(|key| key.as_str().and_then(|str| Some(str.to_string())))
        .collect();

    Ok(Response::success(Some(result), None))
}

#[tauri::command]
pub async fn refresh_scanned_all_keys(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    settings_manager: State<'_, SettingsManager>,
    guid: Guid,
    condition_part: Option<String>,
    offset: Option<u32>,
) -> Result<Response<Vec<String>>> {
    let mut lock = redis_client_manager.lock().await;

    let manager = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?;

    let pattern = condition_part
        .and_then(|part| if part.is_empty() { None } else { Some(part) })
        .map_or_else(|| "*".to_string(), |part| "*".to_string() + &part + "*");

    let settings_lock = settings_manager.read().await;
    let redis_each_scan_count: u32 = settings_lock.get_de("redisEachScanCount").unwrap();

    let scan_result = manager
        .refresh_scan(
            pattern,
            redis_each_scan_count,
            redis_each_scan_count + offset.unwrap_or_default(),
            None,
        )
        .await?;

    let result = scan_result
        .keys()
        .iter()
        .filter_map(|key| key.as_str().and_then(|str| Some(str.to_string())))
        .collect();

    Ok(Response::success(Some(result), None))
}

#[tauri::command]
pub async fn create_new_key(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
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

    let mut lock = redis_client_manager.lock().await;

    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    match key_type {
        RedisKeyType::String => {
            conn.set(key_name, "".to_string(), None, None, false)
                .await
                .map_err(Error::RedisInternalError)?;
        }
        RedisKeyType::Hash => {
            conn.hset(key_name, ("New field", "New Value"))
                .await
                .map_err(Error::RedisInternalError)?;
        }
        _ => {}
    }

    Ok(Response::default())
}

#[tauri::command]
pub async fn remove_key(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
) -> Result<Response<()>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
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
pub async fn get_key_type(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
) -> Result<Response<RedisKeyType>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let key_type: String = conn
        .custom(CustomCommand::new("TYPE", None, false), vec![key_name])
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(RedisKeyType::from(key_type)), None))
}

#[tauri::command]
pub async fn get_key_ttl(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
) -> Result<Response<TTL>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
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
pub async fn set_key_ttl(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
    ttl: TTL,
) -> Result<Response<()>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.expire(key_name, ttl)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn rename_key(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
    new_key_name: String,
) -> Result<Response<()>> {
    if key_name.is_empty() || new_key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.rename(key_name, new_key_name)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn get_key_content_type_string(
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
) -> Result<Response<String>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
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
    redis_client_manager: State<'_, Arc<Mutex<RedisClientManager>>>,
    guid: Guid,
    key_name: String,
    content: String,
) -> Result<Response<()>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.set(key_name, content, None, None, false)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}
