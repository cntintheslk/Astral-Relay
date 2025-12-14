CREATE TABLE IF NOT EXISTS role_assignments (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id, role_id)
);

CREATE TABLE IF NOT EXISTS auto_purge_rules (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('kick', 'remove_role')),
    reason TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);
