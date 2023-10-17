use crate::features::cache::FileCacheManager;
use crate::features::command::Miscs;
use crate::features::error::{Error, Result};
use crate::features::response::Response;
use crate::utils::config::get_miscs_file_cache_manager_key;
use std::sync::Arc;
use tauri::State;
use tauri_redis_core::cache::abstracts::FileCacheBase;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn record_page_route_visited(
    file_cache_manager: State<'_, Arc<Mutex<FileCacheManager>>>,
    page_route: String,
) -> Result<Response<()>> {
    let mut lock = file_cache_manager.lock().await;

    let miscs_file_cache = lock
        .get_mut(&get_miscs_file_cache_manager_key().unwrap())
        .ok_or_else(|| Error::FailedToGetCachedMiscsInfo)?;

    let mut miscs = miscs_file_cache
        .as_de::<Miscs>()
        .map_err(|_| Error::FailedToParseCachedMiscsInfo)
        .unwrap_or_default();

    if miscs.visited_page_routes.contains(&page_route) {
        return Ok(Response::default());
    }

    miscs.visited_page_routes.push(page_route);

    miscs_file_cache.replace_se(miscs)?;

    miscs_file_cache.save(true)?;

    Ok(Response::default())
}

#[tauri::command]
pub async fn judge_page_route_visited(
    file_cache_manager: State<'_, Arc<Mutex<FileCacheManager>>>,
    page_route: String,
) -> Result<Response<bool>> {
    let mut lock = file_cache_manager.lock().await;

    let miscs_file_cache = lock
        .get_mut(&get_miscs_file_cache_manager_key().unwrap())
        .ok_or_else(|| Error::FailedToGetCachedMiscsInfo)?;

    let miscs = miscs_file_cache
        .as_de::<Miscs>()
        .map_err(|_| Error::FailedToParseCachedMiscsInfo)
        .unwrap_or_default();

    Ok(Response::success(
        Some(miscs.visited_page_routes.contains(&page_route)),
        None,
    ))
}
