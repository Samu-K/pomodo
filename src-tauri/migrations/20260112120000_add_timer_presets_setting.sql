-- Add Timer Presets setting
INSERT INTO user_settings (key, value, description, data_type, category_id) VALUES
('Timer Presets', '[]', 'Custom timer presets stored as JSON', 'string', 1);
