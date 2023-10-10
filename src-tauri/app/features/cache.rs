use std::collections::HashMap;
use std::ops::{Deref, DerefMut};
use tauri_redis_core::cache::impls::FileCache;

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
