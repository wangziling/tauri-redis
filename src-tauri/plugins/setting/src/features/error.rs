use serde::Serialize;

#[derive(thiserror::Error, Debug, Serialize)]
pub enum Error {
    #[error("Failed to load the setting file.")]
    FailedToLoadTheSettingFile,
    #[error("Failed to parse the setting file.")]
    FailedToParseTheSettingFile,
    #[error("Failed to get target setting item.")]
    FailedToGetTargetSettingItem,
    #[error("Failed to Parse target setting item.")]
    FailedToParseTargetSettingItem,
    #[error("Failed to set target setting item.")]
    FailedToSetTargetSettingItem,
    #[error("Failed to save settings.")]
    FailedToSaveSettings,
    #[error("Failed to get target setting presets item.")]
    FailedToGetTargetSettingPresetsItem,
    #[error("Failed to Parse target setting presets item.")]
    FailedToParseTargetSettingPresetsItem,
    #[error("Invalid parameter.")]
    InvalidParameter,
    #[error("{0}")]
    TauriInternalError(String),
}

pub type Result<T> = std::result::Result<T, Error>;
