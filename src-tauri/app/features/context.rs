use serde::{Deserialize, Serialize};

#[derive(Serialize, PartialEq, Deserialize)]
pub enum InternalSystemTrayMenuId {
    #[serde(rename = "quit-app")]
    QuitApp,
    #[serde(rename = "toggle-app-visible")]
    ToggleAppVisible,
}

impl Into<String> for InternalSystemTrayMenuId {
    fn into(self) -> String {
        self.to_string()
    }
}

impl ToString for InternalSystemTrayMenuId {
    fn to_string(&self) -> String {
        serde_json::from_value(serde_json::to_value(&self).unwrap()).unwrap()
    }
}

impl Into<&'static str> for InternalSystemTrayMenuId {
    fn into(self) -> &'static str {
        Box::leak(Box::new(self.to_string()))
    }
}

impl From<String> for InternalSystemTrayMenuId {
    fn from(value: String) -> Self {
        serde_json::from_value(serde_json::to_value(value).unwrap()).unwrap()
    }
}
