-- Divisions are tournament-scoped competitive brackets.
-- Each tournament defines its own set of divisions; they are not shared.
CREATE TABLE divisions (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  max_teams     INTEGER,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
