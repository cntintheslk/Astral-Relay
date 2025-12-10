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
    getSettings,
    setRegistrationRoles,
    setApprovalConfig,
    setApproverRoles
} = require("../../modules/registration/settingsStore");

function isGuildAdminOrOwner(interaction) {
    if (!interaction.inGuild()) return false;

    // Bot owners override everything
    if (config.ownerIds?.includes(interaction.user.id)) return true;

    const member = interaction.member;
    if (!member?.permissions) return false;

    return member.permissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("registration")
        .setDescription("Configure the R1–R5 registration system (admins only)")

        // ---- CONFIG ROLES ----
        .addSubcommand(sub =>
            sub
                .setName("config-roles")
                .setDescription("Set or update the R1–R5 rank roles")
                .addRoleOption(opt => opt.setName("r1").setDescription("Role for R1").setRequired(false))
                .addRoleOption(opt => opt.setName("r2").setDescription("Role for R2").setRequired(false))
                .addRoleOption(opt => opt.setName("r3").setDescription("Role for R3").setRequired(false))
                .addRoleOption(opt => opt.setName("r4").setDescription("Role for R4").setRequired(false))
                .addRoleOption(opt => opt.setName("r5").setDescription("Role for R5").setRequired(false))
        )

        // ---- CONFIG APPROVAL ----
        .addSubcommand(sub =>
            sub
                .setName("config-approval")
                .setDescription("Set approval requirements for ranks")
                .addStringOption(opt =>
                    opt.setName("rank")
                        .setDescription("Which rank requires approval?")
                        .setRequired(true)
                        .addChoices(
                            { name: "R1", value: "r1" },
                            { name: "R2", value: "r2" },
                            { name: "R3", value: "r3" },
                            { name: "R4", value: "r4" },
                            { name: "R5", value: "r5" }
                        )
                )
                .addBooleanOption(opt =>
                    opt
                        .setName("required")
                        .setDescription("Should this rank require approval?")
                        .setRequired(true)
                )
        )

        // ---- CONFIG APPROVER ADD ----
        .addSubcommand(sub =>
            sub
                .setName("config-approver-add")
                .setDescription("Add a role that can approve registrations")
                .addRoleOption(opt =>
                    opt.setName("role")
                        .setDescription("Role allowed to approve registrations")
                        .setRequired(true)
                )
        )

        // ---- CONFIG APPROVER REMOVE ----
        .addSubcommand(sub =>
            sub
                .setName("config-approver-remove")
                .setDescription("Remove an approver role")
                .addRoleOption(opt =>
                    opt.setName("role")
                        .setDescription("Role to remove from approvers")
                        .setRequired(true)
                )
        )

        // ---- CONFIG SHOW ----
        .addSubcommand(sub =>
            sub
                .setName("config-show")
                .setDescription("Show the current registration configuration")
        )

        .addChannelOption(opt =>
            opt.setName("log_channel")
            .setDescription("Channel where registration logs will be sent.")
            .addChannelTypes(0) // 0 = text channel
        ),


    // ----------------------------------------------------
    // EXECUTE COMMAND
    // ----------------------------------------------------
    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                embeds: [createErrorEmbed("Guild Only", "This command must be used inside a server.")],
                flags: 64
            });
        }

        if (!isGuildAdminOrOwner(interaction)) {
            return interaction.reply({
                embeds: [createErrorEmbed("Insufficient Permissions", "You must be an administrator.")],
                flags: 64
            });
        }

        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();

        // ============================================
        // /registration config-roles
        // ============================================
        if (sub === "config-roles") {
            const patch = {
                r1: interaction.options.getRole("r1")?.id ?? null,
                r2: interaction.options.getRole("r2")?.id ?? null,
                r3: interaction.options.getRole("r3")?.id ?? null,
                r4: interaction.options.getRole("r4")?.id ?? null,
                r5: interaction.options.getRole("r5")?.id ?? null,
            };

            // Remove null entries (unchanged fields)
            const update = Object.fromEntries(
                Object.entries(patch).filter(([_, v]) => v !== null)
            );

            if (Object.keys(update).length === 0) {
                return interaction.reply({
                    embeds: [createErrorEmbed("No Changes", "You did not provide any roles to update.")],
                    flags: 64
                });
            }

            setRegistrationRoles(guildId, update);

            log(
                "SUCCESS",
                "Registration Roles Updated",
                Object.entries(update)
                    .map(([rank, id]) => `• **${rank.toUpperCase()}** → <@&${id}>`)
                    .join("\n")
            );

            return interaction.reply({
                embeds: [
                    createSuccessEmbed(
                        "Rank Roles Updated",
                        Object.entries(update)
                            .map(([rank, id]) => `• **${rank.toUpperCase()}** → <@&${id}>`)
                            .join("\n")
                    )
                ],
                flags: 64
            });
        }

        // ============================================
        // /registration config-approval
        // ============================================
        if (sub === "config-approval") {
            let rank = interaction.options.getString("rank"); // "r1" → "r5"
            const required = interaction.options.getBoolean("required");

            // Convert to correct format "R1" → "R5"
            rank = rank.toUpperCase();

            setApprovalConfig(guildId, { [rank]: required });

            log(
                "SUCCESS",
                "Approval Requirement Updated",
                `Rank **${rank}** now ${required ? "requires approval" : "auto-approves"}.`
            );

            return interaction.reply({
                embeds: [
                    createSuccessEmbed(
                        "Approval Updated",
                        `Rank **${rank}** now **${required ? "requires" : "does NOT require"}** approval.`
                    )
                ],
                flags: 64
            });
        }


        // ============================================
        // /registration config-approver-add
        // ============================================
        if (sub === "config-approver-add") {
            const role = interaction.options.getRole("role");

            const current = getSettings(guildId) || {};
            const list = JSON.parse(current.approver_roles || "[]");

            if (!list.includes(role.id)) {
                list.push(role.id);
                setApproverRoles(guildId, list);
            }

            log("SUCCESS", "Approver Role Added", `<@&${role.id}> added as approver.`);

            return interaction.reply({
                embeds: [createSuccessEmbed("Approver Added", `<@&${role.id}> can now approve registrations.`)],
                flags: 64
            });
        }

        // ============================================
        // /registration config-approver-remove
        // ============================================
        if (sub === "config-approver-remove") {
            const role = interaction.options.getRole("role");

            const current = getSettings(guildId) || {};
            let list = JSON.parse(current.approver_roles || "[]");

            list = list.filter(id => id !== role.id);
            setApproverRoles(guildId, list);

            log("WARN", "Approver Role Removed", `<@&${role.id}> removed as approver.`);

            return interaction.reply({
                embeds: [createSuccessEmbed("Approver Removed", `<@&${role.id}> can no longer approve.`)],
                flags: 64
            });
        }

        // ============================================
        // /registration config-show
        // ============================================
        if (sub === "config-show") {
            const reg = getSettings(guildId) || {};

            const roles = {
                R1: reg.role_r1,
                R2: reg.role_r2,
                R3: reg.role_r3,
                R4: reg.role_r4,
                R5: reg.role_r5,
            };

            const approvals = ["r1", "r2", "r3", "r4", "r5"]
                .map(r => {
                    const field = `require_approval_${r}`;
                    const needed = reg[field] ? true : false;
                    return `• **${r.toUpperCase()}** → ${needed ? "✅ Requires approval" : "⚪ Auto-approve"}`;
                })
                .join("\n");

            const approverRoles = JSON.parse(reg.approver_roles || "[]");

            const embed = createInfoEmbed("Registration Configuration", null)
                .addFields(
                    {
                        name: "Rank Roles",
                        value: Object.entries(roles)
                            .map(([rank, id]) => `• **${rank}** → ${id ? `<@&${id}>` : "*Not set*"}`)
                            .join("\n")
                    },
                    {
                        name: "Approval Requirements",
                        value: approvals
                    },
                    {
                        name: "Approver Roles",
                        value: approverRoles.length
                            ? approverRoles.map(id => `• <@&${id}>`).join("\n")
                            : "*None configured*"
                    }
                );

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
        
        if (options.getChannel("log_channel")) {
            const ch = options.getChannel("log_channel");
            db.prepare(`
                UPDATE guild_settings
                SET registration_log_channel_id = ?
                WHERE guild_id = ?
            `).run(ch.id, guildId);

            return interaction.reply({
                content: `📑 Registration logs will now be sent to <#${ch.id}>.`,
                ephemeral: true
            });
        }

        // ---- fallback (should never run) ----
        return interaction.reply({
            embeds: [createErrorEmbed("Unknown Error", "Unhandled subcommand.")],
            flags: 64
        });
    }
};
