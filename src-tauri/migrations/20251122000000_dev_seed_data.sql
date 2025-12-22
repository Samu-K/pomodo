-- SEED DATA MIGRATION
-- Date Range: 2025-09-01 to 2025-11-20
-- Logic: Generates categories, then procedurally generates sessions with gaps and peaks.
-- Note: Duration is stored in SECONDS.

-- ---------------------------------------------------------
-- 1. Seed Categories
-- ---------------------------------------------------------
INSERT INTO categories (name, color) VALUES 
('Work', 'red'),      -- Red
('School', 'blue'),    -- Blue
('Project 1', 'green'), -- Green
('Budgeting', 'yellow'); -- Yellow

INSERT INTO categories (name) VALUES ('Other'); 

-- ---------------------------------------------------------
-- 2. Procedural Session Generation
-- ---------------------------------------------------------
INSERT INTO sessions (start_time, duration, finished, category_id, notes, created_at, last_modified)
WITH RECURSIVE 
    -- A. Generate all dates from Sept 1 to Nov 20
    date_range(dt) AS (
        SELECT datetime('2025-09-01 09:00:00')
        UNION ALL
        SELECT datetime(dt, '+1 day') FROM date_range WHERE dt < '2025-11-20 09:00:00'
    ),
    
    -- B. Define Exclusions (Gap Day: Sept 15, Gap Week: Oct 12-18)
    valid_dates(dt) AS (
        SELECT dt FROM date_range 
        WHERE date(dt) != '2025-09-15' 
        AND (date(dt) < '2025-10-12' OR date(dt) > '2025-10-18')
    ),

    -- C. Generate Multipliers (1 to 15 slots per day)
    slots(i) AS (
        SELECT 1 UNION ALL SELECT i + 1 FROM slots WHERE i < 15
    )

-- D. Select and Randomize
SELECT 
    -- START TIME
    datetime(v.dt, '+' || (abs(random()) % 12) || ' hours', '+' || (abs(random()) % 60) || ' minutes') as start_time,
    
    -- DURATION (SECONDS): 
    -- Base 15 to 120 minutes, multiplied by 60 to get seconds
    ((abs(random()) % 105) + 15) * 60 as duration,
    
    -- FINISHED: 80% chance true
    CASE WHEN (abs(random()) % 10) < 8 THEN 1 ELSE 0 END as finished,
    
    -- CATEGORY: Random 1-5
    (abs(random()) % 5) + 1 as category_id,
    
    -- NOTES
    CASE WHEN (abs(random()) % 3) = 0 THEN 'Auto-generated focus session' ELSE NULL END as notes,
    
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM valid_dates v
CROSS JOIN slots s
WHERE 
    -- Peaks
    date(v.dt) IN ('2025-09-20', '2025-10-25', '2025-11-10')
    OR 
    -- Average volume
    (abs(random()) % 100) < 33;


-- SEED DATA: CURRENT WEEK
-- Generates 5-8 sessions/day for this week (Mon-Sun).
-- Skips 1 specific day (Gap Day), ensuring the Gap Day is not Today.

INSERT INTO sessions (start_time, duration, finished, category_id, notes, created_at, last_modified)
WITH RECURSIVE 
    -- 1. Define the Start of the Current Week (Monday)
    week_start(dt) AS (
        SELECT date('now', '-6 days', 'weekday 1') -- Finds the most recent Monday
    ),

    -- 2. Generate the 7 days of this week
    week_dates(dt) AS (
        SELECT dt FROM week_start
        UNION ALL
        SELECT date(dt, '+1 day') FROM week_dates WHERE dt < date((SELECT dt FROM week_start), '+6 days')
    ),

    -- 3. Determine the "Gap Day" (The day with 0 sessions)
    -- Logic: If Today is Sunday, make the gap Saturday. Otherwise, make the gap Sunday.
    -- This guarantees the Gap Day is never Today.
    gap_config(gap_dt) AS (
        SELECT CASE 
            WHEN date('now') = date((SELECT dt FROM week_start), '+6 days') -- If Today is Sunday
            THEN date((SELECT dt FROM week_start), '+5 days')               -- Gap is Saturday
            ELSE date((SELECT dt FROM week_start), '+6 days')               -- Else Gap is Sunday
        END
    ),

    -- 4. Assign a "Session Count" (5-8) to each day
    daily_targets(dt, target_count) AS (
        SELECT 
            w.dt,
            CASE 
                WHEN w.dt = g.gap_dt THEN 0 -- Force 0 sessions for the Gap Day
                ELSE 5 + (abs(random()) % 4) -- Random integer between 5 and 8
            END
        FROM week_dates w, gap_config g
    ),

    -- 5. Slot generator (Max 8 slots needed)
    slots(i) AS (
        SELECT 1 UNION ALL SELECT i + 1 FROM slots WHERE i < 8
    )

