const { SlashCommandBuilder } = require("discord.js");
const { getSettings, getRegistrationConfig } = require("../../modules/registration/settingsStore");
const db = require("../../core/database");
const logger = require("../../core/logger");

// NEW IMPORT
const { sendRegLog } = require("../../core/registrationLogHelper");

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
                    { name: "R5", value: "R5" }
                )
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                flags: 64,
            });
        }

        const guild = interaction.guild;
        const guildId = guild.id;
        const userId = interaction.user.id;
        const ign = interaction.options.getString("ign");
        const rank = interaction.options.getString("rank");

        const settings = getRegistrationConfig(guildId);

        if (!settings) {
            logger.warn(`[register] No registration settings for guild ${guildId}`);
            return interaction.reply({
                content: "⚠️ Registration is not configured on this server.",
                flags: 64,
            });
        }

        const roleMap = settings.roles;
        const targetRoleId = roleMap[rank];

        if (!targetRoleId) {
            logger.error(`[register] No role configured for ${rank} in guild ${guildId}`);
            return interaction.reply({
                content: `❌ No role configured for **${rank}**. Please contact an admin.`,
                flags: 64,
            });
        }

        const member = await guild.members.fetch(userId);

        const needsApproval = settings.approvalRequired[rank];
        const timestamp = Date.now();

        const insertStmt = db.prepare(`
            INSERT INTO registrations (guild_id, user_id, ign, rank, status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        // -----------------------------
        // PENDING REGISTRATION
        // -----------------------------
        console.log("DEBUG SETTINGS =", getSettings(guild.id));

        if (needsApproval) {
            insertStmt.run(guildId, userId, ign, rank, "pending", timestamp);

            await sendRegLog(
                guild,
                "INFO",
                "Registration Pending",
                `User: <@${userId}>\nRank: **${rank}**\nIGN: \`${ign}\`\nStatus: \`pending\``
            );

            return interaction.reply({
                content:
                    `✅ Your registration has been received.\n` +
                    `Requested Rank: **${rank}**\n` +
                    `IGN: \`${ign}\`\n\n` +
                    "Your application requires **manual approval**.",
                flags: 64,
            });
        }

        // -----------------------------
        // AUTO APPROVAL
        // -----------------------------
        insertStmt.run(guildId, userId, ign, rank, "auto", timestamp);

        // Assign rank role
        try {
            await member.roles.add(targetRoleId);
        } catch (err) {
            logger.error(`[register] Failed to assign role ${targetRoleId}: ${err.message}`);
            return interaction.reply({
                content: "⚠️ Registration saved, but role assignment failed.",
                flags: 64,
            });
        }

        // Set nickname
        const desiredNick = `[${rank}] | ${ign}`;
        if (member.manageable) {
            try {
                await member.setNickname(desiredNick);
            } catch (err) {
                logger.warn(`[register] Failed to set nickname: ${err.message}`);
            }
        }

        await sendRegLog(
            guild,
            "SUCCESS",
            "Registration Auto-Approved",
            `User: <@${userId}>\nRank: **${rank}**\nIGN: \`${ign}\`\nStatus: \`auto-approved\``
        );

        return interaction.reply({
            content: `✅ You have been registered as **${rank}**.\nYour nickname is now \`${desiredNick}\`.`,
            flags: 64,
        });
    },
};
