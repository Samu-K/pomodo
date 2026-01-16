pub mod category;
pub mod decls;
pub mod project;
pub mod session;
pub mod settings;
pub mod task;
pub mod snapshot;

use decls::Db;
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Sqlite};
use std::fs::create_dir_all;
use tauri::{App, Manager as _};

use std::path::PathBuf;

pub async fn create_database(app: Option<&App>) -> Result<(Db, PathBuf), String> {

    println!("Database init: starting");
    let mut app_dir;
    match app {
        Some(app) => {
            println!("Database init: getting app dir");
            app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        }
        None => {
            app_dir = std::path::PathBuf::from("/home/samuk/.local/share/com.pomodo.app/");
        }
    };

    println!("Database init: creating dir at {:?}", app_dir);
    create_dir_all(&app_dir).map_err(|e| format!("failed to create dir: {e}"))?;
    println!("Creating db at {app_dir:?}");
    app_dir.push("pomodo.sqlite");

    let db_url = format!(
        "sqlite:{}",
        app_dir.to_str().ok_or("path should be valid unicode")?
    );
    println!("Database init: db_url is {}", db_url);

    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        println!("Database init: creating database file");
        Sqlite::create_database(&db_url)
            .await
            .map_err(|e| format!("failed to create database: {e}"))?;
    } else {
        println!("Database init: database exists");
    }

    println!("Database init: connecting");
    let db = SqlitePoolOptions::new()
        .connect(&db_url)
        .await
        .map_err(|e| format!("Failed to connect to database: {e}"))?;

    println!("Database init: running migrations");
    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .map_err(|e| format!("failed to run migrations: {e}"))?;

    #[cfg(debug_assertions)]
    {
        if std::env::var("POMODO_SKIP_SEEDING").is_err() {
            println!("Database init: Dev seed data");
            let seed_sql = include_str!("../../migrations/seed/20260105120000_dev_seed_data.sql");
            sqlx::query(seed_sql)
                .execute(&db)
                .await
                .map_err(|e| format!("failed to run seed migrations: {e}"))?;
        } else {
            println!("Database init: Skipping dev seed data (POMODO_SKIP_SEEDING is set)");
        }
    }

    println!("Database init: success");
    Ok((db, app_dir))
}

