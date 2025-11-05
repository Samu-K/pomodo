// decls.rs (updated)
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use sqlx::{Pool, Sqlite};
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppError {
    message: String,
}

impl AppError {
    pub fn new(msg: impl Into<String>) -> Self {
        Self {
            message: msg.into(),
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AppError {}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        Self::new(err.to_string())
    }
}
impl From<&str> for AppError {
    fn from(err: &str) -> Self {
        Self::new(err)
    }
}
impl From<String> for AppError {
    fn from(err: String) -> Self {
        Self::new(err)
    }
}
impl From<Box<dyn std::error::Error>> for AppError {
    fn from(err: Box<dyn std::error::Error>) -> Self {
        Self::new(err.to_string())
    }
}

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct Session {
    pub id: Option<i64>,
    pub start_time: NaiveDateTime, // TIMESTAMP
    pub duration: Option<i64>,
    pub finished: bool,
    pub category_id: Option<i64>,
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub last_modified: Option<NaiveDateTime>,
}

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug, Default)]
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: String,
}

pub type NoReturn = Result<(), AppError>;
pub type IdReturn = Result<i64, AppError>;

pub type Db = Pool<Sqlite>;

pub type CategoryGet = Result<Category, AppError>;
pub type CategoryGetVec = Result<Vec<Category>, AppError>;

pub type SessionGet = Result<Session, AppError>;
pub type SessionGetVec = Result<Vec<Session>, AppError>;

pub type SettingGetVec = Result<Vec<Setting>, AppError>;
pub type StringReturn = Result<String, AppError>;
