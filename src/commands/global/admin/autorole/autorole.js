const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const {
    getAutoRoles,
    addAutoRole,
    removeAutoRole,
    clearAutoRoles
} = require("../../../../modules/autorole/autoroleStore");

const {
    createSuccessEmbed,
    createInfoEmbed,
    createErrorEmbed
} = require("../../../../core/embedStyles");

module.exports = {
    scope: "global",
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription("Manage unlimited autoroles")

        .addSubcommand(sub =>
            sub.setName("add")
               .setDescription("Add a role to the autorole list")
               .addRoleOption(opt =>
                    opt.setName("role")
                       .setDescription("Role to assign automatically")
                       .setRequired(true)
               )
        )

        .addSubcommand(sub =>
            sub.setName("remove")
               .setDescription("Remove one autorole")
               .addRoleOption(opt =>
                    opt.setName("role")
                       .setDescription("Role to remove")
                       .setRequired(true)
               )
        )

        .addSubcommand(sub =>
            sub.setName("clear")
               .setDescription("Clear ALL autoroles")
        )

        .addSubcommand(sub =>
            sub.setName("show")
               .setDescription("Show all autoroles")
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

        // ADD
        if (sub === "add") {
            const role = interaction.options.getRole("role");
            addAutoRole(guildId, role.id);

            return interaction.reply({
                embeds: [createSuccessEmbed("Autorole Added", `<@&${role.id}> will now be auto-assigned.`)],
                ephemeral: true
            });
        }

        // REMOVE
        if (sub === "remove") {
            const role = interaction.options.getRole("role");
            removeAutoRole(guildId, role.id);

            return interaction.reply({
                embeds: [createSuccessEmbed("Autorole Removed", `<@&${role.id}> will no longer be auto-assigned.`)],
                ephemeral: true
            });
        }

        // CLEAR
        if (sub === "clear") {
            clearAutoRoles(guildId);

            return interaction.reply({
                embeds: [createSuccessEmbed("Autoroles Cleared", "All autoroles have been removed.")],
                ephemeral: true
            });
        }

        // SHOW
        if (sub === "show") {
            const roles = getAutoRoles(guildId);

            return interaction.reply({
                embeds: [
                    createInfoEmbed(
                        "Configured Autoroles",
                        roles.length
                            ? roles.map(id => `• <@&${id}>`).join("\n")
                            : "No autoroles configured."
                    )
                ],
                ephemeral: true
            });
        }
    }
};
