use serde::Serialize;

#[derive(Debug, thiserror::Error, Serialize)]
pub enum Error {
    #[error("Failed to find the matched translation.")]
    FailedToFindMatchedTranslation,
    #[error("Empty translation source.")]
    EmptyTranslationSource,
    #[error("Failed to find the target translation folder.")]
    FailedToFindTargetTranslationFolder,
    #[error("Failed to find the target translation file.")]
    FailedToFindTargetTranslationFile,
    #[error("Failed to parse the target translation file.")]
    FailedToParseTargetTranslationFile,
    #[error("Invalid parameter.")]
    InvalidParameter,
}

pub type Result<T> = std::result::Result<T, Error>;