-- 6. Generate the Data
SELECT 
    -- START TIME: Date + Random Hour (08:00 to 20:00) + Random Minute
    datetime(t.dt, '+' || (8 + abs(random()) % 12) || ' hours', '+' || (abs(random()) % 60) || ' minutes') as start_time,
    
    -- DURATION: 15 to 90 mins (in seconds)
    ((abs(random()) % 76) + 15) * 60 as duration,
    
    -- FINISHED: Mostly true
    CASE WHEN (abs(random()) % 10) < 9 THEN 1 ELSE 0 END as finished,
    
    -- CATEGORY: Random 1-5
    (abs(random()) % 5) + 1 as category_id,
    
    NULL as notes,
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM daily_targets t
CROSS JOIN slots s
WHERE s.i <= t.target_count; -- Only generate rows up to the target count (5, 6, 7, or 8)

-- ---------------------------------------------------------
-- 3. Edge Case Injection (Bug Catching)
-- ---------------------------------------------------------

-- A. Session crossing midnight (1 hour = 3600s)
INSERT INTO sessions (start_time, duration, finished, category_id, notes) 
VALUES ('2025-09-05 23:45:00', 3600, 1, 1, 'Late night work crossing midnight');

-- B. Uncategorized session (30 mins = 1800s)
INSERT INTO sessions (start_time, duration, finished, category_id, notes) 
VALUES ('2025-09-06 14:00:00', 1800, 1, NULL, 'Uncategorized floating session');

-- C. Huge duration (12 hours = 43200s)
INSERT INTO sessions (start_time, duration, finished, category_id, notes) 
VALUES ('2025-09-21 08:00:00', 43200, 0, 3, 'Forgot to stop timer?');

-- D. Special Characters/Unicode (25 mins = 1500s)
INSERT INTO sessions (start_time, duration, finished, category_id, notes) 
VALUES ('2025-10-05 10:00:00', 1500, 1, 2, 'Notes with emojis 🚀 and SQL injection attempt: " OR 1=1; --');

-- E. Zero duration session (0s)
INSERT INTO sessions (start_time, duration, finished, category_id, notes) 
VALUES ('2025-11-01 09:00:00', 0, 0, 5, 'Started and immediately stopped');

-- ---------------------------------------------------------
-- 4. Seed Tasks
-- ---------------------------------------------------------
INSERT INTO tasks (title, category_id, estimated_pomodoros, start_datetime, is_completed, created_at)
WITH RECURSIVE 
    -- A. Generate Dates (Sept 1 - Nov 20)
    task_dates(dt) AS (
        SELECT datetime('2025-09-01 09:00:00')
        UNION ALL
        SELECT datetime(dt, '+1 day') FROM task_dates WHERE dt < '2025-11-20 09:00:00'
    ),
    
    -- B. Valid Dates (Exclude Gap Day: Oct 10)
    valid_task_dates(dt) AS (
        SELECT dt FROM task_dates 
        WHERE date(dt) != '2025-10-10'
    ),

    -- C. Generate Daily Load (0 to 3 tasks per day)
    -- We'll use a random multiplier to decide how many rows to generate per day
    daily_tasks(dt, i) AS (
        SELECT dt, 1 FROM valid_task_dates
        UNION ALL
        SELECT dt, i + 1 FROM daily_tasks WHERE i < (abs(random()) % 4) -- 0 to 3 tasks
    )

