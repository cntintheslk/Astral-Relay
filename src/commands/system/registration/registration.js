// src/commands/registration/registration.js

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
} = require("discord.js");

const config = require("../../core/config");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");
const {
    createInfoEmbed,
    createSuccessEmbed,
    createErrorEmbed,
} = require("../../core/embedStyles");

const {
    getRegistrationConfig,
    setRegistrationRoles,
    setApprovalRequirement,
    addApproverRole,
    removeApproverRole,
} = require("../../modules/registration/settingsStore");

function isGuildAdminOrOwner(interaction) {
    if (!interaction.inGuild()) return false;

    // Render owner IDs from config
    if (config.ownerIds && config.ownerIds.includes(interaction.user.id)) {
        return true;
    }

    const member = interaction.member;
    if (!member || !member.permissions) return false;

    return member.permissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("registration")
        .setDescription("Configure the R1–R5 registration system (admins only)")
        // ---- config roles ----
        .addSubcommand((sub) =>
            sub
                .setName("config-roles")
                .setDescription("Set or update the R1–R5 rank roles")
                .addRoleOption((opt) =>
                    opt.setName("r1_role")
                        .setDescription("Role for R1")
                        .setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r2_role")
                        .setDescription("Role for R2")
                        .setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r3_role")
                        .setDescription("Role for R3")
                        .setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r4_role")
                        .setDescription("Role for R4")
                        .setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r5_role")
                        .setDescription("Role for R5")
                        .setRequired(false)
                )
        )
        // ---- config approval requirement ----
        .addSubcommand((sub) =>
            sub
                .setName("config-approval")
                .setDescription("Set whether a rank requires approval")
                .addStringOption((opt) =>
                    opt
                        .setName("rank")
                        .setDescription("Rank to configure")
                        .setRequired(true)
                        .addChoices(
                            { name: "R1", value: "R1" },
                            { name: "R2", value: "R2" },
                            { name: "R3", value: "R3" },
                            { name: "R4", value: "R4" },
                            { name: "R5", value: "R5" },
                        )
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("required")
                        .setDescription("Does this rank require approval?")
                        .setRequired(true)
                )
        )
        // ---- config approver add ----
        .addSubcommand((sub) =>
            sub
                .setName("config-approver-add")
                .setDescription("Add a role that can approve registrations")
                .addRoleOption((opt) =>
                    opt
                        .setName("role")
                        .setDescription("Role that can approve registrations")
                        .setRequired(true)
                )
        )
        // ---- config approver remove ----
        .addSubcommand((sub) =>
            sub
                .setName("config-approver-remove")
                .setDescription("Remove a role's approval permission")
                .addRoleOption((opt) =>
                    opt
                        .setName("role")
                        .setDescription("Role to remove from approvers")
                        .setRequired(true)
                )
        )
        // ---- show config ----
        .addSubcommand((sub) =>
            sub
                .setName("config-show")
                .setDescription("Show the current registration configuration")
        ),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                embeds: [
                    createErrorEmbed(
                        "Guild Only",
                        "Registration configuration can only be used inside a server."
                    ),
                ],
                flags: 64,
            });
        }

        if (!isGuildAdminOrOwner(interaction)) {
            return interaction.reply({
                embeds: [
                    createErrorEmbed(
                        "Insufficient Permissions",
                        "You must be a server administrator (or bot owner) to configure registration."
                    ),
                ],
                flags: 64,
            });
        }

        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();

        // --------------------------------
        // /registration config-roles
        // --------------------------------
        if (sub === "config-roles") {
            const r1 = interaction.options.getRole("r1_role");
            const r2 = interaction.options.getRole("r2_role");
            const r3 = interaction.options.getRole("r3_role");
            const r4 = interaction.options.getRole("r4_role");
            const r5 = interaction.options.getRole("r5_role");

            const patch = {};
            if (r1) patch.R1 = r1.id;
            if (r2) patch.R2 = r2.id;
            if (r3) patch.R3 = r3.id;
            if (r4) patch.R4 = r4.id;
            if (r5) patch.R5 = r5.id;

            if (Object.keys(patch).length === 0) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "No Changes",
                            "You didn't provide any roles to update."
                        ),
                    ],
                    flags: 64,
                });
            }

            const updated = setRegistrationRoles(guildId, patch);

            logger.info(
                `[registration] Updated rank roles in guild ${guildId}: ${JSON.stringify(
                    patch
                )}`
            );
            log(
                "SUCCESS",
                "Registration Roles Updated",
                `Guild: \`${guildId}\`\nUpdated roles:\n${Object.entries(patch)
                    .map(([rank, id]) => `• **${rank}** → <@&${id}> (\`${id}\`)`)
                    .join("\n")}`
            );

            const replyEmbed = createSuccessEmbed(
                "Registration Roles Updated",
                "The following ranks have been updated:\n" +
                Object.entries(patch)
                    .map(([rank, id]) => `• **${rank}** → <@&${id}>`)
                    .join("\n")
            );

            return interaction.reply({
                embeds: [replyEmbed],
                flags: 64,
            });
        }

        // --------------------------------
        // /registration config-approval
        // --------------------------------
        if (sub === "config-approval") {
            const rank = interaction.options.getString("rank");
            const required = interaction.options.getBoolean("required");

            const updated = setApprovalRequirement(guildId, rank, required);

            logger.info(
                `[registration] Updated approval requirement for ${rank} in guild ${guildId} -> ${required}`
            );
            log(
                "SUCCESS",
                "Registration Approval Updated",
                `Guild: \`${guildId}\`\nRank: **${rank}**\nRequires approval: **${required ? "Yes" : "No"}**`
            );

            const replyEmbed = createSuccessEmbed(
                "Approval Requirement Updated",
                `Rank **${rank}** now **${required ? "requires" : "does not require"}** approval.`
            );

            return interaction.reply({
                embeds: [replyEmbed],
                flags: 64,
            });
        }

        // --------------------------------
        // /registration config-approver-add
        // --------------------------------
        if (sub === "config-approver-add") {
            const role = interaction.options.getRole("role");
            const updated = addApproverRole(guildId, role.id);

            logger.info(
                `[registration] Added approver role ${role.id} in guild ${guildId}`
            );
            log(
                "SUCCESS",
                "Approver Role Added",
                `Guild: \`${guildId}\`\nRole <@&${role.id}> added as registration approver.`
            );

            const replyEmbed = createSuccessEmbed(
                "Approver Role Added",
                `<@&${role.id}> can now approve registration requests.`
            );

            return interaction.reply({
                embeds: [replyEmbed],
                flags: 64,
            });
        }

        // --------------------------------
        // /registration config-approver-remove
        // --------------------------------
        if (sub === "config-approver-remove") {
            const role = interaction.options.getRole("role");
            const updated = removeApproverRole(guildId, role.id);

            logger.info(
                `[registration] Removed approver role ${role.id} in guild ${guildId}`
            );
            log(
                "WARN",
                "Approver Role Removed",
                `Guild: \`${guildId}\`\nRole <@&${role.id}> removed from registration approvers.`
            );

            const replyEmbed = createSuccessEmbed(
                "Approver Role Removed",
                `<@&${role.id}> can no longer approve registration requests.`
            );

            return interaction.reply({
                embeds: [replyEmbed],
                flags: 64,
            });
        }

        // --------------------------------
        // /registration config-show
        // --------------------------------
        if (sub === "config-show") {
            const reg = getRegistrationConfig(guildId);

            const roleName = (rankKey) => {
                const id = reg.roles[rankKey];
                return id ? `<@&${id}> (\`${id}\`)` : "*Not set*";
            };

            const approvals = Object.entries(reg.approvalRequired)
                .map(
                    ([rank, needed]) =>
                        `• **${rank}** → ${needed ? "✅ Requires approval" : "⚪ Auto-approve"}`
                )
                .join("\n");

            const approvers =
                reg.approverRoleIds.length > 0
                    ? reg.approverRoleIds
                        .map((id) => `• <@&${id}> (\`${id}\`)`)
                        .join("\n")
                    : "*No approver roles configured.*";

            const embed = createInfoEmbed(
                "Registration Configuration",
                "Here is the current per-guild registration configuration:"
            ).addFields(
                {
                    name: "Rank Roles",
                    value:
                        `• **R1** → ${roleName("R1")}\n` +
                        `• **R2** → ${roleName("R2")}\n` +
                        `• **R3** → ${roleName("R3")}\n` +
                        `• **R4** → ${roleName("R4")}\n` +
                        `• **R5** → ${roleName("R5")}`,
                    inline: false,
                },
                {
                    name: "Approval Requirements",
                    value: approvals,
                    inline: false,
                },
                {
                    name: "Approver Roles",
                    value: approvers,
                    inline: false,
                }
            );

            return interaction.reply({
                embeds: [embed],
                flags: 64,
            });
        }

        // Fallback – shouldn’t hit
        return interaction.reply({
            embeds: [
                createErrorEmbed(
                    "Unknown Subcommand",
                    "This subcommand is not recognized."
                ),
            ],
            flags: 64,
        });
    },
};
