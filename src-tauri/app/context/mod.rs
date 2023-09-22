mod setup;

use tauri::{Builder, Result, Runtime};

pub fn run_with_context<R>(b: Builder<R>) -> Result<()>
where
    R: Runtime,
{
    b.setup(|app| setup::init(app).map_err(|err| err.into()))
        .run(tauri::generate_context!())
}
