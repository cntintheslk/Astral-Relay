// src/core/embedStyles.js
const { EmbedBuilder } = require("discord.js");

// Consistent embed colors for internal logs
const LOG_COLORS = {
    INFO: 0x3498db,
    SUCCESS: 0x2ecc71,
    WARN: 0xf1c40f,
    ERROR: 0xe74c3c,
};

function createLogEmbed(type, title, description) {
    return new EmbedBuilder()
        .setColor(LOG_COLORS[type] || LOG_COLORS.INFO)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: "Astral Relay • Bot System Log" });
}

module.exports = {
    createLogEmbed,
    LOG_COLORS,
};
