-- Add registration deadline, location, and description to tournaments.
ALTER TABLE tournaments ADD COLUMN registration_deadline TEXT;
ALTER TABLE tournaments ADD COLUMN location TEXT;
ALTER TABLE tournaments ADD COLUMN description TEXT;
