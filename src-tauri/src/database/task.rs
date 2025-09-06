// src/database/task.rs
use crate::database::{
    self,
    decls::{
        IdReturn, NoReturn, RecurrenceExdate, RecurrenceExdateGetVec, RecurrenceRdate,
        RecurrenceRdateGetVec, RecurrenceRule, RecurrenceRuleGetVec, Task, TaskGet, TaskGetVec,
    },
};
use chrono::{NaiveDate, NaiveDateTime};
use futures::TryStreamExt;
use sqlx::{Row, Sqlite};
use std::error::Error;

pub struct TaskActions<'a> {
    pub db: &'a database::Db, // Pool<Sqlite>
}

impl<'a> TaskActions<'a> {
    pub fn new(db: &'a database::Db) -> Self {
        TaskActions { db }
    }

    /*
     * ########################################################################
     *                      CREATE
     * ########################################################################
     */

    pub async fn add_task(&self, task: Task) -> IdReturn {
        // minimal validation: title must be provided and non-empty
        let title = match task.title.as_ref() {
            Some(s) if !s.is_empty() => s.clone(),
            _ => return Err("Task requires a title".into()),
        };

        // Insert into tasks. We'll insert all known columns; nullable ones will be NULL if Option::None.
        let sql = r#"
            INSERT INTO tasks
                (title, category_id, estimated_cycles, estimated_duration_seconds, is_recurring, series_id, completed)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#;

        let res = sqlx::query(sql)
            .bind(title)
            .bind(task.category_id)
            .bind(task.estimated_cycles)
            .bind(task.estimated_duration_seconds)
            .bind(task.is_recurring)
            .bind(task.series_id)
            .bind(task.completed)
            .execute(self.db)
            .await?;

        let task_id = res.last_insert_rowid();

        // insert task_details row if description or deadline provided
        if task.description.is_some() || task.deadline.is_some() {
            sqlx::query(
                "INSERT OR REPLACE INTO task_details (task_id, description, deadline) VALUES ($1, $2, $3)",
            )
            .bind(task_id)
            .bind(task.description.clone())
            .bind(task.deadline)
            .execute(self.db)
            .await?;
        }

        Ok(task_id)
    }

    /*
     * ########################################################################
     *                      READ
     * ########################################################################
     */

    pub async fn get_task_by_id(&self, task_id: i64) -> TaskGet {
        let sql = r#"
            SELECT
                t.id AS id,
                t.title AS title,
                t.category_id AS category_id,
                t.estimated_cycles AS estimated_cycles,
                t.estimated_duration_seconds AS estimated_duration_seconds,
                t.is_recurring AS is_recurring,
                t.series_id AS series_id,
                t.completed AS completed,
                t.created_at AS created_at,
                t.updated_at AS updated_at,
                d.description AS description,
                d.deadline AS deadline,
                COALESCE((SELECT COUNT(1) FROM sessions s WHERE s.task_id = t.id), 0) AS completed_cycles
            FROM tasks t
            LEFT JOIN task_details d ON d.task_id = t.id
            WHERE t.id = $1
        "#;

        let task: Task = sqlx::query_as::<_, Task>(sql)
            .bind(task_id)
            .fetch_one(self.db)
            .await?;

        Ok(task)
    }

    pub async fn get_tasks(&self) -> TaskGetVec {
        let sql = r#"
            SELECT
                t.id AS id,
                t.title AS title,
                t.category_id AS category_id,
                t.estimated_cycles AS estimated_cycles,
                t.estimated_duration_seconds AS estimated_duration_seconds,
                t.is_recurring AS is_recurring,
                t.series_id AS series_id,
                t.completed AS completed,
                t.created_at AS created_at,
                t.updated_at AS updated_at,
                d.description AS description,
                d.deadline AS deadline,
                COALESCE((SELECT COUNT(1) FROM sessions s WHERE s.task_id = t.id), 0) AS completed_cycles
            FROM tasks t
            LEFT JOIN task_details d ON d.task_id = t.id
        "#;

        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(tasks)
    }

