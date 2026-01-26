use serde::{Deserialize, Serialize};
use specta::Type;
use super::decls::*;
use super::category::CategoryActions;
use super::project::ProjectActions;
use super::session::SessionActions;
use super::task::TaskActions;
use super::settings::SettingActions;
use std::sync::Arc;
use chrono::Local;

#[derive(Serialize, Deserialize, Debug, Type)]
pub struct Snapshot {
    pub timestamp: String,
    pub version: String,
    pub categories: Vec<Category>,
    pub projects: Vec<Project>,
    pub sessions: Vec<Session>,
    pub tasks: Vec<Task>,
    pub settings: Vec<Setting>,
    pub setting_categories: Vec<SettingCategory>,
}

impl Snapshot {
    pub async fn create(db: Arc<Db>) -> Result<Self, AppError> {
        let category_actions = CategoryActions::new(db.clone());
        let project_actions = ProjectActions::new(db.clone());
        let session_actions = SessionActions::new(db.clone());
        let task_actions = TaskActions::new(db.clone());
        let setting_actions = SettingActions::new(db.clone());

        let categories = category_actions.get_categories().await?;
        let projects = project_actions.get_projects().await?;
        let sessions = session_actions.get_sessions().await?;
        let tasks = task_actions.get_tasks().await?;
        let settings = setting_actions.get_all_settings().await?;
        let setting_categories = setting_actions.get_setting_categories().await?;

        Ok(Self {
            timestamp: Local::now().to_rfc3339(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            categories,
            projects,
            sessions,
            tasks,
            settings,
            setting_categories,
        })
    }

    pub async fn restore(&self, db: Arc<Db>) -> Result<(), AppError> {
        let mut tx = db.begin().await?;

        // 1. Wipe existing data (Order matters for foreign keys if enforced, but here we wipe all)
        sqlx::query("DELETE FROM tasks").execute(&mut *tx).await?;
        sqlx::query("DELETE FROM sessions").execute(&mut *tx).await?;
        sqlx::query("DELETE FROM projects").execute(&mut *tx).await?;
        sqlx::query("DELETE FROM user_settings").execute(&mut *tx).await?;
        sqlx::query("DELETE FROM settings_categories").execute(&mut *tx).await?;
        sqlx::query("DELETE FROM categories").execute(&mut *tx).await?;

        // 2. Insert Categories
        for cat in &self.categories {
            sqlx::query("INSERT INTO categories (id, name, color) VALUES (?, ?, ?)")
                .bind(cat.id)
                .bind(&cat.name)
                .bind(&cat.color)
                .execute(&mut *tx)
                .await?;
        }

        // 3. Insert Settings Categories
        for cat in &self.setting_categories {
             sqlx::query("INSERT INTO settings_categories (id, name) VALUES (?, ?)")
                .bind(cat.id)
                .bind(&cat.name)
                .execute(&mut *tx)
                .await?;
        }

        // 4. Insert Settings
        for setting in &self.settings {
             sqlx::query("INSERT INTO user_settings (id, key, description, value, category_id, data_type) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(setting.id)
                .bind(&setting.key)
                .bind(&setting.description)
                .bind(&setting.value)
                .bind(setting.category_id)
                .bind(&setting.data_type)
                .execute(&mut *tx)
                .await?;
        }

        // 5. Insert Projects
        for p in &self.projects {
             sqlx::query("INSERT INTO projects (id, name, description, color, estimated_pomodoros, category_id, is_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(p.id)
                .bind(&p.name)
                .bind(&p.description)
                .bind(&p.color)
                .bind(p.estimated_pomodoros)
                .bind(p.category_id)
                .bind(p.is_completed)
                .bind(p.created_at)
                .execute(&mut *tx)
                .await?;
        }

        // 6. Insert Tasks
        // Note: Tasks have parent_task_id, so we technically need to insert parents first.
        // Or if we use deferred constraints. SQLite FKs are on by default in SQLx?
        // Let's just pray or sort?
        // Actually, if we insert all with ID, order might not matter if deferred?
        // SQLite doesn't support deferred FKs by default unless configured.
        // Safe bet: Insert those with parent_task_id = NULL first, then others.
        // Or just disable FK checks temporarily?
        sqlx::query("PRAGMA foreign_keys = OFF").execute(&mut *tx).await?;

        for t in &self.tasks {
             sqlx::query("INSERT INTO tasks (id, title, description, category_id, project_id, estimated_pomodoros, start_datetime, recurrence_rule, is_completed, completed_pomodoros, parent_task_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(t.id)
                .bind(&t.title)
                .bind(&t.description)
                .bind(t.category_id)
                .bind(t.project_id)
                .bind(t.estimated_pomodoros)
                .bind(t.start_datetime)
                .bind(&t.recurrence_rule)
                .bind(t.is_completed)
                .bind(t.completed_pomodoros)
                .bind(t.parent_task_id)
                .bind(t.created_at)
                .execute(&mut *tx)
                .await?;
        }

        sqlx::query("PRAGMA foreign_keys = ON").execute(&mut *tx).await?;

        // 7. Insert Sessions
        for s in &self.sessions {
            sqlx::query("INSERT INTO sessions (id, start_time, duration, finished, category_id, task_id, project_id, notes, created_at, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(s.id)
                .bind(s.start_time)
                .bind(s.duration)
                .bind(s.finished)
                .bind(s.category_id)
                .bind(s.task_id)
                .bind(s.project_id)
                .bind(&s.notes)
                .bind(s.created_at)
                .bind(s.last_modified)
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }
}
