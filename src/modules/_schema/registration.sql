-- Registration settings
CREATE TABLE IF NOT EXISTS registration_settings (
    guild_id TEXT PRIMARY KEY,
    role_r1 TEXT,
    role_r2 TEXT,
    role_r3 TEXT,
    role_r4 TEXT,
    role_r5 TEXT,
    require_approval_r1 INTEGER DEFAULT 1,
    require_approval_r2 INTEGER DEFAULT 1,
    require_approval_r3 INTEGER DEFAULT 1,
    require_approval_r4 INTEGER DEFAULT 1,
    require_approval_r5 INTEGER DEFAULT 1,
    approver_roles TEXT
);

-- Registration log / state machine
CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ign TEXT NOT NULL,
    rank TEXT NOT NULL,
    status TEXT NOT NULL, -- pending / approved / denied / auto
    timestamp INTEGER NOT NULL,
    approved_by TEXT,
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_registrations_guild
  ON registrations (guild_id);

CREATE INDEX IF NOT EXISTS idx_registrations_user
  ON registrations (user_id);


DROP TABLE IF EXISTS pending_approvals;
ALTER TABLE registrations ADD COLUMN approved_by TEXT;
ALTER TABLE registrations ADD COLUMN reason TEXT;
