-- ============================================================
--  LOA SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS loa_settings (
  guild_id TEXT PRIMARY KEY,
  require_approval INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL
);


-- ============================================================
--  LOA MAIN TABLE (UUID IDs)
-- ============================================================

CREATE TABLE IF NOT EXISTS loas (
  id           TEXT PRIMARY KEY,         -- UUID
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  reason       TEXT NOT NULL,
  start_date   INTEGER NOT NULL,
  end_date     INTEGER NOT NULL,
  status       TEXT NOT NULL,            -- pending, active, cancelled, denied, expired
  submitted_at INTEGER NOT NULL,
  approved_at  INTEGER,
  approved_by  TEXT,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loas_guild
  ON loas (guild_id);

CREATE INDEX IF NOT EXISTS idx_loas_user
  ON loas (user_id);

CREATE INDEX IF NOT EXISTS idx_loas_status
  ON loas (status);


-- ============================================================
--  LOA HISTORY TABLE (UUID IDs)
-- ============================================================

CREATE TABLE IF NOT EXISTS loa_history (
  id           TEXT PRIMARY KEY,         -- UUID
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  reason       TEXT NOT NULL,
  start_date   INTEGER NOT NULL,
  end_date     INTEGER NOT NULL,
  resolved_at  INTEGER NOT NULL,
  resolved_by  TEXT,
  resolution   TEXT NOT NULL,            -- completed, cancelled, expired, denied
  status       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loa_history_guild
  ON loa_history (guild_id);

CREATE INDEX IF NOT EXISTS idx_loa_history_user
  ON loa_history (user_id);


-- ============================================================
--  LOA BOARD CONFIG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS loa_board (
  guild_id   TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);


ALTER TABLE loa_settings ADD COLUMN loa_role_id TEXT;
