// ============================================================
// ASTRAL RELAY — EMBED STYLES
// Defines the canonical visual language for all Discord embeds.
// No other file should construct EmbedBuilder directly.
// ============================================================

const { EmbedBuilder } = require("discord.js");

// ------------------------------------------------------------
// SEVERITY → COLOUR MAPPING (CANONICAL)
// ------------------------------------------------------------
const SEVERITY_COLORS = {
    INFO: 0x3498db,       // Blue — informational telemetry
    SUCCESS: 0x2ecc71,    // Green — confirmed actions
    WARN: 0xf1c40f,       // Yellow — non-fatal issues
    SECURITY: 0xe67e22,   // Orange — guarded / sensitive actions
    ERROR: 0xe74c3c,      // Red — failures
    CRITICAL: 0x2c2f33,   // Dark — system integrity events
};

// ------------------------------------------------------------
// BRANDING
// ------------------------------------------------------------
const BOT_NAME = "Astral Relay";
const BOT_LOGO =
    "https://cdn.discordapp.com/icons/1444904297358688320/a_d05db8a486d3c803566d67525914c901.gif?size=256";

// ------------------------------------------------------------
// BASE EMBED CONSTRUCTOR
// ------------------------------------------------------------

/**
 * Creates a canonical Astral Relay embed.
 * All embeds — logs, replies, admin messages — flow through here.
 *
 * @param {Object} options
 * @param {string} options.severity   One of the defined severity levels
 * @param {string} options.title      Short, declarative title
 * @param {string} options.description Human-readable explanation
 * @param {string} [options.source]   Optional subsystem identifier
 * @param {string} [options.environment] DEV / PROD tag
 */
function createBaseEmbed({
    severity = "INFO",
    title,
    description,
    source,
    environment,
}) {
    const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.INFO;

    const footerParts = [];
    if (source) footerParts.push(source);
    if (environment) footerParts.push(environment.toUpperCase());

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setAuthor({
            name: BOT_NAME,
            iconURL: BOT_LOGO,
        })
        .setThumbnail(BOT_LOGO)
        .setTimestamp()
        .setFooter({
            text: footerParts.length
                ? `${BOT_NAME} — ${footerParts.join(" | ")}`
                : `${BOT_NAME} — Command & Control`,
            iconURL: BOT_LOGO,
        });
}

// ------------------------------------------------------------
// EXPORTED FACTORIES (INTENT-DRIVEN)
// ------------------------------------------------------------

module.exports = {
    SEVERITY_COLORS,

    createInfoEmbed: (opts) =>
        createBaseEmbed({ ...opts, severity: "INFO" }),

    createSuccessEmbed: (opts) =>
        createBaseEmbed({ ...opts, severity: "SUCCESS" }),

    createWarningEmbed: (opts) =>
        createBaseEmbed({ ...opts, severity: "WARN" }),

    createSecurityEmbed: (opts) =>
        createBaseEmbed({ ...opts, severity: "SECURITY" }),

    createErrorEmbed: (opts) =>
        createBaseEmbed({ ...opts, severity: "ERROR" }),

    createCriticalEmbed: (opts) =>
        createBaseEmbed({ ...opts, severity: "CRITICAL" }),
};
