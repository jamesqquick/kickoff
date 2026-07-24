-- Migration: 0014_roster_import
-- Extends team_members to support coach-imported rosters.
--
-- Changes:
--   user_id  → nullable (imported players have no account yet)
--   email    → new, nullable, UNIQUE per team (the matching key)
--   display_name → new, nullable (imported name shown before account is claimed)
--   date_of_birth → new, nullable (ISO YYYY-MM-DD)
--   phone    → new, nullable
--   player_id → new, nullable (state registration ID)
--   status   → adds 'pending_signup' to the enum
--
-- SQLite does not support ALTER COLUMN, so we recreate the table.

PRAGMA foreign_keys = OFF;

CREATE TABLE team_members_new (
  id           TEXT    NOT NULL PRIMARY KEY,
  user_id      TEXT,
  team_id      TEXT    NOT NULL,
  email        TEXT,
  display_name TEXT,
  jersey_number INTEGER,
  date_of_birth TEXT,
  phone        TEXT,
  player_id    TEXT,
  status       TEXT    NOT NULL DEFAULT 'pending'
                 CHECK(status IN ('pending', 'pending_signup', 'approved', 'rejected')),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  -- Existing constraint: one account per team (NULLs are distinct in SQLite — safe)
  UNIQUE(user_id, team_id),
  -- New constraint: one imported email per team (NULLs are distinct — won't affect account rows)
  UNIQUE(email, team_id)
);

INSERT INTO team_members_new
  (id, user_id, team_id, jersey_number, status, created_at, updated_at)
SELECT
  id, user_id, team_id, jersey_number, status, created_at, updated_at
FROM team_members;

DROP TABLE team_members;
ALTER TABLE team_members_new RENAME TO team_members;

PRAGMA foreign_keys = ON;
