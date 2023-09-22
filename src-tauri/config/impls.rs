use config::Config;
use std::ops::Deref;
use std::path::Path;

#[allow(dead_code)]
pub struct CrateConfig {
    inner: Config,
    file_path: String,
}

impl CrateConfig {
    pub(crate) fn new() -> Self {
        let file_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("public/config.toml");

        let config = Config::builder()
            .add_source(config::File::from(file_path.clone()))
            .build()
            .unwrap();

        Self {
            inner: config,
            file_path: file_path.to_str().unwrap().to_string(),
        }
    }
}

impl Deref for CrateConfig {
    type Target = Config;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}
