use crate::events::{SettingsEvents, SettingsSetPayload};
use crate::features::error::{Error, Result};
use crate::features::state::{SettingsMap, SettingsMapValue, SettingsResources};
use crate::SettingsManager;
use tauri::{AppHandle, Runtime, State};

#[tauri::command]
pub async fn resources(state: State<'_, SettingsManager>) -> Result<SettingsResources> {
    let lock = state.read().await;

    let settings = lock
        .inner
        .as_ref()
        .ok_or_else(|| Error::FailedToLoadTheSettingFile)
        .map(|settings| settings.clone())?;

    let presets = lock
        .presets
        .inner
        .as_ref()
        .ok_or_else(|| Error::FailedToLoadTheSettingFile)
        .map(|settings| settings.clone())?;

    Ok(SettingsResources { settings, presets })
}

#[tauri::command]
pub async fn settings(state: State<'_, SettingsManager>) -> Result<SettingsMap> {
    let lock = state.read().await;

    lock.inner
        .as_ref()
        .ok_or_else(|| Error::FailedToLoadTheSettingFile)
        .map(|settings| settings.clone())
}

#[tauri::command]
pub async fn presets(state: State<'_, SettingsManager>) -> Result<SettingsMap> {
    let lock = state.read().await;

    lock.presets
        .inner
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
pub async fn get_preset(
    state: State<'_, SettingsManager>,
    key: String,
) -> Result<SettingsMapValue> {
    if key.is_empty() {
        return Err(Error::InvalidParameter);
    }

    let lock = state.read().await;

    lock.get_presets(&key)
        .ok_or_else(|| Error::FailedToGetTargetSettingPresetsItem)
        .map(|value| value.clone())
}

#[tauri::command]
pub async fn set<R>(
    state: State<'_, SettingsManager>,
    handle: AppHandle<R>,
    key: String,
    value: SettingsMapValue,
) -> Result<()>
where
    R: Runtime,
{
    if key.is_empty() {
        return Err(Error::InvalidParameter);
    }

    let mut lock = state.write().await;

    lock.insert(key.clone(), value.clone())
        .ok_or_else(|| Error::FailedToSetTargetSettingItem)?;

    lock.save()?;

    SettingsEvents::emit_set(&handle, SettingsSetPayload { key, value })?;

    Ok(())
}

#[tauri::command]
pub async fn reset<R>(state: State<'_, SettingsManager>, handle: AppHandle<R>) -> Result<()>
where
    R: Runtime,
{
    let mut lock = state.write().await;

    lock.reset()
        .map_err(|_| Error::FailedToLoadTheSettingFile)?;

    lock.save()?;

    SettingsEvents::emit_reset(&handle)?;

    Ok(())
}
