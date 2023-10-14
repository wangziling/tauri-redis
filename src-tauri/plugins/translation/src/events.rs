#![allow(dead_code)]

use crate::features::error::{Error, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Event, EventHandler, Manager, Runtime};
use tauri_redis_core::features::events::{AsBackendEventPayload, IntoEventName};

#[derive(Serialize, Clone)]
pub struct NonePayload;

#[derive(Serialize, Clone, Deserialize)]
pub struct TranslationSwitchLanguagePayload {
    pub language: String,
}

impl AsBackendEventPayload for TranslationSwitchLanguagePayload {}

#[derive(Serialize)]
pub enum TranslationEvents {
    #[serde(rename = "plugins:translation:switch-language")]
    SwitchLanguage,
    #[serde(rename = "plugins:translation:initialized")]
    Initialized,
}

impl ToString for TranslationEvents {
    fn to_string(&self) -> String {
        serde_json::from_value(serde_json::to_value(&self).unwrap()).unwrap()
    }
}

impl Into<String> for TranslationEvents {
    fn into(self) -> String {
        self.to_string()
    }
}

impl IntoEventName for TranslationEvents {}

impl TranslationEvents {
    pub fn calc_switch_language_payload(event: &Event) -> TranslationSwitchLanguagePayload {
        serde_json::from_str(event.payload().unwrap()).unwrap()
    }

    pub(crate) fn initialized<R>(handle: &AppHandle<R>) -> Result<()>
    where
        R: Runtime,
    {
        handle.trigger_global(TranslationEvents::Initialized.into_event_name(), None);

        handle
            .emit_all(
                TranslationEvents::Initialized.into_event_name(),
                NonePayload,
            )
            .map_err(|err| Error::TauriInternalError(err.to_string()))
    }

    pub fn emit_switch_language<R>(handle: &AppHandle<R>, language: impl Into<String>) -> Result<()>
    where
        R: Runtime,
    {
        let payload = TranslationSwitchLanguagePayload {
            language: language.into(),
        };

        handle.trigger_global(
            TranslationEvents::SwitchLanguage.into_event_name(),
            payload.as_payload(),
        );

        handle
            .emit_all(TranslationEvents::SwitchLanguage.into_event_name(), payload)
            .map_err(|err| Error::TauriInternalError(err.to_string()))
    }

    pub fn listen_initialized<R, F>(handle: &AppHandle<R>, func: F) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        handle.listen_global(TranslationEvents::Initialized.into_event_name(), func)
    }

    pub fn listen_switch_language<R, F>(handle: &AppHandle<R>, func: F) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        handle.listen_global(TranslationEvents::SwitchLanguage.into_event_name(), func)
    }
}
