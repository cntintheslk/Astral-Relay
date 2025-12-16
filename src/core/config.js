// ============================================================
// ASTRAL RELAY — RUNTIME CONFIGURATION
// Centralised access to all environment-driven configuration.
// This file is the single source of truth for process.env usage.
// ============================================================

// ------------------------------------------------------------
// ENVIRONMENT RESOLUTION
// ------------------------------------------------------------
// ENVIRONMENT is authoritative (development | staging | production)
// NODE_ENV is treated as a fallback only.
const ENVIRONMENT =
    process.env.ENVIRONMENT ||
    process.env.NODE_ENV ||
    "production";

// ------------------------------------------------------------
// EXPORTED CONFIG
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
    ownerIds: process.env.OWNER_IDS
        ? process.env.OWNER_IDS.split(",").map(id => id.trim())
        : [],
};
