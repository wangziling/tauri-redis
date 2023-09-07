use crate::features::error;
use serde::Serialize;
use std::time::Instant;

#[derive(Serialize)]
pub struct WebContent {
    html: String,
    uri: String,
    time_elapsed: String,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn async_greet(name: &str) -> Result<String, error::Error> {
    Ok(name.to_string())
}

#[tauri::command]
pub async fn get_web_content(uri: &str) -> Result<WebContent, error::Error> {
    let duration = Instant::now();

    let html = reqwest::Client::new()
        .get(uri)
        .send()
        .await
        .map_err(|_| error::Error::FailedToSendHTTPRequest)?
        .text()
        .await
        .map_err(|_| error::Error::FailedToSendHTTPRequest)?;

    Ok(WebContent {
        uri: uri.to_string(),
        html,
        time_elapsed: format!("{:?}", duration.elapsed()),
    })
}
