ALTER TABLE loa_settings
ADD COLUMN require_approval INTEGER DEFAULT 0;

ALTER TABLE loa_settings
ADD COLUMN loa_role_id TEXT;

ALTER TABLE loa_settings
ADD COLUMN updated_at INTEGER NOT NULL;

ALTER TABLE loas
ADD COLUMN guild_id TEXT NOT NULL;

ALTER TABLE loas
ADD COLUMN user_id TEXT NOT NULL;

ALTER TABLE loas
ADD COLUMN reason TEXT NOT NULL;

ALTER TABLE loas
ADD COLUMN start_date INTEGER NOT NULL;

ALTER TABLE loas
ADD COLUMN end_date INTEGER NOT NULL;

ALTER TABLE loas
ADD COLUMN status TEXT NOT NULL;

ALTER TABLE loas
ADD COLUMN submitted_at INTEGER NOT NULL;

ALTER TABLE loas
ADD COLUMN approved_at INTEGER;

ALTER TABLE loas
ADD COLUMN approved_by TEXT;

ALTER TABLE loas
ADD COLUMN pending_message_id TEXT;

ALTER TABLE loas
ADD COLUMN updated_at INTEGER NOT NULL;

ALTER TABLE loa_history
ADD COLUMN guild_id TEXT NOT NULL;

ALTER TABLE loa_history
ADD COLUMN user_id TEXT NOT NULL;

ALTER TABLE loa_history
ADD COLUMN reason TEXT NOT NULL;

ALTER TABLE loa_history
ADD COLUMN start_date INTEGER NOT NULL;

ALTER TABLE loa_history
ADD COLUMN end_date INTEGER NOT NULL;

ALTER TABLE loa_history
ADD COLUMN resolved_at INTEGER NOT NULL;

ALTER TABLE loa_history
ADD COLUMN resolved_by TEXT;

ALTER TABLE loa_history
ADD COLUMN resolution TEXT NOT NULL;

ALTER TABLE loa_history
ADD COLUMN status TEXT NOT NULL;

ALTER TABLE loa_board
ADD COLUMN channel_id TEXT NOT NULL;

ALTER TABLE loa_board
ADD COLUMN message_id TEXT NOT NULL;

ALTER TABLE loa_board
ADD COLUMN updated_at INTEGER NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loas_guild
ON loas (guild_id);

CREATE INDEX IF NOT EXISTS idx_loas_user
ON loas (user_id);

CREATE INDEX IF NOT EXISTS idx_loas_status
ON loas (status);

CREATE INDEX IF NOT EXISTS idx_loa_history_guild
ON loa_history (guild_id);

CREATE INDEX IF NOT EXISTS idx_loa_history_user
ON loa_history (user_id);
