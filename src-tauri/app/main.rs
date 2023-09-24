// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod command;
mod context;
mod features;
mod plugins;
mod utils;

fn main() {
    let builder = command::register_commands(tauri::Builder::default());
    let builder = plugins::register_plugins(builder);

    context::run_with_context(builder).expect("error while running tauri application");
}
