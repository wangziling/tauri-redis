use crate::utils::config::get_settings_file_name;
use tauri::{Builder, Runtime};

pub fn register_plugins<R>(b: Builder<R>) -> Builder<R>
where
    R: Runtime,
{
    b.plugin(tauri_plugin_tauri_redis_translation::init())
        .plugin(tauri_plugin_tauri_redis_setting::init(
            get_settings_file_name().unwrap(),
        ))
}
