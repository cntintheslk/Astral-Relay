const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../../core/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-view")
        .setDescription("View all active LOAs."),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const loas = db.prepare(`
            SELECT * FROM loas
            WHERE guild_id = ? AND status IN ('approved', 'active')
            ORDER BY end_date ASC
        `).all(guildId);

        const embed = new EmbedBuilder()
            .setTitle("📋 Active LOAs")
            .setColor(0x00bfff);

        if (loas.length === 0) {
            embed.setDescription("*There are no active LOAs.*");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let desc = "";

        for (const loa of loas) {
            desc += `<@${loa.user_id}> — **${loa.reason}**\n`;
            desc += `<t:${loa.start_date}:d> → <t:${loa.end_date}:d>\n\n`;
        }

        embed.setDescription(desc);
        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
