mod cmd;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![cmd::demo::greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
