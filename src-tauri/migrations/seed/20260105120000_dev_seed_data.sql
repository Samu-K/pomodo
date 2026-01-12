-- SEED DATA MIGRATION
-- Generates dynamic seed data for a 21-day window (Last Week, Current Week, Next Week)
-- This migration is designed to run LAST to ensure all schema changes are applied.

-- ---------------------------------------------------------
-- 1. Seed Categories (if they don't exist)
-- ---------------------------------------------------------
INSERT OR IGNORE INTO categories (id, name, color) VALUES 
(1, 'Work', 'pomodo-orange'),
(2, 'School', 'blue'),
(3, 'Project 1', 'green'),
(4, 'Budgeting', 'yellow'),
(5, 'Other', 'gray');

-- ---------------------------------------------------------
-- 2. Seed Projects
-- ---------------------------------------------------------
INSERT OR IGNORE INTO projects (id, name, description, color, category_id) VALUES
(1, 'Finish Website', 'Building a portfolio site', 'blue', 1),
(2, 'Study Anatomy', 'Medical school prep', 'red', 2),
(3, 'House Reno', 'Kitchen painting', 'green', 5);

-- ---------------------------------------------------------
-- 3. Procedural Session Generation
-- ---------------------------------------------------------
INSERT INTO sessions (start_time, duration, finished, category_id, project_id, notes, created_at, last_modified)
WITH RECURSIVE 
    -- A. Calculate the 21-day window
    date_config(start_date, end_date) AS (
        SELECT 
            date('now', 'weekday 1', '-14 days'),
            date('now', 'weekday 1', '+6 days')
    ),
    
    -- B. Generate all dates in the range
    date_range(dt) AS (
        SELECT start_date FROM date_config
        UNION ALL
        SELECT date(dt, '+1 day') FROM date_range WHERE dt < (SELECT end_date FROM date_config)
    ),
    
    -- C. Define daily slots (up to 8 sessions per day)
    slots(i) AS (
        SELECT 1 UNION ALL SELECT i + 1 FROM slots WHERE i < 8
    )

SELECT 
    -- START TIME: Date + Slot-based Hour (2h spacing) + Random Minute (0-15)
    -- Slots: 08:xx, 10:xx, 12:xx, 14:xx, 16:xx, 18:xx, 20:xx, 22:xx
    datetime(d.dt, '+' || (8 + (s.i - 1) * 2) || ' hours', '+' || (abs(random()) % 15) || ' minutes') as start_time,
    
    -- DURATION: 25 to 90 mins (in seconds)
    -- Max logic: Start 00:15 + 90m = 01:45. Next slot starts at 02:00. Guaranteed 15m gap.
    ((abs(random()) % 66) + 25) * 60 as duration,
    
    -- FINISHED: 85% chance true
    CASE WHEN (abs(random()) % 100) < 85 THEN 1 ELSE 0 END as finished,
    
    -- CATEGORY: Random 1-5
    (abs(random()) % 5) + 1 as category_id,
    
    -- PROJECT: 30% chance of being linked to a project (1-3)
    CASE WHEN (abs(random()) % 100) < 30 THEN (abs(random()) % 3) + 1 ELSE NULL END as project_id,
    
    -- NOTES
    CASE WHEN (abs(random()) % 5) = 0 THEN 'Dynamic seed session' ELSE NULL END as notes,
    
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM date_range d
CROSS JOIN slots s
WHERE 
    -- Randomly decide if this slot is used (40% density)
    (abs(random()) % 100) < 40;

-- ---------------------------------------------------------
-- 4. Seed Tasks
-- ---------------------------------------------------------
INSERT INTO tasks (title, category_id, project_id, estimated_pomodoros, start_datetime, is_completed, created_at)
WITH RECURSIVE 
    date_config(start_date, end_date) AS (
        SELECT 
            date('now', 'weekday 1', '-14 days'),
            date('now', 'weekday 1', '+6 days')
    ),
    date_range(dt) AS (
        SELECT start_date FROM date_config
        UNION ALL
        SELECT date(dt, '+1 day') FROM date_range WHERE dt < (SELECT end_date FROM date_config)
    ),
    slots(i) AS (
        SELECT 1 UNION ALL SELECT i + 1 FROM slots WHERE i < 4
    )

SELECT 
    'Task ' || d.dt || ' #' || s.i as title,
    (abs(random()) % 5) + 1 as category_id,
    CASE WHEN (abs(random()) % 100) < 50 THEN (abs(random()) % 3) + 1 ELSE NULL END as project_id,
    (abs(random()) % 4) + 1 as estimated_pomodoros,
    datetime(d.dt, '+' || (9 + abs(random()) % 8) || ' hours') as start_datetime,
    CASE WHEN (abs(random()) % 100) < 70 THEN 1 ELSE 0 END as is_completed,
    CURRENT_TIMESTAMP
FROM date_range d
CROSS JOIN slots s
WHERE (abs(random()) % 100) < 60;
