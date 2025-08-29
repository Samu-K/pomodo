pub mod command_mapper;
pub mod database;
pub mod derive_commands;

use command_mapper::{categories_add_category, categories_get_categories};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            categories_add_category,
            categories_get_categories
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
