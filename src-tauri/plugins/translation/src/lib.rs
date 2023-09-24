mod command;
mod features;

use crate::features::state::Translations;
use std::sync::{Arc, RwLock};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("translation")
        .invoke_handler(tauri::generate_handler![
            command::translate,
            command::translate_group,
            command::switch_to,
            command::resources
        ])
        .setup(|app| {
            let mut translations = Translations::new();
            translations.count_languages()?;
            translations.load("en-US".to_string())?;

            app.manage(Arc::new(RwLock::new(translations)));

            Ok(())
        })
        .build()
}
