use tauri::{Builder, Runtime};

pub fn register_plugins<R>(b: Builder<R>) -> Builder<R>
where
    R: Runtime,
{
    b.plugin(tauri_plugin_tauri_redis_translation::init())
}
