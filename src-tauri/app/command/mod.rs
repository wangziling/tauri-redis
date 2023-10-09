use tauri::{Builder, Runtime};

mod client;
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
        connections::establish_connection,
        connections::release_connection,
        connections::remove_connection,
        client::list_client_metrics,
        client::list_all_keys,
        client::create_new_key,
        client::remove_key,
        client::get_key_type,
        client::get_key_ttl,
        client::get_key_content_type_string,
    ])
}
