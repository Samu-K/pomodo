use crate::database;

use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Row};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: i64,
    pub session_length: i64,
    pub finished: bool,
    pub category_id: Option<i64>,
    pub task_id: Option<i64>,
}

pub struct SessionActions {
    pub db: database::Db,
}

impl SessionActions {
    pub fn new(db: database::Db) -> Self {
        SessionActions { db }
    }
    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    pub async fn add_session(&self, session: Session) -> Result<i64, Box<dyn Error>> {
        if session.session_length == 0 {
            return Err("Session length must be more than 0".into());
        };

        let mut sql = String::from("INSERT into sessions (session_length, finished");

        let mut count = 2;
        if session.category_id.is_some() {
            sql += ", category_id";
            count += 1
        }
        if session.task_id.is_some() {
            sql += ", task_id";
            count += 1
        }
        sql += ") VALUES ($1";
        for i in 2..count + 1 {
            sql += format!(",${i}").as_str();
        }
        sql += ");";

        let mut query = sqlx::query(&sql)
            .bind(session.session_length)
            .bind(session.finished);

        if session.category_id.is_some() {
            query = query.bind(session.category_id);
        }
        if session.task_id.is_some() {
            query = query.bind(session.task_id);
        }
        println!("SQL to run {sql}");

        let res = query
            .execute(&self.db)
            .await
            .map_err(|e| format!("Failed to insert session: {e}"));

        println!("{:?}", res);
        Ok(res.unwrap().last_insert_rowid())
    }
    /*
     * ########################################################################
     *                       R E A D
     * ########################################################################
     */
    pub async fn get_sessions(&self) -> Result<Vec<Session>, Box<dyn Error>> {
        let sql = "SELECT * FROM sessions";

        let cats: Vec<Session> = sqlx::query_as::<_, Session>(sql)
            .fetch(&self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    /*
     * ########################################################################
     *                      U P D A T E
     * ########################################################################
     */

    pub async fn set_session_incomplete(&self, id: i64) -> Result<(), Box<dyn Error>> {
        let sql = "UPDATE sessions SET finished = false WHERE id = $1";

        let _ = sqlx::query(sql).bind(id).execute(&self.db).await?;

        Ok(())
    }

    pub async fn set_session_complete(&self, id: i64) -> Result<(), Box<dyn Error>> {
        let sql = "UPDATE sessions SET finished = true WHERE id = $1";

        let _ = sqlx::query(sql).bind(id).execute(&self.db).await?;

        Ok(())
    }

    // link the session to a task
    pub async fn set_session_task(
        &self,
        session_id: i64,
        task_id: i64,
    ) -> Result<(), Box<dyn Error>> {
        let sql = "UPDATE sessions SET task_id = $1 WHERE id = $2";

        let _ = sqlx::query(sql)
            .bind(task_id)
            .bind(session_id)
            .execute(&self.db)
            .await?;

        Ok(())
    }

    /*
     * ########################################################################
     *                      D E L E T E
     * ########################################################################
     */
    pub async fn delete_session(&self, session_id: i64) -> Result<(), Box<dyn Error>> {
        let sql = "DELETE FROM sessions WHERE id = $1";

        let res = sqlx::query(sql).bind(session_id).execute(&self.db).await?;

        Ok(())
    }
}
