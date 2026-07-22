-- Tournament registrations: a team's slot in a specific division of a tournament.
-- One registration per team per tournament (unique constraint).
-- tournament_id is denormalized for efficient lookups without joining through divisions.
CREATE TABLE tournament_registrations (
  id            TEXT PRIMARY KEY,
  team_id       TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  division_id   TEXT NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending',
  registered_at TEXT NOT NULL,
  notes         TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE(team_id, tournament_id)
);
