// src/core/embedStyles.js
const { EmbedBuilder } = require("discord.js");

// Standard colours
const LOG_COLORS = {
    INFO: 0x3498db,
    SUCCESS: 0x2ecc71,
    WARN: 0xf1c40f,
    ERROR: 0xe74c3c,
};

// Bot logo used everywhere
const BOT_LOGO =
    "https://cdn.discordapp.com/icons/1444904297358688320/a_d05db8a486d3c803566d67525914c901.gif?size=256";

/* ============================================================
   SYSTEM LOG EMBEDS (Logged to Discord logChannel)
   ============================================================ */

function createLogEmbed(client, type, title, description) {
    const botAvatar = client?.user?.displayAvatarURL() || BOT_LOGO;

    return new EmbedBuilder()
        .setColor(LOG_COLORS[type] || LOG_COLORS.INFO)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(botAvatar)               // Bot logo thumbnail
        .setTimestamp()
        .setFooter({
            text: "Astral Relay — System Log", // System log footer
            iconURL: botAvatar,
        });
}

/* ============================================================
   USER-FACING EMBEDS (Slash command responses)
   ============================================================ */

function baseReplyEmbed(color) {
    return new EmbedBuilder()
        .setColor(color)
        .setTimestamp()
        .setThumbnail(BOT_LOGO)               // Consistent bot logo
        .setFooter({
            text: "Astral Relay - System Log",             // General bot footer
            iconURL: BOT_LOGO,
        });
}

function createSuccessEmbed(title, description) {
    return baseReplyEmbed(LOG_COLORS.SUCCESS)
        .setTitle(title)
        .setDescription(description);
}

function createInfoEmbed({ title, description }) {
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(title ?? "Info");

    // ✅ HARD GUARD
    if (typeof description !== "string" || description.trim().length === 0) {
        embed.setDescription("*No data available.*");
    } else {
        embed.setDescription(description);
    }

    return embed;
}


function createWarningEmbed(title, description) {
    return baseReplyEmbed(LOG_COLORS.WARN)
        .setTitle(title)
        .setDescription(description);
}

function createErrorEmbed(title, description) {
    return baseReplyEmbed(LOG_COLORS.ERROR)
        .setTitle(title)
        .setDescription(description);
}

module.exports = {
    LOG_COLORS,
    createLogEmbed,
    createSuccessEmbed,
    createInfoEmbed,
    createWarningEmbed,
    createErrorEmbed,
};
