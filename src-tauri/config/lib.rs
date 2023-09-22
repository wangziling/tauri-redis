use crate::impls::CrateConfig;
use once_cell::sync::Lazy;

pub use config::ConfigError;

pub mod impls;

pub static CFG: Lazy<CrateConfig> = Lazy::new(|| CrateConfig::new());

#[cfg(test)]
mod tests {
    use super::CFG;

    #[test]
    fn it_works() {
        let result = CFG.get_int("redis.max_pool_size").unwrap();

        assert_eq!(result, 15_i64);
    }
}
