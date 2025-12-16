// ============================================================
// ASTRAL RELAY — MODULE REGISTRY SERVICE
// Central authority for module availability and lifecycle.
// ============================================================

const logger = require("../core/logger");
const db = require("./database");

// ------------------------------------------------------------
// MODULE AVAILABILITY (PER-GUILD)
// ------------------------------------------------------------

/**
 * Returns true if a module is enabled for the given guild.
 * Default behaviour: ENABLED unless explicitly disabled.
 */
function isEnabled(guildId, moduleName) {
    if (!guildId || !moduleName) return true;

    const row = db.prepare(`
        SELECT enabled
        FROM guild_modules
        WHERE guild_id = ? AND module = ?
    `).get(guildId, moduleName);

    return row?.enabled !== 0;
}

/**
 * Enforces module availability and logs blocked access.
 * Intended for use by events and services.
 */
function requireEnabled(guildId, moduleName, context = "UNKNOWN") {
    const enabled = isEnabled(guildId, moduleName);

    if (!enabled) {
        logger.info("Module access blocked (disabled).", {
            module: moduleName,
            guildId,
            context,
        });
    }

    return enabled;
}

// ------------------------------------------------------------
// MODULE LIFECYCLE (PLACEHOLDER / FUTURE)
// ------------------------------------------------------------
// This is where future logic belongs:
// - loadModule()
// - unloadModule()
// - reloadModule()
// - dependency checks
// - startup ordering

module.exports = {
    isEnabled,
    requireEnabled,
};
