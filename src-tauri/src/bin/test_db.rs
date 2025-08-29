use pomodo_lib::database::{self};

use std::error::Error;

/*
pub struct Task {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub task_type: String,
    pub estimated_cycles: i64,
    pub completed_cycles: i64,
    pub deadline: Option<NaiveDate>,

    pub parent_id: Option<i64>,
    pub repeat_period: Option<String>,
}
*/
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let _db = database::create_database(None).await;
    let ta = database::task::TaskActions::new(&_db);

    let ex_task = database::decls::Task {
        id: 0,
        name: "Test".to_string(),
        description: Some("Test desct".to_string()),
        task_type: "oneshot".to_string(),
        estimated_cycles: 4,
        completed_cycles: 0,
        deadline: None,
        parent_id: Some(0),
        repeat_period: Some("daily".to_string()),
        ..Default::default()
    };

    Ok(())
}
