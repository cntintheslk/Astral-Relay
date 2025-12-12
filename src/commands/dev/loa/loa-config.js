const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../../core/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loa-config")
        .setDescription("Configure LOA settings for this guild.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName("approval")
               .setDescription("Enable or disable LOA approval requirement.")
               .addStringOption(opt =>
                    opt.setName("mode")
                       .setDescription("Approval mode")
                       .setRequired(true)
                       .addChoices(
                           { name: "Approval Required", value: "on" },
                           { name: "Auto-Approve", value: "off" }
                       )
               )
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const mode = interaction.options.getString("mode");
        const now = Math.floor(Date.now() / 1000);

        const requireApproval = mode === "on" ? 1 : 0;

        db.prepare(`
            INSERT INTO loa_settings (guild_id, require_approval, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                require_approval = excluded.require_approval,
                updated_at = excluded.updated_at
        `).run(guildId, requireApproval, now);

        await interaction.reply({
            content: `LOA approval mode set to **${mode === "on" ? "Approval Required" : "Auto-Approve"}**.`,
            ephemeral: true
        });
    }
};
