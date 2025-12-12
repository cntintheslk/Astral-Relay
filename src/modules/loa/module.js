// modules/loa/module.js
const logger = require("../../core/logger");
const db = require("../../core/database");

module.exports = {
    name: "loa",
    description: "Leave of Absence system",
    environment: "production",

    init(client) {
        logger.info("[loa] Initializing LOA module...");

        // Create tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS loa_settings (
                guild_id TEXT PRIMARY KEY,
                require_approval INTEGER DEFAULT 0,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS loas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                start_date INTEGER NOT NULL,
                end_date INTEGER NOT NULL,
                status TEXT NOT NULL,
                submitted_at INTEGER NOT NULL,
                approved_at INTEGER,
                approved_by TEXT,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS loa_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                start_date INTEGER NOT NULL,
                end_date INTEGER NOT NULL,
                resolved_at INTEGER NOT NULL,
                resolved_by TEXT,
                resolution TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS loa_board (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );
        `);

        // Every minute: expire LOAs
        setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const expired = db.prepare(`
                SELECT * FROM loas
                WHERE status = 'approved' AND end_date < ?
            `).all(now);

            for (const entry of expired) {
                db.prepare(`
                    UPDATE loas SET status='expired', updated_at=? WHERE id=?
                `).run(now, entry.id);

                // Move to history
                db.prepare(`
                    INSERT INTO loa_history (
                        guild_id, user_id, reason, start_date,
                        end_date, resolved_at, resolved_by, resolution, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    entry.guild_id, entry.user_id, entry.reason,
                    entry.start_date, entry.end_date, now,
                    "system", "expired", "expired"
                );

                // Remove from active
                db.prepare(`DELETE FROM loas WHERE id = ?`).run(entry.id);

                client.emit("loaUpdate", entry.guild_id);
            }
        }, 60_000);

        logger.success("[module:loa] Initialized");
    }
};
