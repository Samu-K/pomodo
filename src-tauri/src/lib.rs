pub mod database;

use chrono::{NaiveDate, NaiveDateTime};
use paste::paste;
use std::sync::Arc;
use tauri::Manager as _;
use tauri::State;

use crate::database::{
    category::CategoryActions,
    decls::{
        Category, CategoryGet, CategoryGetVec, IdReturn, NoReturn, RecurrenceExdateGetVec,
        RecurrenceRdateGetVec, RecurrenceRuleGetVec, Session, SessionGetVec, SettingGetVec,
        StringReturn, Task, TaskGet, TaskGetVec,
    },
    session::SessionActions,
    settings::SettingActions,
    task::TaskActions,
};

pub struct AppState {
    pub categories: CategoryActions,
    pub task: TaskActions,
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
    session::get_task_sessions(task_id: i64) -> SessionGetVec,
    session::get_date_sessions(date: NaiveDate) -> SessionGetVec,
    session::set_session_incomplete(id: i64) -> NoReturn,
    session::set_session_complete(id: i64) -> NoReturn,
    session::set_session_task(session_id: i64, task_id: i64) -> NoReturn,
    session::set_session_category(session_id: i64, task_id: i64) -> NoReturn,
    session::set_session_length(session_id: i64, len: u16) -> NoReturn,
    session::delete_session(session_id: i64) -> NoReturn,
    settings::get_setting_value(key: String) -> StringReturn,
    settings::get_all_settings() -> SettingGetVec,
    settings::set_setting_value(value: String, key: String) -> NoReturn,
    settings::reset_default_setting(key: String) -> NoReturn,
    settings::reset_all_settings_default() -> NoReturn,
    task::add_task(task: Task) -> IdReturn,
    task::get_task_by_id(task_id: i64) -> TaskGet,
    task::get_tasks() -> TaskGetVec,
    task::get_oneshot_tasks() -> TaskGetVec,
    task::get_recurring_tasks() -> TaskGetVec,
    task::get_date_tasks(date: NaiveDate) -> TaskGetVec,
    task::get_date_range_tasks(start_date: NaiveDate, end_date: NaiveDate) -> TaskGetVec,
    task::update_task(task: Task) -> NoReturn,
    task::set_task_complete(task_id: i64) -> NoReturn,
    task::set_task_incomplete(task_id: i64) -> NoReturn,
    task::update_task_string(task_id: i64, field: &str, value: String) -> NoReturn,
    task::update_task_numerical(task_id: i64, field: &str, value: i64) -> NoReturn,
    task::update_task_boolean(task_id:  i64, field: &str, value: bool) -> NoReturn,
    task::delete_task( task_id: i64) -> NoReturn,
    task::delete_tasks_in_category( category_id: i64) -> NoReturn,
    task::clear_all_oneshot_tasks() -> NoReturn,
    task::clear_all_tasks_for_date( date: NaiveDate) -> NoReturn,
    task::clear_all_tasks_for_and_after_date( date: NaiveDate) -> NoReturn,
    task::clear_complete_tasks() -> NoReturn,
    task::add_rule(
        task_id: i64,
        rrule: String,
        dtstart: NaiveDateTime,
        until: Option<NaiveDateTime>,
        timezone: Option<String>
    ) -> IdReturn,
    task::delete_rule(rule_id: i64) -> NoReturn,
    task::update_rule(
        rule_id: i64,
        rrule: Option<String>,
        dtstart: Option<NaiveDateTime>,
        until: Option<NaiveDateTime>,
        timezone: Option<String>
    ) -> NoReturn,
    task::get_rules_for_task(task_id: i64) -> RecurrenceRuleGetVec,
    task::add_exdate(
        recurrence_rule_id: i64,
        exdate: NaiveDateTime
    ) -> IdReturn,
    task::add_rdate(
        recurrence_rule_id: i64,
        rdate: NaiveDateTime
    ) -> IdReturn,
    task::get_exdates_for_rule(recurrence_rule_id: i64) -> RecurrenceExdateGetVec,
    task::get_rdates_for_rule(recurrence_rule_id: i64) -> RecurrenceRdateGetVec
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
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
            session_get_task_sessions,
            session_get_date_sessions,
            session_set_session_incomplete,
            session_set_session_complete,
            session_set_session_task,
            session_set_session_category,
            session_set_session_length,
            session_delete_session,
            settings_get_setting_value,
            settings_get_all_settings,
            settings_set_setting_value,
            settings_reset_default_setting,
            settings_reset_all_settings_default,
            task_add_task,
            task_get_task_by_id,
            task_get_tasks,
            task_get_oneshot_tasks,
            task_get_recurring_tasks,
            task_get_date_tasks,
            task_get_date_range_tasks,
            task_update_task,
            task_set_task_complete,
            task_set_task_incomplete,
            task_update_task_string,
            task_update_task_numerical,
            task_update_task_boolean,
            task_delete_task,
            task_delete_tasks_in_category,
            task_clear_all_oneshot_tasks,
            task_clear_all_tasks_for_date,
            task_clear_all_tasks_for_and_after_date,
            task_clear_complete_tasks,
            task_add_rule,
            task_delete_rule,
            task_update_rule,
            task_get_rules_for_task,
            task_add_exdate,
            task_add_rdate,
            task_get_exdates_for_rule,
            task_get_rdates_for_rule
        ])
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                let db = Arc::new(database::create_database(Some(app)).await);
                let ta = TaskActions::new(db.clone());
                let sa = SessionActions::new(db.clone());
                let sta = SettingActions::new(db.clone());
                let ca = CategoryActions::new(db.clone());
                app.manage(AppState {
                    categories: ca,
                    task: ta,
                    session: sa,
                    settings: sta,
                })
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
