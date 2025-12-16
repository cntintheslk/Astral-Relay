// ============================================================
// ASTRAL RELAY — GUILD MEMBER UPDATE EVENT
// Tracks role assignments for audit and historical purposes.
// ============================================================

const db = require("../services/database");
const logger = require("../core/logger");

module.exports = {
    name: "guildMemberUpdate",

    async execute(oldMember, newMember) {
        // -----------------------------------------------------
        // ROLE DIFF
        // -----------------------------------------------------

        const addedRoles = newMember.roles.cache.filter(
            role => !oldMember.roles.cache.has(role.id)
        );

        // Intentional no-op: role update without new roles
        if (!addedRoles.size) {
            logger.debug("Guild member update with no new roles.", {
                memberId: newMember.id,
                guildId: newMember.guild.id,
            });
            return;
        }

        logger.info("Recording newly assigned roles.", {
            memberId: newMember.id,
            guildId: newMember.guild.id,
            roles: [...addedRoles.keys()],
        });

        const stmt = db.prepare(`
            INSERT OR IGNORE INTO role_assignments
            (guild_id, user_id, role_id, assigned_at)
            VALUES (?, ?, ?, ?)
        `);

        try {
            for (const role of addedRoles.values()) {
                stmt.run(
                    newMember.guild.id,
                    newMember.id,
                    role.id,
                    Date.now()
                );
            }

            logger.success("Role assignments recorded.", {
                memberId: newMember.id,
                guildId: newMember.guild.id,
                count: addedRoles.size,
            });

        } catch (err) {
            logger.error("Failed to record role assignments.", {
                memberId: newMember.id,
                guildId: newMember.guild.id,
                error: err?.stack || err.message,
            });
        }
    },
};
