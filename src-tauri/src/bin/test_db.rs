use pomodo_lib::database::{self};

use std::error::Error;

/*
pub struct Session {
    pub id: u16,
    pub session_length: u16,
    pub finished: bool,
    pub category_id: Option<u16>,
    pub task_id: Option<u16>,
}
*/
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let _db = database::create_database(None).await;

    Ok(())
}
