-- Migration: team_invites table
-- Stores persistent per-team invite tokens that coaches share with players.
-- Joining via a token auto-approves membership (bypasses the pending → approval flow).
-- One active invite per team; regenerating deactivates the old token (is_active = 0).
CREATE TABLE team_invites (
  id          TEXT    NOT NULL PRIMARY KEY,
  team_id     TEXT    NOT NULL,
  token       TEXT    NOT NULL UNIQUE,
  created_by  TEXT    NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
