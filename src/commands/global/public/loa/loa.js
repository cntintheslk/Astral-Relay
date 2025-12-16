const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags
} = require("discord.js");

const db = require("../../../services/database");
const renderBoard = require("../../../../modules/loa/renderBoard");
const getRegistrationInfo = require("../../../../modules/loa/getRegistrationInfo");
const { randomUUID } = require("crypto");

module.exports = {
    scope: "global",
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

        // /loa pending
        .addSubcommand(sub =>
            sub
                .setName("pending")
                .setDescription("View LOAs awaiting approval.")
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

        // /loa config approval + role
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
                .addSubcommand(sub =>
                    sub
                        .setName("role")
                        .setDescription("Set the LOA role to assign during active leave.")
                        .addRoleOption(opt =>
                            opt.setName("role").setDescription("Selected LOA Role").setRequired(true)
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
                    flags: MessageFlags.Ephemeral,
                });
            }

            const start = now;
            const end = now + days * 86400;

            let settings = db
                .prepare("SELECT require_approval, loa_role_id FROM loa_settings WHERE guild_id = ?")
                .get(guildId);

            if (!settings) {
                db.prepare(
                    "INSERT INTO loa_settings (guild_id, require_approval, updated_at) VALUES (?, 0, ?)"
                ).run(guildId, now);

                settings = { require_approval: 0, loa_role_id: null };
            }

            const requiresApproval = settings.require_approval === 1;
            const status = requiresApproval ? "pending" : "active";
            const loaId = randomUUID();

            // Create LOA entry
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

            // ------------------------------------------------------------------
            // If approval is required, send pending LOA to the board channel
            // ------------------------------------------------------------------
            if (requiresApproval) {
                const board = db
                    .prepare("SELECT channel_id FROM loa_board WHERE guild_id = ?")
                    .get(guildId);

                if (board) {
                    const channel = interaction.guild.channels.cache.get(board.channel_id);

                    if (channel) {
                        const reg = getRegistrationInfo(guildId, userId);

                        const embed = new EmbedBuilder()
                            .setColor(0xffc857)
                            .setTitle("⏳ Pending LOA Request")
                            .setDescription(
                                `**User:** ${
                                    reg?.ign ? `${reg.ign} (${reg.rank})` : `<@${userId}>`
                                }\n` +
                                `**Reason:** ${reason}\n` +
                                `**Duration:** <t:${start}:d> → <t:${end}:d>\n` +
                                `**Submitted:** <t:${now}:R>`
                            )
                            .setFooter({ text: `LOA ID: ${loaId}` })
                            .setTimestamp();

                        const message = await channel.send({ embeds: [embed] });

                        // Save message ID so we can delete it on approve/deny
                        db.prepare(
                            "UPDATE loas SET pending_message_id = ? WHERE id = ?"
                        ).run(message.id, loaId);
                    }
                }
            }

            // ------------------------------------------------------------------
            // Auto-approval flow (if enabled)
            // ------------------------------------------------------------------
            if (!requiresApproval) {
                interaction.client.emit("loaUpdate", guildId);

                // Assign LOA Role
                if (settings.loa_role_id) {
                    try {
                        const member = await interaction.guild.members.fetch(userId);
                        await member.roles.add(settings.loa_role_id);
                    } catch {}
                }

                // DM User
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    await member.send(
                        `Your LOA has been **approved automatically**.\n\n` +
                        `**Reason:** ${reason}\n` +
                        `**Duration:** <t:${start}:d> → <t:${end}:d>`
                    );
                } catch {}
            }

            return interaction.reply({
                content: requiresApproval
                    ? "Your LOA request has been submitted and is **pending approval**."
                    : "Your LOA has been **auto-approved** and added to the board.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // ----------------------------------------------------------------------
        // /loa cancel → remove LOA role
        // ----------------------------------------------------------------------
        if (sub === "cancel") {
            const loa = db
                .prepare(
                    `SELECT * FROM loas
                    WHERE guild_id = ?
                    AND user_id = ?
                    AND status IN ('pending','active')
                    ORDER BY submitted_at DESC
                    LIMIT 1`
                )
                .get(guildId, userId);

            if (!loa) {
                return interaction.reply({
                    content: "You do not have an active or pending LOA to cancel.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            // --------------------------------------------------
            // Move LOA to history
            // --------------------------------------------------
            db.prepare(
                `INSERT INTO loa_history (
                    id, guild_id, user_id, reason,
                    start_date, end_date,
                    resolved_at, resolved_by,
                    resolution, status
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

            // --------------------------------------------------
            // REMOVE LOA from active table (THIS WAS MISSING)
            // --------------------------------------------------
            db.prepare(
                `DELETE FROM loas WHERE id = ?`
            ).run(loa.id);

            // --------------------------------------------------
            // Remove LOA role if set
            // --------------------------------------------------
            const settings = db
                .prepare("SELECT loa_role_id FROM loa_settings WHERE guild_id = ?")
                .get(guildId);

            if (settings?.loa_role_id) {
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    await member.roles.remove(settings.loa_role_id);
                } catch {}
            }

            // --------------------------------------------------
            // Refresh LOA board + views
            // --------------------------------------------------
            interaction.client.emit("loaUpdate", guildId);

            return interaction.reply({
                content: "Your LOA has been **cancelled** and removed from the board.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // ----------------------------------------------------------------------
        // /loa view (active LOAs) — unchanged
        // ----------------------------------------------------------------------
        if (sub === "view" && !group) {
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
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // ----------------------------------------------------------------------
        // /loa pending (with pagination) — unchanged
        // ----------------------------------------------------------------------
        if (sub === "pending" && !group) {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to view pending LOAs.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const pending = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND status = 'pending' ORDER BY submitted_at ASC"
                )
                .all(guildId);

            const embed = new EmbedBuilder()
                .setColor(0xffc857)
                .setTitle("⏳ Pending LOA Requests")
                .setTimestamp();

            if (pending.length === 0) {
                embed.setDescription("*There are no LOAs currently awaiting approval.*");
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Pagination setup
            const pageSize = 5;
            const totalPages = Math.ceil(pending.length / pageSize);
            let currentPage = 0;
            const sessionId = randomUUID().slice(0, 8);

            const buildPageEmbed = (pageIndex) => {
                const startIndex = pageIndex * pageSize;
                const slice = pending.slice(startIndex, startIndex + pageSize);

                let description = "";

                for (const loa of slice) {
                    const reg = getRegistrationInfo(guildId, loa.user_id);

                    const displayName =
                        reg && reg.ign
                            ? `**${reg.ign}** (${reg.rank})`
                            : `<@${loa.user_id}>`;

                    description +=
                        `### ${displayName}\n` +
                        `**Reason:** ${loa.reason}\n` +
                        `**Submitted:** <t:${loa.submitted_at}:R>\n` +
                        `**Duration:** <t:${loa.start_date}:d> → <t:${loa.end_date}:d>\n` +
                        `**LOA ID:** \`${loa.id}\`\n` +
                        `┈┈┈┈┈┈┈┈┈┈┈\n`;
                }

                const pageEmbed = EmbedBuilder.from(embed);
                pageEmbed.setDescription(description);
                pageEmbed.setFooter({
                    text: `Page ${pageIndex + 1} of ${totalPages}`,
                });

                return pageEmbed;
            };

            const makeRow = (pageIndex) => {
                const firstId = `loa_pending_${sessionId}_first`;
                const prevId = `loa_pending_${sessionId}_prev`;
                const nextId = `loa_pending_${sessionId}_next`;
                const lastId = `loa_pending_${sessionId}_last`;

                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(firstId)
                        .setLabel("⏮ First")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIndex === 0),
                    new ButtonBuilder()
                        .setCustomId(prevId)
                        .setLabel("◀ Prev")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIndex === 0),
                    new ButtonBuilder()
                        .setCustomId(nextId)
                        .setLabel("Next ▶")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIndex >= totalPages - 1),
                    new ButtonBuilder()
                        .setCustomId(lastId)
                        .setLabel("Last ⏭")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIndex >= totalPages - 1)
                );
            };

            const message = await interaction.reply({
                embeds: [buildPageEmbed(currentPage)],
                components: [makeRow(currentPage)],
                flags: MessageFlags.Ephemeral,
                fetchReply: true,
            });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60_000,
                filter: (i) =>
                    i.user.id === interaction.user.id &&
                    i.customId.startsWith(`loa_pending_${sessionId}_`),
            });

            collector.on("collect", async (buttonInteraction) => {
                const id = buttonInteraction.customId;

                if (id.endsWith("_first")) currentPage = 0;
                else if (id.endsWith("_prev") && currentPage > 0) currentPage--;
                else if (id.endsWith("_next") && currentPage < totalPages - 1)
                    currentPage++;
                else if (id.endsWith("_last")) currentPage = totalPages - 1;

                await buttonInteraction.update({
                    embeds: [buildPageEmbed(currentPage)],
                    components: [makeRow(currentPage)],
                });
            });

            collector.on("end", async () => {
                try {
                    await message.edit({ components: [] });
                } catch {
                    // message may be gone, ignore
                }
            });

            return;
        }

        // ----------------------------------------------------------------------
        // /loa status — unchanged
        // ----------------------------------------------------------------------
        if (sub === "status" && !group) {
            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? ORDER BY submitted_at DESC LIMIT 1"
                )
                .get(guildId, userId);

            if (!loa) {
                return interaction.reply({
                    content: "You do not currently have an LOA.",
                    flags: MessageFlags.Ephemeral,
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

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // ----------------------------------------------------------------------
        // /loa approve
        // ----------------------------------------------------------------------
        if (sub === "approve" && !group) {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to approve LOAs.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const target = interaction.options.getUser("user");

            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? AND status = 'pending' ORDER BY submitted_at DESC LIMIT 1"
                )
                .get(guildId, target.id);

            if (!loa) {
                return interaction.reply({
                    content: "No pending LOA found for that user.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            // ------------------------------------------------------------------
            // DELETE the pending LOA message from board channel
            // ------------------------------------------------------------------
            if (loa.pending_message_id) {
                const board = db
                    .prepare("SELECT channel_id FROM loa_board WHERE guild_id = ?")
                    .get(guildId);

                if (board) {
                    const channel = interaction.guild.channels.cache.get(board.channel_id);
                    if (channel) {
                        try {
                            const msg = await channel.messages.fetch(loa.pending_message_id);
                            await msg.delete();
                        } catch {
                            // Message may already be deleted. Ignore silently.
                        }
                    }
                }
            }

            // Approve LOA in DB
            db.prepare(
                "UPDATE loas SET status = 'active', approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?"
            ).run(now, interaction.user.id, now, loa.id);

            // Update board to reflect this LOA becoming active
            interaction.client.emit("loaUpdate", guildId);

            // Assign LOA role if configured
            const settings = db
                .prepare("SELECT loa_role_id FROM loa_settings WHERE guild_id = ?")
                .get(guildId);

            if (settings?.loa_role_id) {
                try {
                    const member = await interaction.guild.members.fetch(target.id);
                    await member.roles.add(settings.loa_role_id);
                } catch {}
            }

            // DM user about approval
            try {
                const member = await interaction.guild.members.fetch(target.id);
                await member.send(
                    `Your LOA request has been **approved**.\n\n` +
                    `**Reason:** ${loa.reason}\n` +
                    `**Duration:** <t:${loa.start_date}:d> → <t:${loa.end_date}:d>`
                );
            } catch {}

            return interaction.reply({
                content: `Approved LOA for **${target.tag}**.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // ----------------------------------------------------------------------
        // /loa deny
        // ----------------------------------------------------------------------
        if (sub === "deny" && !group) {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to deny LOAs.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const target = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");

            const loa = db
                .prepare(
                    "SELECT * FROM loas WHERE guild_id = ? AND user_id = ? AND status = 'pending' ORDER BY submitted_at DESC LIMIT 1"
                )
                .get(guildId, target.id);

            if (!loa) {
                return interaction.reply({
                    content: "No pending LOA found for that user.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Add to history
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

            // Remove pending LOA
            db.prepare("DELETE FROM loas WHERE id = ?").run(loa.id);

            // Send DM to the denied user
            try {
                const member = await interaction.guild.members.fetch(target.id);
                await member.send(
                    `Your LOA request has been **denied**.\n` +
                    `**Reviewer's Reason:** ${reason}`
                );
            } catch {}

            return interaction.reply({
                content: `Denied LOA for **${target.tag}**.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // ----------------------------------------------------------------------
        // /loa board set
        // ----------------------------------------------------------------------
        if (group === "board" && sub === "set") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to configure the LOA board.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const channel = interaction.options.getChannel("channel");

            // Push or update board location
            const existing = db
                .prepare("SELECT * FROM loa_board WHERE guild_id = ?")
                .get(guildId);

            const embed = renderBoard(guildId);
            const sent = await channel.send({ embeds: [embed] });

            if (existing) {
                db.prepare(
                    "UPDATE loa_board SET channel_id = ?, message_id = ?, updated_at = ? WHERE guild_id = ?"
                ).run(channel.id, sent.id, now, guildId);
            } else {
                db.prepare(
                    "INSERT INTO loa_board (guild_id, channel_id, message_id, updated_at) VALUES (?, ?, ?, ?)"
                ).run(guildId, channel.id, sent.id, now);
            }

            return interaction.reply({
                content: "LOA board updated successfully.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // ----------------------------------------------------------------------
        // /loa config approval
        // ----------------------------------------------------------------------
        if (group === "config" && sub === "approval") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to configure LOA settings.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const mode = interaction.options.getString("mode"); // "on" or "off"
            const requireApproval = mode === "on" ? 1 : 0;

            const exists = db
                .prepare("SELECT guild_id FROM loa_settings WHERE guild_id = ?")
                .get(guildId);

            if (exists) {
                db.prepare(
                    "UPDATE loa_settings SET require_approval = ?, updated_at = ? WHERE guild_id = ?"
                ).run(requireApproval, now, guildId);
            } else {
                db.prepare(
                    "INSERT INTO loa_settings (guild_id, require_approval, updated_at) VALUES (?, ?, ?)"
                ).run(guildId, requireApproval, now);
            }

            return interaction.reply({
                content:
                    requireApproval === 1
                        ? "LOA approval is now **required**."
                        : "LOA approval is now **disabled** (auto-approve).",
                flags: MessageFlags.Ephemeral,
            });
        }

        // ----------------------------------------------------------------------
        // /loa config role → set LOA role
        // ----------------------------------------------------------------------
        if (group === "config" && sub === "role") {
            if (!isStaff()) {
                return interaction.reply({
                    content: "You do not have permission to configure LOA settings.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const role = interaction.options.getRole("role");

            const exists = db
                .prepare("SELECT guild_id FROM loa_settings WHERE guild_id = ?")
                .get(guildId);

            if (exists) {
                db.prepare(
                    "UPDATE loa_settings SET loa_role_id = ?, updated_at = ? WHERE guild_id = ?"
                ).run(role.id, now, guildId);
            } else {
                db.prepare(
                    "INSERT INTO loa_settings (guild_id, loa_role_id, updated_at) VALUES (?, ?, ?)"
                ).run(guildId, role.id, now);
            }

            return interaction.reply({
                content: `LOA role set to **${role.name}**.`,
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};      
