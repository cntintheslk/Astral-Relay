const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setAutoRole, clearAutoRole, getAutoRole } = require("../../modules/autorole/autoroleStore");
const { createSuccessEmbed, createInfoEmbed, createErrorEmbed } = require("../../core/embedStyles");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription("Configure autorole settings")

        .addSubcommand(sub =>
            sub.setName("set")
               .setDescription("Set the autorole for new members")
               .addRoleOption(opt => 
                    opt.setName("role")
                       .setDescription("Role to assign automatically")
                       .setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName("clear")
               .setDescription("Disable autorole")
        )

        .addSubcommand(sub =>
            sub.setName("show")
               .setDescription("Show current autorole configuration")
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                embeds: [createErrorEmbed("Insufficient Permissions", "You need Manage Roles to use this.")],
                ephemeral: true
            });
        }

        const guildId = interaction.guild.id;
        const sub = interaction.options.getSubcommand();

        // SET AUTOROLE
        if (sub === "set") {
            const role = interaction.options.getRole("role");
            setAutoRole(guildId, role.id);

            return interaction.reply({
                embeds: [createSuccessEmbed("Autorole Set", `New members will receive <@&${role.id}> automatically.`)],
                ephemeral: true
            });
        }

        // CLEAR AUTOROLE
        if (sub === "clear") {
            clearAutoRole(guildId);

            return interaction.reply({
                embeds: [createSuccessEmbed("Autorole Disabled", "New members will no longer receive an autorole.")],
                ephemeral: true
            });
        }

        // SHOW AUTOROLE
        if (sub === "show") {
            const roleId = getAutoRole(guildId);

            return interaction.reply({
                embeds: [
                    createInfoEmbed(
                        "Autorole Configuration",
                        roleId ? `Current autorole: <@&${roleId}>` : "Autorole is currently disabled."
                    )
                ],
                ephemeral: true
            });
        }
    }
};
