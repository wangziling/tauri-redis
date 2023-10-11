use crate::features::response::Response;

#[allow(dead_code)]
#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("Internal error.")]
    InternalError,

    #[error("Unexpected issue.")]
    UnexpectedIssue,

    #[error("Invalid guid.")]
    InvalidGuid,

    #[error(transparent)]
    FailedToGetRelatedConfig(#[from] tauri_redis_config::ConfigError),

    #[error("Failed to get the cached connections info.")]
    FailedToGetCachedConnectionsInfo,
    #[error("Failed to parse the cached connections info.")]
    FailedToParseCachedConnectionsInfo,
    #[error("Failed to parse the connection info.")]
    FailedToParseConnectionInfo,
    #[error("Failed to save the connection info.")]
    FailedToSaveConnectionInfo,
    #[error("Failed to find the matched connection info.")]
    FailedToFindTheMatchedConnectionInfo,

    #[error(transparent)]
    RedisInternalError(#[from] fred::error::RedisError),
    #[error("Already a pending redis connection.")]
    AlreadyAPendingRedisConnection,
    #[error(transparent)]
    SerdeJsonError(#[from] serde_json::Error),
    #[error("Failed to find existed redis connection.")]
    FailedToFindExistedRedisConnection,
    #[error("Invalid redis key type.")]
    InvalidRedisKeyType,
    #[error("Invalid redis key name.")]
    InvalidRedisKeyName,
}

impl Error {
    #[allow(dead_code)]
    pub(crate) fn into_anyhow(self) -> anyhow::Error {
        anyhow::anyhow!(self.to_string())
    }
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type Result<T, E = Error> = std::result::Result<T, E>;

impl<Data> From<Error> for Response<Data> {
    fn from(value: Error) -> Self {
        Response::<Data>::failed(value.to_string(), None)
    }
}
