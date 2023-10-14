use serde::Serialize;

pub trait AsBackendEventPayload: Serialize {
    fn as_payload(&self) -> Option<String> {
        Some(serde_json::to_string(self).unwrap())
    }
}

pub trait IntoEventName: Into<String> {
    fn into_event_name(self) -> &'static str {
        Box::leak(Box::new(self.into()))
    }
}
