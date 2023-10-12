use crate::features::error::{Error, Result};
use crate::features::state::{SettingsMap, SettingsMapValue};
use crate::SettingsManager;
use tauri::State;

#[tauri::command]
pub async fn resources(state: State<'_, SettingsManager>) -> Result<SettingsMap> {
    let lock = state.read().await;

    lock.inner
        .as_ref()
        .ok_or_else(|| Error::FailedToLoadTheSettingFile)
        .map(|settings| settings.clone())
}

#[tauri::command]
pub async fn get(state: State<'_, SettingsManager>, key: String) -> Result<SettingsMapValue> {
    if key.is_empty() {
        return Err(Error::InvalidParameter);
    }

    let lock = state.read().await;

    lock.get(&key)
        .ok_or_else(|| Error::FailedToGetTargetSettingItem)
        .map(|value| value.clone())
}

#[tauri::command]
pub async fn set(
    state: State<'_, SettingsManager>,
    key: String,
    value: SettingsMapValue,
) -> Result<()> {
    if key.is_empty() {
        return Err(Error::InvalidParameter);
    }

    let mut lock = state.write().await;

    lock.insert(key, value)
        .ok_or_else(|| Error::FailedToSetTargetSettingItem)?;

    Ok(())
}

#[tauri::command]
pub async fn reset(state: State<'_, SettingsManager>) -> Result<()> {
    let mut lock = state.write().await;

    lock.reset().map_err(|_| Error::FailedToLoadTheSettingFile)
}
