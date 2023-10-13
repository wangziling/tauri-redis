mod command;
mod features;

use crate::features::state::Settings;
use std::sync::Arc;
use tauri::async_runtime::RwLock;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub type SettingsManager = Arc<RwLock<Settings>>;

/// Initializes the plugin.
pub fn init<R: Runtime>(filename: String) -> TauriPlugin<R> {
    Builder::new("setting")
        .invoke_handler(tauri::generate_handler![
            command::resources,
            command::settings,
            command::presets,
            command::get,
            command::get_preset,
            command::set,
            command::reset,
        ])
        .setup(|handle| {
            let path_resolver = handle.path_resolver();
            let app_local_data_dir = path_resolver.app_local_data_dir().unwrap();

            let mut settings = Settings::new(app_local_data_dir);
            let _ = settings.load(filename);

            // Try save.
            let _ = settings.save();

            handle.manage(Arc::new(RwLock::new(settings)));

            Ok(())
        })
        .build()
}
