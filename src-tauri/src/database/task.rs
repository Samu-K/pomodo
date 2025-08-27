use crate::database;
use chrono::NaiveDate;
use futures::TryStreamExt;
use sqlx::FromRow;
use std::error::Error;

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug)]
pub struct Task {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub task_type: String,
    pub estimated_cycles: i64,
    pub completed_cycles: i64,
    pub deadline: Option<NaiveDate>,

    pub parent_id: Option<i64>,
    pub repeat_period: Option<String>,
}

pub struct TaskActions {
    pub db: database::Db,
}

impl TaskActions {
    pub fn new(db: database::Db) -> Self {
        TaskActions { db }
    }

    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    pub async fn add_task(&self, task: Task) -> Result<i64, Box<dyn Error>> {
        if task.name.is_empty() || task.task_type.is_empty() {
            return Err("Task needs a name and type".into());
        };

        let mut sql = String::from("INSERT INTO tasks (name, task_type");
        let mut count = 2;
        if task.description.is_some() {
            count += 1;
            sql += ", description";
        }
        if task.deadline.is_some() {
            count += 1;
            sql += ", deadline";
        }
        if task.parent_id.is_some() {
            count += 1;
            sql += ", parent_id";
        }
        if task.repeat_period.is_some() {
            count += 1;
            sql += ", repeat_period";
        }
        sql += ") VALUES ($1";

        for i in 1..count {
            let num = i + 1;
            sql += format!(", ${num}").as_str();
        }

        sql += ")";
        println!("Sql to use {sql}");

        Ok(20)
    }
    /*
     * ########################################################################
     *                      R E A D
     * ########################################################################
     */

    /*
     * ########################################################################
     *                       U P D A T E
     * ########################################################################
     */
    /*
     * ########################################################################
     *                       D E L E T E
     * ########################################################################
     */
}
