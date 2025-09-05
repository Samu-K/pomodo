// src-tauri/bin/test_db.rs
use chrono::{NaiveDate, NaiveDateTime};
use pomodo_lib::database::decls::{Session, Task};
use pomodo_lib::database::{self, task::TaskActions};

#[tokio::main]
async fn main() {
    // Create DB (None => default/test DB path as your create_database implements)
    let db = database::create_database(None).await;
    let ta = TaskActions::new(&db);

    println!("=== TASKS: Creating a oneshot task ===");
    let deadline_dt = NaiveDateTime::parse_from_str("2025-09-10 10:00:00", "%Y-%m-%d %H:%M:%S")
        .expect("parse dt");
    let oneshot = Task {
        id: None,
        title: Some("OneShot Task".to_string()),
        category_id: None,
        estimated_cycles: Some(3),
        estimated_duration_seconds: Some(25 * 60), // 1 pomodoro = 25m
        is_recurring: Some(false),
        series_id: None,
        completed: Some(false),
        completed_cycles: None,
        description: Some("A simple one-shot test".to_string()),
        deadline: Some(deadline_dt),
        created_at: None,
        updated_at: None,
    };

    let oneshot_id = ta.add_task(oneshot).await.expect("add_task oneshot failed");
    println!("Inserted oneshot task with id = {}", oneshot_id);

    println!("\n=== TASKS: Creating a recurring task ===");
    let recurring = Task {
        id: None,
        title: Some("Daily Recurring Task".to_string()),
        category_id: None,
        estimated_cycles: Some(1),
        estimated_duration_seconds: Some(25 * 60),
        is_recurring: Some(true),
        series_id: None,
        completed: Some(false),
        completed_cycles: None,
        description: Some("Occurs daily".to_string()),
        deadline: None,
        created_at: None,
        updated_at: None,
    };

    let recurring_id = ta
        .add_task(recurring)
        .await
        .expect("add_task recurring failed");
    println!("Inserted recurring task with id = {}", recurring_id);

    println!("\n=== READ: get_task_by_id ===");
    let t = ta
        .get_task_by_id(oneshot_id)
        .await
        .expect("get_task_by_id failed");
    println!(
        "Fetched task {} -> title={:?}, completed_cycles={:?}, deadline={:?}",
        oneshot_id, t.title, t.completed_cycles, t.deadline
    );

    println!("\n=== READ: get_tasks / counts ===");
    let all = ta.get_tasks().await.expect("get_tasks failed");
    println!("Total tasks: {}", all.len());

    let oneshots = ta
        .get_oneshot_tasks()
        .await
        .expect("get_oneshot_tasks failed");
    println!("OneShot tasks count: {}", oneshots.len());

    let recurrings = ta
        .get_recurring_tasks()
        .await
        .expect("get_recurring_tasks failed");
    println!("Recurring tasks count: {}", recurrings.len());

    println!("\n=== DATE queries ===");
    let date = NaiveDate::from_ymd_opt(2025, 9, 10).expect("date");
    let tasks_on_date = ta
        .get_date_tasks(date)
        .await
        .expect("get_date_tasks failed");
    println!("Tasks with deadline on 2025-09-10: {}", tasks_on_date.len());

    let tasks_in_range = ta
        .get_date_range_tasks(
            NaiveDate::from_ymd_opt(2025, 9, 1).unwrap(),
            NaiveDate::from_ymd_opt(2025, 9, 30).unwrap(),
        )
        .await
        .expect("get_date_range_tasks failed");
    println!("Tasks in Sep 2025: {}", tasks_in_range.len());

    println!("\n=== UPDATE: update_task_string / numerical / boolean ===");
    // Update title
    ta.update_task_string(oneshot_id, "title", "OneShot Task (updated)".to_string())
        .await
        .expect("update_task_string failed");
    // Update estimated_cycles
    ta.update_task_numerical(oneshot_id, "estimated_cycles", 5)
        .await
        .expect("update_task_numerical failed");
    // Toggle is_recurring (should be ok even though it's oneshot; just testing)
    ta.update_task_boolean(oneshot_id, "is_recurring", false)
        .await
        .expect("update_task_boolean failed");

    let t2 = ta
        .get_task_by_id(oneshot_id)
        .await
        .expect("get_task_by_id after update");
    println!(
        "After updates: title={:?}, estimated_cycles={:?}, is_recurring={:?}",
        t2.title, t2.estimated_cycles, t2.is_recurring
    );

    println!("\n=== COMPLETE / INCOMPLETE ===");
    ta.set_task_complete(oneshot_id)
        .await
        .expect("set_task_complete failed");
    let t3 = ta
        .get_task_by_id(oneshot_id)
        .await
        .expect("get_task_by_id after complete");
    println!("After complete: completed={:?}", t3.completed);

    ta.set_task_incomplete(oneshot_id)
        .await
        .expect("set_task_incomplete failed");
    let t4 = ta
        .get_task_by_id(oneshot_id)
        .await
        .expect("get_task_by_id after incomplete");
    println!("After incomplete: completed={:?}", t4.completed);

    println!("\n=== SESSIONS: inserting sample sessions and counting ===");
    let session_actions = database::session::SessionActions::new(&db);

    let st1 = NaiveDateTime::parse_from_str("2025-09-01 09:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
    let st2 = NaiveDateTime::parse_from_str("2025-09-02 10:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
    let st3 = NaiveDateTime::parse_from_str("2025-09-03 11:00:00", "%Y-%m-%d %H:%M:%S").unwrap();

    // Session 1: oneshot
    let s1 = Session {
        id: 0,
        start_time: st1,
        session_length: Some(25 * 60),
        finished: true,
        category_id: None,
        task_id: Some(oneshot_id),
        task_instance_id: None,
        duration_seconds: Some(25 * 60),
        notes: Some("first session".to_string()),
        created_at: None,
        last_modified: None,
    };
    session_actions
        .add_session(s1)
        .await
        .expect("insert session 1 failed");

    // Session 2: oneshot
    let s2 = Session {
        id: 1,
        start_time: st2,
        session_length: Some(25 * 60),
        finished: true,
        category_id: None,
        task_id: Some(oneshot_id),
        task_instance_id: None,
        duration_seconds: Some(25 * 60),
        notes: Some("second session".to_string()),
        created_at: None,
        last_modified: None,
    };
    session_actions
        .add_session(s2)
        .await
        .expect("insert session 2 failed");

    // Session 3: recurring
    let s3 = Session {
        id: 2,
        start_time: st3,
        session_length: Some(25 * 60),
        finished: true,
        category_id: None,
        task_id: Some(recurring_id),
        task_instance_id: None,
        duration_seconds: Some(25 * 60),
        notes: Some("recurring task session".to_string()),
        created_at: None,
        last_modified: None,
    };

    session_actions
        .add_session(s3)
        .await
        .expect("insert session 3 failed");
    let count_oneshot = ta
        .count_sessions_for_task(oneshot_id)
        .await
        .expect("count_sessions failed");
    println!(
        "Completed pomodoro sessions for task {} = {}",
        oneshot_id, count_oneshot
    );

    let count_recurring = ta
        .count_sessions_for_task(recurring_id)
        .await
        .expect("count_sessions failed");
    println!(
        "Completed pomodoro sessions for recurring task {} = {}",
        recurring_id, count_recurring
    );

    println!("\n=== RECURRENCE RULES (add/get/update) ===");
    let dtstart =
        NaiveDateTime::parse_from_str("2025-09-01 08:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
    let rule_id = ta
        .add_rule(
            recurring_id,
            "FREQ=DAILY;INTERVAL=1".to_string(),
            dtstart,
            None,
            Some("UTC".to_string()),
        )
        .await
        .expect("add_rule failed");
    println!("Added recurrence_rule id = {}", rule_id);

    let rules = ta
        .get_rules_for_task(recurring_id)
        .await
        .expect("get_rules_for_task failed");
    println!("Rules for task {}: count = {}", recurring_id, rules.len());

    // add exdate and rdate
    let exdate_dt =
        NaiveDateTime::parse_from_str("2025-09-05 08:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
    let rdate_dt =
        NaiveDateTime::parse_from_str("2025-09-07 08:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
    let exid = ta
        .add_exdate(rule_id, exdate_dt)
        .await
        .expect("add_exdate failed");
    let rid = ta
        .add_rdate(rule_id, rdate_dt)
        .await
        .expect("add_rdate failed");
    println!("Added exdate id = {}, rdate id = {}", exid, rid);

    let exs = ta
        .get_exdates_for_rule(rule_id)
        .await
        .expect("get_exdates_for_rule failed");
    let rds = ta
        .get_rdates_for_rule(rule_id)
        .await
        .expect("get_rdates_for_rule failed");
    println!(
        "Exdates for rule {} = {}, Rdates = {}",
        rule_id,
        exs.len(),
        rds.len()
    );

    println!("Updating rule (set UNTIL to 2025-09-30)...");
    let until_dt =
        NaiveDateTime::parse_from_str("2025-09-30 23:59:59", "%Y-%m-%d %H:%M:%S").unwrap();
    ta.update_rule(rule_id, None, None, Some(until_dt), None)
        .await
        .expect("update_rule failed");
    let rules2 = ta
        .get_rules_for_task(recurring_id)
        .await
        .expect("get_rules_for_task after update failed");
    println!("After update, rules count = {}", rules2.len());

    println!("\n=== CLEANUP: delete tasks ===");
    ta.delete_task(oneshot_id)
        .await
        .expect("delete_task oneshot");
    ta.delete_task(recurring_id)
        .await
        .expect("delete_task recurring");
    println!("Deleted both tasks.");

    println!("All tests completed.");
}
