// src/database/sessions.rs
use crate::database::{
    self,
    decls::{IdReturn, NoReturn, Session, SessionGetVec},
};

use chrono::NaiveDate;
use futures::TryStreamExt;
use std::sync::Arc;

/// CRUD operations for sessions (pomodoro cycles)
pub struct SessionActions {
    pub db: Arc<database::Db>,
}

impl SessionActions {
    pub fn new(db: Arc<database::Db>) -> Self {
        SessionActions { db }
    }

    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    pub async fn add_session(&self, session: Session) -> IdReturn {
        // require a positive session length (treat None as 0)
        if session.session_length.unwrap_or(0) == 0 {
            return Err("Session length must be more than 0".into());
        }

        // Build INSERT statement dynamically depending on which optional columns are present.
        // start_time is required.
        let mut cols = vec!["start_time", "session_length", "finished"];
        if session.category_id.is_some() {
            cols.push("category_id");
        }
        if session.task_id.is_some() {
            cols.push("task_id");
        }
        if session.task_instance_id.is_some() {
            cols.push("task_instance_id");
        }
        if session.notes.is_some() {
            cols.push("notes");
        }

        // Build placeholder list ($1, $2, ...)
        let mut placeholders = Vec::with_capacity(cols.len());
        for i in 1..=cols.len() {
            placeholders.push(format!("${}", i));
        }

        let sql = format!(
            "INSERT INTO sessions ({}) VALUES ({})",
            cols.join(", "),
            placeholders.join(", ")
        );

        // Prepare query and bind values in the same order as cols
        let mut query = sqlx::query(&sql)
            .bind(session.start_time) // $1
            .bind(session.session_length) // $2
            .bind(session.finished); // $3

        // subsequent binds (if present) must follow the same order as the cols array
        // (category_id -> task_id -> task_instance_id -> notes)
        if session.category_id.is_some() {
            query = query.bind(session.category_id);
        }
        if session.task_id.is_some() {
            query = query.bind(session.task_id);
        }
        if session.task_instance_id.is_some() {
            query = query.bind(session.task_instance_id);
        }
        if session.notes.is_some() {
            query = query.bind(session.notes.clone());
        }

        let res = query
            .execute(&*self.db)
            .await
            .map_err(|e| format!("Failed to insert session: {e}"))?;

        Ok(res.last_insert_rowid())
    }

    /*
     * ########################################################################
     *                       R E A D
     * ########################################################################
     */
    pub async fn get_sessions(&self) -> SessionGetVec {
        let sql = "SELECT * FROM sessions";

        let rows: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(rows)
    }

    pub async fn get_incomplete_sessions(&self) -> SessionGetVec {
        // store finished as 0/1 in sqlite; query for 0
        let sql = "SELECT * FROM sessions WHERE finished = 0";

        let rows: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(rows)
    }

    pub async fn get_category_sessions(&self, cat_id: i64) -> SessionGetVec {
        let sql = "SELECT * FROM sessions WHERE category_id = $1";

        let rows: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .bind(cat_id)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(rows)
    }

    pub async fn get_task_sessions(&self, task_id: i64) -> SessionGetVec {
        let sql = "SELECT * FROM sessions WHERE task_id = $1";

        let rows: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .bind(task_id)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(rows)
    }

    // gets all sessions on given date (compares date(created_at))
    pub async fn get_date_sessions(&self, date: NaiveDate) -> SessionGetVec {
        let sql = "SELECT * FROM sessions WHERE date(created_at) = $1";

        let rows: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .bind(date)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(rows)
    }

    /*
     * ########################################################################
     *                      U P D A T E
     * ########################################################################
     */

    pub async fn set_session_incomplete(&self, id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET finished = 0 WHERE id = $1";

        sqlx::query(sql).bind(id).execute(&*self.db).await?;

        Ok(())
    }

    pub async fn set_session_complete(&self, id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET finished = 1 WHERE id = $1";

        sqlx::query(sql).bind(id).execute(&*self.db).await?;

        Ok(())
    }

    // link the session to a task
    pub async fn set_session_task(&self, session_id: i64, task_id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET task_id = $1 WHERE id = $2";

        sqlx::query(sql)
            .bind(task_id)
            .bind(session_id)
            .execute(&*self.db)
            .await?;

        Ok(())
    }

    // link the session to a category
    pub async fn set_session_category(&self, session_id: i64, category_id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET category_id = $1 WHERE id = $2";

        sqlx::query(sql)
            .bind(category_id)
            .bind(session_id)
            .execute(&*self.db)
            .await?;

        Ok(())
    }

    pub async fn set_session_length(&self, session_id: i64, len: u16) -> NoReturn {
        let sql = "UPDATE sessions SET session_length = $1 WHERE id = $2";

        sqlx::query(sql)
            .bind(len as i64)
            .bind(session_id)
            .execute(&*self.db)
            .await?;

        Ok(())
    }

    /*
     * ########################################################################
     *                      D E L E T E
     * ########################################################################
     */
    pub async fn delete_session(&self, session_id: i64) -> NoReturn {
        let sql = "DELETE FROM sessions WHERE id = $1";

        sqlx::query(sql).bind(session_id).execute(&*self.db).await?;

        Ok(())
    }
}
