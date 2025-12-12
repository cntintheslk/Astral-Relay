const { SlashCommandBuilder } = require("discord.js");
const db = require("../../../core/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-cancel")
        .setDescription("Cancel your current LOA."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const loa = db.prepare(`
            SELECT * FROM loas WHERE guild_id = ? AND user_id = ?
        `).get(guildId, userId);

        if (!loa) {
            return interaction.reply({ content: "You have no active LOA.", ephemeral: true });
        }

        const now = Math.floor(Date.now() / 1000);

        // Move to history
        db.prepare(`
            INSERT INTO loa_history (
                guild_id, user_id, reason, start_date, end_date, resolved_at, resolved_by, resolution, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            guildId, userId, loa.reason, loa.start_date, loa.end_date,
            now, userId, "cancelled", "cancelled"
        );

        db.prepare(`DELETE FROM loas WHERE id = ?`).run(loa.id);

        interaction.client.emit("loaUpdate", guildId);

        await interaction.reply({ content: "Your LOA has been cancelled.", ephemeral: true });
    }
};
