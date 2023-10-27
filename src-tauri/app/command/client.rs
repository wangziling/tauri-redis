use crate::features::client::{RedisClientManagerState, RedisInfoDict, RedisKeyType};
use crate::features::command::{Guid, TTL};
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use crate::utils::config::get_redis_max_db_nums;
use fred::interfaces::{ClientLike, HashesInterface, KeysInterface, ServerInterface};
use fred::types::{CustomCommand, InfoKind, RedisValue};
use std::collections::HashMap;
use tauri::State;
use tauri_plugin_tauri_redis_setting::SettingsManager;

#[tauri::command]
pub async fn db_nums(
    redis_client_manager: State<'_, RedisClientManagerState>,
    guid: Guid,
) -> Result<Response<u8>> {
    let mut lock = redis_client_manager.lock().await;
    let _ = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let nums = get_redis_max_db_nums()?;

    Ok(Response::success(Some(nums), None))
}

#[tauri::command]
pub async fn switch_db(
    redis_client_manager: State<'_, RedisClientManagerState>,
    guid: Guid,
    db: u8,
) -> Result<Response<()>> {
    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.select(db).await.map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn flush_all(
    redis_client_manager: State<'_, RedisClientManagerState>,
    guid: Guid,
) -> Result<Response<()>> {
    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    conn.flushall(true)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn list_client_metrics(
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
        .refresh_scan(pattern, redis_each_scan_count, offset, None)
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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
    redis_client_manager: State<'_, RedisClientManagerState>,
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

#[tauri::command]
pub async fn get_key_content_type_hash(
    redis_client_manager: State<'_, RedisClientManagerState>,
    guid: Guid,
    key_name: String,
) -> Result<Response<HashMap<String, String>>> {
    if key_name.is_empty() {
        return Err(Error::InvalidRedisKeyName);
    }

    let mut lock = redis_client_manager.lock().await;
    let conn = lock
        .get_mut(&guid)
        .ok_or_else(|| Error::FailedToFindExistedRedisConnection)?
        .conn()?;

    let content: HashMap<String, String> = conn
        .hgetall(key_name)
        .await
        .map_err(Error::RedisInternalError)?;

    Ok(Response::success(Some(content), None))
}

#[tauri::command]
pub async fn hscan_key_all_values(
    redis_client_manager: State<'_, RedisClientManagerState>,
    settings_manager: State<'_, SettingsManager>,
    guid: Guid,
    key_name: String,
    condition_part: Option<String>,
) -> Result<Response<HashMap<String, String>>> {
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
        .hscan(
            key_name.into(),
            pattern,
            redis_each_scan_count,
            redis_each_scan_count,
        )
        .await?;

    let map = scan_result.take_map().inner();

    let mut result = HashMap::default();
    map.into_iter().for_each(|(key, value)| {
        result
            .entry(key.as_str().unwrap_or_default().to_string())
            .or_insert(value.as_string().unwrap_or_default());
    });

    Ok(Response::success(Some(result), None))
}

#[tauri::command]
pub async fn refresh_hscaned_key_all_values(
    redis_client_manager: State<'_, RedisClientManagerState>,
    settings_manager: State<'_, SettingsManager>,
    guid: Guid,
    key_name: String,
    condition_part: Option<String>,
    offset: Option<u32>,
) -> Result<Response<HashMap<String, String>>> {
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
        .refresh_hscan(key_name.into(), pattern, redis_each_scan_count, offset)
        .await?;

    let map = scan_result.take_map().inner();
    let mut result = HashMap::default();
    map.into_iter().for_each(|(key, value)| {
        result
            .entry(key.as_str().unwrap_or_default().to_string())
            .or_insert(value.as_string().unwrap_or_default());
    });

    Ok(Response::success(Some(result), None))
}
