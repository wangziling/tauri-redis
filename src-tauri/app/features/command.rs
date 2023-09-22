use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    connection_name: String,
    host: String,
    port: u16,
    username: Option<String>,
    password: Option<String>,
    separator: Option<String>,
    readonly: bool,
}
