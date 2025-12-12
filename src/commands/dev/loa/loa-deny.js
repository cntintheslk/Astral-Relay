const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../../core/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-deny")
        .setDescription("Deny a pending LOA.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(opt =>
            opt.setName("user")
               .setDescription("User whose LOA to deny")
               .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("reason")
               .setDescription("Reason for denial")
               .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");

        const loa = db.prepare(`
            SELECT * FROM loas
            WHERE guild_id = ? AND user_id = ? AND status='pending'
        `).get(guildId, user.id);

        if (!loa) {
            return interaction.reply({ content: "No pending LOA found.", ephemeral: true });
        }

        const now = Math.floor(Date.now() / 1000);

        // Move to history
        db.prepare(`
            INSERT INTO loa_history (
                guild_id, user_id, reason, start_date, end_date,
                resolved_at, resolved_by, resolution, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            guildId, user.id, loa.reason, loa.start_date, loa.end_date,
            now, interaction.user.id, "denied", "denied"
        );

        db.prepare(`DELETE FROM loas WHERE id=?`).run(loa.id);

        interaction.client.emit("loaUpdate", guildId);

        await interaction.reply({ content: `Denied LOA for ${user}: **${reason}**`, ephemeral: true });
    }
};
