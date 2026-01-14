INSERT INTO user_settings (key, description, value, category_id, data_type)
SELECT 'iCal sync secret', 'Shared secret for authentication with the VPS sync service', '', id, 'text'
FROM settings_categories WHERE name = 'iCal Integration';
