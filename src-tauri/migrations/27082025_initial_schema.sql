
-- tracks focus sessions
CREATE TABLE sessions (
  id INT PRIMARY KEY,
  session_length INT NOT NULL,
  finished INT NOT NULL DEFAULT TRUE,
  category_id INT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

  FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_settings (
    id INT PRIMARY KEY,
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

CREATE TABLE oneshot_tasks (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INT,

  FOREIGN KEY (category_id) REFERENCES categories (id)
);

