use crate::features::error::{Error, Result};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri_redis_core::cache::abstracts::FileCacheBase;
use tauri_redis_core::cache::impls::FileCache;

static KEY_LIKE_PLACEHOLDER_MATCHER: regex::RegexSet = regex::RegexSetBuilder::new([r"(?:{([a-zA-z]+[^{}|]*(?:\|.*)?)})"])
    .case_insensitive(true)
    .build()
    .unwrap();

pub struct Translations {
    cache: FileCache,
    language: String,

    languages: Vec<String>,
    inner: Option<HashMap<String, String>>,
}

fn invoke_translate(resources: &HashMap<String, String>, key: &String, rest: Option<Vec<String>>) -> Result<String> {
    if key.is_empty() {
        return Err(Error::InvalidParameter);
    }

    resources
        .get(key)
        .ok_or_else(|| {
            Error::FailedToFindMatchedTranslation
        })
        .and_then(|res| {
            let res = Clone::clone(res);

            // TODO: Rest params replacements.

            Ok(res)
        })
}

impl Translations {
    pub fn new() -> Self {
        Translations {
            cache: FileCache::new(
                Path::new(env!("CARGO_MANIFEST_DIR"))
                    .to_path_buf()
                    .join("resources/translations"),
            ),
            language: Default::default(),
            inner: Default::default(),
            languages: Default::default(),
        }
    }

    pub fn count_languages(&mut self) -> Result<()> {
        let handle = fs::read_dir(&self.cache.directory)
            .map_err(|_| Error::FailedToFindTargetTranslationFolder)?;

        self.languages = handle
            .enumerate()
            .filter_map(|(_, entry)| {
                entry
                    .ok()
                    .and_then(|entry| {
                        entry
                            .metadata()
                            .ok()
                            .and_then(|metadata| Some((metadata, entry.path())))
                    })
                    .and_then(|(metadata, path)| {
                        if metadata.is_file() && path.extension().is_some_and(|ext| ext == "json") {
                            return path
                                .file_stem()
                                .and_then(|stem| stem.to_str())
                                .and_then(|stem| Some(stem.to_string()));
                        }

                        None
                    })
            })
            .collect();

        Ok(())
    }

    pub fn load(&mut self, language: String) -> Result<()> {
        if language.is_empty() {
            return Err(Error::InvalidParameter);
        }

        if !self.languages.contains(&language) {
            return Err(Error::FailedToFindTargetTranslationFile);
        }

        self.cache
            .load(language.clone() + ".json")
            .map_err(|_| Error::FailedToFindTargetTranslationFile)?;

        let result = self
            .cache
            .as_de::<HashMap<String, String>>()
            .map_err(|_| Error::FailedToParseTargetTranslationFile)?;

        self.language = language;
        self.inner = Some(result);

        Ok(())
    }

    pub fn switch_to(&mut self, language: String) -> Result<HashMap<String, String>> {
        self.load(language)?;

        Ok(self.inner.as_ref().unwrap().clone())
    }

    pub fn resources(&self) -> Result<HashMap<String, String>> {
        self.inner
            .as_ref()
            .map_or_else(|| Ok(Default::default()), |resources| Ok(resources.clone()))
    }

    pub fn translate(&self, key: String, rest: Option<Vec<String>>) -> Result<String> {
        self.inner
            .as_ref()
            .and_then(|resources| invoke_translate(resources,&key, rest).ok())
            .ok_or_else(|| Error::FailedToFindMatchedTranslation)
    }

    pub fn translate_group(&self, keys: Vec<String>) -> Result<HashMap<String, String>> {
        self.inner
            .as_ref()
            .ok_or_else(|| Error::EmptyTranslationSource)
            .and_then(|resources| {
                let mut result = HashMap::new();

                for key in keys.iter() {
                   let res = invoke_translate(resources, key, None);
                    if res.is_err() {
                        continue;
                    }

                    result.insert(key.clone(), res.unwrap());
                }

                Ok(result)
            })
    }
}
