use crate::database;
use std::error::Error;

use futures::TryStreamExt;
use sqlx::FromRow;

#[derive(serde::Deserialize, serde::Serialize, FromRow, Debug)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
}

pub struct CategoryActions {
    pub db: database::Db,
}

impl CategoryActions {
    pub fn new(db: database::Db) -> Self {
        CategoryActions { db }
    }

    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    pub async fn add_category(&self, cat: Category) -> Result<i64, Box<dyn Error>> {
        if cat.name.is_empty() {
            return Err("Category needs to have a name".into());
        };

        let mut sql = String::from("INSERT INTO categories (name, ");

        if cat.color.is_some() {
            sql += "color) VALUES ($1,$2)";
        } else {
            sql += ") VALUES ($1)";
        };

        let mut query = sqlx::query(&sql).bind(cat.name);

        if cat.color.is_some() {
            query = query.bind(cat.color);
        };

        let res = query.execute(&self.db).await?;

        Ok(res.last_insert_rowid())
    }

    /*
     * ########################################################################
     *                      R E A D
     * ########################################################################
     */

    pub async fn get_categories(&self) -> Result<Vec<Category>, Box<dyn Error>> {
        let sql = "SELECT * FROM categories";

        let cats: Vec<Category> = sqlx::query_as::<_, Category>(sql)
            .fetch(&self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }

    /*
     * ########################################################################
     *                       U P D A T E
     * ########################################################################
     */
    pub async fn set_category_name(&self, name: String, cat_id: i64) -> Result<(), Box<dyn Error>> {
        let sql = "UPDATE categories SET name = $1 WHERE id = $2";

        let _res = sqlx::query(sql)
            .bind(name)
            .bind(cat_id)
            .execute(&self.db)
            .await?;

        Ok(())
    }

    pub async fn set_category_color(
        &self,
        color: String,
        cat_id: i64,
    ) -> Result<(), Box<dyn Error>> {
        let sql = "UPDATE categories SET color = $1 WHERE id = $2";
        let _res = sqlx::query(sql)
            .bind(color)
            .bind(cat_id)
            .execute(&self.db)
            .await?;

        Ok(())
    }

    /*
     * ########################################################################
     *                       D E L E T E
     * ########################################################################
     */
    pub async fn delete_category(&self, cat_id: i64) -> Result<(), Box<dyn Error>> {
        let sql = "DELETE FROM categories WHERE id = $1";

        let _res = sqlx::query(sql).bind(cat_id).execute(&self.db).await?;

        Ok(())
    }
}
