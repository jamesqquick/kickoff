-- notifications: persisted in-app notification records for any user.
-- readAt is null for unread notifications; set to epoch ms when read.
-- referenceUrl is the app path to navigate to on click; nullable.
CREATE TABLE notifications (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  type          TEXT    NOT NULL,
  title         TEXT    NOT NULL,
  body          TEXT    NOT NULL,
  reference_url TEXT,
  read_at       INTEGER,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- Fetch all notifications for a user ordered by creation date (the common case).
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- Efficiently count unread notifications per user (NULL read_at = unread).
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read_at);
