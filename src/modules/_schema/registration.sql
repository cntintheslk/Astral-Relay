-- Registration tables

CREATE TABLE IF NOT EXISTS registrations (
  id           TEXT PRIMARY KEY,
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  rank         TEXT NOT NULL,
  status       TEXT NOT NULL, -- pending, approved, denied, auto_approved
  submitted_at INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  approved_by  TEXT,          -- moderator id (nullable)
  reason       TEXT           -- optional denial/notes
);

CREATE INDEX IF NOT EXISTS idx_registrations_guild
  ON registrations (guild_id);

CREATE INDEX IF NOT EXISTS idx_registrations_user
  ON registrations (user_id);

CREATE TABLE IF NOT EXISTS pending_approvals (
  id           TEXT PRIMARY KEY,
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  rank         TEXT NOT NULL,
  submitted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_guild
  ON pending_approvals (guild_id);
