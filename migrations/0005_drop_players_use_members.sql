-- Replace the players + player_teams tables with a single team_members table
-- that references the Better Auth user table directly. No data migration needed.

CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  jersey_number INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, team_id)
);

DROP TABLE player_teams;
DROP TABLE players;
