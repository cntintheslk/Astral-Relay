-- Registration tables

CREATE TABLE IF NOT EXISTS registration_settings (
    guild_id TEXT PRIMARY KEY,
    role_r1   TEXT,
    role_r2   TEXT,
    role_r3   TEXT,
    role_r4   TEXT,
    role_r5   TEXT,
    require_approval_r4 INTEGER DEFAULT 1,
    require_approval_r5 INTEGER DEFAULT 1,
    approver_roles TEXT
);

CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ign TEXT NOT NULL,
    rank TEXT NOT NULL,
    status TEXT NOT NULL, -- pending / approved / auto
    timestamp INTEGER NOT NULL
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
