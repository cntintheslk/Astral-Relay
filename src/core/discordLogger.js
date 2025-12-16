// ============================================================
// ASTRAL RELAY — DISCORD LOGGER SINK
// Converts log entries into Discord embeds.
// ============================================================

const { EmbedBuilder } = require("discord.js");
const LOG_LEVELS = require("./logLevel");

let logChannel = null;

// ------------------------------------------------------------
// LEVEL → COLOUR MAP
// ------------------------------------------------------------

const LEVEL_COLOURS = {
    [LOG_LEVELS.DEBUG]: 0x95a5a6,     // Grey
    [LOG_LEVELS.INFO]: 0x5865f2,      // Blurple
    [LOG_LEVELS.SUCCESS]: 0x2ecc71,   // Green
    [LOG_LEVELS.WARN]: 0xf1c40f,      // Yellow
    [LOG_LEVELS.SECURITY]: 0xe67e22,  // Orange
    [LOG_LEVELS.ERROR]: 0xe74c3c,     // Red
    [LOG_LEVELS.CRITICAL]: 0x8b0000,  // Dark Red
};

// ------------------------------------------------------------
// ATTACHMENT
// ------------------------------------------------------------

function setLogChannel(channel) {
    logChannel = channel;
}

// ------------------------------------------------------------
// SINK HANDLER
// ------------------------------------------------------------

function handleLog(entry) {
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(entry.level)
        .setDescription(entry.message)
        .setColor(LEVEL_COLOURS[entry.level] || 0x5865f2)
        .setTimestamp(new Date(entry.timestamp));

    if (entry.meta) {
        embed.addFields({
            name: "Context",
            value: `\`\`\`json\n${JSON.stringify(entry.meta, null, 2)}\n\`\`\``,
        });
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
    setLogChannel,
    handleLog,
};
