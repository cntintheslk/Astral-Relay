// src/commands/registration/register.js

const { SlashCommandBuilder } = require("discord.js");
const { getSettings, getRegistrationConfig } = require("../../modules/registration/settingsStore");
const db = require("../../core/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register your in-game rank on this server.")
        .addStringOption(opt =>
            opt
                .setName("ign")
                .setDescription("Your in-game name")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt
                .setName("rank")
                .setDescription("Select your rank")
                .setRequired(true)
                .addChoices(
                    { name: "R1", value: "R1" },
                    { name: "R2", value: "R2" },
                    { name: "R3", value: "R3" },
                    { name: "R4", value: "R4" },
                    { name: "R5", value: "R5" },
                )
        ),

    /**
     * /register execution
     * - Reads per-guild config
     * - Assigns rank role (or queues approval for high ranks)
     * - Sets nickname: [Rank] | IGN
     * - Logs to DB + Discord
     */
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                flags: 64,
            });
        }

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const ign = interaction.options.getString("ign");
        const rank = interaction.options.getString("rank"); // "R1".."R5"

        // Load guild-specific registration settings
        const settings = getRegistrationConfig(guildId);

        if (!settings) {
            logger.warn(`[register] No registration settings for guild ${guildId}`);
            return interaction.reply({
                content:
                    "⚠️ Registration is not configured on this server.\n" +
                    "An admin must run the registration config command first.",
                flags: 64,
            });
        }

        // Map rank -> role field
        const roleMap = settings.roles;

        const targetRoleId = roleMap[rank];

        if (!targetRoleId) {
            logger.error(
                `[register] No role configured for ${rank} in guild ${guildId}`
            );
            return interaction.reply({
                content:
                    `❌ The server has not configured a role for **${rank}** yet.\n` +
                    "Please contact an administrator.",
                flags: 64,
            });
        }

        const member = await interaction.guild.members.fetch(userId);

        // Decide if this rank needs approval
        const needsApproval = settings.approvalRequired[rank];

        console.log("DEBUG: approvalRequired = ", settings.approvalRequired);
        console.log("DEBUG: needsApproval = ", needsApproval);

        const timestamp = Date.now();

        // Insert registration record into DB
        const insertStmt = db.prepare(`
            INSERT INTO registrations (guild_id, user_id, ign, rank, status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        if (needsApproval) {
            // For now: queue as pending, no approver workflow yet
            insertStmt.run(guildId, userId, ign, rank, "pending", timestamp);

            logger.info(
                `[register] Pending registration for ${userId} as ${rank} in guild ${guildId}`
            );

            log(
                "INFO",
                "Registration Pending",
                `User: <@${userId}>\nRank: **${rank}**\nIGN: \`${ign}\`\nStatus: \`pending\``
            );

            return interaction.reply({
                content:
                    `✅ Your registration has been received.\n` +
                    `Requested Rank: **${rank}**\n` +
                    `IGN: \`${ign}\`\n\n` +
                    "Your application requires **manual approval**. A staff member will review it shortly.",
                flags: 64,
            });
        }

        // Auto-approve flow
        insertStmt.run(guildId, userId, ign, rank, "auto", timestamp);

        // Assign role
        try {
            await member.roles.add(targetRoleId);
        } catch (err) {
            logger.error(
                `[register] Failed to assign role ${targetRoleId} to ${userId}: ${err.message}`
            );
            console.error(err);

            return interaction.reply({
                content:
                    "⚠️ Registration recorded, but I couldn't assign your role.\n" +
                    "Please contact a server administrator.",
                flags: 64,
            });
        }

        // Set nickname: [Rank] | IGN
        const desiredNick = `[${rank}] | ${ign}`;
        if (member.manageable) {
            try {
                await member.setNickname(desiredNick);
            } catch (err) {
                logger.warn(
                    `[register] Failed to set nickname for ${userId} in guild ${guildId}: ${err.message}`
                );
            }
        }

        logger.success(
            `[register] Auto-approved ${userId} as ${rank} (${ign}) in guild ${guildId}`
        );

        log(
            "SUCCESS",
            "Registration Approved",
            `User: <@${userId}>\nRank: **${rank}**\nIGN: \`${ign}\`\nStatus: \`auto-approved\``
        );

        return interaction.reply({
            content:
                `✅ You have been registered as **${rank}**.\n` +
                `Your nickname has been set to \`${desiredNick}\`.`,
            flags: 64,
        });
    },
};
