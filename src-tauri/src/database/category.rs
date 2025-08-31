use crate::database::{
    self,
    decls::{Category, CategoryGet, CategoryGetVec, IdReturn, NoReturn},
};
use futures::TryStreamExt;

pub struct CategoryActions<'a> {
    pub db: &'a database::Db,
}

impl<'a> CategoryActions<'a> {
    pub fn new(db: &'a database::Db) -> Self {
        Self { db }
    }

    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    pub async fn add_category(&self, cat: Category) -> IdReturn {
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

        let res = query.execute(self.db).await?;

        Ok(res.last_insert_rowid())
    }

    /*
     * ########################################################################
     *                      R E A D
     * ########################################################################
     */

    pub async fn get_categories(&self) -> CategoryGetVec {
        let sql = "SELECT * FROM categories";

        let cats: Vec<Category> = sqlx::query_as::<_, Category>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(cats)
    }
    pub async fn get_category(&self, cat_id: i64) -> CategoryGet {
        let sql = "SELECT * FROM categories WHERE id = $1";
        let cat = sqlx::query_as::<_, Category>(sql)
            .bind(cat_id)
            .fetch_one(self.db)
            .await?;

        Ok(cat)
    }

    /*
     * ########################################################################
     *                       U P D A T E
     * ########################################################################
     */
    pub async fn set_category_name(&self, name: String, cat_id: i64) -> NoReturn {
        let sql = "UPDATE categories SET name = $1 WHERE id = $2";

        let _res = sqlx::query(sql)
            .bind(name)
            .bind(cat_id)
            .execute(self.db)
            .await?;

        Ok(())
    }

    pub async fn set_category_color(&self, color: String, cat_id: i64) -> NoReturn {
        let sql = "UPDATE categories SET color = $1 WHERE id = $2";
        let _res = sqlx::query(sql)
            .bind(color)
            .bind(cat_id)
            .execute(self.db)
            .await?;

        Ok(())
    }

    /*
     * ########################################################################
     *                       D E L E T E
     * ########################################################################
     */
    pub async fn delete_category(&self, cat_id: i64) -> NoReturn {
        let sql = "DELETE FROM categories WHERE id = $1";

        let _res = sqlx::query(sql).bind(cat_id).execute(self.db).await?;

        Ok(())
    }
}
