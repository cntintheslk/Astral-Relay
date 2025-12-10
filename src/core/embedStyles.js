// src/core/embedStyles.js
const { EmbedBuilder } = require("discord.js");

// Colors for log types
const LOG_COLORS = {
    INFO: 0x3498db,
    SUCCESS: 0x2ecc71,
    WARN: 0xf1c40f,
    ERROR: 0xe74c3c,
};

// Create a uniform log embed with bot avatar + timestamped footer
function createLogEmbed(client, type, title, description) {
    const botAvatar = client?.user?.displayAvatarURL() || null;

    return new EmbedBuilder()
        .setColor(LOG_COLORS[type] || LOG_COLORS.INFO)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(botAvatar) // BOT LOGO INCLUDED
        .setTimestamp()
        .setFooter({
            text: "Astral Relay — System Log",
            iconURL: botAvatar,  // BOT LOGO IN FOOTER
        });
}

module.exports = {
    createLogEmbed,
    LOG_COLORS,
};
