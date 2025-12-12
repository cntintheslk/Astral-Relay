const { EmbedBuilder } = require("discord.js");
const db = require("../../core/database");
const getRegistrationInfo = require("./getRegistrationInfo");

module.exports = function renderBoard(guildId) {
    const loas = db
        .prepare(
            "SELECT * FROM loas WHERE guild_id = ? AND status = 'active' ORDER BY end_date ASC"
        )
        .all(guildId);

    // Astral Relay theme colours
    const ASTRAL_PURPLE = 0x8c52ff;
    const ASTRAL_DIVIDER = "━━━━━━━━━━━━━━━━━━━━";

    const embed = new EmbedBuilder()
        .setColor(ASTRAL_PURPLE)
        .setTitle("✦ Astral Relay — LOA Board ✦")
        .setDescription("**Active Leave of Absence roster**\n" + ASTRAL_DIVIDER)
        .setFooter({ text: "Last Updated" })
        .setTimestamp();

    if (loas.length === 0) {
        embed.addFields({
            name: "No Active LOAs",
            value: "*There are currently no personnel on leave.*"
        });

        return embed;
    }

    let description = "";

    for (const loa of loas) {
        const reg = getRegistrationInfo(guildId, loa.user_id);

        const name = reg?.ign
            ? `**${reg.ign}** (${reg.rank})`
            : `<@${loa.user_id}>`;

        description +=
            `### ${name}\n` +
            `> **Reason:** ${loa.reason}\n` +
            `> **Duration:** <t:${loa.start_date}:d> → <t:${loa.end_date}:d>\n` +
            `> **Ends:** <t:${loa.end_date}:R>\n` +
            `${ASTRAL_DIVIDER}\n`;
    }

    embed.addFields({
        name: "Active LOAs",
        value: description.slice(0, 1024) // safe limit
    });

    return embed;
};