    pub async fn get_oneshot_tasks(&self) -> TaskGetVec {
        let sql = r#"
            SELECT
                t.id AS id,
                t.title AS title,
                t.category_id AS category_id,
                t.estimated_cycles AS estimated_cycles,
                t.estimated_duration_seconds AS estimated_duration_seconds,
                t.is_recurring AS is_recurring,
                t.series_id AS series_id,
                t.completed AS completed,
                t.created_at AS created_at,
                t.updated_at AS updated_at,
                d.description AS description,
                d.deadline AS deadline,
                COALESCE((SELECT COUNT(1) FROM sessions s WHERE s.task_id = t.id), 0) AS completed_cycles
            FROM tasks t
            LEFT JOIN task_details d ON d.task_id = t.id
            WHERE t.is_recurring = 0
        "#;

        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(tasks)
    }

    pub async fn get_recurring_tasks(&self) -> TaskGetVec {
        let sql = r#"
            SELECT
                t.id AS id,
                t.title AS title,
                t.category_id AS category_id,
                t.estimated_cycles AS estimated_cycles,
                t.estimated_duration_seconds AS estimated_duration_seconds,
                t.is_recurring AS is_recurring,
                t.series_id AS series_id,
                t.completed AS completed,
                t.created_at AS created_at,
                t.updated_at AS updated_at,
                d.description AS description,
                d.deadline AS deadline,
                COALESCE((SELECT COUNT(1) FROM sessions s WHERE s.task_id = t.id), 0) AS completed_cycles
            FROM tasks t
            LEFT JOIN task_details d ON d.task_id = t.id
            WHERE t.is_recurring = 1
        "#;

        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(tasks)
    }

    pub async fn get_date_tasks(&self, date: NaiveDate) -> TaskGetVec {
        let sql = r#"
            SELECT
                t.id AS id,
                t.title AS title,
                t.category_id AS category_id,
                t.estimated_cycles AS estimated_cycles,
                t.estimated_duration_seconds AS estimated_duration_seconds,
                t.is_recurring AS is_recurring,
                t.series_id AS series_id,
                t.completed AS completed,
                t.created_at AS created_at,
                t.updated_at AS updated_at,
                d.description AS description,
                d.deadline AS deadline,
                COALESCE((SELECT COUNT(1) FROM sessions s WHERE s.task_id = t.id), 0) AS completed_cycles
            FROM tasks t
            JOIN task_details d ON d.task_id = t.id
            WHERE date(d.deadline) = $1
        "#;
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
        let sql = r#"
            SELECT
                t.id AS id,
                t.title AS title,
                t.category_id AS category_id,
                t.estimated_cycles AS estimated_cycles,
                t.estimated_duration_seconds AS estimated_duration_seconds,
                t.is_recurring AS is_recurring,
                t.series_id AS series_id,
                t.completed AS completed,
                t.created_at AS created_at,
                t.updated_at AS updated_at,
                d.description AS description,
                d.deadline AS deadline,
                COALESCE((SELECT COUNT(1) FROM sessions s WHERE s.task_id = t.id), 0) AS completed_cycles
            FROM tasks t
            JOIN task_details d ON d.task_id = t.id
            WHERE date(d.deadline) >= $1 AND date(d.deadline) <= $2
        "#;
        let tasks: Vec<Task> = sqlx::query_as::<_, Task>(sql)
            .bind(start_date)
            .bind(end_date)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(tasks)
    }

    /*
     * ########################################################################
     *                       UPDATE
     * ########################################################################
     */

    pub async fn update_task(&self, task: Task) -> NoReturn {
        let task_id = task.id.ok_or("task.id required for update")?;

        // simple update: set columns to provided values (nullable ones may be NULL)
        let sql = r#"
            UPDATE tasks SET
                title = $1,
                category_id = $2,
                estimated_cycles = $3,
                estimated_duration_seconds = $4,
                is_recurring = $5,
                series_id = $6,
                completed = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
        "#;

        sqlx::query(sql)
            .bind(task.title.clone())
            .bind(task.category_id)
            .bind(task.estimated_cycles)
            .bind(task.estimated_duration_seconds)
            .bind(task.is_recurring)
            .bind(task.series_id)
            .bind(task.completed)
            .bind(task_id)
            .execute(self.db)
            .await?;

        // update/insert task_details if provided
        if task.description.is_some() || task.deadline.is_some() {
            sqlx::query(
                "INSERT OR REPLACE INTO task_details (task_id, description, deadline) VALUES ($1, $2, $3)",
            )
            .bind(task_id)
            .bind(task.description.clone())
            .bind(task.deadline)
            .execute(self.db)
            .await?;
        }

        Ok(())
    }

