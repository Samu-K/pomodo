use pomodo_lib::database::{
    self,
    session::{self, Session, SessionActions},
};

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
    let db = database::create_database(None).await;
    let sa = SessionActions::new(db);
    let ex_session = Session {
        id: 0,
        session_length: 20,
        finished: true,
        category_id: Some(0),
        task_id: None,
    };
    let ex_session2 = Session {
        id: 0,
        session_length: 20,
        finished: true,
        category_id: Some(1),
        task_id: Some(0),
    };

    let ins1 = sa.add_session(ex_session).await?;
    println!("{:?}", ins1);
    let ins2 = sa.add_session(ex_session2).await?;
    println!("{:?}", ins2);
    let sessions = sa.get_sessions().await;
    println!("{:?}", sessions);

    sa.delete_session(ins1).await?;
    sa.delete_session(ins2).await?;

    let sessions = sa.get_sessions().await;
    println!("{:?}", sessions);

    Ok(())
}
