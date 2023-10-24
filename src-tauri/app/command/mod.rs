use tauri::{Builder, Runtime};

mod client;
mod connections;
mod system;
mod telemetry;

pub fn register_commands<R>(b: Builder<R>) -> Builder<R>
where
    R: Runtime,
{
    b.invoke_handler(tauri::generate_handler![
        system::close_splashscreen,
        telemetry::record_page_route_visited,
        telemetry::judge_page_route_visited,
        connections::save_connection,
        connections::get_connections,
        connections::establish_connection,
        connections::release_connection,
        connections::remove_connection,
        client::db_nums,
        client::switch_db,
        client::flush_all,
        client::list_client_metrics,
        client::list_all_keys,
        client::create_new_key,
        client::remove_key,
        client::get_key_type,
        client::get_key_ttl,
        client::get_key_content_type_string,
        client::set_key_ttl,
        client::set_key_content_type_string,
        client::rename_key,
        client::scan_all_keys,
        client::refresh_scanned_all_keys,
        client::get_key_content_type_hash,
    ])
}
