-- Add isCoach and isDirector to the Better Auth user table.
-- These correspond to the additionalFields defined in auth.ts.
-- Default 0 (false) — existing users retain null-like state until they update their settings.
ALTER TABLE "user" ADD COLUMN isCoach INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN isDirector INTEGER NOT NULL DEFAULT 0;
