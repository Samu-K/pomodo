use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::error::Error;
use specta::Type;
use super::super::database::snapshot::Snapshot;

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct SupabaseUser {
    pub id: String,
    pub email: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct SupabaseSession {

    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_token: String,
    pub user: SupabaseUser,
}

#[derive(Clone)]
pub struct SupabaseClient {
    url: String,
    anon_key: String,
    client: Client,
}

impl SupabaseClient {
    pub fn new(url: String, key: String) -> Self {
        Self {
            url,
            anon_key: key,
            client: Client::new(),
        }
    }

    pub async fn sign_up(&self, email: &str, password: &str) -> Result<Option<SupabaseSession>, Box<dyn Error>> {
        let url = format!("{}/auth/v1/signup", self.url);
        let resp = self.client.post(&url)
            .header("apikey", &self.anon_key)
            .header("Content-Type", "application/json")
            .json(&serde_json::json!({
                "email": email,
                "password": password,
            }))
            .send()
            .await?;

        if !resp.status().is_success() {
            let err_text = resp.text().await?;
            return Err(format!("Signup failed: {}", err_text).into());
        }

        let body: serde_json::Value = resp.json().await?;
        
        // If "access_token" exists, we are logged in.
        if body.get("access_token").is_some() {
            let session: SupabaseSession = serde_json::from_value(body)?;
            Ok(Some(session))
        } else {
            // No token implies confirmation is required (or some other flow without immediate login)
            Ok(None)
        }
    }


    pub async fn sign_in(&self, email: &str, password: &str) -> Result<SupabaseSession, Box<dyn Error>> {
        let url = format!("{}/auth/v1/token?grant_type=password", self.url);
        let resp = self.client.post(&url)
            .header("apikey", &self.anon_key)
            .header("Content-Type", "application/json")
            .json(&serde_json::json!({
                "email": email,
                "password": password,
            }))
            .send()
            .await?;

        if !resp.status().is_success() {
            let err_text = resp.text().await?;
            return Err(format!("Login failed: {}", err_text).into());
        }

        let session: SupabaseSession = resp.json().await?;
        Ok(session)
    }

    pub async fn get_user(&self, token: &str) -> Result<SupabaseUser, Box<dyn Error>> {
        let url = format!("{}/auth/v1/user", self.url);
        let resp = self.client.get(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        if !resp.status().is_success() {
            let err_text = resp.text().await?;
            return Err(format!("Get user failed: {}", err_text).into());
        }

        let user: SupabaseUser = resp.json().await?;
        Ok(user)
    }

    pub async fn upload_snapshot(&self, token: &str, user_id: &str, snapshot: Snapshot) -> Result<(), Box<dyn Error>> {
        let url = format!("{}/rest/v1/backups", self.url);
        // We use JSONB so we wrap the snapshot in a "data" field
        let body = serde_json::json!({
            "user_id": user_id,
            "data": snapshot,
            "app_version": env!("CARGO_PKG_VERSION"),
        });

        let resp = self.client.post(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", token))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&body)
            .send()
            .await?;

        if !resp.status().is_success() {
            let err_text = resp.text().await?;
            return Err(format!("Upload failed: {}", err_text).into());
        }

        Ok(())
    }

    // Fetch the LATEST backup
    pub async fn get_latest_backup(&self, token: &str) -> Result<Option<serde_json::Value>, Box<dyn Error>> {
        let url = format!("{}/rest/v1/backups?select=*&order=created_at.desc&limit=1", self.url);
        
        let resp = self.client.get(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        if !resp.status().is_success() {
            let err_text = resp.text().await?;
            return Err(format!("Fetch failed: {}", err_text).into());
        }

        let rows: Vec<serde_json::Value> = resp.json().await?;
        Ok(rows.first().cloned())
    }
}
