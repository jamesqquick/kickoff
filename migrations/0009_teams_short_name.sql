-- Migration: add short_name column to teams
-- Nullable; existing rows default to NULL.
-- Display layer falls back to the first two characters of the team name.
ALTER TABLE teams ADD COLUMN short_name TEXT;
