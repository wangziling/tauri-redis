use crate::features::error::{Error, Result};
use tauri_redis_config::CFG;

pub fn get_connections_file_cache_manager_key() -> Result<String> {
    CFG.get_string("connections.file_cache_manager_key")
        .map_err(Error::FailedToGetRelatedConfig)
}

pub fn get_connections_file_name() -> Result<String> {
    CFG.get_string("connections.filename")
        .map_err(Error::FailedToGetRelatedConfig)
}
