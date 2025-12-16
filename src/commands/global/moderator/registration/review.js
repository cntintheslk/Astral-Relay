const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const db = require("../../../core/database");
const { getSettings } = require("../../../../modules/registration/settingsStore");
const { createInfoEmbed } = require("../../../../core/embedStyles");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("registration-review")
        .setDescription("View all pending registration requests (approvers only)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        // Fetch pending registrations
        const pending = db.prepare(`
            SELECT * FROM registrations
            WHERE guild_id = ? AND status = 'pending'
        `).all(guildId);

        if (pending.length === 0) {
            return interaction.reply({
                content: "🎉 No pending registrations.",
                flags: 64
            });
        }

        for (const reg of pending) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${reg.id}`)
                    .setLabel("Approve")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`deny_${reg.id}`)
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger)
            );

            const embed = createInfoEmbed(
                `Pending Registration`,
                `**User:** <@${reg.user_id}>\n` +
                `**IGN:** \`${reg.ign}\`\n` +
                `**Rank:** **${reg.rank}**`
            );

            await interaction.channel.send({ embeds: [embed], components: [row] });
        }

        return interaction.reply({
            content: `📥 Posted **${pending.length}** pending registrations.`,
            flags: 64
        });
    }
};
