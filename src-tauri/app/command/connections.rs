use crate::features::cache::FileCacheManagerState;
use crate::features::client::{
    RedisClientConnectionPayload, RedisClientManager, RedisClientManagerState,
};
use crate::features::command::{ConnectionInfo, Guid, SaveConnectionPayload};
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use crate::utils::calculator::{gen_uuid, get_cur_time};
use crate::utils::config::get_connections_file_cache_manager_key;
use crate::utils::judgements::judge_guid_valid;
use tauri::State;
use tauri_redis_core::cache::abstracts::FileCacheBase;

async fn invoke_get_connections(
    file_cache_manager: &State<'_, FileCacheManagerState>,
) -> Result<Vec<ConnectionInfo>> {
    let lock = file_cache_manager.lock().await;
    let connections_file_cache = lock
        .get(&get_connections_file_cache_manager_key()?)
        .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

    connections_file_cache
        .as_de::<Vec<ConnectionInfo>>()
        .map_err(|_| Error::FailedToParseCachedConnectionsInfo)
}

async fn invoke_find_connection<'a>(
    connections_info: &'a Vec<ConnectionInfo>,
    guid: &Guid,
) -> Result<(usize, &'a ConnectionInfo)> {
    judge_guid_valid(&guid)?;

    connections_info
        .iter()
        .enumerate()
        .find(|(_, i)| i.guid == *guid)
        .ok_or_else(|| Error::FailedToFindTheMatchedConnectionInfo)
        .and_then(|(idx, found_info)| Ok((idx, found_info)))
}

async fn invoke_establish_connection<'a>(
    file_cache_manager: &State<'_, FileCacheManagerState>,
    redis_client_manager: &State<'_, RedisClientManagerState>,
    guid: &'a Guid,
) -> Result<()> {
    let connections_info = invoke_get_connections(&file_cache_manager).await?;
    let (_, connection_info) = invoke_find_connection(&connections_info, guid).await?;

    // Release the lock quickly.
    let mut lock = redis_client_manager.lock().await;
    let existed_one = lock.get_mut(guid);
    if existed_one.is_some() {
        drop(lock);
        return Ok(());
    }

    drop(lock);

    // Use invoke functionality.
    let client = RedisClientManager::invoke_new_client(RedisClientConnectionPayload {
        host: connection_info.host.clone(),
        port: connection_info.port.clone(),
        username: Some(connection_info.username.clone()),
        password: Some(connection_info.password.clone()),
        guid: guid.clone(),
    })
    .await?;

    // Only after we got the new client, we call the lock.
    // Otherwise if we call lock when we are trying to get client, it will stuck. It cannot concurrently connect to other clients.
    let mut lock = redis_client_manager.lock().await;

    lock.record_new_client(guid.clone(), client)?;

    Ok(())
}

async fn invoke_release_connection<'a>(
    file_cache_manager: &State<'_, FileCacheManagerState>,
    redis_client_manager: &State<'_, RedisClientManagerState>,
    guid: &'a Guid,
) -> Result<()> {
    let mut connections_info = invoke_get_connections(&file_cache_manager).await?;
    let found = {
        let found = invoke_find_connection(&connections_info, guid).await?;

        (found.0, found.1.clone())
    };

    let mut lock = redis_client_manager.lock().await;

    // Release.
    // Seems the fred redis client didn't support Drop trait.
    lock.release_client(guid).await?;
    drop(lock);

    let (idx, mut connection_info) = found;
    connection_info.connected_at = Some(get_cur_time());
    connections_info.remove(idx);
    connections_info.insert(idx, connection_info);

    let mut lock = file_cache_manager.lock().await;
    let connections_file_cache = lock
        .get_mut(&get_connections_file_cache_manager_key()?)
        .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

    connections_file_cache
        .replace_se(connections_info)
        .map_err(|_| Error::FailedToSaveConnectionInfo)?;

    connections_file_cache
        .save(true)
        .map_err(|_| Error::FailedToSaveConnectionInfo)?;

    drop(lock);

    Ok(())
}

