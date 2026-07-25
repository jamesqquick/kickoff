-- Add created_by to tournaments (nullable — SQLite cannot add NOT NULL to a populated table).
-- Backfill existing rows with the platform admin user id.
ALTER TABLE tournaments ADD COLUMN created_by TEXT;
UPDATE tournaments SET created_by = (SELECT id FROM "user" WHERE role = 'admin' LIMIT 1) WHERE created_by IS NULL;
