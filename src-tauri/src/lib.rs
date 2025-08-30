pub mod command_mapper;
pub mod database;

use crate::database::{
    category::{self, CategoryActions},
    decls,
    session::SessionActions,
    settings::SettingActions,
    task::TaskActions,
};

pub struct AppState<'a> {
    pub categories: CategoryActions<'a>,
    pub tasks: TaskActions<'a>,
    pub session: SessionActions<'a>,
    pub settings: SettingActions<'a>,
}

impl<'a> AppState<'a> {
    pub async fn new(db: &'a decls::Db) -> Self {
        Self {
            categories: CategoryActions::new(db),
            tasks: TaskActions::new(db),
            session: SessionActions::new(db),
            settings: SettingActions::new(db),
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
