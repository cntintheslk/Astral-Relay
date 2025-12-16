// ============================================================
// ASTRAL RELAY — ROLE ASSIGNMENT SERVICE
// Persists role assignment events for audit / analytics.
// ============================================================

const db = require("./database");
const logger = require("../core/logger");

/**
 * Records newly assigned roles for a guild member.
 */
function recordAssignments(guildId, userId, roleIds) {
    if (!roleIds.length) return;

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO role_assignments
        (guild_id, user_id, role_id, assigned_at)
        VALUES (?, ?, ?, ?)
    `);

    for (const roleId of roleIds) {
        stmt.run(guildId, userId, roleId, Date.now());
    }

    logger.info("Role assignments recorded.", {
        guildId,
        userId,
        roles: roleIds,
    });
}

module.exports = {
    recordAssignments,
};
