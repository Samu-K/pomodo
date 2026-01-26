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

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_id INTEGER,
    project_id INTEGER,
    estimated_pomodoros INTEGER DEFAULT 1,
    completed_pomodoros INTEGER DEFAULT 0,
    description TEXT,
    
    -- Scheduling & Recurrence
    start_datetime TIMESTAMP, -- ISO8601 string (e.g., "2023-10-27T09:00:00Z")
    recurrence_rule TEXT,     -- iCal RRULE string (e.g., "FREQ=WEEKLY;BYDAY=MO,WE")
    
    -- State
    is_completed BOOLEAN DEFAULT 0,
    parent_task_id INTEGER,   -- Links specific instances back to a recurring master task
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
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
    project_id INTEGER,
    task_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Create projects table
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'pomodo-orange',
    estimated_pomodoros INTEGER DEFAULT 1,
    category_id INTEGER,
    is_completed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);

INSERT INTO settings_categories (id, name) VALUES
(1, 'timer'),
(2, 'automation'),
(3, 'notification'),
(4, 'integrations');

INSERT INTO user_settings (key, value, description, data_type, category_id) VALUES
('Default category', 'None', 'Default category to use for focus', 'string', 1),
('Focus Duration', '25','Focus session time', 'number', 1),
('Short Break Time', '5','Shorter break time', 'number', 1),
('Long Break Time', '15','Longer break time', 'number', 1),
('Long Break Interval', '4','How many focus sessions per longer break', 'number', 1),
('Auto Start Break', 'false','Start break automatically when focus ends', 'boolean',2),
('Auto Start Focus', 'false','Start focus automatically when break ends', 'boolean', 2),
('Sound Alerts', 'true', 'Play sound on focus/break end', 'boolean', 3),
('Vibration','true','Vibrate on focus/break end', 'boolean', 3),
('Push notifications', 'true', 'Push notification on focus/break end', 'boolean', 3),
('Theme', 'dark', 'Application theme (light or dark)', 'string', 3),
('Timer Presets', '[]', 'Custom timer presets', 'string', 1),
('Toggle Timer', 'CommandOrControl+Alt+P', 'Global shortcut to toggle the timer', 'string', 3),
('iCal sync URL', '', 'URL for iCal synchronization', 'string', 4),
('iCal sync token', '', 'Token for iCal synchronization', 'string', 4),
('iCal sync secret', '', 'Secret for iCal synchronization', 'string', 4),
('iCal sync enabled', 'false', 'Enable iCal synchronization', 'boolean', 4);

-- Trigger: After INSERT on sessions
CREATE TRIGGER update_completed_pomodoros_insert
AFTER INSERT ON sessions
WHEN NEW.finished = 1 AND NEW.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = completed_pomodoros + 1
    WHERE id = NEW.task_id;
END;

-- Trigger: After UPDATE on sessions (marking as finished)
CREATE TRIGGER update_completed_pomodoros_update_finished
AFTER UPDATE OF finished ON sessions
WHEN NEW.finished = 1 AND OLD.finished = 0 AND NEW.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = completed_pomodoros + 1
    WHERE id = NEW.task_id;
END;

-- Trigger: After UPDATE on sessions (marking as unfinished)
CREATE TRIGGER update_completed_pomodoros_update_unfinished
AFTER UPDATE OF finished ON sessions
WHEN NEW.finished = 0 AND OLD.finished = 1 AND NEW.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = MAX(0, completed_pomodoros - 1)
    WHERE id = NEW.task_id;
END;

-- Trigger: After DELETE on sessions
CREATE TRIGGER update_completed_pomodoros_delete
AFTER DELETE ON sessions
WHEN OLD.finished = 1 AND OLD.task_id IS NOT NULL
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = MAX(0, completed_pomodoros - 1)
    WHERE id = OLD.task_id;
END;

-- Trigger: After UPDATE on sessions (changing task_id)
-- If moving FROM a task TO another task (both finished)
CREATE TRIGGER update_completed_pomodoros_move_task
AFTER UPDATE OF task_id ON sessions
WHEN NEW.finished = 1 AND OLD.finished = 1
BEGIN
    UPDATE tasks 
    SET completed_pomodoros = MAX(0, completed_pomodoros - 1)
    WHERE id = OLD.task_id;

    UPDATE tasks 
    SET completed_pomodoros = completed_pomodoros + 1
    WHERE id = NEW.task_id;
END;

-- Indexes to assist common queries
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
