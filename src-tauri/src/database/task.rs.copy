use crate::database::{
    self,
    decls::{IdReturn, NoReturn, Task, TaskGet, TaskGetVec},
};
use chrono::NaiveDate;
use futures::TryStreamExt;
use sqlx::{QueryBuilder, Sqlite};
use std::error::Error;

pub struct TaskActions<'a> {
    pub db: &'a database::Db,
}

impl<'a> TaskActions<'a> {
    pub fn new(db: &'a database::Db) -> Self {
        TaskActions { db }
    }

    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    fn build_query_from_task(
        query_type: &str,
        task: Task,
    ) -> Result<QueryBuilder<'_, Sqlite>, Box<dyn Error>> {
        let mut query_builder: QueryBuilder<Sqlite>;
        match query_type.to_lowercase().as_str() {
            "insert" => {
                query_builder = QueryBuilder::new("INSERT into tasks (");
            }
            "update" => {
                query_builder = QueryBuilder::new("UPDATE tasks SET (");
            }
            _ => return Err("Invalid query type".into()),
        };
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
        if task.completed.is_some() {
            query_builder.push(", completed");
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
        if task.completed.is_some() {
            sep.push_bind(task.completed);
        }
        sep.push_unseparated(")");

        Ok(query_builder)
    }

    pub async fn add_task(&self, task: Task) -> IdReturn {
        if task.name.is_empty() || task.task_type.is_empty() {
            return Err("Task needs a name and type".into());
        };

        let mut query_builder: QueryBuilder<Sqlite> = Self::build_query_from_task("insert", task)?;
        let query = query_builder.build();
        let res = query.execute(self.db).await?;

        Ok(res.last_insert_rowid())
    }
    /*
     * ########################################################################
     *                      R E A D
     * ########################################################################
     */

    pub async fn get_task_by_id(&self, task_id: i64) -> TaskGet {
        let sql = "SELECT * from tasks WHERE id = $1";
        let task: Task = sqlx::query_as::<_, Task>(sql)
            .bind(task_id)
            .fetch_one(self.db)
            .await?;

        Ok(task)
    }

    pub async fn get_tasks(&self) -> TaskGetVec {
        let sql = "SELECT * from tasks";
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(tasks)
    }

    pub async fn get_oneshot_tasks(&self) -> TaskGetVec {
        let sql = "SELECT * FROM tasks WHERE Task_type = 'oneshot'";
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(tasks)
    }

    pub async fn get_recurring_tasks(&self) -> TaskGetVec {
        let sql = "SELECT * FROM tasks WHERE task_type = 'recurring'";
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(tasks)
    }

    // all tasks with given date as deadline
    pub async fn get_date_tasks(&self, date: NaiveDate) -> TaskGetVec {
        let sql = "SELECT * from tasks WHERE deadline = $1";
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .bind(date)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(tasks)
    }

    pub async fn get_date_range_tasks(
        &self,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> TaskGetVec {
        let sql = "SELECT * FROM tasks WHERE deadline >= $1 AND deadline <= $2";
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .bind(start_date)
            .bind(end_date)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(tasks)
    }

    pub async fn get_subtasks(&self, parent_id: i64) -> TaskGetVec {
        let sql = "SELECT * from tasks WHERE parent_id = $1";
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .bind(parent_id)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(tasks)
    }

    // get the parent of given subtask.
    pub async fn get_parent_task(&self, task_id: i64) -> TaskGet {
        let sql = "SELECT * from tasks 
             WHERE id in (
                SELECT parent_id FROM tasks
                WHERE id = $1
            );";
        let parent_task: Task = sqlx::query_as::<_, Task>(sql)
            .bind(task_id)
            .fetch_one(self.db)
            .await?;

        Ok(parent_task)
    }

    /*
     * ########################################################################
     *                       U P D A T E
     * ########################################################################
     */

    // dynamic task updating with whole task object
    pub async fn update_task(&self, task: Task) -> NoReturn {
        let mut query_builder: QueryBuilder<Sqlite> = Self::build_query_from_task("update", task)?;
        let query = query_builder.build();
        let _res = query.execute(self.db).await?;
        Ok(())
    }

    pub async fn set_task_complete(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE tasks SET completed = true WHERE id = $1";
        let _res = sqlx::query(sql).bind(task_id).execute(self.db).await?;

        Ok(())
    }
    pub async fn set_task_incomplete(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE tasks SET completed = false WHERE id = $1";
        let _res = sqlx::query(sql).bind(task_id).execute(self.db).await?;

        Ok(())
    }

    pub async fn update_task_string(&self, task_id: i64, field: &str, value: String) -> NoReturn {
        let mut sql = String::from("UPDATE tasks SET ");
        sql += field;
        sql += " = $1 WHERE id = $2";
        let _res = sqlx::query(&sql)
            .bind(value)
            .bind(task_id)
            .execute(self.db)
            .await?;
        Ok(())
    }
    pub async fn update_task_numerical(&self, task_id: i64, field: &str, value: i64) -> NoReturn {
        let mut sql = String::from("UPDATE tasks SET ");
        sql += field;
        sql += " = $1 WHERE id = $2";
        let _res = sqlx::query(&sql)
            .bind(value)
            .bind(task_id)
            .execute(self.db)
            .await?;
        Ok(())
    }
    pub async fn update_task_boolean(&self, task_id: i64, field: &str, value: bool) -> NoReturn {
        let mut sql = String::from("UPDATE tasks SET ");
        sql += field;
        sql += " = $1 WHERE id = $2";
        let _res = sqlx::query(&sql)
            .bind(value)
            .bind(task_id)
            .execute(self.db)
            .await?;
        Ok(())
    }

    /*
     * ########################################################################
     *                       D E L E T E
     * ########################################################################
     */
    pub async fn delete_task(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE id = $1";
        let _res = sqlx::query(sql).bind(task_id).execute(self.db).await?;

        Ok(())
    }
    pub async fn recover_task(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = false WHERE id = $1";
        let _res = sqlx::query(sql).bind(task_id).execute(self.db).await?;

        Ok(())
    }
    pub async fn delete_subtasks(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE parent_id = $1";
        let _res = sqlx::query(sql).bind(task_id).execute(self.db).await?;

        Ok(())
    }
    pub async fn delete_tasks_in_category(&self, category_id: i64) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE category_id = $1";
        let _res = sqlx::query(sql).bind(category_id).execute(self.db).await?;

        Ok(())
    }
    pub async fn clear_all_oneshot_tasks(&self) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE task_type = 'oneshot'";
        let _res = sqlx::query(sql).execute(self.db).await?;

        Ok(())
    }
    pub async fn clear_all_tasks_for_date(&self, date: NaiveDate) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE deadline = '$1'";
        let _res = sqlx::query(sql).bind(date).execute(self.db).await?;

        Ok(())
    }
    pub async fn clear_all_tasks_for_and_after_date(&self, date: NaiveDate) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE deadline >= '$1'";
        let _res = sqlx::query(sql).bind(date).execute(self.db).await?;

        Ok(())
    }
    pub async fn clear_complete_tasks(&self) -> NoReturn {
        let sql = "UPDATE TASKS SET deleted = true WHERE complete = true";
        let _res = sqlx::query(sql).execute(self.db).await?;

        Ok(())
    }
}
