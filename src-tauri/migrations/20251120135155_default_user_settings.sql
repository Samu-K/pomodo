-- Add migration script here
INSERT INTO user_settings (key, value, data_type) VALUES
('default_category', 'None', 'string'),
('focus_time', '25', 'number'),
('short_break_time', '5', 'number'),
('long_break_time', '15', 'number'),
('long_break_interval', '4', 'number'),
('auto_start_break', 'false', 'boolean'),
('auto_start_focus', 'false', 'boolean');
