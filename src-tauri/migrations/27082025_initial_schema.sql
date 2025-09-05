-- recurring_tasks_schema.sql
-- Schema for recurring tasks, instances, and pomodoro sessions
-- Constraints: no UNIQUE constraints, no DB-side validation checks, use TIMESTAMP for all dates.

-- Categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY ,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#808080',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User settings (simple key/value store)
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY ,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    data_type TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks: templates / series
-- estimated_cycles: estimated number of pomodoro sessions to complete the task
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY ,
    title TEXT NOT NULL,
    category_id INTEGER,
    completed boolean,
    estimated_cycles INTEGER,              -- estimated pomodoro count
    estimated_duration_seconds INTEGER,    -- optional total estimated seconds (nullable)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT 0,        -- 0/1 boolean (SQLite affinity)
    series_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Task details (one-to-one with tasks)
CREATE TABLE task_details (
    task_id INTEGER PRIMARY KEY,
    description TEXT,
    priority INTEGER DEFAULT 1,
    deadline TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Recurrence rules (iCal RRULE stored)
CREATE TABLE recurrence_rules (
    id INTEGER PRIMARY KEY ,
    task_id INTEGER NOT NULL,
    rrule TEXT NOT NULL,       -- iCal RRULE
    dtstart TIMESTAMP NOT NULL,
    until TIMESTAMP,
    timezone TEXT DEFAULT 'UTC', -- IANA timezone name (e.g. "Europe/Helsinki")
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- EXDATEs normalized (one row per excluded date)
CREATE TABLE recurrence_exdates (
    id INTEGER PRIMARY KEY ,
    recurrence_rule_id INTEGER NOT NULL,
    exdate TIMESTAMP NOT NULL,
    FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rules(id) ON DELETE CASCADE
);

-- RDATEs normalized (one row per extra included date)
CREATE TABLE recurrence_rdates (
    id INTEGER PRIMARY KEY ,
    recurrence_rule_id INTEGER NOT NULL,
    rdate TIMESTAMP NOT NULL,
    FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rules(id) ON DELETE CASCADE
);

-- Materialized task instances (occurrences); supports exceptions/overrides
CREATE TABLE task_instances (
    id INTEGER PRIMARY KEY ,
    task_id INTEGER NOT NULL,               -- series/template that produced this instance
    recurrence_rule_id INTEGER,             -- optional FK to the rule that generated it
    recurrence_id TIMESTAMP,                -- iCal RECURRENCE-ID if applicable
    instance_date TIMESTAMP NOT NULL,       -- stored as TIMESTAMP (UTC canonicalization handled by API)
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMP,
    is_exception BOOLEAN DEFAULT 0,         -- 0/1 if this row is an edited exception
    override_of_instance_id INTEGER,        -- FK to task_instances if this row replaces another
    modified_title TEXT,
    modified_description TEXT,
    modified_duration INTEGER,              -- seconds
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rules(id) ON DELETE SET NULL,
    FOREIGN KEY (override_of_instance_id) REFERENCES task_instances(id) ON DELETE SET NULL
);

-- Sessions: tracked pomodoro cycles
-- Each session is a single pomodoro cycle; only start_time is required
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY ,
    task_id INTEGER,                        -- link to a task (series/template)
    task_instance_id INTEGER,               -- optional link to a specific occurrence (nullable)
    start_time TIMESTAMP NOT NULL,          -- when the pomodoro started
    duration_seconds INTEGER,               -- recorded duration in seconds (nullable if not measured)
    session_length INTEGER,                 -- planned pomodoro length in seconds (optional)
    finished BOOLEAN DEFAULT 0,             -- 0/1 boolean if session considered finished
    category_id INTEGER,                    -- optional category snapshot
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (task_instance_id) REFERENCES task_instances(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Indexes to assist common queries
CREATE INDEX idx_task_instances_date ON task_instances(instance_date);
CREATE INDEX idx_task_instances_task ON task_instances(task_id);
CREATE INDEX idx_recurrence_rules_task ON recurrence_rules(task_id);
CREATE INDEX idx_recurrence_exdates_rule ON recurrence_exdates(recurrence_rule_id);
CREATE INDEX idx_recurrence_rdates_rule ON recurrence_rdates(recurrence_rule_id);
CREATE INDEX idx_sessions_task ON sessions(task_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);

