use crate::features::cache::FileCacheManager;
use crate::features::client::RedisClientManager;
use crate::utils::config::{get_connections_file_cache_manager_key, get_connections_file_name};
use std::sync::Arc;
use tauri::{App, Manager, Result, Runtime};
use tauri_plugin_tauri_redis_setting::SettingsManager;
use tauri_plugin_tauri_redis_translation::TRANSLATIONS;
use tauri_redis_core::cache::abstracts::FileCacheBase;
use tauri_redis_core::cache::impls::FileCache;

fn setup_file_cache_manager<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    let handle = app.handle();
    let path_resolver = handle.path_resolver();

    let mut file_cache_manager: FileCacheManager = FileCacheManager::default();

    file_cache_manager
        .entry(
            get_connections_file_cache_manager_key()
                .map_err(|err| err.into_anyhow())
                .unwrap(),
        )
        .or_insert_with(|| {
            let connections_path = path_resolver.app_local_data_dir().unwrap();
            let mut file_cache = FileCache::new(connections_path);
            let _ = file_cache.load(
                get_connections_file_name()
                    .map_err(|err| err.into_anyhow())
                    .unwrap(),
            );

            file_cache
        });

    handle.manage(Arc::new(tokio::sync::Mutex::new(file_cache_manager)));

    Ok(())
}

fn setup_redis_client_manager<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    let handle = app.handle();

    handle.manage(Arc::new(tokio::sync::Mutex::new(RedisClientManager::new())));

    Ok(())
}

fn setup_page_metrics<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    let handle = app.handle();

    // Get the current language and enable it.
    let settings_manager = handle.state::<SettingsManager>();

    tauri::async_runtime::block_on(async move {
        let settings_manager_lock = settings_manager.read().await;
        let target_language = settings_manager_lock.get("language");
        if target_language.is_some() {
            let target_language = target_language.unwrap().as_str().unwrap();

            TRANSLATIONS
                .write()
                .unwrap()
                .switch_to(target_language)
                .unwrap();
        }
    });

    Ok(())
}

pub fn init<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    setup_file_cache_manager(app)?;

    setup_redis_client_manager(app)?;

    setup_page_metrics(app)
}
