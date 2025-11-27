pub mod database;

use chrono::NaiveDate;
use paste::paste;
use specta::specta;
use std::sync::Arc;
use tauri::Manager as _;
use tauri::State;

use crate::database::{
    category::CategoryActions,
    decls::{
        Category, CategoryGet, CategoryGetVec, IdReturn, NoReturn, Session, SessionGetVec,
        SettingCatGetVec, SettingGetVec, StringReturn,
    },
    session::SessionActions,
    settings::SettingActions,
};

pub struct AppState {
    pub categories: CategoryActions,
    pub session: SessionActions,
    pub settings: SettingActions,
}

macro_rules! tauri_commands {
    (
    $state_type:ty,
    $($action:ident :: $method:ident($($param:ident: $param_type:ty),*) -> $ret:ty),*) => {
        $(
            paste! {
                #[tauri::command(rename_all="snake_case")]
                #[specta]
                async fn [<$action _ $method>]<'r>(
                    state: State<'r, $state_type>,
                    $($param: $param_type),*
                ) -> $ret {
                    state.$action
                        .$method($($param),*)
                        .await
                        .map_err(|e| e)
                }
            }
        )*
    };
}

tauri_commands! {
    AppState,
    categories::add_category(cat:Category) -> IdReturn,
    categories::get_categories() -> CategoryGetVec,
    categories::get_category_by_name(cat_name: String) -> CategoryGet,
    categories::get_category(cat_id: i64) -> CategoryGet,
    categories::set_category_name(name: String, cat_id: i64) -> NoReturn,
    categories::set_category_color(color: String, cat_id: i64) -> NoReturn,
    categories::delete_category(cat_id: i64) -> NoReturn,
    session::add_session(session: Session) -> IdReturn,
    session::get_sessions() -> SessionGetVec,
    session::get_incomplete_sessions() -> SessionGetVec,
    session::get_category_sessions(cat_id:i64) -> SessionGetVec,
    session::get_date_sessions(date: NaiveDate) -> SessionGetVec,
    session::set_session_incomplete(id: i64) -> NoReturn,
    session::set_session_complete(id: i64) -> NoReturn,
    session::set_session_category(session_id: i64, cat_id: i64) -> NoReturn,
    session::set_session_length(session_id: i64, len: u16) -> NoReturn,
    session::delete_session(sessionId: i64) -> NoReturn,
    settings::get_setting_value(key: String) -> StringReturn,
    settings::get_all_settings() -> SettingGetVec,
    settings::set_setting_value(value: String, id: i64) -> NoReturn,
    settings::get_setting_categories() -> SettingCatGetVec,
    settings::get_settings_for_category(cat_id: i64) -> SettingGetVec
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder =
        tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
            categories_add_category,
            categories_get_categories,
            categories_get_category_by_name,
            categories_get_category,
            categories_set_category_name,
            categories_set_category_color,
            categories_delete_category,
            session_add_session,
            session_get_sessions,
            session_get_incomplete_sessions,
            session_get_category_sessions,
            session_get_date_sessions,
            session_set_session_incomplete,
            session_set_session_complete,
            session_set_session_category,
            session_set_session_length,
            session_delete_session,
            settings_get_setting_value,
            settings_get_all_settings,
            settings_set_setting_value,
            settings_get_setting_categories,
            settings_get_settings_for_category,
        ]);

    #[cfg(all(debug_assertions, not(mobile)))]
    builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number),
            "../src/funcs/commands.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                let db = Arc::new(database::create_database(Some(app)).await);
                let sa = SessionActions::new(db.clone());
                let sta = SettingActions::new(db.clone());
                let ca = CategoryActions::new(db.clone());
                app.manage(AppState {
                    categories: ca,
                    session: sa,
                    settings: sta,
                })
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
