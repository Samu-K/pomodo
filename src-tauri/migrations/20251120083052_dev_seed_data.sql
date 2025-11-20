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

