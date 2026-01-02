use super::decls::{Db, IdReturn, NoReturn, Task, TaskGetVec};
use chrono::NaiveDateTime;
use sqlx::{query, query_as};

use std::sync::Arc;

pub struct TaskActions {
    pub db: Arc<Db>,
}

impl TaskActions {
    pub fn new(db: Arc<Db>) -> Self {
        Self { db }
    }

    pub async fn add_task(&self, task: Task) -> IdReturn {
        let mut tx = self.db.begin().await?;
        let id = query(
            "INSERT INTO tasks (title, description, category_id, project_id, estimated_pomodoros, start_datetime, recurrence_rule, is_completed, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(task.title)
        .bind(task.description)
        .bind(task.category_id)
        .bind(task.project_id)
        .bind(task.estimated_pomodoros)
        .bind(task.start_datetime)
        .bind(task.recurrence_rule)
        .bind(task.is_completed)
        .bind(task.parent_task_id)
        .execute(&mut *tx)
        .await?
        .last_insert_rowid();

        tx.commit().await?;
        Ok(id)
    }

    pub async fn get_tasks(&self) -> TaskGetVec {
        let tasks = query_as::<_, Task>("SELECT * FROM tasks ORDER BY start_datetime ASC")
            .fetch_all(&*self.db)
            .await?;
        Ok(tasks)
    }

    pub async fn update_task(&self, task: Task) -> NoReturn {
        query(
            "UPDATE tasks SET title = ?, description = ?, category_id = ?, project_id = ?, estimated_pomodoros = ?, start_datetime = ?, recurrence_rule = ?, is_completed = ? WHERE id = ?",
        )
        .bind(task.title)
        .bind(task.description)
        .bind(task.category_id)
        .bind(task.project_id)
        .bind(task.estimated_pomodoros)
        .bind(task.start_datetime)
        .bind(task.recurrence_rule)
        .bind(task.is_completed)
        .bind(task.id)
        .execute(&*self.db)
        .await?;
        Ok(())
    }

    pub async fn complete_task_instance(
        &self,
        parent_task_id: i64,
        date: NaiveDateTime,
    ) -> IdReturn {
        let parent_task: Task = query_as("SELECT * FROM tasks WHERE id = ?")
            .bind(parent_task_id)
            .fetch_one(&*self.db)
            .await?;

        let id = query(
             "INSERT INTO tasks (title, description, category_id, project_id, estimated_pomodoros, start_datetime, recurrence_rule, is_completed, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?)",
        )
        .bind(parent_task.title)
        .bind(parent_task.description)
        .bind(parent_task.category_id)
        .bind(parent_task.project_id)
        .bind(parent_task.estimated_pomodoros)
        .bind(date) // The specific instance date
        .bind(parent_task_id)
        .execute(&*self.db)
        .await?
        .last_insert_rowid();

        Ok(id)
    }

    pub async fn delete_task(&self, id: i64) -> NoReturn {
        query("DELETE FROM tasks WHERE id = ?")
            .bind(id)
            .execute(&*self.db)
            .await?;
        Ok(())
    }
}
