use tauri::{Builder, Result, Runtime};

pub fn run_with_context<R>(b: Builder<R>) -> Result<()>
where
    R: Runtime,
{
    b.run(tauri::generate_context!())
}
