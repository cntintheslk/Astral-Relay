// ============================================================
// ASTRAL RELAY — GUILD CONFIG SERVICE
// Central authority for per-guild configuration & defaults.
// ============================================================

const db = require("./database");
const logger = require("../core/logger");

// ------------------------------------------------------------
// DEFAULTS
// ------------------------------------------------------------

const DEFAULTS = {
    approver_roles: [],
    registration_log_channel_id: null,
};

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

function safeJsonArray(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalise(row = {}) {
    return {
        approver_roles: safeJsonArray(row.approver_roles),
        registration_log_channel_id: row.registration_log_channel_id || null,
    };
}

// ------------------------------------------------------------
// PUBLIC API
// ------------------------------------------------------------

/**
 * Returns normalised guild settings with defaults applied.
 */
function getSettings(guildId) {
    if (!guildId) {
        logger.debug("Guild config requested without guildId; using defaults.");
        return { ...DEFAULTS };
    }

    const row = db
        .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
        .get(guildId);

    if (!row) {
        logger.debug("No guild settings found; using defaults.", { guildId });
        return { ...DEFAULTS };
    }

    return {
        ...DEFAULTS,
        ...normalise(row),
    };
}

module.exports = {
    getSettings,
};
