pub mod category;
pub mod decls;
pub mod session;
pub mod settings;
pub mod task;

use decls::Db;
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Sqlite};
use std::fs::create_dir_all;
use tauri::{App, Manager as _};

pub async fn create_database(app: Option<&App>) -> Db {
    let mut app_dir;
    match app {
        Some(app) => {
            app_dir = app.path().app_data_dir().expect("Failed to get app dir");
        }
        None => {
            app_dir = std::path::PathBuf::from("/home/samuk/.local/share/com.pomodo.app/");
        }
    };

    create_dir_all(&app_dir).expect("failed to create dir");
    println!("Creating db at {app_dir:?}");
    app_dir.push("pomodo.sqlite");

    Sqlite::create_database(
        format!(
            "sqlite:{}",
            app_dir.to_str().expect("path should be something")
        )
        .as_str(),
    )
    .await
    .expect("failed to create database");

    let db = SqlitePoolOptions::new()
        .connect(app_dir.to_str().unwrap())
        .await
        .unwrap();

    sqlx::migrate!("./migrations").run(&db).await.unwrap();

    db
}
