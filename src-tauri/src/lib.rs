pub mod database;
pub mod integrations;

use chrono::{NaiveDate, NaiveDateTime};
use serde::Deserialize;


use paste::paste;
use specta::specta;
use std::sync::Arc;

use tauri::Emitter;
use tauri::Manager as _;
use tauri::State;
#[cfg(not(mobile))]
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    WindowEvent,
};

use crate::database::{
    category::CategoryActions,
    decls::{
        Category, CategoryGet, CategoryGetVec, IdReturn, NoReturn, Project, ProjectGetVec, Session,
        SessionGetVec, SettingCatGetVec, SettingGetVec, StringReturn, Task, TaskGetVec,
    },
    project::ProjectActions,
    session::SessionActions,
    settings::SettingActions,
    task::TaskActions,
    snapshot::Snapshot,
};
use crate::integrations::supabase::{SupabaseClient, SupabaseSession};
use std::sync::Mutex;


pub struct AppState {
    pub categories: CategoryActions,
    pub session: SessionActions,
    pub settings: SettingActions,
    pub tasks: TaskActions,
    pub projects: ProjectActions,
    pub db_path: std::path::PathBuf,
}


pub struct AuthState {
    pub client: SupabaseClient,
    pub session: Mutex<Option<SupabaseSession>>,
}

#[derive(Deserialize)]
struct SupabaseConfig {
    url: String,
    key: String,
}



pub struct TrayState {
    #[cfg(not(mobile))]
    pub toggle_item: MenuItem<tauri::Wry>,
}

#[tauri::command]
#[specta]
async fn update_tray(
    app: tauri::AppHandle,
    state: State<'_, TrayState>,
    title: String,
    toggle_text: Option<String>,
) -> Result<(), String> {
    #[cfg(not(mobile))]
    {
        if let Some(tray) = app.tray_by_id("main") {
            let _ = tray.set_tooltip(Some(title));
        }
        if let Some(text) = toggle_text {
            let _ = state.toggle_item.set_text(text);
        }
    }
    #[cfg(mobile)]
    {
        let _ = app;
        let _ = state;
        let _ = title;
        let _ = toggle_text;
    }
    Ok(())
}

