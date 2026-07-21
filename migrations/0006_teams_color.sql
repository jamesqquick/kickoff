-- Add color column to teams table for storing the selected crest color key.
-- Defaults to 'emerald' so existing rows are valid without a data migration.

ALTER TABLE teams ADD COLUMN color TEXT NOT NULL DEFAULT 'emerald';
