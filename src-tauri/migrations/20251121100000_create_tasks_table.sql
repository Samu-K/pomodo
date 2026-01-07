CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_id INTEGER,
    estimated_pomodoros INTEGER DEFAULT 1,
    
    -- Scheduling & Recurrence
    start_datetime TIMESTAMP, -- ISO8601 string (e.g., "2023-10-27T09:00:00Z")
    recurrence_rule TEXT,     -- iCal RRULE string (e.g., "FREQ=WEEKLY;BYDAY=MO,WE")
    
    -- State
    is_completed BOOLEAN DEFAULT 0,
    parent_task_id INTEGER,   -- Links specific instances back to a recurring master task
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);
