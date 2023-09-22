use tauri::{Builder, Runtime};

mod connections;
mod demo;

pub fn register_commands<R>(b: Builder<R>) -> Builder<R>
where
    R: Runtime,
{
    b.invoke_handler(tauri::generate_handler![
        demo::greet,
        demo::async_greet,
        demo::get_web_content,
        connections::save_connection,
        connections::get_connections,
    ])
}
