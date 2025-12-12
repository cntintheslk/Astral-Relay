const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require("discord.js");

const db = require("../../../core/database");
const renderBoard = require("../../../modules/loa/renderBoard");
const getRegistrationInfo = require("../../../modules/loa/getRegistrationInfo");
const { randomUUID } = require("crypto");

module.exports = {
    category: "dev",

    data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Manage Leave of Absence (LOA).")

        // /loa apply
        .addSubcommand(sub =>
            sub
                .setName("apply")
                .setDescription("Submit a Leave of Absence request.")
                .addStringOption(opt =>
                    opt
                        .setName("reason")
                        .setDescription("Reason for your LOA.")
                        .setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt
                        .setName("days")
                        .setDescription("How many days you will be away.")
                        .setRequired(true)
                )
        )

        // /loa cancel
        .addSubcommand(sub =>
            sub
                .setName("cancel")
                .setDescription("Cancel your current LOA.")
        )

        // /loa view
        .addSubcommand(sub =>
            sub
                .setName("view")
                .setDescription("View all active LOAs.")
        )

        // /loa status
        .addSubcommand(sub =>
            sub
                .setName("status")
                .setDescription("View your current LOA status.")
        )

        // /loa approve
        .addSubcommand(sub =>
            sub
                .setName("approve")
                .setDescription("Approve a pending LOA.")
                .addUserOption(opt =>
                    opt
                        .setName("user")
                        .setDescription("User whose LOA you want to approve.")
                        .setRequired(true)
                )
        )

        // /loa deny
        .addSubcommand(sub =>
            sub
                .setName("deny")
                .setDescription("Deny a pending LOA.")
                .addUserOption(opt =>
                    opt
                        .setName("user")
                        .setDescription("User whose LOA you want to deny.")
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt
                        .setName("reason")
                        .setDescription("Reason for denial.")
                        .setRequired(true)
                )
        )

        // /loa board set
        .addSubcommandGroup(group =>
            group
                .setName("board")
                .setDescription("Configure the LOA board.")
                .addSubcommand(sub =>
                    sub
                        .setName("set")
                        .setDescription("Set or update the LOA board channel.")
                        .addChannelOption(opt =>
                            opt
                                .setName("channel")
                                .setDescription("Channel to post the LOA board.")
                                .setRequired(true)
                        )
                )
        )

        // /loa config approval
        .addSubcommandGroup(group =>
            group
                .setName("config")
                .setDescription("Configure LOA behaviour.")
                .addSubcommand(sub =>
                    sub
                        .setName("approval")
                        .setDescription("Enable or disable LOA approval.")
                        .addStringOption(opt =>
                            opt
                                .setName("mode")
                                .setDescription("Approval mode")
                                .setRequired(true)
                                .addChoices(
                                    { name: "Approval Required", value: "on" },
                                    { name: "Auto-Approve", value: "off" }
                                )
                        )
                )
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const sub = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);
        const now = Math.floor(Date.now() / 1000);

        const isStaff = () =>
            interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

        // ----------------------------------------------------------------------
        // /loa apply
        // ----------------------------------------------------------------------
        if (sub === "apply") {
            const reason = interaction.options.getString("reason");
            const days = interaction.options.getInteger("days");

            if (days <= 0) {
                return interaction.reply({
                    content: "Days must be at least 1.",
                    ephemeral: true,
                });
            }

            const start = now;
            const end = now + days * 86400;

            let settings = db
                .prepare("SELECT require_approval FROM loa_settings WHERE guild_id = ?")
                .get(guildId);

            if (!settings) {
                db.prepare(
                    "INSERT INTO loa_settings (guild_id, require_approval, updated_at) VALUES (?, 0, ?)"
                ).run(guildId, now);
                settings = { require_approval: 0 };
            }

            const requiresApproval = settings.require_approval === 1;
            const status = requiresApproval ? "pending" : "active";
            const loaId = randomUUID();

            db.prepare(
                `INSERT INTO loas (
                    id, guild_id, user_id, reason, start_date, end_date,
                    status, submitted_at, approved_at, approved_by, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
                loaId,
                guildId,
                userId,
                reason,
                start,
                end,
                status,
                now,
                requiresApproval ? null : now,
                requiresApproval ? null : "system",
                now
            );

            if (!requiresApproval) {
                interaction.client.emit("loaUpdate", guildId);
            }

            return interaction.reply({
                content: requiresApproval
                    ? "Your LOA request has been submitted and is **pending approval**."
                    : "Your LOA has been **auto-approved** and added to the board.",
                ephemeral: true,
            });
        }

        // ----------------------------------------------------------------------
        // /loa cancel
        // ----------------------------------------------------------------------
        if (sub === "cancel") {
            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? AND status IN ('pending','active') ORDER BY submitted_at DESC LIMIT 1"
                )
                .get(guildId, userId);

            if (!loa) {
                return interaction.reply({
                    content: "You do not have an active or pending LOA to cancel.",
                    ephemeral: true,
                });
            }

            db.prepare(
                `INSERT INTO loa_history (
                    id, guild_id, user_id, reason, start_date, end_date,
                    resolved_at, resolved_by, resolution, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
                randomUUID(),
                guildId,
                userId,
                loa.reason,
                loa.start_date,
                loa.end_date,
                now,
                userId,
                "cancelled",
                "cancelled"
            );

            db.prepare("DELETE FROM loas WHERE id = ?").run(loa.id);

            interaction.client.emit("loaUpdate", guildId);

            return interaction.reply({
                content: "Your LOA has been **cancelled**.",
                ephemeral: true,
            });
        }

        // ----------------------------------------------------------------------
        // /loa view
        // ----------------------------------------------------------------------
        if (sub === "view") {
            const loas = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND status = 'active' ORDER BY end_date ASC"
                )
                .all(guildId);

            const embed = new EmbedBuilder()
                .setColor(0x8c52ff)
                .setTitle("📋 Active LOAs");

            if (loas.length === 0) {
                embed.setDescription("*There are no active LOAs.*");
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            let desc = "";

            for (const loa of loas) {
                const reg = getRegistrationInfo(guildId, loa.user_id);
                const name = reg.ign
                    ? `**${reg.ign}** (${reg.rank})`
                    : `<@${loa.user_id}>`;

                desc += `${name}\n`;
                desc += `Reason: *${loa.reason}*\n`;
                desc += `Duration: <t:${loa.start_date}:d> → <t:${loa.end_date}:d>\n\n`;
            }

            embed.setDescription(desc);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ----------------------------------------------------------------------
        // /loa status
        // ----------------------------------------------------------------------
        if (sub === "status") {
            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? ORDER BY submitted_at DESC LIMIT 1"
                )
                .get(guildId, userId);

            if (!loa) {
                return interaction.reply({
                    content: "You do not currently have an LOA.",
                    ephemeral: true,
                });
            }

            const reg = getRegistrationInfo(guildId, userId);
            const displayName = reg.ign
                ? `${reg.ign} (${reg.rank})`
                : interaction.user.tag;

            const embed = new EmbedBuilder()
                .setColor(0x8c52ff)
                .setTitle(`✦ LOA Status — ${displayName}`)
                .addFields(
                    { name: "Reason", value: loa.reason },
                    { name: "Start", value: `<t:${loa.start_date}:F>` },
                    { name: "End", value: `<t:${loa.end_date}:F>` },
                    { name: "Status", value: `\`${loa.status.toUpperCase()}\`` }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ----------------------------------------------------------------------
        // /loa approve
        // ----------------------------------------------------------------------
        if (sub === "approve") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to approve LOAs.",
                    ephemeral: true,
                });
            }

            const target = interaction.options.getUser("user");

            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? AND status = 'pending' LIMIT 1"
                )
                .get(guildId, target.id);

            if (!loa) {
                return interaction.reply({
                    content: "No pending LOA found for that user.",
                    ephemeral: true,
                });
            }

            db.prepare(
                "UPDATE loas SET status = 'active', approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?"
            ).run(now, interaction.user.id, now, loa.id);

            interaction.client.emit("loaUpdate", guildId);

            return interaction.reply({
                content: `Approved LOA for **${target.tag}**.`,
                ephemeral: true,
            });
        }

        // ----------------------------------------------------------------------
        // /loa deny
        // ----------------------------------------------------------------------
        if (sub === "deny") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to deny LOAs.",
                    ephemeral: true,
                });
            }

            const target = interaction.options.getUser("user");
            const denyReason = interaction.options.getString("reason");

            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? AND status = 'pending' LIMIT 1"
                )
                .get(guildId, target.id);

            if (!loa) {
                return interaction.reply({
                    content: "No pending LOA found for that user.",
                    ephemeral: true,
                });
            }

            db.prepare(
                `INSERT INTO loa_history (
                    id, guild_id, user_id, reason, start_date, end_date,
                    resolved_at, resolved_by, resolution, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
                randomUUID(),
                guildId,
                target.id,
                loa.reason,
                loa.start_date,
                loa.end_date,
                now,
                interaction.user.id,
                "denied",
                "denied"
            );

            db.prepare("DELETE FROM loas WHERE id = ?").run(loa.id);

            interaction.client.emit("loaUpdate", guildId);

            return interaction.reply({
                content: `Denied LOA for **${target.tag}**.\nReason: *${denyReason}*`,
                ephemeral: true,
            });
        }

        // ----------------------------------------------------------------------
        // /loa board set
        // ----------------------------------------------------------------------
        if (group === "board" && sub === "set") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to configure the LOA board.",
                    ephemeral: true,
                });
            }

            const channel = interaction.options.getChannel("channel");
            const embed = renderBoard(guildId);

            const msg = await channel.send({ embeds: [embed] });

            db.prepare(
                `INSERT INTO loa_board (guild_id, channel_id, message_id, updated_at)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(guild_id) DO UPDATE SET
                     channel_id = excluded.channel_id,
                     message_id = excluded.message_id,
                     updated_at = excluded.updated_at`
            ).run(guildId, channel.id, msg.id, now);

            return interaction.reply({
                content: "LOA board has been configured.",
                ephemeral: true,
            });
        }

        // ----------------------------------------------------------------------
        // /loa config approval
        // ----------------------------------------------------------------------
        if (group === "config" && sub === "approval") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to configure LOA settings.",
                    ephemeral: true,
                });
            }

            const mode = interaction.options.getString("mode");
            const requireApproval = mode === "on" ? 1 : 0;

            db.prepare(
                `INSERT INTO loa_settings (guild_id, require_approval, updated_at)
                 VALUES (?, ?, ?)
                 ON CONFLICT(guild_id) DO UPDATE SET
                     require_approval = excluded.require_approval,
                     updated_at = excluded.updated_at`
            ).run(guildId, requireApproval, now);

            return interaction.reply({
                content: `LOA approval mode set to **${
                    mode === "on" ? "Approval Required" : "Auto-Approve"
                }**.`,
                ephemeral: true,
            });
        }
    },
};
