mod command;
mod features;

use crate::features::state::Translations;
use once_cell::sync::Lazy;
use std::sync::{Arc, RwLock};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub static TRANSLATIONS: Lazy<Arc<RwLock<Translations>>> =
    Lazy::new(|| Arc::new(RwLock::new(Translations::new())));

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("translation")
        .invoke_handler(tauri::generate_handler![
            command::translate,
            command::translate_group,
            command::switch_to,
            command::resources,
            command::languages,
            command::language,
        ])
        .setup(|app| {
            let mut translations = TRANSLATIONS.write().unwrap();
            translations.count_languages()?;
            translations.load("en-US".to_string())?;

            app.manage(TRANSLATIONS.clone());

            Ok(())
        })
        .build()
}
