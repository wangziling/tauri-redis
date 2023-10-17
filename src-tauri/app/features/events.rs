#![allow(dead_code)]
use crate::features::error::Result;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Event, EventHandler, Manager, Runtime};
use tauri_redis_core::features::events::{AsBackendEventPayload, IntoEventName};

#[derive(Serialize, Clone)]
pub struct EventsNonePayload;

impl AsBackendEventPayload for EventsNonePayload {}

#[derive(Serialize, Deserialize, Clone)]
pub enum Events {
    #[serde(rename = "internal:window:visible-changed-manually")]
    WindowVisibleChangedManually,
}

impl ToString for Events {
    fn to_string(&self) -> String {
        serde_json::from_value(serde_json::to_value(&self).unwrap()).unwrap()
    }
}

impl Into<String> for Events {
    fn into(self) -> String {
        self.to_string()
    }
}

impl IntoEventName for Events {}

impl Events {
    pub fn trigger_with_type<R>(
        handle: &AppHandle<R>,
        event_type: Events,
        payload: Option<String>,
    ) -> Result<()>
    where
        R: Runtime,
    {
        handle.trigger_global(event_type.into_event_name(), payload);

        Ok(())
    }

    pub fn listen_with_type<R, F>(
        handle: &AppHandle<R>,
        event_type: Events,
        func: F,
    ) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        handle.listen_global(event_type.into_event_name(), func)
    }

    pub fn trigger<R>(&self, handle: &AppHandle<R>, payload: Option<String>) -> Result<()>
    where
        R: Runtime,
    {
        Events::trigger_with_type(handle, self.clone(), payload)
    }

    pub fn listen<R, F>(&self, handle: &AppHandle<R>, func: F) -> EventHandler
    where
        R: Runtime,
        F: Fn(Event) + Send + 'static,
    {
        Events::listen_with_type(handle, self.clone(), func)
    }
}
