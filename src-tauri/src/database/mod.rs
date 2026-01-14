pub mod category;
pub mod decls;
pub mod ical;
pub mod project;
pub mod session;
pub mod settings;
pub mod task;

use decls::Db;
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Sqlite};
use std::fs::create_dir_all;
use tauri::{App, Manager as _};

pub async fn create_database(app: Option<&tauri::App>) -> Result<SqlitePool, String> {
    let app_dir = match app {
        Some(a) => a.path().app_data_dir().map_err(|e| e.to_string())?,
        None => {
            let mut path = std::env::current_dir().unwrap();
            path.push("data");
            path
        }
    };
    create_dir_all(&app_dir).map_err(|e| format!("failed to create dir: {e}"))?;
    let db_path = app_dir.join("pomodo.db");

    let db_url = format!("sqlite:{}", db_path.to_str().unwrap());

    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        Sqlite::create_database(&db_url).await.map_err(|e| e.to_string())?;
    }

    let pool = SqlitePool::connect(&db_url).await.map_err(|e| e.to_string())?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| e.to_string())?;

    #[cfg(debug_assertions)]
    {
        if std::env::var("POMODO_SKIP_SEEDING").is_err() {
            sqlx::migrate!("./migrations/seed")
                .run(&pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(pool)
}
