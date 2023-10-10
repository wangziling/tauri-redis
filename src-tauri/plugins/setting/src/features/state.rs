use crate::features::error::{Error, Result};
use std::path::Path;
use std::{
    collections::HashMap,
    ops::{Deref, DerefMut},
    path::PathBuf,
};
use tauri_redis_core::cache::{abstracts::FileCacheBase, impls::FileCache};

pub type SettingsMapValue = serde_json::Value;

pub type SettingsMap = HashMap<String, SettingsMapValue>;

pub struct Settings {
    pub cache: FileCache,
    pub inner: Option<SettingsMap>,
    default_inner: SettingsMap,
}

impl Settings {
    pub fn new(directory: PathBuf) -> Self {
        let mut default_cache = FileCache::new(Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf());
        let _ = default_cache.load("resources/settings.json".to_string());

        Self {
            cache: FileCache::new(directory),
            inner: default_cache
                .as_de()
                .map_or_else(|_| Default::default(), Some),
            default_inner: default_cache.as_de().unwrap_or_default(),
        }
    }

    pub(crate) fn load(&mut self, filename: impl Into<String>) -> Result<()> {
        self.cache
            .load(filename.into())
            .map_err(|_| Error::FailedToLoadTheSettingFile)?;

        self.inner = Some(
            self.cache
                .as_de()
                .map_err(|_| Error::FailedToParseTheSettingFile)?,
        );

        Ok(())
    }

    pub fn save(&mut self) -> Result<()> {
        self.cache
            .replace_se(self.inner.as_ref().unwrap().clone())
            .and_then(|_| self.cache.save(true))
            .map_err(|_| Error::FailedToSaveSettings)
    }

    pub fn reset(&mut self) -> Result<()> {
        self.inner = Some(self.default_inner.clone());

        Ok(())
    }
}

impl Deref for Settings {
    type Target = SettingsMap;

    fn deref(&self) -> &Self::Target {
        self.inner.as_ref().unwrap()
    }
}

impl DerefMut for Settings {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.inner.as_mut().unwrap()
    }
}