async fn invoke_save_connection(
    file_cache_manager: &State<'_, FileCacheManagerState>,
    info: SaveConnectionPayload,
) -> Result<()> {
    let connections_info = invoke_get_connections(&file_cache_manager).await;
    let mut connections_info = connections_info.unwrap_or_default();
    if info.guid.is_some() {
        let found = {
            let found =
                invoke_find_connection(&connections_info, info.guid.as_ref().unwrap()).await?;

            (found.0, found.1.clone())
        };

        connections_info.remove(found.0);
        connections_info.insert(found.0, {
            let info = info.clone();
            let mut found = found.1;

            found.connection_name = info.connection_name.unwrap_or(found.connection_name);
            found.host = info.host;
            found.port = info.port;
            found.username = info.username.unwrap_or(found.username);
            found.password = info.password.unwrap_or(found.password);
            found.separator = info.separator.unwrap_or(found.separator);
            found.readonly = info.readonly.unwrap_or(found.readonly);
            found.updated_at = Some(get_cur_time());

            found
        });
    } else {
        connections_info.push(ConnectionInfo {
            guid: gen_uuid(),
            created_at: get_cur_time(),
            connection_name: info.connection_name.unwrap_or_default(),
            host: info.host,
            port: info.port,
            separator: info.separator.unwrap_or_default(),
            username: info.username.unwrap_or_default(),
            password: info.password.unwrap_or_default(),
            readonly: info.readonly.unwrap_or_default(),
            updated_at: None,
            connected_at: None,
        });
    }

    let mut lock = file_cache_manager.lock().await;
    let connections_file_cache = lock
        .get_mut(&get_connections_file_cache_manager_key()?)
        .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

    connections_file_cache
        .replace_se(connections_info)
        .map_err(|_| Error::FailedToSaveConnectionInfo)?;

    connections_file_cache
        .save(true)
        .map_err(|_| Error::FailedToSaveConnectionInfo)?;

    drop(lock);

    Ok(())
}

async fn invoke_remove_connection<'a>(
    file_cache_manager: &State<'_, FileCacheManagerState>,
    guid: &'a Guid,
) -> Result<()> {
    judge_guid_valid(guid)?;

    let mut connections_info = invoke_get_connections(&file_cache_manager)
        .await
        .unwrap_or_default();
    let found = invoke_find_connection(&connections_info, guid).await?;
    connections_info.remove(found.0);

    let mut lock = file_cache_manager.lock().await;
    let connections_file_cache = lock
        .get_mut(&get_connections_file_cache_manager_key()?)
        .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

    connections_file_cache
        .replace_se(connections_info)
        .map_err(|_| Error::FailedToSaveConnectionInfo)?;

    connections_file_cache
        .save(true)
        .map_err(|_| Error::FailedToSaveConnectionInfo)?;

    drop(lock);

    Ok(())
}

#[tauri::command]
pub async fn save_connection(
    file_cache_manager: State<'_, FileCacheManagerState>,
    connection_info: &str,
) -> Result<Response<()>> {
    let info: Result<SaveConnectionPayload> =
        serde_json::from_str(connection_info).map_err(|_| Error::FailedToParseConnectionInfo);
    if info.is_err() {
        return Ok(info.err().unwrap().into());
    }

    invoke_save_connection(&file_cache_manager, info.unwrap()).await?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn get_connections(
    file_cache_manager: State<'_, FileCacheManagerState>,
) -> Result<Response<Vec<ConnectionInfo>>> {
    invoke_get_connections(&file_cache_manager)
        .await
        .and_then(|connections_info| Ok(Response::success(Some(connections_info), None)))
        .or_else(|err| Ok(err.into()))
}

#[tauri::command]
pub async fn establish_connection(
    file_cache_manager: State<'_, FileCacheManagerState>,
    redis_client_manager: State<'_, RedisClientManagerState>,
    guid: String,
) -> Result<Response<()>> {
    invoke_establish_connection(&file_cache_manager, &redis_client_manager, &guid)
        .await
        .and_then(|_| Ok(Response::default()))
        .or_else(|err| Ok(err.into()))
}

#[tauri::command]
pub async fn release_connection(
    file_cache_manager: State<'_, FileCacheManagerState>,
    redis_client_manager: State<'_, RedisClientManagerState>,
    guid: String,
) -> Result<Response<()>> {
    invoke_release_connection(&file_cache_manager, &redis_client_manager, &guid)
        .await
        .and_then(|_| Ok(Response::default()))
        .or_else(|err| Ok(err.into()))
}

#[tauri::command]
pub async fn remove_connection(
    file_cache_manager: State<'_, FileCacheManagerState>,
    guid: Guid,
) -> Result<Response<()>> {
    invoke_remove_connection(&file_cache_manager, &guid)
        .await
        .and_then(|_| Ok(Response::default()))
        .or_else(|err| Ok(err.into()))
}
