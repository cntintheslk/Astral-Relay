// ============================================================
// ASTRAL RELAY — LOA BOARD RENDERER
// Responsible ONLY for Discord embed presentation.
// ============================================================

const { EmbedBuilder } = require("discord.js");

const ASTRAL_PURPLE = 0x8c52ff;
const ASTRAL_DIVIDER = "━━━━━━━━━━━━━━━━━━━━";

module.exports = function renderBoard({ loas = [], updatedAt }) {
    const embed = new EmbedBuilder()
        .setColor(ASTRAL_PURPLE)
        .setTitle("✦ Astral Relay — LOA Board ✦")
        .setDescription("**Active Leave of Absence roster**\n" + ASTRAL_DIVIDER)
        .setFooter({ text: "Last Updated" })
        .setTimestamp(updatedAt || Date.now());

    if (!loas.length) {
        embed.addFields({
            name: "No Active LOAs",
            value: "*There are currently no personnel on leave.*",
        });
        return embed;
    }

    let description = "";

    for (const loa of loas) {
        const name = loa.ign
            ? `**${loa.ign}** (${loa.rank})`
            : `<@${loa.userId}>`;

        description +=
            `### ${name}\n` +
            `> **Reason:** ${loa.reason}\n` +
            `> **Duration:** <t:${loa.startDate}:d> → <t:${loa.endDate}:d>\n` +
            `> **Ends:** <t:${loa.endDate}:R>\n` +
            `${ASTRAL_DIVIDER}\n`;
    }

    embed.addFields({
        name: "Active LOAs",
        value: description.slice(0, 1024),
    });

    return embed;
};
