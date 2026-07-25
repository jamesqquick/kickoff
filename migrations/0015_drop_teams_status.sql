-- Drop the global team status column.
-- Team approval now lives exclusively on tournament_registrations.status.
ALTER TABLE teams DROP COLUMN status;
