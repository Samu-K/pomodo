use crate::database::{
    self,
    decls::{NoReturn, Setting, SettingGetVec, StringReturn},
};

use futures::TryStreamExt;
use sqlx::Row;
use std::collections::HashMap;

pub struct SettingActions<'a> {
    pub db: &'a database::Db,
    default_settings: HashMap<String, String>,
}

impl<'a> SettingActions<'a> {
    pub fn new(db: &'a database::Db) -> Self {
        let default_settings = HashMap::from([
            ("default_category".to_string(), "general".to_string()),
            ("focus_time".to_string(), "25".to_string()),
            ("short_break_time".to_string(), "5".to_string()),
            ("long_break_time".to_string(), "15".to_string()),
            ("long_break_interval".to_string(), "4".to_string()),
            ("auto_start_break".to_string(), "false".to_string()),
            ("auto_start_focus".to_string(), "false".to_string()),
        ]);
        SettingActions {
            db,
            default_settings,
        }
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

        let res = sqlx::query(sql).bind(key).fetch_one(self.db).await?;

        Ok(res.get(0))
    }
    pub async fn get_all_settings(&self) -> SettingGetVec {
        let sql = "SELECT * FROM user_settings";
        let settings = sqlx::query_as::<_, Setting>(sql)
            .fetch(self.db)
            .try_collect()
            .await?;

        Ok(settings)
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
            .execute(self.db)
            .await?;
        Ok(())
    }

    pub async fn reset_default_setting(&self, key: String) -> NoReturn {
        let default_value = self.default_settings.get(&key);
        if default_value.is_none() {
            return Err("Setting not found".into());
        };
        let sql = "UPDATE user_settings SET value = $1 WHERE key = $2";
        let _res = sqlx::query(sql)
            .bind(default_value)
            .bind(key)
            .execute(self.db)
            .await?;

        Ok(())
    }

    pub async fn reset_all_settings_default(&self) -> NoReturn {
        let sql = "UPDATE user_settings SET value = $1 WHERE key = $2";

        let setting_clone = self.default_settings.clone();
        for key in setting_clone.into_keys() {
            let value = self.default_settings.get(&key);
            let _res = sqlx::query(sql)
                .bind(value)
                .bind(key)
                .execute(self.db)
                .await?;
        }

        Ok(())
    }

    /*
     * ########################################################################
     *                       D E L E T E
     * ########################################################################
     */
}
