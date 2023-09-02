#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("Failed to send the http request.")]
    FailedToSendHTTPRequest,
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
