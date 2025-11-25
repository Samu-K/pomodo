-- Add migration script here
INSERT INTO settings_categories (id, name) VALUES
(1, 'timer'),
(2, 'automation'),
(3, 'notification');

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
('Push notifications', 'true', 'Push notification on focus/break end', 'boolean', 3);
