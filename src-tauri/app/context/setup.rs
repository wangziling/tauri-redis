use crate::features::cache::FileCacheManager;
use crate::features::client::RedisClientManager;
use crate::features::context::InternalSystemTrayMenuId;
use crate::features::events::Events;
use crate::utils::config::{
    get_connections_file_cache_manager_key, get_connections_file_name,
    get_miscs_file_cache_manager_key, get_miscs_file_name,
};
use std::sync::Arc;
use tauri::{App, Manager, Result, Runtime};
use tauri_plugin_tauri_redis_setting::{SettingsEvents, SettingsManager};
use tauri_plugin_tauri_redis_translation::{TranslationEvents, TRANSLATIONS};
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
            let _ = file_cache.load_ignore_empty(
                get_connections_file_name()
                    .map_err(|err| err.into_anyhow())
                    .unwrap(),
            );

            file_cache
        });

    file_cache_manager
        .entry(
            get_miscs_file_cache_manager_key()
                .map_err(|err| err.into_anyhow())
                .unwrap(),
        )
        .or_insert_with(|| {
            let miscs_path = path_resolver.app_local_data_dir().unwrap();
            let mut file_cache = FileCache::new(miscs_path);
            let _ = file_cache.load_ignore_empty(
                get_miscs_file_name()
                    .map_err(|err| err.into_anyhow())
                    .unwrap(),
            );

            file_cache
        });

    handle.manage(Arc::new(tauri::async_runtime::Mutex::new(
        file_cache_manager,
    )));

    Ok(())
}

fn setup_redis_client_manager<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    let handle = app.handle();

    handle.manage(Arc::new(tauri::async_runtime::Mutex::new(
        RedisClientManager::new(),
    )));

    Ok(())
}

fn setup_page_metrics<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    let handle = app.handle();

    // Get the current language and enable it.
    tauri::async_runtime::spawn(async move {
        let settings_manager = handle.state::<SettingsManager>();
        let settings_manager_lock = settings_manager.read().await;

        let new_handle = handle.clone();
        let language = settings_manager_lock.get("language");
        if language.is_some() {
            let language = language.unwrap().as_str().unwrap();

            TRANSLATIONS.write().await.switch_to(language).unwrap();

            TranslationEvents::emit_switch_language(&new_handle, language).unwrap();
        }
    });

    Ok(())
}

fn setup_events<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    let handle = app.handle();
    let new_handle = handle.clone();

    SettingsEvents::listen_set(&handle, move |event| {
        let payload = SettingsEvents::calc_set_payload(&event);
        let new_handle = new_handle.clone();

        if payload.key.as_str() == "language" {
            tauri::async_runtime::spawn(async move {
                let language = payload.value.as_str().unwrap();

                TRANSLATIONS.write().await.switch_to(language).unwrap();

                TranslationEvents::emit_switch_language(&new_handle, language).unwrap();
            });
        }
    });

    let new_handle = handle.clone();

    let handle_switch_language = move |_| {
        let tray_handle = new_handle.tray_handle();
        let quit_app_item_handle = tray_handle.get_item(InternalSystemTrayMenuId::QuitApp.into());
        let toggle_app_visible_item_handle =
            tray_handle.get_item(InternalSystemTrayMenuId::ToggleAppVisible.into());

        let main_window = new_handle.get_window("main").unwrap();
        let is_main_window_visible = main_window.is_visible().unwrap();

        tauri::async_runtime::spawn(async move {
            let translator = TRANSLATIONS.read().await;

            quit_app_item_handle
                .set_title(translator.translate("quit app|Quit", None).unwrap())
                .unwrap();
            toggle_app_visible_item_handle
                .set_title(if is_main_window_visible {
                    translator.translate("hide app|Hide", None).unwrap()
                } else {
                    translator.translate("show app|Show", None).unwrap()
                })
                .unwrap();

            let app_title = translator
                .translate(
                    "this project description|Tauri redis - A simple redis desktop manager.",
                    None,
                )
                .unwrap();
            main_window.set_title(app_title.as_str()).unwrap();
            tray_handle.set_tooltip(app_title.as_str()).unwrap();
        });
    };

    TranslationEvents::listen_switch_language(&handle, handle_switch_language);

    let new_handle = handle.clone();
    Events::listen_with_type(
        &handle,
        Events::WindowVisibleChangedManually,
        move |_event| {
            let new_handle = new_handle.clone();

            tauri::async_runtime::spawn(async move {
                let translator = TRANSLATIONS.read().await;
                let tray_handle = new_handle.tray_handle();
                let toggle_app_visible_item_handle =
                    tray_handle.get_item(InternalSystemTrayMenuId::ToggleAppVisible.into());

                let main_window = new_handle.get_window("main").unwrap();
                let is_main_window_visible = main_window.is_visible().unwrap();

                toggle_app_visible_item_handle
                    .set_title(if is_main_window_visible {
                        translator.translate("hide app|Hide", None).unwrap()
                    } else {
                        translator.translate("show app|Show", None).unwrap()
                    })
                    .unwrap();
            });
        },
    );

    Ok(())
}

pub fn init<R>(app: &mut App<R>) -> Result<()>
where
    R: Runtime,
{
    setup_file_cache_manager(app)?;

    setup_redis_client_manager(app)?;

    setup_page_metrics(app)?;

    setup_events(app)
}
