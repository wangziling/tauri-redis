mod command;
mod events;
mod features;

pub use crate::events::TranslationEvents;
use crate::features::state::Translations;
use once_cell::sync::OnceCell;
use std::path::Path;
use std::sync::Arc;
use tauri::async_runtime::{block_on, RwLock};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub type TranslationManager = Arc<RwLock<Translations>>;

pub static TRANSLATIONS: OnceCell<TranslationManager> = OnceCell::new();

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
                let path_resolver = handle.path_resolver();

                /** @see https://tauri.app/v1/guides/building/resources/#__docusaurus_skipToContent_fallback */
                /** @see https://github.com/tauri-apps/tauri/discussions/7323#discussioncomment-6332259 */
                let dir = path_resolver
                    .resolve_resource("../plugins/translation/resources/translations")
                    .and_then(|dir| {
                        if !dir.exists() {
                            return Some(
                                Path::new(env!("CARGO_MANIFEST_DIR"))
                                    .to_path_buf()
                                    .join("resources/translations"),
                            );
                        }

                        Some(dir)
                    })
                    .or_else(|| {
                        Some(
                            Path::new(env!("CARGO_MANIFEST_DIR"))
                                .to_path_buf()
                                .join("resources/translations"),
                        )
                    });

                let translations = Arc::new(RwLock::new(Translations::new(dir.unwrap())));

                {
                    let mut translations = translations.write().await;
                    translations.count_languages().unwrap();
                    translations.load("en-US".to_string()).unwrap();
                }

                // Manage, should be executed before `.set()`
                handle.manage(translations.clone());

                let _ = TRANSLATIONS.set(translations);

                TranslationEvents::initialized(&handle.app_handle()).unwrap();
            });

            Ok(())
        })
        .build()
}
