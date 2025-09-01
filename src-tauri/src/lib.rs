pub mod database;

use chrono::NaiveDate;
use paste::paste;
use tauri::State;

use crate::database::{
    category::CategoryActions,
    decls::{
        self, Category, CategoryGet, CategoryGetVec, IdReturn, NoReturn, Session, SessionGetVec,
        SettingGetVec, StringReturn, Task, TaskGet, TaskGetVec,
    },
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
    AppState<'_>,
    categories::add_category(cat:Category) -> IdReturn,
    categories::get_categories() -> CategoryGetVec,
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
    tasks::add_task(task: Task) -> IdReturn,
    tasks::get_task_by_id(task_id: i64) -> TaskGet,
    tasks::get_tasks() -> TaskGetVec,
    tasks::get_oneshot_tasks() -> TaskGetVec,
    tasks::get_recurring_tasks() -> TaskGetVec,
    tasks::get_date_tasks(date: NaiveDate) -> TaskGetVec,
    tasks::get_date_range_tasks(start_date: NaiveDate, end_date: NaiveDate) -> TaskGetVec,
    tasks::get_subtasks(parent_id: i64) -> TaskGetVec,
    tasks::get_parent_task(task_id: i64) -> TaskGet,
    tasks::update_task(task: Task) -> NoReturn,
    tasks::set_task_complete(task_id: i64) -> NoReturn,
    tasks::set_task_incomplete(task_id: i64) -> NoReturn,
    tasks::update_task_string(task_id: i64, field: &str, value: String) -> NoReturn,
    tasks::update_task_numerical(task_id: i64, field: &str, value: i64) -> NoReturn,
    tasks::update_task_boolean(task_id: i64, field: &str, value: bool) -> NoReturn,
    tasks::delete_task(task_id: i64) -> NoReturn,
    tasks::recover_task(task_id: i64) -> NoReturn,
    tasks::delete_subtasks(task_id: i64) -> NoReturn,
    tasks::delete_tasks_in_category(category_id: i64) -> NoReturn,
    tasks::clear_all_oneshot_tasks() -> NoReturn,
    tasks::clear_all_tasks_for_date(date: NaiveDate) -> NoReturn,
    tasks::clear_all_tasks_for_and_after_date(date: NaiveDate) -> NoReturn,
    tasks::clear_complete_tasks() -> NoReturn
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            categories_add_category,
            categories_get_categories,
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
            tasks_add_task,
            tasks_get_task_by_id,
            tasks_get_tasks,
            tasks_get_oneshot_tasks,
            tasks_get_recurring_tasks,
            tasks_get_date_tasks,
            tasks_get_date_range_tasks,
            tasks_get_subtasks,
            tasks_get_parent_task,
            tasks_update_task,
            tasks_set_task_complete,
            tasks_set_task_incomplete,
            tasks_update_task_string,
            tasks_update_task_numerical,
            tasks_update_task_boolean,
            tasks_delete_task,
            tasks_recover_task,
            tasks_delete_subtasks,
            tasks_delete_tasks_in_category,
            tasks_clear_all_oneshot_tasks,
            tasks_clear_all_tasks_for_date,
            tasks_clear_all_tasks_for_and_after_date,
            tasks_clear_complete_tasks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
