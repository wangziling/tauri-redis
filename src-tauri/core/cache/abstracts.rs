use crate::features::error::AnyError;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt::Debug;
use std::hash::Hash;
use std::path::PathBuf;

pub trait CacheBase<K: Eq + Hash + Debug> {
    fn new() -> Self;
    fn get(&self, path: K) -> Result<&Value, AnyError>;
    fn get_de<T: for<'a> Deserialize<'a>>(&self, key: K) -> Result<T, AnyError>;
    fn set(&mut self, key: K, value: &Value) -> Result<(), AnyError>;
    fn set_se<T: Serialize>(&mut self, key: K, value: &T) -> Result<(), AnyError>;
}

pub trait FileCacheBase {
    fn new(directory: PathBuf) -> Self;
    fn as_inner(&self) -> &Option<Value>;
    fn as_de<T: for<'a> Deserialize<'a>>(&self) -> Result<T, AnyError>;
    fn replace(&mut self, value: Value) -> Result<(), AnyError>;
    fn replace_se<T: Serialize>(&mut self, value: T) -> Result<(), AnyError>;
    fn load(&mut self, filename: String) -> Result<(), AnyError>;
    fn save(&self, pretty: bool) -> Result<(), AnyError>;
}
