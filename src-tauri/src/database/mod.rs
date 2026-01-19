pub mod category;
pub mod decls;
pub mod ical;
pub mod project;
pub mod session;
pub mod settings;
pub mod task;
pub mod snapshot;

use decls::Db;
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use std::fs::create_dir_all;
use tauri::Manager as _;

use std::path::PathBuf;

use tauri::App;

pub async fn create_database(app: Option<&App>) -> Result<(Db, PathBuf), String> {

    println!("Database init: starting");
    let app_dir = match app {
        Some(app) => {
            println!("Database init: getting app dir");
            app.path().app_data_dir().map_err(|e| e.to_string())?
        }
        None => {
            let mut path = std::env::current_dir().unwrap();
            path.push("data");
            path
        }
    };
    println!("DB: app_dir: {}", app_dir.display());
    create_dir_all(&app_dir).map_err(|e| format!("failed to create dir: {e}"))?;
    let db_path = app_dir.join("pomodo.db");

    let db_url = format!("sqlite:{}", db_path.to_str().unwrap());

    println!("DB: Checking if DB exists at {db_url}");
    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        println!("DB: DB does not exist, creating");
        Sqlite::create_database(&db_url)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        println!("DB: DB already exists");
    }

    let pool = SqlitePool::connect(&db_url)
        .await
        .map_err(|e| e.to_string())?;

    println!("DB: Running migrations");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| e.to_string())?;

    #[cfg(debug_assertions)]
    {
        if std::env::var("POMODO_SKIP_SEEDING").is_err() {
            sqlx::migrate!("./seed_migrations")
                .set_ignore_missing(true)
                .run(&pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    println!("Database init: success");
    Ok((pool, app_dir))
}

