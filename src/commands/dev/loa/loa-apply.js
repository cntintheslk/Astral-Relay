const { SlashCommandBuilder } = require("discord.js");
const db = require("../../../core/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-apply")
        .setDescription("Submit a Leave of Absence request.")
        .addStringOption(opt =>
            opt.setName("reason")
               .setDescription("Reason for LOA")
               .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("days")
               .setDescription("Number of days away")
               .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const reason = interaction.options.getString("reason");
        const days = interaction.options.getInteger("days");

        const now = Math.floor(Date.now() / 1000);
        const end = now + (days * 86400);

        const settings = db.prepare(`
            SELECT require_approval FROM loa_settings WHERE guild_id = ?
        `).get(guildId) || { require_approval: 0 };

        const requiresApproval = settings.require_approval === 1;
        const status = requiresApproval ? "pending" : "approved";

        db.prepare(`
            INSERT INTO loas (
                guild_id, user_id, reason, start_date, end_date,
                status, submitted_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            guildId, userId, reason, now, end, status, now, now
        );

        if (!requiresApproval) {
            // Auto-approval path
            db.prepare(`
                UPDATE loas SET approved_at = ?, approved_by = ? WHERE user_id = ? AND guild_id = ? AND status='approved'
            `).run(now, "system", userId, guildId);

            interaction.client.emit("loaUpdate", guildId);
        }

        await interaction.reply({
            content: requiresApproval
                ? "Your LOA request has been submitted and is pending approval."
                : "Your LOA has been approved and recorded.",
            ephemeral: true
        });
    }
};
