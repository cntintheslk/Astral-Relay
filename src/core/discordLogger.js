// ============================================================
// ASTRAL RELAY — DISCORD LOGGER
// Pretty, branded, human-readable logging sink.
// ============================================================

const { EmbedBuilder } = require("discord.js");
const LOG_LEVELS = require("./logLevel");
const BRAND = require("./logBranding");

let logChannel = null;

// ------------------------------------------------------------
// LEVEL STYLING
// ------------------------------------------------------------

const LEVEL_STYLE = {
    [LOG_LEVELS.DEBUG]:   { icon: "🧪", color: 0x95a5a6, label: "DEBUG" },
    [LOG_LEVELS.INFO]:    { icon: "ℹ️", color: 0x5865f2, label: "INFO" },
    [LOG_LEVELS.SUCCESS]: { icon: "✅", color: 0x2ecc71, label: "SUCCESS" },
    [LOG_LEVELS.WARN]:    { icon: "⚠️", color: 0xf1c40f, label: "WARNING" },
    [LOG_LEVELS.SECURITY]:{ icon: "🔒", color: 0xe67e22, label: "SECURITY" },
    [LOG_LEVELS.ERROR]:   { icon: "❌", color: 0xe74c3c, label: "ERROR" },
    [LOG_LEVELS.CRITICAL]:{ icon: "🚨", color: 0x8b0000, label: "CRITICAL" },
};

// ------------------------------------------------------------
// CHANNEL ATTACHMENT
// ------------------------------------------------------------

function setLogChannel(channel) {
    logChannel = channel;
}

// ------------------------------------------------------------
// META FORMATTER (NO JSON)
// ------------------------------------------------------------

function formatMeta(meta) {
    if (!meta || typeof meta !== "object") return null;

    const lines = [];

    for (const [key, value] of Object.entries(meta)) {
        if (value === undefined || value === null) continue;

        const label =
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1");

        lines.push(`• **${label}:** ${String(value)}`);
    }

    return lines.length ? lines.join("\n") : null;
}

// ------------------------------------------------------------
// LOG HANDLER
// ------------------------------------------------------------

function handleLog(entry) {
    if (!logChannel) return;

    const style = LEVEL_STYLE[entry.level] || LEVEL_STYLE[LOG_LEVELS.INFO];

    const embed = new EmbedBuilder()
        .setAuthor({
            name: BRAND.NAME,
            iconURL: BRAND.LOGO_URL,
        })
        .setThumbnail(BRAND.LOGO_URL)
        .setTitle(`${style.icon} ${style.label}`)
        .setDescription(entry.message)
        .setColor(style.color)
        .setTimestamp(new Date(entry.timestamp))
        .setFooter({ text: BRAND.FOOTER });

    const metaText = formatMeta(entry.meta);
    if (metaText) {
        embed.addFields({
            name: "Details",
            value: metaText.slice(0, 1024), // embed-safe
        });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
    setLogChannel,
    handleLog,
};
