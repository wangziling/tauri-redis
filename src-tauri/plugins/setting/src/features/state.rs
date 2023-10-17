use crate::features::error::{Error, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::{
    collections::HashMap,
    ops::{Deref, DerefMut},
    path::PathBuf,
};
use tauri_redis_core::cache::{abstracts::FileCacheBase, impls::FileCache};

pub type SettingsMapValue = serde_json::Value;

pub type SettingsMap = HashMap<String, SettingsMapValue>;

#[derive(Serialize)]
pub struct SettingsResources {
    pub settings: SettingsMap,
    pub presets: SettingsMap,
}

pub struct SettingsPresets {
    pub cache: FileCache,
    pub inner: Option<SettingsMap>,
}

pub struct Settings {
    pub cache: FileCache,
    pub inner: Option<SettingsMap>,
    default_inner: SettingsMap,
    pub presets: SettingsPresets,
}

impl Settings {
    pub fn new(directory: PathBuf) -> Self {
        let mut default_cache = FileCache::new(Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf());
        let _ = default_cache.load_ignore_empty("resources/settings.json".to_string());

        let mut presets_cache = FileCache::new(Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf());
        let _ = presets_cache.load_ignore_empty("resources/presets.json".to_string());

        Self {
            cache: FileCache::new(directory),
            inner: default_cache
                .as_de()
                .map_or_else(|_| Default::default(), Some),
            default_inner: default_cache.as_de().unwrap_or_default(),
            presets: SettingsPresets {
                inner: presets_cache
                    .as_de()
                    .map_or_else(|_| Default::default(), Some),
                cache: presets_cache,
            },
        }
    }

    pub(crate) fn load(&mut self, filename: impl Into<String>) -> Result<()> {
        self.cache
            .load_ignore_empty(filename.into())
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

    pub fn get<T>(&self, key: T) -> Option<&SettingsMapValue>
    where
        T: Into<String>,
    {
        let key = &key.into();
        // If inner didn't own this key.
        // Use the default_inner related instead.
        self.inner
            .as_ref()
            .and_then(|map| map.get(key))
            .or_else(|| self.default_inner.get(key))
    }

    pub fn get_de<V: for<'a> Deserialize<'a>, T>(&self, key: T) -> Result<V>
    where
        T: Into<String>,
    {
        let key = &key.into();

        self.get(key)
            .ok_or_else(|| Error::FailedToGetTargetSettingItem)
            .and_then(|value| {
                serde_json::from_value::<V>(value.clone())
                    .map_err(|_| Error::FailedToParseTargetSettingItem)
            })
    }

    pub fn get_presets<T>(&self, key: T) -> Option<&SettingsMapValue>
    where
        T: Into<String>,
    {
        let key = &key.into();
        // If inner didn't own this key.
        // Use the default_inner related instead.
        self.presets.inner.as_ref().and_then(|map| map.get(key))
    }

    pub fn get_presets_de<V: for<'a> Deserialize<'a>, T>(&self, key: T) -> Result<V>
    where
        T: Into<String>,
    {
        let key = &key.into();

        self.get_presets(key)
            .ok_or_else(|| Error::FailedToGetTargetSettingPresetsItem)
            .and_then(|value| {
                serde_json::from_value::<V>(value.clone())
                    .map_err(|_| Error::FailedToParseTargetSettingPresetsItem)
            })
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
