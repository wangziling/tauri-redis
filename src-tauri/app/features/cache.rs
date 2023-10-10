use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::ops::{Deref, DerefMut};
use std::sync::Arc;
use tauri_redis_core::cache::impls::FileCache;

pub static FILE_CACHE_MANAGER: Lazy<Arc<tokio::sync::Mutex<FileCacheManager>>> =
    Lazy::new(|| Arc::new(tokio::sync::Mutex::new(FileCacheManager::default())));

#[derive(Default)]
pub struct FileCacheManager {
    pub inner: HashMap<String, FileCache>,
}

impl Deref for FileCacheManager {
    type Target = HashMap<String, FileCache>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for FileCacheManager {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}
