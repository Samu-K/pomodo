-- recurring_tasks_schema.sql
-- Constraints: no UNIQUE constraints, no DB-side validation checks, use TIMESTAMP for all dates.

-- Categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY ,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'pomodo-orange',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User settings (simple key/value store)
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY ,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    data_type TEXT NOT NULL,
    category_id INTEGER NOT NULL, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE sessions (
    id INTEGER PRIMARY KEY ,
    start_time TIMESTAMP NOT NULL,
    duration INTEGER,
    finished BOOLEAN DEFAULT 0,
    category_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Indexes to assist common queries
CREATE INDEX idx_sessions_start_time ON sessions(start_time);