SELECT 
    -- TITLE
    'Task ' || date(dt) || ' #' || i as title,

    -- CATEGORY: 1, 2, 3, or 5. (Exclude 4)
    CASE (abs(random()) % 4)
        WHEN 0 THEN 1 -- Work
        WHEN 1 THEN 2 -- School
        WHEN 2 THEN 3 -- Project 1
        WHEN 3 THEN 5 -- Other
    END as category_id,

    -- ESTIMATED POMODOROS: 1-4
    (abs(random()) % 4) + 1 as estimated_pomodoros,

    -- START TIME: Random offset from 9am
    datetime(dt, '+' || (abs(random()) % 8) || ' hours') as start_datetime,

    -- COMPLETED: 80% chance
    CASE WHEN (abs(random()) % 10) < 8 THEN 1 ELSE 0 END as is_completed,

    CURRENT_TIMESTAMP
FROM daily_tasks;

-- Edge Cases
INSERT INTO tasks (title, category_id, estimated_pomodoros, start_datetime, is_completed) VALUES
('Super Long Task Title That Goes On And On And On For Testing Layout Wrapping And Overflow Issues In The UI ' || 
 'Because We Need To Be Sure It Does Not Break Anything', 1, 5, '2025-09-02 10:00:00', 0),
('🚀 Start Mars Mission (Critical)', 2, 10, '2025-09-05 14:00:00', 1),
('Uncategorized Floating Task', NULL, 1, '2025-09-12 12:00:00', 0);

-- ---------------------------------------------------------
-- 5. Seed Tasks: Current Week
-- ---------------------------------------------------------
INSERT INTO tasks (title, category_id, estimated_pomodoros, start_datetime, is_completed, created_at)
WITH RECURSIVE 
    -- 1. Define Week Start (Monday)
    week_start(dt) AS (
        SELECT date('now', '-6 days', 'weekday 1')
    ),

    -- 2. Generate 7 Days
    week_dates(dt) AS (
        SELECT dt FROM week_start
        UNION ALL
        SELECT date(dt, '+1 day') FROM week_dates WHERE dt < date((SELECT dt FROM week_start), '+6 days')
    ),

    -- 3. Define Gap Day (same logic as sessions: Sat or Sun, never Today)
    gap_config(gap_dt) AS (
        SELECT CASE 
            WHEN date('now') = date((SELECT dt FROM week_start), '+6 days') 
            THEN date((SELECT dt FROM week_start), '+5 days') 
            ELSE date((SELECT dt FROM week_start), '+6 days')
        END
    ),

    -- 4. Assign Daily Task Count (3-6 tasks)
    daily_task_targets(dt, target_count) AS (
        SELECT 
            w.dt,
            CASE 
                WHEN w.dt = g.gap_dt THEN 0
                ELSE 3 + (abs(random()) % 4) -- 3 to 6 tasks
            END
        FROM week_dates w, gap_config g
    ),

    -- 5. Slot Generator (Max 6)
    slots(i) AS (
        SELECT 1 UNION ALL SELECT i + 1 FROM slots WHERE i < 6
    )

SELECT 
    -- TITLE
    'Current Week Task ' || date(dt) || ' #' || i,

    -- CATEGORY: 1, 2, 3, or 5
    CASE (abs(random()) % 4)
        WHEN 0 THEN 1 -- Work
        WHEN 1 THEN 2 -- School
        WHEN 2 THEN 3 -- Project 1
        WHEN 3 THEN 5 -- Other
    END,

    -- ESTIMATED POMODOROS: 1-4
    (abs(random()) % 4) + 1,

    -- START TIME: 09:00 to 17:00
    datetime(dt, '+' || (9 + abs(random()) % 9) || ' hours', '+' || (abs(random()) % 60) || ' minutes'),

    -- COMPLETED: 50% chance (mix for testing)
    CASE WHEN (abs(random()) % 2) = 0 THEN 1 ELSE 0 END,

    CURRENT_TIMESTAMP
FROM daily_task_targets t
CROSS JOIN slots s
WHERE s.i <= t.target_count;

