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

// Correct import mapping
const {
    getSettings: getRegistrationConfig,
    setRegistrationRoles,
    setApprovalConfig,
    setApproverRoles,
} = require("../../modules/registration/settingsStore");

function isGuildAdminOrOwner(interaction) {
    if (!interaction.inGuild()) return false;

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
                    opt.setName("r1_role").setDescription("Role for R1").setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r2_role").setDescription("Role for R2").setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r3_role").setDescription("Role for R3").setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r4_role").setDescription("Role for R4").setRequired(false)
                )
                .addRoleOption((opt) =>
                    opt.setName("r5_role").setDescription("Role for R5").setRequired(false)
                )
        )

        // ---- config approval ----
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

        // ---- approver add ----
        .addSubcommand((sub) =>
            sub
                .setName("config-approver-add")
                .setDescription("Add a role that can approve registrations")
                .addRoleOption((opt) =>
                    opt.setName("role").setDescription("Role to allow approvals").setRequired(true)
                )
        )

        // ---- approver remove ----
        .addSubcommand((sub) =>
            sub
                .setName("config-approver-remove")
                .setDescription("Remove a role's approval permissions")
                .addRoleOption((opt) =>
                    opt.setName("role").setDescription("Role to remove from approvers").setRequired(true)
                )
        )

        // ---- show config ----
        .addSubcommand((sub) =>
            sub.setName("config-show").setDescription("View current registration configuration")
        ),


    async execute(interaction) {

        if (!interaction.inGuild()) {
            return interaction.reply({
                embeds: [createErrorEmbed("Guild Only", "This command must be run inside a server.")],
                flags: 64,
            });
        }

        if (!isGuildAdminOrOwner(interaction)) {
            return interaction.reply({
                embeds: [createErrorEmbed("Insufficient Permissions", "You must be an admin to configure registration.")],
                flags: 64,
            });
        }

        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();

        //────────────────────────────────────────
        //  /registration config-roles
        //────────────────────────────────────────

        if (sub === "config-roles") {
            const patch = {};

            const r1 = interaction.options.getRole("r1_role");
            const r2 = interaction.options.getRole("r2_role");
            const r3 = interaction.options.getRole("r3_role");
            const r4 = interaction.options.getRole("r4_role");
            const r5 = interaction.options.getRole("r5_role");

            if (r1) patch.r1 = r1.id;
            if (r2) patch.r2 = r2.id;
            if (r3) patch.r3 = r3.id;
            if (r4) patch.r4 = r4.id;
            if (r5) patch.r5 = r5.id;

            if (Object.keys(patch).length === 0) {
                return interaction.reply({
                    embeds: [createErrorEmbed("No Changes", "You did not provide any new roles.")],
                    flags: 64,
                });
            }

            setRegistrationRoles(guildId, patch);

            log(
                "SUCCESS",
                "Registration Roles Updated",
                Object.entries(patch)
                    .map(([k, id]) => `• **${k.toUpperCase()}** → <@&${id}>`)
                    .join("\n")
            );

            return interaction.reply({
                embeds: [
                    createSuccessEmbed(
                        "Roles Updated",
                        Object.entries(patch)
                            .map(([k, id]) => `• **${k.toUpperCase()}** → <@&${id}>`)
                            .join("\n")
                    )
                ],
                flags: 64,
            });
        }

        //────────────────────────────────────────
        //  /registration config-approval
        //────────────────────────────────────────

        if (sub === "config-approval") {
            const rank = interaction.options.getString("rank");
            const required = interaction.options.getBoolean("required");

            const configObj = {};
            configObj[rank.toLowerCase()] = required;

            setApprovalConfig(guildId, {
                r4: rank === "R4" ? required : undefined,
                r5: rank === "R5" ? required : undefined,
            });

            log("SUCCESS", "Approval Updated", `Rank ${rank} now requires approval: ${required}`);

            return interaction.reply({
                embeds: [
                    createSuccessEmbed(
                        "Approval Updated",
                        `Rank **${rank}** now **${required ? "requires" : "does not require"}** approval.`
                    )
                ],
                flags: 64,
            });
        }

        //────────────────────────────────────────
        //  /registration config-approver-add
        //────────────────────────────────────────

        if (sub === "config-approver-add") {
            const role = interaction.options.getRole("role");

            const existing = getRegistrationConfig(guildId) || {};
            const list = existing.approver_roles ? JSON.parse(existing.approver_roles) : [];

            if (!list.includes(role.id)) {
                list.push(role.id);
            }

            setApproverRoles(guildId, list);

            log("SUCCESS", "Approver Added", `<@&${role.id}> added as approver.`);

            return interaction.reply({
                embeds: [
                    createSuccessEmbed("Approver Added", `<@&${role.id}> can now approve registrations.`)
                ],
                flags: 64,
            });
        }

        //────────────────────────────────────────
        //  /registration config-approver-remove
        //────────────────────────────────────────

        if (sub === "config-approver-remove") {
            const role = interaction.options.getRole("role");

            const existing = getRegistrationConfig(guildId) || {};
            const list = existing.approver_roles ? JSON.parse(existing.approver_roles) : [];

            const filtered = list.filter((id) => id !== role.id);

            setApproverRoles(guildId, filtered);

            log("WARN", "Approver Removed", `<@&${role.id}> removed from approvers.`);

            return interaction.reply({
                embeds: [
                    createSuccessEmbed("Approver Removed", `<@&${role.id}> can no longer approve registrations.`)
                ],
                flags: 64,
            });
        }

        //────────────────────────────────────────
        //  /registration config-show
        //────────────────────────────────────────

        if (sub === "config-show") {
            const reg = getRegistrationConfig(guildId);

            if (!reg) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "Not Configured",
                            "This server has no registration configuration yet."
                        )
                    ],
                    flags: 64,
                });
            }

            const roles = {
                R1: reg.role_r1,
                R2: reg.role_r2,
                R3: reg.role_r3,
                R4: reg.role_r4,
                R5: reg.role_r5,
            };

            const approval = {
                R4: !!reg.require_approval_r4,
                R5: !!reg.require_approval_r5,
            };

            const approvers = reg.approver_roles ? JSON.parse(reg.approver_roles) : [];

            const embed = createInfoEmbed("Registration Configuration", "Current settings:")
                .addFields(
                    {
                        name: "Rank Roles",
                        value: Object.entries(roles)
                            .map(([k, id]) => `• **${k}** → ${id ? `<@&${id}>` : "*Not set*"}`)
                            .join("\n"),
                    },
                    {
                        name: "Approval Requirements",
                        value: `• **R4** → ${approval.R4 ? "Yes" : "No"}\n• **R5** → ${approval.R5 ? "Yes" : "No"}`,
                    },
                    {
                        name: "Approver Roles",
                        value:
                            approvers.length > 0
                                ? approvers.map((id) => `• <@&${id}>`).join("\n")
                                : "*None configured.*",
                    }
                );

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    },
};
