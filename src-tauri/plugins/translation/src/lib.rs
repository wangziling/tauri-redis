mod command;
mod events;
mod features;

pub use crate::events::TranslationEvents;
use crate::features::state::Translations;
use once_cell::sync::Lazy;
use std::sync::Arc;
use tauri::async_runtime::{block_on, RwLock};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub type TranslationManager = Arc<RwLock<Translations>>;

pub static TRANSLATIONS: Lazy<TranslationManager> =
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
        .setup(|handle| {
            block_on(async {
                let mut translations = TRANSLATIONS.write().await;
                translations.count_languages().unwrap();
                translations.load("en-US".to_string()).unwrap();

                handle.manage(TRANSLATIONS.clone());

                TranslationEvents::initialized(&handle.app_handle()).unwrap();
            });

            Ok(())
        })
        .build()
}
