-- tracks focus sessions
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  session_length INTEGER NOT NULL,
  finished INTEGER NOT NULL DEFAULT FALSE,
  category_id INTEGER,
  task_id INTEGER,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories (id),
  FOREIGN KEY (task_id) REFERENCES tasks (id)
);

-- focus categories e.g studies, work
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (id, name) VALUES (0,'default');
INSERT INTO categories (id, name) VALUES (1,'work');

CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    data_type TEXT NOT NULL,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('default_category', 'general', 'string', CURRENT_TIMESTAMP);
INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('focus_time', '25', 'number', CURRENT_TIMESTAMP);
INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('short_break_time', '5', 'number', CURRENT_TIMESTAMP);
INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('long_break_time', '15', 'number', CURRENT_TIMESTAMP);
INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('long_break_interval', '4', 'number', CURRENT_TIMESTAMP);
INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('auto_start_break', 'false', 'boolean', CURRENT_TIMESTAMP);
INSERT INTO user_settings (key, value, data_type, updated_at) VALUES
('auto_start_focus', 'false', 'boolean', CURRENT_TIMESTAMP);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  -- oneshot or recurring
  task_type TEXT NOT NULL,
  -- how many focus cycles task will take
  estimated_cycles INTEGER default 0,
  completed_cycles INTEGER default 0,
  completed boolean NOT NULL default FALSE,
  -- when the task should be started
  deadline TIMESTAMP,
  parent_id INTEGER,
  -- daily, weekly, monthly eg
  repeat_period TEXT,
  deleted BOOLEAN default false,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id),
  FOREIGN KEY (parent_id) REFERENCES tasks (id)
);

INSERT INTO tasks (id, name, category_id, task_type) VALUES (0,'test_task', 0, 'oneshot');
