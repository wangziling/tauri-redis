use crate::features::error::Result;
use crate::{TranslationEvents, TranslationManager};
use std::collections::HashMap;
use tauri::{AppHandle, Runtime, State};

#[tauri::command]
pub async fn translate<R: Runtime>(
    state: State<'_, TranslationManager>,
    key: String,
    rest: Option<Vec<String>>,
) -> Result<String> {
    state.read().await.translate(key, rest)
}

#[tauri::command]
pub async fn translate_group<R: Runtime>(
    state: State<'_, TranslationManager>,
    keys: Vec<String>,
) -> Result<HashMap<String, String>> {
    state.read().await.translate_group(keys)
}

#[tauri::command]
pub async fn switch_to<R: Runtime>(
    handle: AppHandle<R>,
    state: State<'_, TranslationManager>,
    language: String,
) -> Result<()> {
    let mut lock = state.write().await;

    lock.switch_to(language.clone())?;

    TranslationEvents::emit_switch_language(&handle, language)
}

#[tauri::command]
pub async fn resources<R: Runtime>(
    state: State<'_, TranslationManager>,
) -> Result<HashMap<String, String>> {
    let lock = state.read().await;

    lock.resources()
}

#[tauri::command]
pub async fn language<R: Runtime>(state: State<'_, TranslationManager>) -> Result<String> {
    let lock = state.read().await;

    lock.language()
}

#[tauri::command]
pub async fn languages<R: Runtime>(state: State<'_, TranslationManager>) -> Result<Vec<String>> {
    let lock = state.read().await;

    lock.languages()
}
