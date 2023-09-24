use crate::cache::abstracts::{CacheBase, FileCacheBase};
use crate::features::error::AnyError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fmt::Debug;
use std::fs;
use std::hash::Hash;
use std::io::{Read, Write};
use std::ops::{Deref, DerefMut};
use std::path::PathBuf;

pub struct CacheOptions {
    max_keys: usize,
    enable_conflicts_set: bool,
}

impl Default for CacheOptions {
    fn default() -> Self {
        Self {
            max_keys: 5000_usize,
            enable_conflicts_set: false,
        }
    }
}

pub struct Cache<K: Eq + Hash + Debug> {
    inner: HashMap<K, Value>,
    options: CacheOptions,
}

impl<K: Eq + Hash + Debug> CacheBase<K> for Cache<K> {
    fn new() -> Self {
        Cache {
            inner: HashMap::new(),
            options: CacheOptions::default(),
        }
    }

    fn get(&self, key: K) -> Result<&Value, AnyError> {
        self.inner.get(&key).ok_or(AnyError::msg(format!(
            "Failed to get the value of the key {key:?}"
        )))
    }

    fn get_de<T: for<'a> Deserialize<'a>>(&self, key: K) -> Result<T, AnyError> {
        let value = serde_json::from_value::<T>(self.get(key)?.clone())?;

        Ok(value)
    }

    fn set(&mut self, key: K, value: &Value) -> Result<(), AnyError> {
        if !self.options.enable_conflicts_set && self.inner.contains_key(&key) {
            return Err(AnyError::msg(format!("The key {key:?} is already existed")));
        }

        let cur_len = self.inner.len();
        if cur_len >= self.options.max_keys {
            return Err(AnyError::msg(format!("Maximum keys({cur_len}) exceed.")));
        }

        self.inner.insert(key, value.clone());

        Ok(())
    }

    fn set_se<T: Serialize>(&mut self, key: K, value: &T) -> Result<(), AnyError> {
        let value = serde_json::to_value(value)?;

        self.set(key, &value)
    }
}

impl<K: Eq + Hash + Debug> Deref for Cache<K> {
    type Target = HashMap<K, Value>;
    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<K: Eq + Hash + Debug> DerefMut for Cache<K> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

impl<K: Eq + Hash + Debug> Cache<K> {
    pub fn options(&self) -> &CacheOptions {
        &self.options
    }

    pub fn set_options_max_key(&mut self, max_keys: usize) {
        self.options.max_keys = max_keys;
    }

    pub fn set_options_enable_conflicts_set(&mut self, enable_conflicts_set: bool) {
        self.options.enable_conflicts_set = enable_conflicts_set;
    }
}

pub struct FileCache {
    inner: Option<Value>,
    pub directory: PathBuf,
    pub filename: Option<String>,
    pub filepath: Option<PathBuf>,
}

impl FileCacheBase for FileCache {
    fn new(directory: PathBuf) -> Self {
        Self {
            inner: None,
            directory,
            filename: None,
            filepath: None,
        }
    }

    fn as_inner(&self) -> &Option<Value> {
        &self.inner
    }

    fn as_de<T: for<'a> Deserialize<'a>>(&self) -> Result<T, AnyError> {
        if self.inner.is_none() {
            return Err(AnyError::msg("Empty file cache!"));
        }

        let value = serde_json::from_value::<T>(self.inner.as_ref().unwrap().clone())?;

        Ok(value)
    }

    fn replace(&mut self, value: Value) -> Result<(), AnyError> {
        self.inner = Some(value);

        Ok(())
    }

    fn replace_se<T: Serialize>(&mut self, value: T) -> Result<(), AnyError> {
        let value = serde_json::to_value(value)?;

        self.replace(value)
    }

    fn load(&mut self, filename: String) -> Result<(), AnyError> {
        // Load the initialized file data.
        if self.filename.as_ref().is_some_and(|f| f == &filename) && self.inner.is_some() {
            return Ok(());
        }

        let mut file_content = String::default();
        self.filepath = Some(self.directory.join(filename.clone()));
        let mut handle = fs::File::open(self.filepath.as_ref().unwrap())?;
        handle.read_to_string(&mut file_content)?;

        if file_content.is_empty() {
            return Err(AnyError::msg("Empty content."));
        }

        self.filename = Some(filename);
        self.inner = Some(serde_json::from_str(file_content.as_str())?);

        Ok(())
    }

    fn save(&self, pretty: bool) -> Result<(), AnyError> {
        if self.filepath.is_none() {
            return Err(AnyError::msg("Please correctly exec 'load' fn first."));
        }

        if self.inner.is_none() {
            return Err(AnyError::msg("Empty file cache!"));
        }

        // Create the folders, if existed, bypass.
        fs_extra::dir::create_all(
            &self.directory,
            /* Forcibly re-create the folders */ false,
        )?;

        // Try to create the target file.
        let mut options = fs::File::options();
        let options = options.read(true).write(true).create_new(true);

        let filepath = self.filepath.as_ref().unwrap();
        let mut handle = options
            .open(filepath)
            .or_else(|_| fs::File::create(filepath))?;

        // Empty the file content.
        handle.set_len(0)?;

        handle.write_all(
            {
                if pretty {
                    serde_json::to_string_pretty(self.inner.as_ref().unwrap())
                } else {
                    serde_json::to_string(self.inner.as_ref().unwrap())
                }
            }?
            .as_bytes(),
        )?;

        Ok(())
    }
}

impl Deref for FileCache {
    type Target = Value;
    fn deref(&self) -> &Self::Target {
        self.inner.as_ref().unwrap()
    }
}

impl DerefMut for FileCache {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.inner.as_mut().unwrap()
    }
}
