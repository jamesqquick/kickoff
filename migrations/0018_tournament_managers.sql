-- tournament_managers: grants a user director-level access to a specific tournament.
-- Adding a manager also sets that user's isDirector = true (enforced in the service layer).
CREATE TABLE tournament_managers (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  added_by      TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE UNIQUE INDEX uq_tournament_managers ON tournament_managers (tournament_id, user_id);

-- tournament_manager_invites: share-a-link, single-use, 48h-expiring invite.
-- email is nullable now; populated later when email delivery is added.
CREATE TABLE tournament_manager_invites (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  email         TEXT,
  token         TEXT NOT NULL UNIQUE,
  created_by    TEXT NOT NULL,
  expires_at    INTEGER NOT NULL,
  accepted_at   INTEGER,
  created_at    INTEGER NOT NULL
);
