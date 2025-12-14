const db = require("../../core/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

const PROTECTED_PERMS = [
    "Administrator",
    "KickMembers",
    "BanMembers"
];

function isProtected(member) {
    return member.permissions.has(PROTECTED_PERMS);
}

async function runAutoPurge(client, dryRun = true) {
    const now = Date.now();

    const rules = db
        .prepare(`SELECT * FROM auto_purge_rules WHERE enabled = 1`)
        .all();

    for (const rule of rules) {
        const guild = client.guilds.cache.get(rule.guild_id);
        if (!guild) continue;

        const members = await guild.members.fetch();

        for (const member of members.values()) {
            if (!member.roles.cache.has(rule.role_id)) continue;
            if (isProtected(member)) continue;

            const assignment = db.prepare(`
                SELECT assigned_at FROM role_assignments
                WHERE guild_id = ? AND user_id = ? AND role_id = ?
            `).get(guild.id, member.id, rule.role_id);

            if (!assignment) continue;

            const heldTime = now - assignment.assigned_at;

            if (heldTime < rule.duration_seconds * 1000) continue;

            // ---- DRY RUN ----
            if (dryRun) {
                logger.warn(
                    `[AUTO-PURGE DRY RUN] ${member.user.tag} would be ${rule.action}`
                );
                continue;
            }

            try {
                if (rule.action === "kick") {
                    await member.kick(rule.reason);
                } else if (rule.action === "remove_role") {
                    await member.roles.remove(rule.role_id, rule.reason);
                }

                log(
                    "WARN",
                    "Auto Purge Executed",
                    `User: ${member.user.tag}\nAction: ${rule.action}\nReason: ${rule.reason}`
                );
            } catch (err) {
                logger.error(`Auto-purge failed for ${member.user.tag}`, err);
            }
        }
    }
}

module.exports = { runAutoPurge };
