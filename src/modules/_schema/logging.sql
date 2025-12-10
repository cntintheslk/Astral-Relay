-- Logging / audit trail

CREATE TABLE IF NOT EXISTS audit_logs (
  id           TEXT PRIMARY KEY,
  guild_id     TEXT NOT NULL,
  action       TEXT NOT NULL,   -- e.g. registration_approved, loa_submitted
  user_id      TEXT,            -- subject of the action
  moderator_id TEXT,            -- who performed it (nullable)
  details      TEXT,            -- JSON blob with extra metadata
  timestamp    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_guild
  ON audit_logs (guild_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action);
