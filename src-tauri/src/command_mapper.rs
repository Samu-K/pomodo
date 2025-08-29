use crate::database::{
    self, category::CategoryActions, decls, session::SessionActions, settings::SettingActions,
    task::TaskActions,
};

use paste::paste;
use tauri::State;

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
                #[tauri::command]
                pub async fn [<$action _ $method>]<'r>(
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
    categories::add_category(cat: decls::Category) -> decls::IdReturn,
    categories::get_categories() -> decls::CategoryGetVec
}
