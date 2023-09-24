use crate::features::error::{Error, Result};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri_redis_core::cache::abstracts::FileCacheBase;
use tauri_redis_core::cache::impls::FileCache;

static KEY_LIKE_PLACEHOLDER_MATCHER: Lazy<regex::RegexSet> = Lazy::new(|| {
    regex::RegexSetBuilder::new([r"(?:\{([a-zA-z]+[^{}|]*(?:\|[^{}]*)?)\})"])
        .case_insensitive(true)
        .build()
        .unwrap()
});

static WHITESPACE_REPLACER: Lazy<regex::Regex> = Lazy::new(|| regex::Regex::new(r"\s").unwrap());

const TRANSLATION_KEY_DEFAULT_SPLITTER: &'static str = "|";

pub struct Translations {
    cache: FileCache,
    language: String,

    languages: Vec<String>,
    inner: Option<HashMap<String, String>>,
}

fn _base_translate(resources: &HashMap<String, String>, key: &String) -> String {
    if key.is_empty() || WHITESPACE_REPLACER.replace(&key, "").is_empty() {
        return "".to_string();
    }

    // 'idx + 1' means bypass the idx of "|".
    let (key, default_value) = key
        .find(TRANSLATION_KEY_DEFAULT_SPLITTER)
        .and_then(|idx| Some((key[..idx].to_string(), key[idx + 1..key.len()].to_string())))
        .or_else(|| Some((key.to_string(), Default::default())))
        .unwrap();

    resources.get(&key.to_lowercase()).map_or_else(
        || {
            if default_value.is_empty() {
                return "#".to_string() + &key;
            } else {
                default_value
            }
        },
        |value| Clone::clone(value),
    )
}

fn _format(value: String, rest: Option<Vec<String>>) -> String {
    if rest.is_none() {
        return value;
    }

    let rest = rest.unwrap();
    if rest.is_empty() {
        return value;
    }

    // Here replace the "{0}, {1}" by the rest items with the mutual idx.
    let mut content = value;
    for (idx, replacer) in rest.iter().enumerate() {
        // Needs to be escaped.
        let regexp =
            regex::Regex::new(("\\{".to_string() + idx.to_string().as_str() + "\\}").as_str())
                .unwrap();

        content = regexp.replace(&content, replacer).to_string();
    }

    content
}

fn _translate(
    resources: &HashMap<String, String>,
    key: &String,
    rest: Option<Vec<String>>,
) -> String {
    let mut content = _base_translate(resources, key);
    if content.is_empty() {
        return content;
    }

    content = _format(content, rest);

    // This is inspired by the demo code in "regexp/src/regexset/string.rs   line 53".

    // Try to catch the translation key placeholder.
    // E.g. Please give me some {advice}.
    // The {advice} will be replaced by translate('advice').
    let regexps: Vec<_> = KEY_LIKE_PLACEHOLDER_MATCHER
        .patterns()
        .iter()
        .map(|pattern| regex::Regex::new(pattern).unwrap())
        .collect();

    let matches: Vec<_> = KEY_LIKE_PLACEHOLDER_MATCHER
        .matches(&content)
        .into_iter()
        .map(|idx| &regexps[idx])
        .map(|re| {
            re.replace_all(&content, |caps: &regex::Captures| {
                let maybe_key = &caps[1];

                _base_translate(resources, &maybe_key.to_string())
            })
        })
        .collect();

    matches.join("")
}

fn invoke_translate(
    resources: &HashMap<String, String>,
    key: &String,
    rest: Option<Vec<String>>,
) -> Result<String> {
    if key.is_empty() {
        return Err(Error::InvalidParameter);
    }

    Ok(_translate(resources, key, rest))
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
            .and_then(|resources| invoke_translate(resources, &key, rest).ok())
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
