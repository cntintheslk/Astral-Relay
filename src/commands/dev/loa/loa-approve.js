const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../../core/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-approve")
        .setDescription("Approve a pending LOA.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(opt =>
            opt.setName("user")
               .setDescription("User whose LOA to approve")
               .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const user = interaction.options.getUser("user");

        const loa = db.prepare(`
            SELECT * FROM loas
            WHERE guild_id = ? AND user_id = ? AND status='pending'
        `).get(guildId, user.id);

        if (!loa) {
            return interaction.reply({ content: "No pending LOA found.", ephemeral: true });
        }

        const now = Math.floor(Date.now() / 1000);

        db.prepare(`
            UPDATE loas SET status='approved', approved_at=?, approved_by=?, updated_at=?
            WHERE id=?
        `).run(now, interaction.user.id, now, loa.id);

        interaction.client.emit("loaUpdate", guildId);

        await interaction.reply({ content: `Approved LOA for ${user}.`, ephemeral: true });
    }
};
