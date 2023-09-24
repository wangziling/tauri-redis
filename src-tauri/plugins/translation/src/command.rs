use crate::features::error::Result;
use crate::features::state::Translations;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Runtime, State, Window};

#[tauri::command]
pub async fn translate<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, Arc<RwLock<Translations>>>,
    key: String,
) -> Result<String> {
    state.read().unwrap().translate(key)
}

#[tauri::command]
pub async fn translate_group<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, Arc<RwLock<Translations>>>,
    keys: Vec<String>,
) -> Result<HashMap<String, String>> {
    state.read().unwrap().translate_group(keys)
}

#[tauri::command]
pub async fn switch_to<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, Arc<RwLock<Translations>>>,
    language: String,
) -> Result<HashMap<String, String>> {
    let mut lock = state.write().unwrap();

    lock.switch_to(language)
}

#[tauri::command]
pub async fn resources<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, Arc<RwLock<Translations>>>,
) -> Result<HashMap<String, String>> {
    let lock = state.write().unwrap();

    lock.resources()
}
