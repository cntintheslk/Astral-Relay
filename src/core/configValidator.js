// ============================================================
// ASTRAL RELAY — CONFIGURATION VALIDATOR
// Performs runtime validation of environment configuration.
// This module must remain transport-agnostic.
// ============================================================

const logger = require("./logger");

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

/**
 * Validates a Discord snowflake ID.
 */
function isSnowflake(id) {
    return typeof id === "string" && /^\d{17,20}$/.test(id);
}

// ------------------------------------------------------------
// VALIDATION ENTRY POINT
// ------------------------------------------------------------

/**
 * Validates required and optional runtime configuration.
 * Fatal issues will terminate the process immediately.
 */
function validateConfig(config) {
    let hasFatalError = false;
    const warnings = [];

    // --------------------------------------------------------
    // CORE AUTHENTICATION
    // --------------------------------------------------------

    if (!config.token) {
        hasFatalError = true;
        warnings.push("BOT_TOKEN is missing.");
    }

    // --------------------------------------------------------
    // LOGGING / TELEMETRY
    // --------------------------------------------------------

    if (!config.logChannelId) {
        hasFatalError = true;
        warnings.push("LOG_CHANNEL_ID is missing.");
    } else if (!isSnowflake(config.logChannelId)) {
        hasFatalError = true;
        warnings.push(`LOG_CHANNEL_ID is invalid: ${config.logChannelId}`);
    }

    // --------------------------------------------------------
    // DEVELOPMENT ENVIRONMENT
    // --------------------------------------------------------

    if (!config.devGuildId) {
        warnings.push(
            "DEV_GUILD_ID is not set — development command deployment will be disabled."
        );
    } else if (!isSnowflake(config.devGuildId)) {
        warnings.push(`DEV_GUILD_ID is invalid: ${config.devGuildId}`);
    }

    // --------------------------------------------------------
    // ACCESS CONTROL
    // --------------------------------------------------------

    if (!config.hasOwners) {
        warnings.push(
            "OWNER_IDS is empty — protected commands will be inaccessible."
        );
    } else {
        for (const id of config.ownerIds) {
            if (!isSnowflake(id)) {
                warnings.push(`OWNER_IDS is invalid: ${id}`);
            }
        }
    }


    // --------------------------------------------------------
    // REPORTING
    // --------------------------------------------------------

    if (warnings.length > 0) {
        const message = [
            "Configuration issues detected:",
            ...warnings.map(w => `• ${w}`),
        ].join("\n");

        logger.warn(message);
    }

    if (hasFatalError) {
        logger.critical(
            "Fatal configuration error detected — system initialisation aborted."
        );
        process.exit(1);
    }
}

module.exports = validateConfig;
