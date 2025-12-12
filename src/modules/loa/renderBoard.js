const db = require("../../core/database");
const getReg = require("./getRegistrationInfo");
const { EmbedBuilder } = require("discord.js");

module.exports = function renderLoaBoard(guildId) {
    const loas = db.prepare(`
        SELECT * FROM loas
        WHERE guild_id = ? AND status IN ('approved','active')
        ORDER BY end_date ASC
    `).all(guildId);

    const embed = new EmbedBuilder()
        .setTitle("✦ Astral Relay — LOA Board ✦")
        .setColor(0x8c52ff)
        .setDescription("**Active Leaves of Absence**\n\u200b")
        .setTimestamp()
        .setFooter({ text: "Astral Relay • Leave of Absence System" });

    if (loas.length === 0) {
        embed.setDescription("### ✧ No Active LOAs\n*All personnel are present.*");
        return embed;
    }

    let desc = "";

    for (const loa of loas) {
        const reg = getReg(guildId, loa.user_id);

        const name = reg.ign
            ? `**${reg.ign}** (${reg.rank})`
            : `<@${loa.user_id}>`;

        const start = `<t:${loa.start_date}:d>`;
        const end = `<t:${loa.end_date}:d>`;

        desc +=
`> ✦ ${name}
> **Reason:** ${loa.reason}
> **Duration:** ${start} → ${end}
> **Status:** \`${loa.status.toUpperCase()}\`
\u200b
`;
    }

    embed.addFields({ name: "📘 Active LOAs", value: desc });

    return embed;
};
