use crate::features::error::Result;
use crate::TranslationManager;
use std::collections::HashMap;
use tauri::{AppHandle, Runtime, State, Window};

#[tauri::command]
pub async fn translate<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, TranslationManager>,
    key: String,
    rest: Option<Vec<String>>,
) -> Result<String> {
    state.read().unwrap().translate(key, rest)
}

#[tauri::command]
pub async fn translate_group<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, TranslationManager>,
    keys: Vec<String>,
) -> Result<HashMap<String, String>> {
    state.read().unwrap().translate_group(keys)
}

#[tauri::command]
pub async fn switch_to<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, TranslationManager>,
    language: String,
) -> Result<()> {
    let mut lock = state.write().unwrap();

    lock.switch_to(language)
}

#[tauri::command]
pub async fn resources<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, TranslationManager>,
) -> Result<HashMap<String, String>> {
    let lock = state.read().unwrap();

    lock.resources()
}

#[tauri::command]
pub async fn language<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, TranslationManager>,
) -> Result<String> {
    let lock = state.read().unwrap();

    lock.language()
}

#[tauri::command]
pub async fn languages<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, TranslationManager>,
) -> Result<Vec<String>> {
    let lock = state.read().unwrap();

    lock.languages()
}
