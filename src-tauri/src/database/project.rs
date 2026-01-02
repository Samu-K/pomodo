use super::decls::{Db, IdReturn, NoReturn, Project, ProjectGetVec};
use sqlx::{query, query_as};
use std::sync::Arc;

pub struct ProjectActions {
    pub db: Arc<Db>,
}

impl ProjectActions {
    pub fn new(db: Arc<Db>) -> Self {
        Self { db }
    }

    pub async fn add_project(&self, project: Project) -> IdReturn {
        let mut tx = self.db.begin().await?;
        let id = query(
            "INSERT INTO projects (name, description, color, estimated_pomodoros, category_id, is_completed) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(project.name)
        .bind(project.description)
        .bind(project.color)
        .bind(project.estimated_pomodoros)
        .bind(project.category_id)
        .bind(project.is_completed)
        .execute(&mut *tx)
        .await?
        .last_insert_rowid();

        tx.commit().await?;
        Ok(id)
    }

    pub async fn get_projects(&self) -> ProjectGetVec {
        let projects = query_as::<_, Project>("SELECT * FROM projects ORDER BY created_at ASC")
            .fetch_all(&*self.db)
            .await?;
        Ok(projects)
    }

    pub async fn update_project(&self, project: Project) -> NoReturn {
        query(
            "UPDATE projects SET name = ?, description = ?, color = ?, estimated_pomodoros = ?, category_id = ?, is_completed = ? WHERE id = ?",
        )
        .bind(project.name)
        .bind(project.description)
        .bind(project.color)
        .bind(project.estimated_pomodoros)
        .bind(project.category_id)
        .bind(project.is_completed)
        .bind(project.id)
        .execute(&*self.db)
        .await?;
        Ok(())
    }

    pub async fn delete_project(&self, id: i64) -> NoReturn {
        query("DELETE FROM projects WHERE id = ?")
            .bind(id)
            .execute(&*self.db)
            .await?;
        Ok(())
    }
}
