-- Add migration script here
INSERT INTO settings_categories (id, name) VALUES
(1, 'timer'),
(2, 'automation'),
(3, 'notification');

INSERT INTO user_settings (key, value, description, data_type, category_id) VALUES
('default_category', 'None', 'Default category to use for focus', 'string', 1),
('focus_time', '25','Focus session time', 'number', 1),
('short_break_time', '5','Shorter break time', 'number', 1),
('long_break_time', '15','Longer break time', 'number', 1),
('long_break_interval', '4','How many focus sessions per break', 'number', 1),
('auto_start_break', 'false','Start break automatically when focus ends', 'boolean',2),
('auto_start_focus', 'false','Start focus automatically when break ends', 'boolean', 2),
('sound_notification', 'true', 'Play sound on focus/break end', 'boolean', 3),
('vibration_notification','true','Vibrate on focus/break end', 'boolean', 3),
('push_notification', 'true', 'Push notification on focus/break end', 'boolean', 3);
