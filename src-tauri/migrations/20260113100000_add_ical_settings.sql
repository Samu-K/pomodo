-- Add iCal category
INSERT INTO settings_categories (id, name) VALUES (4, 'iCal Integration');

-- Add iCal settings
INSERT INTO user_settings (key, value, description, data_type, category_id) VALUES
('iCal sync enabled', 'false', 'Enable syncing tasks to an external calendar via iCal', 'boolean', 4),
('iCal sync URL', '', 'The URL of your iCal sync service (e.g., https://yourbase.url/sync)', 'string', 4),
('iCal sync token', '', 'Unique token for your iCal feed (automatically generated)', 'string', 4);