    pub async fn set_task_complete(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE tasks SET completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1";
        sqlx::query(sql).bind(task_id).execute(self.db).await?;
        Ok(())
    }
    pub async fn set_task_incomplete(&self, task_id: i64) -> NoReturn {
        let sql = "UPDATE tasks SET completed = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1";
        sqlx::query(sql).bind(task_id).execute(self.db).await?;
        Ok(())
    }

    pub async fn update_task_string(&self, task_id: i64, field: &str, value: String) -> NoReturn {
        let allowed = ["title"];
        if !allowed.contains(&field) {
            return Err("attempted update of unsupported string field".into());
        }
        let sql = format!(
            "UPDATE tasks SET {} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            field
        );
        sqlx::query(&sql)
            .bind(value)
            .bind(task_id)
            .execute(self.db)
            .await?;
        Ok(())
    }

    pub async fn update_task_numerical(&self, task_id: i64, field: &str, value: i64) -> NoReturn {
        let allowed = [
            "estimated_cycles",
            "estimated_duration_seconds",
            "category_id",
            "series_id",
        ];
        if !allowed.contains(&field) {
            return Err("attempted update of unsupported numerical field".into());
        }
        let sql = format!(
            "UPDATE tasks SET {} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            field
        );
        sqlx::query(&sql)
            .bind(value)
            .bind(task_id)
            .execute(self.db)
            .await?;
        Ok(())
    }

    pub async fn update_task_boolean(&self, task_id: i64, field: &str, value: bool) -> NoReturn {
        let allowed = ["is_recurring", "completed"];
        if !allowed.contains(&field) {
            return Err("attempted update of unsupported boolean field".into());
        }
        let sql = format!(
            "UPDATE tasks SET {} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            field
        );
        sqlx::query(&sql)
            .bind(value)
            .bind(task_id)
            .execute(self.db)
            .await?;
        Ok(())
    }

    /*
     * ########################################################################
     *                       DELETE
     * ########################################################################
     */

    pub async fn delete_task(&self, task_id: i64) -> NoReturn {
        let sql = "DELETE FROM tasks WHERE id = $1";
        sqlx::query(sql).bind(task_id).execute(self.db).await?;
        Ok(())
    }

    pub async fn recover_task(&self, _task_id: i64) -> NoReturn {
        Err("recover_task unsupported: no soft-delete column exists. Consider adding `deleted` to tasks if you want recoverable deletes.".into())
    }

    pub async fn delete_subtasks(&self, _task_id: i64) -> NoReturn {
        Err("delete_subtasks unsupported: parent_id not present. Add parent_id if you need subtasks.".into())
    }

    pub async fn delete_tasks_in_category(&self, category_id: i64) -> NoReturn {
        let sql = "DELETE FROM tasks WHERE category_id = $1";
        sqlx::query(sql).bind(category_id).execute(self.db).await?;
        Ok(())
    }

    pub async fn clear_all_oneshot_tasks(&self) -> NoReturn {
        let sql = "DELETE FROM tasks WHERE is_recurring = 0";
        sqlx::query(sql).execute(self.db).await?;
        Ok(())
    }

    pub async fn clear_all_tasks_for_date(&self, date: NaiveDate) -> NoReturn {
        let sql = "DELETE FROM tasks WHERE id IN (SELECT task_id FROM task_details WHERE date(deadline) = $1)";
        sqlx::query(sql).bind(date).execute(self.db).await?;
        Ok(())
    }

    pub async fn clear_all_tasks_for_and_after_date(&self, date: NaiveDate) -> NoReturn {
        let sql = "DELETE FROM tasks WHERE id IN (SELECT task_id FROM task_details WHERE date(deadline) >= $1)";
        sqlx::query(sql).bind(date).execute(self.db).await?;
        Ok(())
    }

    pub async fn clear_complete_tasks(&self) -> NoReturn {
        let sql = "DELETE FROM tasks WHERE completed = 1";
        sqlx::query(sql).execute(self.db).await?;
        Ok(())
    }

    /*
     * ########################################################################
     *                    ADDITIONAL HELPERS (A)
     * ########################################################################
     */

    /// A: Count sessions for a given task_id
    pub async fn count_sessions_for_task(&self, task_id: i64) -> IdReturn {
        let sql = "SELECT COUNT(1) as cnt FROM sessions WHERE task_id = $1";
        let row = sqlx::query(sql).bind(task_id).fetch_one(self.db).await?;
        let cnt: i64 = row.try_get("cnt")?;
        Ok(cnt)
    }

