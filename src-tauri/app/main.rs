mod command;
mod context;
mod features;

fn main() {
    context::run_with_context(command::register_commands(tauri::Builder::default()))
        .expect("error while running tauri application");
}
