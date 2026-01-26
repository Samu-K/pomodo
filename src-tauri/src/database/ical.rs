use super::decls::{AppError, Db, NoReturn, Task};
use serde::{Deserialize, Serialize};
use sqlx::query_as;
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
pub struct ICalSyncPayload {
    pub token: String,
    pub tasks: Vec<Task>,
}

pub struct ICalActions {
    pub db: Arc<Db>,
}

impl ICalActions {
    pub fn new(db: Arc<Db>) -> Self {
        Self { db }
    }

    pub async fn sync_ical(&self) -> NoReturn {
        println!("iCal Sync: Starting...");
        // Load .env if present
        let _ = dotenvy::dotenv();

        // 1. Get settings (using optional for robustness)
        let url: String =
            sqlx::query_scalar("SELECT value FROM user_settings WHERE key = 'iCal sync URL'")
                .fetch_optional(&*self.db)
                .await
                .map_err(|e| AppError::new(e.to_string()))?
                .unwrap_or_default();

        let token: String =
            sqlx::query_scalar("SELECT value FROM user_settings WHERE key = 'iCal sync token'")
                .fetch_optional(&*self.db)
                .await
                .map_err(|e| AppError::new(e.to_string()))?
                .unwrap_or_default();

        let mut secret: String =
            sqlx::query_scalar("SELECT value FROM user_settings WHERE key = 'iCal sync secret'")
                .fetch_optional(&*self.db)
                .await
                .map_err(|e| AppError::new(e.to_string()))?
                .unwrap_or_default();

        // Fallback to .env if empty
        if secret.is_empty() {
            secret = std::env::var("ICAL_SYNC_SECRET").unwrap_or_default();
        }

        let enabled: String =
            sqlx::query_scalar("SELECT value FROM user_settings WHERE key = 'iCal sync enabled'")
                .fetch_optional(&*self.db)
                .await
                .map_err(|e| AppError::new(e.to_string()))?
                .unwrap_or_else(|| "false".to_string());

        println!(
            "iCal Sync: Settings - Enabled: {}, URL: {}, Token present: {}",
            enabled,
            if url.is_empty() { "MISSING" } else { &url },
            !token.is_empty()
        );

        if enabled != "true" {
            println!("iCal Sync: Aborting - Sync disabled.");
            return Ok(());
        }

        if url.is_empty() || token.is_empty() {
            println!("iCal Sync: Aborting - Missing URL or Token.");
            return Ok(());
        }

        if secret.is_empty() {
            println!("iCal Sync: Aborting - Missing Secret.");
            return Ok(());
        }

        // 2. Fetch tasks
        let tasks = query_as::<_, Task>("SELECT * FROM tasks")
            .fetch_all(&*self.db)
            .await
            .map_err(|e| AppError::new(e.to_string()))?;

        println!("iCal Sync: Fetched {} tasks", tasks.len());

        // 3. Prepare payload
        let payload = ICalSyncPayload {
            token: token.clone(),
            tasks,
        };

        // 4. Send to VPS
        let client = reqwest::Client::new();
        let sync_url = format!("{}/sync", url.trim_end_matches('/'));

        println!("iCal Sync: Sending payload to {}", sync_url);

        let res = client
            .post(sync_url)
            .header("x-pomodo-secret", secret)
            .json(&payload)
            .send()
            .await
            .map_err(|e| {
                println!("iCal Sync: Network error: {}", e);
                AppError::new(format!("Failed to send to VPS: {}", e))
            })?;

        let status = res.status();
        println!("iCal Sync: Response status: {}", status);

        if !status.is_success() {
            let body = res.text().await.unwrap_or_default();
            println!("iCal Sync: Failed with body: {}", body);
            return Err(AppError::new(format!(
                "VPS Sync failed ({}): {}",
                status, body
            )));
        }

        println!("iCal Sync: Success");
        Ok(())
    }
}
