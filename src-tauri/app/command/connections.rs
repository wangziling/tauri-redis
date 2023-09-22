use crate::features::cache::FileCacheManager;
use crate::features::command::ConnectionInfo;
use crate::features::error::{Error, Result};
use crate::features::response::Response;
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
        .and_then(|info: ConnectionInfo| {
            let connections_info = invoke_get_connections(file_cache_manager.clone());

            let mut lock = file_cache_manager.lock().unwrap();
            let connections_file_cache = lock
                .get_mut(&get_connections_file_cache_manager_key()?)
                .ok_or_else(|| Error::FailedToGetCachedConnectionsInfo)?;

            connections_file_cache
                .replace_se({
                    let mut connections_info = connections_info.unwrap_or_default();
                    connections_info.push(info);

                    connections_info
                })
                .map_err(|_| Error::FailedToSaveConnectionInfo)?;

            connections_file_cache
                .save()
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
