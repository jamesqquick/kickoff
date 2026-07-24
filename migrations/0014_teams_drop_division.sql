-- Drop the free-text division column from teams.
-- Division assignment now lives on tournament_registrations.division_id.
ALTER TABLE teams DROP COLUMN division;
