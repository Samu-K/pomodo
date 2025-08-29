use chrono::NaiveDate;
use sqlx::FromRow;
use sqlx::{Pool, Sqlite};
use std::error::Error;

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
}

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug, Default)]
pub struct Task {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub task_type: String,
    pub estimated_cycles: i64,
    pub completed_cycles: i64,
    pub completed: Option<bool>,
    pub deadline: Option<NaiveDate>,

    pub parent_id: Option<i64>,
    pub repeat_period: Option<String>,
    pub deleted: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct Session {
    pub id: i64,
    pub session_length: i64,
    pub finished: bool,
    pub category_id: Option<i64>,
    pub task_id: Option<i64>,
}
#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug, Default)]
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: String,
}

pub type NoReturn = Result<(), Box<dyn Error>>;
pub type IdReturn = Result<i64, Box<dyn Error>>;
pub type Db = Pool<Sqlite>;

pub type CategoryGet = Result<Category, Box<dyn Error>>;
pub type CategoryGetVec = Result<Vec<Category>, Box<dyn Error>>;

pub type TaskGet = Result<Task, Box<dyn Error>>;
pub type TaskGetVec = Result<Vec<Task>, Box<dyn Error>>;

pub type SessionGet = Result<Session, Box<dyn Error>>;
pub type SessionGetVec = Result<Vec<Session>, Box<dyn Error>>;

pub type SettingGetVec = Result<Vec<Setting>, Box<dyn Error>>;
