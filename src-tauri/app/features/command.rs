use serde::{Deserialize, Serialize};

type LocalTimeString = String;

pub type Guid = String;

pub type TTL = i64;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    pub connection_name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub separator: String,
    pub readonly: bool,

    // Created by server.
    pub created_at: LocalTimeString,
    pub updated_at: Option<LocalTimeString>,
    pub connected_at: Option<LocalTimeString>,

    // Created by server.
    pub guid: Guid,
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SaveConnectionPayload {
    pub connection_name: Option<String>,
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub separator: Option<String>,
    pub readonly: Option<bool>,

    // If preset and matched, means edit.
    // Non preset means need a new one.
    // Non matched, Error thrown.
    pub guid: Option<Guid>,
}
