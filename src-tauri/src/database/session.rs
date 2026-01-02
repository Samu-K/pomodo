use crate::database::{
    self,
    decls::{IdReturn, NoReturn, Session, SessionGetVec},
};

use chrono::NaiveDate;
use futures::TryStreamExt;
use std::sync::Arc;

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
        if session.duration.unwrap_or(0) == 0 {
            return Err("Session length must be more than 0".into());
        };

        let mut sql = String::from("INSERT into sessions (start_time, duration, finished");

        let mut count = 3;
        if session.category_id.is_some() {
            sql += ", category_id";
            count += 1
        }
        if session.task_id.is_some() {
            sql += ", task_id";
            count += 1
        }
        if session.project_id.is_some() {
            sql += ", project_id";
            count += 1
        }
        sql += ") VALUES ($1";
        for i in 2..count + 1 {
            sql += format!(",${i}").as_str();
        }
        sql += ");";

        let mut query = sqlx::query(&sql)
            .bind(session.start_time)
            .bind(session.duration)
            .bind(session.finished);

        if session.category_id.is_some() {
            query = query.bind(session.category_id);
        }
        if session.task_id.is_some() {
            query = query.bind(session.task_id);
        }
        if session.project_id.is_some() {
            query = query.bind(session.project_id);
        }

        let res = query
            .execute(&*self.db)
            .await
            .map_err(|e| format!("Failed to insert session: {e}"));

        Ok(res.unwrap().last_insert_rowid())
    }
    /*
     * ########################################################################
     *                       R E A D
     * ########################################################################
     */
    pub async fn get_sessions(&self) -> SessionGetVec {
        let sql = "SELECT * FROM sessions";

        let cats: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    pub async fn get_incomplete_sessions(&self) -> SessionGetVec {
        let sql = "SELECT * FROM sessions WHERE finished = false";

        let cats: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    pub async fn get_category_sessions(&self, cat_id: i64) -> SessionGetVec {
        let sql = "SELECT * FROM sessions WHERE category_id = $1";

        let cats: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .bind(cat_id)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    pub async fn get_task_sessions(&self, task_id: i64) -> SessionGetVec {
        let sql = "SELECT * FROM sessions WHERE task_id = $1";

        let cats: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .bind(task_id)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    // gets all sessions on given date
    pub async fn get_date_sessions(&self, date: NaiveDate) -> SessionGetVec {
        let sql = "SELECT * FROM session WHERE created_at = $1";

        let cats: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .bind(date)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    /*
     * ########################################################################
     *                      U P D A T E
     * ########################################################################
     */

    pub async fn set_session_incomplete(&self, id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET finished = false WHERE id = $1";

        let _ = sqlx::query(sql).bind(id).execute(&*self.db).await?;

        Ok(())
    }

    pub async fn set_session_complete(&self, id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET finished = true WHERE id = $1";

        let _ = sqlx::query(sql).bind(id).execute(&*self.db).await?;

        Ok(())
    }

    // link the session to a category
    pub async fn set_session_category(&self, session_id: i64, cat_id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET category_id = $1 WHERE id = $2";

        let _ = sqlx::query(sql)
            .bind(session_id)
            .bind(cat_id)
            .execute(&*self.db)
            .await?;

        Ok(())
    }

    pub async fn set_session_task(&self, session_id: i64, task_id: i64) -> NoReturn {
        let sql = "UPDATE sessions SET task_id = $1 WHERE id = $2";

        let _ = sqlx::query(sql)
            .bind(session_id)
            .bind(task_id)
            .execute(&*self.db)
            .await?;

        Ok(())
    }

    pub async fn set_session_length(&self, session_id: i64, len: u16) -> NoReturn {
        let sql = "UPDATE sessions SET session_length = $1 WHERE id = $2";

        let _ = sqlx::query(sql)
            .bind(len)
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

        let _res = sqlx::query(sql).bind(session_id).execute(&*self.db).await?;

        Ok(())
    }
}
