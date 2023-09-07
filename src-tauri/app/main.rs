// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod command;
mod context;
mod features;

fn main() {
    context::run_with_context(command::register_commands(tauri::Builder::default()))
        .expect("error while running tauri application");
}
