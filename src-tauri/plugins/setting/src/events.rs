#![allow(dead_code)]

use crate::features::error::{Error, Result};
use crate::features::state::SettingsMapValue;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Event, EventHandler, Manager, Runtime};
use tauri_redis_core::features::events::{AsBackendEventPayload, IntoEventName};

#[derive(Serialize, Clone)]
pub struct NonePayload;

#[derive(Serialize, Clone, Deserialize, Debug)]
pub struct SettingsSetPayload {
    pub key: String,
    pub value: SettingsMapValue,
}

impl AsBackendEventPayload for SettingsSetPayload {}

#[derive(Serialize)]
pub enum SettingsEvents {
    #[serde(rename = "plugins:setting:reset")]
    Reset,
    #[serde(rename = "plugins:setting:set")]
    Set,
    #[serde(rename = "plugins:setting:initialized")]
    Initialized,
}

impl ToString for SettingsEvents {
    fn to_string(&self) -> String {
        serde_json::from_value(serde_json::to_value(&self).unwrap()).unwrap()
    }
}

impl Into<String> for SettingsEvents {
    fn into(self) -> String {
        self.to_string()
    }
}

impl IntoEventName for SettingsEvents {}

impl SettingsEvents {
    pub fn calc_set_payload(event: &Event) -> SettingsSetPayload {
        serde_json::from_str(event.payload().unwrap()).unwrap()
    }

    pub fn emit_reset<R>(handle: &AppHandle<R>) -> Result<()>
    where
        R: Runtime,
    {
        handle.trigger_global(SettingsEvents::Reset.into_event_name(), None);

        handle
            .emit_all(SettingsEvents::Reset.into_event_name(), NonePayload)
            .map_err(|err| Error::TauriInternalError(err.to_string()))
    }

    pub fn emit_set<R>(handle: &AppHandle<R>, payload: SettingsSetPayload) -> Result<()>
    where
        R: Runtime,
    {
        handle.trigger_global(SettingsEvents::Set.into_event_name(), payload.as_payload());

        handle
            .emit_all(SettingsEvents::Set.into_event_name(), payload)
            .map_err(|err| Error::TauriInternalError(err.to_string()))
    }

    pub(crate) fn initialized<R>(handle: &AppHandle<R>) -> Result<()>
    where
        R: Runtime,
    {
        handle.trigger_global(SettingsEvents::Initialized.into_event_name(), None);

        handle
            .emit_all(SettingsEvents::Initialized.into_event_name(), NonePayload)
            .map_err(|err| Error::TauriInternalError(err.to_string()))
    }

    pub fn listen_reset<R, F>(handle: &AppHandle<R>, func: F) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        handle.listen_global(SettingsEvents::Reset.into_event_name(), func)
    }

    pub fn listen_set<R, F>(handle: &AppHandle<R>, func: F) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        handle.listen_global(SettingsEvents::Set.into_event_name(), func)
    }

    pub fn listen_initialized<R, F>(handle: &AppHandle<R>, func: F) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        handle.listen_global(SettingsEvents::Initialized.into_event_name(), func)
    }
}