macro_rules! tauri_commands {
    (
    $state_type:ty,
    $($action:ident :: $method:ident($($param:ident: $param_type:ty),*) -> $ret:ty),*) => {
        $(
            paste! {
                #[tauri::command(rename_all="camelCase")]
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
    session::delete_session(session_id: i64) -> NoReturn,
    settings::get_setting_value(key: String) -> StringReturn,
    settings::get_all_settings() -> SettingGetVec,
    settings::set_setting_value(value: String, id: i64) -> NoReturn,
    settings::get_setting_categories() -> SettingCatGetVec,
    settings::get_settings_for_category(cat_id: i64) -> SettingGetVec,
    tasks::add_task(task: Task) -> IdReturn,
    tasks::get_tasks() -> TaskGetVec,
    tasks::update_task(task: Task) -> NoReturn,
    tasks::delete_task(id: i64) -> NoReturn,
    tasks::complete_task_instance(parent_task_id: i64, date: NaiveDateTime) -> IdReturn,
    projects::add_project(project: Project) -> IdReturn,
    projects::get_projects() -> ProjectGetVec,
    projects::update_project(project: Project) -> NoReturn,
    projects::delete_project(id: i64) -> NoReturn
}

#[tauri::command]
#[specta]
async fn supabase_login(
    state: State<'_, AuthState>,
    email: String,
    password: String,
) -> Result<SupabaseSession, String> {
    let session = state
        .client
        .sign_in(&email, &password)
        .await
        .map_err(|e| e.to_string())?;
    
    *state.session.lock().unwrap() = Some(session.clone());
    Ok(session)
}

#[tauri::command]
#[specta]
async fn supabase_signup(
    state: State<'_, AuthState>,
    email: String,
    password: String,
) -> Result<Option<SupabaseSession>, String> {
    let session = state
        .client
        .sign_up(&email, &password)
        .await
        .map_err(|e| e.to_string())?;
    
    if let Some(ref s) = session {
        *state.session.lock().unwrap() = Some(s.clone());
    }
    
    Ok(session)
}


#[tauri::command]
#[specta]
async fn supabase_sync_now(
    app_state: State<'_, AppState>,
    auth_state: State<'_, AuthState>,
) -> Result<(), String> {
    // 1. Check if logged in
    let token = {
        let guard = auth_state.session.lock().unwrap();
        guard.as_ref().map(|s| s.access_token.clone())
    }.ok_or("Not logged in")?;

    let user_id = {
        let guard = auth_state.session.lock().unwrap();
        guard.as_ref().map(|s| s.user.id.clone())
    }.ok_or("No user ID")?;

    // 2. Create Snapshot
    let db = app_state.categories.db.clone(); // Access DB from any action
    let snapshot = Snapshot::create(db).await.map_err(|e| e.to_string())?;

    // 3. Upload
    auth_state
        .client
        .upload_snapshot(&token, &user_id, snapshot)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta]
async fn supabase_restore(
    _app: tauri::AppHandle, // Need app handle to potentially restart or clear DB?
    app_state: State<'_, AppState>,

    auth_state: State<'_, AuthState>,
) -> Result<(), String> {
     // 1. Check if logged in
     let token = {
        let guard = auth_state.session.lock().unwrap();
        guard.as_ref().map(|s| s.access_token.clone())
    }.ok_or("Not logged in")?;

    // 2. Fetch latest backup
    let backup_json = auth_state.client.get_latest_backup(&token).await.map_err(|e| e.to_string())?;

    if let Some(mut json) = backup_json {
        // Supabase returns a JSON object, the snapshot is in the "data" field?
        // upload_snapshot sends: { user_id, data: snapshot, app_version }
        // So we need to extract "data".
        
        let snapshot_val = json.get_mut("data").ok_or("Backup missing data field")?.take();
        let snapshot: Snapshot = serde_json::from_value(snapshot_val).map_err(|e| format!("Invalid snapshot: {}", e))?;

        // 3. Restore
        let db = app_state.categories.db.clone();
        snapshot.restore(db).await.map_err(|e| e.to_string())?;
    } else {
        return Err("No backup found".to_string());
    }
    
    Ok(())
}



#[tauri::command]
#[specta]
async fn supabase_check_updates(
    app_state: State<'_, AppState>,
    auth_state: State<'_, AuthState>,
) -> Result<bool, String> {
    // 1. Check if logged in
    let token = {
        let guard = auth_state.session.lock().unwrap();
        guard.as_ref().map(|s| s.access_token.clone())
    }.ok_or("Not logged in")?;

    // 2. Head check latest backup
    let latest_backup = auth_state.client.get_latest_backup(&token).await.map_err(|e| e.to_string())?;
    
    if let Some(backup) = latest_backup {
         let created_at_str = backup["created_at"].as_str().ok_or("Invalid created_at")?;
         let created_at = chrono::DateTime::parse_from_rfc3339(created_at_str).map_err(|e| e.to_string())?;
         
         // 3. Check local file time
         let metadata = std::fs::metadata(&app_state.db_path).map_err(|e| e.to_string())?;
         let modified_sys = metadata.modified().map_err(|e| e.to_string())?;
         let modified: chrono::DateTime<chrono::Utc> = modified_sys.into();
         
         println!("Cloud Backup: {}, Local File: {}", created_at, modified);

         // If Cloud is NEWER than Local File + Buffer (e.g. 1 sec), return true
         if created_at > (modified + chrono::Duration::seconds(1)) {
             return Ok(true);
         }
    }

    Ok(false)
}

#[tauri::command]
#[specta]
async fn supabase_test_connection(
    auth_state: State<'_, AuthState>,
) -> Result<String, String> {
    let token = {
        let guard = auth_state.session.lock().unwrap();
        guard.as_ref().map(|s| s.access_token.clone())
    };

    if let Some(token) = token {
        match auth_state.client.get_user(&token).await {
            Ok(user) => Ok(format!("Connected to Supabase. User: {}", user.email.unwrap_or("No Email".to_string()))),
            Err(e) => Err(format!("Connection Error: {}", e))
        }
    } else {
        Ok("Not logged in (Connection untested)".to_string())
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let specta_builder =
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
            tasks_add_task,
            tasks_get_tasks,
            tasks_update_task,
            tasks_delete_task,
            tasks_complete_task_instance,
            projects_add_project,
            projects_get_projects,
            projects_update_project,
            projects_delete_project,
            supabase_login,
            supabase_signup,
            supabase_sync_now,

            supabase_restore,
            supabase_check_updates,
            supabase_test_connection,
            update_tray



        ]);

    #[cfg(all(debug_assertions, not(mobile)))]
    specta_builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number)
                .header("// @ts-nocheck"),
            "../src/funcs/commands.ts",
        )
        .expect("Failed to export typescript bindings");

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init());

    #[cfg(not(mobile))]
    {
        builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());
    }

    builder
        // .plugin(tauri_plugin_safe_area_insets_css::init())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|app| {
            tauri::async_runtime::block_on(async {
                println!("Setup: starting async block");
                match database::create_database(Some(app)).await {
                    Ok((db, path)) => {
                        println!("Setup: database created, managing state");
                        let db = Arc::new(db);
                        let sa = SessionActions::new(db.clone());
                        let sta = SettingActions::new(db.clone());
                        let ca = CategoryActions::new(db.clone());
                        let ta = TaskActions::new(db.clone());
                        let pa = ProjectActions::new(db.clone());
                        app.manage(AppState {
                            categories: ca,
                            session: sa,
                            settings: sta,
                            tasks: ta,
                            projects: pa,
                            db_path: path
                        });

                        println!("Setup: state managed");

                        // Init Supabase
                        let config_str = include_str!("../supabase.json");
                        let config: SupabaseConfig = serde_json::from_str(config_str).expect("Failed to parse supabase.json");
                        
                        let client = SupabaseClient::new(config.url, config.key);

                        app.manage(AuthState {
                            client,
                            session: Mutex::new(None),
                        });

                    }
                    Err(e) => {
                        eprintln!("Error creating database: {e}");
                        // Force a visible log for the user
                        println!("CRITICAL ERROR: {e}");
                    }
                }
            });

            // System Tray
            #[cfg(not(mobile))]
            {
                let toggle_i = MenuItem::with_id(app, "toggle", "Start Focus", true, None::<&str>)?;
                let open_i = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
                let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&toggle_i, &open_i, &quit_i])?;

                let _tray = TrayIconBuilder::with_id("main")
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id().as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "toggle" => {
                            let _ = app.emit("tray_toggle", ());
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;

                app.manage(TrayState {
                    toggle_item: toggle_i,
                });
            }

            #[cfg(mobile)]
            app.manage(TrayState {});

            // Window Close Event
            #[cfg(not(mobile))]
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            // Disable content inset adjustment on iOS
            #[cfg(mobile)]
            if let Some(window) = app.get_webview_window("main") {
                window
                    .with_webview(|webview| {
                        #[cfg(target_os = "ios")]
                        unsafe {
                            use objc::runtime::Object;
                            use objc::{msg_send, sel, sel_impl};

                            let wk_webview = webview.inner() as *mut Object;
                            let scroll_view: *mut Object = msg_send![wk_webview, scrollView];
                            let () = msg_send![scroll_view, setContentInsetAdjustmentBehavior: 2];
                            // 2 = UIScrollViewContentInsetAdjustmentNever
                        }
                    })
                    .expect("failed to run on UI thread");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
