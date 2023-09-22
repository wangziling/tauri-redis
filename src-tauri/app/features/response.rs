#![allow(dead_code)]

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ResponseStatus {
    Success,
    Failed,
    Warning,
}

#[derive(Serialize)]
pub struct Response<Data> {
    status: ResponseStatus,
    message: String,
    data: Option<Data>,
}

impl<Data> Response<Data> {
    pub fn default() -> Self {
        Self {
            status: ResponseStatus::Success,
            message: "ok".to_string(),
            data: None,
        }
    }

    pub fn success(data: Option<Data>, message: Option<String>) -> Self {
        let mut ins = Self::default();

        if data.is_some() {
            let _ = ins.data.insert(data.unwrap());
        }

        if message.is_some() {
            ins.message = message.unwrap();
        }

        ins
    }

    pub fn failed(message: String, data: Option<Data>) -> Self {
        let mut ins = Self::default();
        ins.status = ResponseStatus::Failed;
        ins.message = message;

        if data.is_some() {
            ins.data.replace(data.unwrap());
        }

        ins
    }

    pub fn warning(message: String, data: Option<Data>) -> Self {
        let mut ins = Self::default();
        ins.status = ResponseStatus::Warning;
        ins.message = message;

        if data.is_some() {
            ins.data.replace(data.unwrap());
        }

        ins
    }
}
