ALTER TABLE mcq_choices ADD COLUMN updated_at DATETIME;
UPDATE mcq_choices SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP);
