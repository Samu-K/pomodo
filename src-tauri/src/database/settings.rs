use crate::database::{
    self,
    decls::{NoReturn, Setting, SettingCatGetVec, SettingCategory, SettingGetVec, StringReturn},
};

use futures::TryStreamExt;
use sqlx::Row;
use std::sync::Arc;

pub struct SettingActions {
    pub db: Arc<database::Db>,
}

impl SettingActions {
    pub fn new(db: Arc<database::Db>) -> Self {
        SettingActions { db }
    }
    /*
     * ########################################################################
     *                      C R E A T E
     * ########################################################################
     */
    /*
     * ########################################################################
     *                      R E A D
     * ########################################################################
     */
    pub async fn get_setting_value(&self, key: String) -> StringReturn {
        let sql = "SELECT value FROM user_settings WHERE key = $1";

        let res = sqlx::query(sql).bind(key).fetch_one(&*self.db).await?;

        Ok(res.get(0))
    }
    pub async fn get_all_settings(&self) -> SettingGetVec {
        let sql = "SELECT * FROM user_settings";
        let settings = sqlx::query_as::<_, Setting>(sql)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(settings)
    }
    pub async fn get_settings_for_category(&self, cat_id: i64) -> SettingGetVec {
        let sql = "SELECT * FROM user_settings WHERE category_id = $1";
        let settings = sqlx::query_as::<_, Setting>(sql)
            .bind(cat_id)
            .fetch(&*self.db)
            .try_collect()
            .await?;
        Ok(settings)
    }
    pub async fn get_setting_categories(&self) -> SettingCatGetVec {
        let sql = "SELECT * FROM settings_categories";
        let set_cats = sqlx::query_as::<_, SettingCategory>(sql)
            .fetch(&*self.db)
            .try_collect()
            .await?;

        Ok(set_cats)
    }

    /*
     * ########################################################################
     *                       U P D A T E
     * ########################################################################
     */
    pub async fn set_setting_value(&self, value: String, key: String) -> NoReturn {
        let mut sql = String::from("UPDATE user_settings SET ");
        sql += key.as_str();
        sql += " = $1 WHERE key = $2";

        let _res = sqlx::query(&sql)
            .bind(value)
            .bind(key)
            .execute(&*self.db)
            .await?;
        Ok(())
    }

    /*
     * ########################################################################
     *                       D E L E T E
     * ########################################################################
     */
}
