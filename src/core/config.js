// ============================================================
// ASTRAL RELAY — RUNTIME CONFIGURATION
// Centralised access to all environment-driven configuration.
// Single source of truth for process.env usage.
// ============================================================

// ------------------------------------------------------------
// ENVIRONMENT RESOLUTION
// ------------------------------------------------------------

const ENVIRONMENT =
    process.env.ENVIRONMENT ||
    process.env.NODE_ENV ||
    "production";

// ------------------------------------------------------------
// ACCESS CONTROL (PRE-COMPUTED)
// ------------------------------------------------------------

const ownerIds = process.env.OWNER_IDS
    ? process.env.OWNER_IDS
        .split(",")
        .map(id => id.trim())
        .filter(Boolean)
    : [];

// ------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------

module.exports = {
    // --------------------------------------------------------
    // CORE
    // --------------------------------------------------------
    token: process.env.BOT_TOKEN,
    environment: ENVIRONMENT,

    // --------------------------------------------------------
    // LOGGING & TELEMETRY
    // --------------------------------------------------------
    logLevel: process.env.LOG_LEVEL || "INFO",
    logChannelId: process.env.LOG_CHANNEL_ID,

    // --------------------------------------------------------
    // DEVELOPMENT / TESTING
    // --------------------------------------------------------
    devGuildId: process.env.DEV_GUILD_ID,
    devHealthChannelId: process.env.DEV_HEALTH_CHANNEL_ID,

    // --------------------------------------------------------
    // ACCESS CONTROL
    // --------------------------------------------------------
    ownerIds,
    hasOwners: ownerIds.length > 0,
};
