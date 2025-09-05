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

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug, Default)]
pub struct Task {
    // id is optional for inserts; when loaded from DB it will be Some(id)
    pub id: Option<i64>,

    // Task core fields (matches `tasks` table)
    // title maps to DB column `title`
    pub title: Option<String>,
    pub category_id: Option<i64>,
    pub estimated_cycles: Option<i64>,
    pub estimated_duration_seconds: Option<i64>,
    pub is_recurring: Option<bool>,
    pub series_id: Option<i64>,
    pub completed: Option<bool>,

    // computed: number of completed pomodoro sessions for the task (derived)
    pub completed_cycles: Option<i64>,

    // details from `task_details` joined in read queries
    pub description: Option<String>,
    pub deadline: Option<NaiveDateTime>,

    // created/updated timestamps (TIMESTAMP in DB -> NaiveDateTime)
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct Session {
    pub id: i64,
    pub start_time: NaiveDateTime, // TIMESTAMP
    pub duration_seconds: Option<i64>,
    pub session_length: Option<i64>,
    pub finished: bool,
    pub category_id: Option<i64>,
    pub task_id: Option<i64>,
    pub task_instance_id: Option<i64>,
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub last_modified: Option<NaiveDateTime>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct RecurrenceRule {
    pub id: i64,
    pub task_id: i64,
    pub rrule: String,
    pub dtstart: NaiveDateTime,
    pub until: Option<NaiveDateTime>,
    pub timezone: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct RecurrenceExdate {
    pub id: i64,
    pub recurrence_rule_id: i64,
    pub exdate: NaiveDateTime,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct RecurrenceRdate {
    pub id: i64,
    pub recurrence_rule_id: i64,
    pub rdate: NaiveDateTime,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, FromRow)]
pub struct TaskInstance {
    pub id: i64,
    pub task_id: i64,
    pub recurrence_rule_id: Option<i64>,
    pub recurrence_id: Option<NaiveDateTime>,
    pub instance_date: NaiveDateTime,
    pub status: Option<String>,
    pub completed_at: Option<NaiveDateTime>,
    pub is_exception: Option<bool>,
    pub override_of_instance_id: Option<i64>,
    pub modified_title: Option<String>,
    pub modified_description: Option<String>,
    pub modified_duration: Option<i64>,
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

pub type TaskGet = Result<Task, AppError>;
pub type TaskGetVec = Result<Vec<Task>, AppError>;

pub type SessionGet = Result<Session, AppError>;
pub type SessionGetVec = Result<Vec<Session>, AppError>;

pub type RecurrenceRuleGetVec = Result<Vec<RecurrenceRule>, AppError>;
pub type RecurrenceExdateGetVec = Result<Vec<RecurrenceExdate>, AppError>;
pub type RecurrenceRdateGetVec = Result<Vec<RecurrenceRdate>, AppError>;

pub type SettingGetVec = Result<Vec<Setting>, AppError>;
pub type StringReturn = Result<String, AppError>;
