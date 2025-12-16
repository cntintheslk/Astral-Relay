// ============================================================
// ASTRAL RELAY — EMBED STYLES
// Canonical, defensive embed construction.
// All embeds MUST flow through this file.
// ============================================================

const { EmbedBuilder } = require("discord.js");

// ------------------------------------------------------------
// SEVERITY → COLOUR MAPPING (CANONICAL)
// ------------------------------------------------------------

const SEVERITY_COLORS = {
    INFO: 0x3498db,
    SUCCESS: 0x2ecc71,
    WARN: 0xf1c40f,
    SECURITY: 0xe67e22,
    ERROR: 0xe74c3c,
    CRITICAL: 0x2c2f33,
};

// ------------------------------------------------------------
// BRANDING
// ------------------------------------------------------------

const BOT_NAME = "Astral Relay";
const BOT_LOGO =
    "https://cdn.discordapp.com/icons/1444904297358688320/a_d05db8a486d3c803566d67525914c901.gif?size=256";

// ------------------------------------------------------------
// INTERNAL SANITISERS (DISCORD-SAFE)
// ------------------------------------------------------------

function safeString(value, fallback = "") {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
}

function truncate(value, max) {
    return value.length > max ? value.slice(0, max - 3) + "..." : value;
}

// ------------------------------------------------------------
// BASE EMBED CONSTRUCTOR (DEFENSIVE)
// ------------------------------------------------------------

/**
 * Creates a canonical Astral Relay embed.
 * This function is fully defensive against invalid input.
 */
function createBaseEmbed({
    severity = "INFO",
    title,
    description,
    source,
    environment,
}) {
    const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.INFO;

    // -----------------------------
    // TITLE (REQUIRED BY DISCORD)
    // -----------------------------
    const safeTitle = truncate(
        safeString(title, BOT_NAME),
        256
    );

    // -----------------------------
    // DESCRIPTION (OPTIONAL)
    // -----------------------------
    const safeDescription = truncate(
        safeString(description, " "),
        4096
    );

    // -----------------------------
    // FOOTER
    // -----------------------------
    const footerParts = [];

    if (source) footerParts.push(source);
    if (environment) footerParts.push(environment.toUpperCase());

    const footerText = footerParts.length
        ? `${BOT_NAME} — ${footerParts.join(" | ")}`
        : `${BOT_NAME} — Command & Control`;

    // -----------------------------
    // BUILD EMBED
    // -----------------------------
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(safeTitle)
        .setAuthor({
            name: BOT_NAME,
            iconURL: BOT_LOGO,
        })
        .setThumbnail(BOT_LOGO)
        .setTimestamp()
        .setFooter({
            text: footerText,
            iconURL: BOT_LOGO,
        });

    // Description is optional — only set if meaningful
    if (safeDescription.trim().length > 0) {
        embed.setDescription(safeDescription);
    }

    return embed;
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
