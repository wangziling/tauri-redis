use crate::features::cache::FileCacheManager;
use crate::features::command::{ConnectionInfo, SaveConnectionPayload};
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use crate::utils::calculator::{gen_uuid, get_cur_time};
use crate::utils::config::get_connections_file_cache_manager_key;
use std::sync::{Arc, Mutex};
use tauri::State;
use tauri_redis_core::cache::abstracts::FileCacheBase;

fn invoke_get_connections(
    file_cache_manager: State<'_, Arc<Mutex<FileCacheManager>>>,
) -> Result<Vec<ConnectionInfo>> {
    let lock = file_cache_manager.lock().unwrap();
    let connections_file_cache = lock
        .get(&get_connections_file_cache_manager_key()?)
        .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

    connections_file_cache
        .as_de::<Vec<ConnectionInfo>>()
        .map_err(|_| Error::FailedToParseCachedConnectionsInfo)
}

#[tauri::command]
pub async fn save_connection(
    file_cache_manager: State<'_, Arc<Mutex<FileCacheManager>>>,
    connection_info: &str,
) -> Result<Response<()>> {
    serde_json::from_str(connection_info)
        .map_err(|_| Error::FailedToParseConnectionInfo)
        .and_then(|info: SaveConnectionPayload| {
            let connections_info = invoke_get_connections(file_cache_manager.clone());

            let mut lock = file_cache_manager.lock().unwrap();
            let connections_file_cache = lock
                .get_mut(&get_connections_file_cache_manager_key()?)
                .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

            let mut connections_info = connections_info.unwrap_or_default();

            if info.guid.is_some() {
                let found = connections_info
                    .iter()
                    .enumerate()
                    .find(|(_, i)| i.guid == *info.guid.as_ref().unwrap())
                    .and_then(|(idx, found_info)| Some((idx, found_info.clone())));
                if found.is_none() {
                    return Err(Error::FailedToFindTheMatchedConnectionInfo);
                }

                let info = info.clone();
                let found = found.unwrap();
                connections_info.remove(found.0);
                connections_info.insert(found.0, {
                    let mut found = found.1;
                    found.connection_name = info.connection_name.unwrap_or(found.connection_name);
                    found.host = info.host;
                    found.port = info.port;
                    found.username = info.username.unwrap_or(found.username);
                    found.password = info.password.unwrap_or(found.password);
                    found.separator = info.separator.unwrap_or(found.separator);
                    found.readonly = info.readonly.unwrap_or(found.readonly);

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

            connections_file_cache
                .replace_se(connections_info)
                .map_err(|_| Error::FailedToSaveConnectionInfo)?;

            connections_file_cache
                .save(true)
                .map_err(|_| Error::FailedToSaveConnectionInfo)?;

            drop(lock);

            Ok(Response::default())
        })
        .or_else(|err| Ok(err.into()))
}

#[tauri::command]
pub async fn get_connections(
    file_cache_manager: State<'_, Arc<Mutex<FileCacheManager>>>,
) -> Result<Response<Vec<ConnectionInfo>>> {
    invoke_get_connections(file_cache_manager)
        .and_then(|connections_info| Ok(Response::success(Some(connections_info), None)))
        .or_else(|err| Ok(err.into()))
}
