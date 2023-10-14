mod features;
mod setup;

use tauri::{Builder, Result, Runtime};

pub fn run_with_context<R>(b: Builder<R>) -> Result<()>
where
    R: Runtime,
{
    let builder = b.setup(|app| setup::init(app).map_err(|err| err.into()));

    let builder = features::register_features(builder);

    builder.run(tauri::generate_context!())
}
