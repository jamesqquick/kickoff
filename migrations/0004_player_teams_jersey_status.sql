ALTER TABLE player_teams ADD COLUMN jersey_number INTEGER;
ALTER TABLE player_teams ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));
