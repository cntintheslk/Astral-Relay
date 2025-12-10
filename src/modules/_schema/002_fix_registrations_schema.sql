-- =========================================================
-- MIGRATION 002: Rebuild the registrations table cleanly
-- Purpose:
--   - Fix corrupted schema caused by old development versions
--   - Restore correct column types and NOT NULL constraints
--   - Ensure schema matches the bot's expected INSERT queries
-- =========================================================

-- 1) Rename the old, corrupted table
ALTER TABLE registrations RENAME TO registrations_old;


-- 2) Create the new correct table schema
CREATE TABLE registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ign TEXT NOT NULL,
    rank TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);


-- 3) Migrate old data into the new corrected schema
-- This maps columns safely even if old table structure differed
INSERT INTO registrations (guild_id, user_id, ign, rank, status, timestamp)
SELECT 
    guild_id,
    user_id,
    COALESCE(ign, ''),                   -- Default ign if missing
    rank,
    status,
    COALESCE(timestamp, strftime('%s','now'))
FROM registrations_old;


-- 4) Drop the old broken table
DROP TABLE registrations_old;


-- 5) Optional: Create indexes (performance optimization)
CREATE INDEX IF NOT EXISTS idx_registrations_guild
  ON registrations (guild_id);

CREATE INDEX IF NOT EXISTS idx_registrations_user
  ON registrations (user_id);

-- =========================================================
-- END OF MIGRATION
-- =========================================================
