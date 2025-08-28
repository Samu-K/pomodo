use crate::database;
use chrono::NaiveDate;
use futures::TryStreamExt;
use sqlx::{query_builder, Execute, FromRow, QueryBuilder, Sqlite};
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

        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new("INSERT into tasks (");
        query_builder.push("name, task_type");

        if task.description.is_some() {
            query_builder.push(", description");
        }
        if task.deadline.is_some() {
            query_builder.push(", deadline");
        }
        if task.parent_id.is_some() {
            query_builder.push(", parent_id");
        }
        if task.repeat_period.is_some() {
            query_builder.push(", repeat_period");
        }
        query_builder.push(") VALUES (");
        let mut sep = query_builder.separated(", ");
        sep.push_bind(task.name);
        sep.push_bind(task.task_type);

        if task.description.is_some() {
            sep.push_bind(task.description);
        }
        if task.deadline.is_some() {
            sep.push_bind(task.deadline);
        }
        if task.parent_id.is_some() {
            sep.push_bind(task.parent_id);
        }
        if task.repeat_period.is_some() {
            sep.push_bind(task.repeat_period);
        }
        sep.push_unseparated(")");
        let query = query_builder.build();
        println!("Sql to use {}", query.sql());
        let res = query.execute(&self.db).await?;

        Ok(res.last_insert_rowid())
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
    pub async fn delete_task(&self, task_id: i64) -> Result<(), Box<dyn Error>> {
        let sql = "DELETE FROM tasks WHERE id = $1";
        let _res = sqlx::query(sql).bind(task_id).execute(&self.db).await?;

        Ok(())
    }
}
