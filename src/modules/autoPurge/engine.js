// src/src/modules/autoPurge/engine.js

const db = require("../../core/database");
const logger = require("../../core/logger");

/**
 * Determines whether a guild member should be protected
 * from auto-purge actions.
 */
function isProtected(member) {
    if (!member) return true;
    if (member.permissions.has("Administrator")) return true;
    return false;
}

/**
 * Core evaluator.
 * Returns all matches WITHOUT performing any action.
 */
async function evaluateGuild(client, guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return [];

    const now = Date.now();

    const rules = db.prepare(`
        SELECT *
        FROM auto_purge_rules
        WHERE guild_id = ? AND enabled = 1
    `).all(guildId);

    if (!rules.length) return [];

    await guild.members.fetch();

    const matches = [];

    for (const rule of rules) {
        for (const member of guild.members.cache.values()) {
            if (!member.roles.cache.has(rule.role_id)) continue;
            if (isProtected(member)) continue;

            const assignment = db.prepare(`
                SELECT assigned_at
                FROM role_assignments
                WHERE guild_id = ?
                  AND user_id = ?
                  AND role_id = ?
            `).get(guildId, member.id, rule.role_id);

            if (!assignment) continue;

            const heldMs = now - assignment.assigned_at;
            const requiredMs = rule.duration_seconds * 1000;

            if (heldMs < requiredMs) continue;

            matches.push({
                member,
                rule,
                heldMs
            });
        }
    }

    return matches;
}

/**
 * DRY RUN
 * Returns a summary only.
 * Performs NO actions.
 */
async function dryRunSummary(client, guildId) {
    const matches = await evaluateGuild(client, guildId);

    return {
        matched: matches.length,
        rules: new Set(matches.map(m => m.rule.id)).size
    };
}

/**
 * LIVE RUN
 * Executes kicks / role removals.
 * Should only be called when system is explicitly enabled.
 */
async function runAutoPurge(client, guildId, { dryRun = true } = {}) {
    const matches = await evaluateGuild(client, guildId);

    if (dryRun) {
        logger.info(
            `[AutoPurge] Dry-run complete for guild ${guildId}: ${matches.length} match(es)`
        );
        return {
            matched: matches.length,
            executed: 0
        };
    }

    let executed = 0;

    for (const entry of matches) {
        const { member, rule } = entry;

        try {
            if (rule.action === "kick") {
                await member.kick(rule.reason);
            }

            if (rule.action === "remove_role") {
                if (member.roles.cache.has(rule.role_id)) {
                    await member.roles.remove(rule.role_id, rule.reason);
                }
            }

            executed++;
        } catch (err) {
            logger.error(
                `[AutoPurge] Failed to execute rule ${rule.id} on ${member.user.tag}`,
                err
            );
        }
    }

    logger.warn(
        `[AutoPurge] LIVE RUN executed ${executed}/${matches.length} action(s) in guild ${guildId}`
    );

    return {
        matched: matches.length,
        executed
    };
}

module.exports = {
    evaluateGuild,
    dryRunSummary,
    runAutoPurge
};