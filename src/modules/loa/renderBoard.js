const db = require("../../core/database");
const { EmbedBuilder } = require("discord.js");

module.exports = function renderLoaBoard(guildId) {
    const loas = db.prepare(`
        SELECT * FROM loas
        WHERE guild_id = ? AND status IN ('approved', 'active')
        ORDER BY end_date ASC
    `).all(guildId);

    const embed = new EmbedBuilder()
        .setColor(0x8c52ff) // Astral Purple Accent
        .setTitle("✦ Astral Relay — LOA Board ✦")
        .setDescription("**Active Leaves of Absence**\nA live overview of all approved LOAs within this guild.\n\u200b")
        .setThumbnail("https://i.imgur.com/nSgk7zF.png") // (Optional: Replace with your Astral icon)
        .setTimestamp()
        .setFooter({
            text: "Astral Relay — Operational Status Module",
            iconURL: "https://i.imgur.com/nSgk7zF.png" // (Optional)
        });

    if (loas.length === 0) {
        return embed.setDescription(
            "### ✧ No Active LOAs\n" +
            "*All personnel are currently active and accounted for.*"
        );
    }

    let desc = "";

    for (const loa of loas) {
        const start = `<t:${loa.start_date}:d>`;
        const end = `<t:${loa.end_date}:d>`;
        const userTag = `<@${loa.user_id}>`;
        
        desc +=
`> ✦ **${userTag}**
> **Reason:** ${loa.reason}
> **Duration:** ${start} → ${end}
> **Status:** \`${loa.status.toUpperCase()}\`
\u200b
`;
    }

    embed.addFields({
        name: "📋 Active LOAs",
        value: desc
    });

    return embed;
};