    /*
     * ########################################################################
     *                    RECURRENCE MANAGEMENT (B)
     * ########################################################################
     */

    pub async fn add_rule(
        &self,
        task_id: i64,
        rrule: String,
        dtstart: NaiveDateTime,
        until: Option<NaiveDateTime>,
        timezone: Option<String>,
    ) -> IdReturn {
        let sql = "INSERT INTO recurrence_rules (task_id, rrule, dtstart, until, timezone) VALUES ($1, $2, $3, $4, $5)";
        let res = sqlx::query(sql)
            .bind(task_id)
            .bind(rrule)
            .bind(dtstart)
            .bind(until)
            .bind(timezone)
            .execute(self.db)
            .await?;
        Ok(res.last_insert_rowid())
    }

    pub async fn update_rule(
        &self,
        rule_id: i64,
        rrule: Option<String>,
        dtstart: Option<NaiveDateTime>,
        until: Option<NaiveDateTime>,
        timezone: Option<String>,
    ) -> NoReturn {
        // build a simple UPDATE that sets every field (nullable) to provided value or keeps current if None is used
        // Here we will update provided fields only. For simplicity we run multiple single-field updates if necessary.
        if let Some(rr) = rrule {
            sqlx::query("UPDATE recurrence_rules SET rrule = $1 WHERE id = $2")
                .bind(rr)
                .bind(rule_id)
                .execute(self.db)
                .await?;
        }
        if let Some(ds) = dtstart {
            sqlx::query("UPDATE recurrence_rules SET dtstart = $1 WHERE id = $2")
                .bind(ds)
                .bind(rule_id)
                .execute(self.db)
                .await?;
        }
        if until.is_some() {
            sqlx::query("UPDATE recurrence_rules SET until = $1 WHERE id = $2")
                .bind(until)
                .bind(rule_id)
                .execute(self.db)
                .await?;
        }
        if let Some(tz) = timezone {
            sqlx::query("UPDATE recurrence_rules SET timezone = $1 WHERE id = $2")
                .bind(tz)
                .bind(rule_id)
                .execute(self.db)
                .await?;
        }
        Ok(())
    }

    pub async fn get_rules_for_task(&self, task_id: i64) -> RecurrenceRuleGetVec {
        let sql = "SELECT * FROM recurrence_rules WHERE task_id = $1";
        let rules: Vec<RecurrenceRule> = sqlx::query_as::<_, RecurrenceRule>(sql)
            .bind(task_id)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(rules)
    }

    pub async fn add_exdate(&self, recurrence_rule_id: i64, exdate: NaiveDateTime) -> IdReturn {
        let sql = "INSERT INTO recurrence_exdates (recurrence_rule_id, exdate) VALUES ($1, $2)";
        let res = sqlx::query(sql)
            .bind(recurrence_rule_id)
            .bind(exdate)
            .execute(self.db)
            .await?;
        Ok(res.last_insert_rowid())
    }

    pub async fn add_rdate(&self, recurrence_rule_id: i64, rdate: NaiveDateTime) -> IdReturn {
        let sql = "INSERT INTO recurrence_rdates (recurrence_rule_id, rdate) VALUES ($1, $2)";
        let res = sqlx::query(sql)
            .bind(recurrence_rule_id)
            .bind(rdate)
            .execute(self.db)
            .await?;
        Ok(res.last_insert_rowid())
    }

    pub async fn get_exdates_for_rule(&self, recurrence_rule_id: i64) -> RecurrenceExdateGetVec {
        let sql = "SELECT * FROM recurrence_exdates WHERE recurrence_rule_id = $1";
        let rows: Vec<RecurrenceExdate> = sqlx::query_as::<_, RecurrenceExdate>(sql)
            .bind(recurrence_rule_id)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(rows)
    }

    pub async fn get_rdates_for_rule(&self, recurrence_rule_id: i64) -> RecurrenceRdateGetVec {
        let sql = "SELECT * FROM recurrence_rdates WHERE recurrence_rule_id = $1";
        let rows: Vec<RecurrenceRdate> = sqlx::query_as::<_, RecurrenceRdate>(sql)
            .bind(recurrence_rule_id)
            .fetch(self.db)
            .try_collect()
            .await?;
        Ok(rows)
    }
}
