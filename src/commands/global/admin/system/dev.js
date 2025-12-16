const { SlashCommandBuilder } = require("discord.js");
const { REST, Routes } = require("discord.js");
const config = require("../../../core/config");
const logger = require("../../../core/logger");
const { log } = require("../../../core/discordLogger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Developer utility commands")
        .addSubcommand(sub =>
            sub
                .setName("purgecommands")
                .setDescription("Delete ALL slash commands in THIS guild (owner only)")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // OWNER CHECK
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: "❌ You are not authorised to use this command.",
                flags: 64
            });
        }

        if (sub === "purgecommands") {
            await interaction.reply({
                content: "🧹 Purging all slash commands in this guild...",
                flags: 64,
            });

            const rest = new REST({ version: "10" }).setToken(config.token);

            try {
                await rest.put(
                    Routes.applicationGuildCommands(
                        interaction.client.user.id,
                        interaction.guild.id
                    ),
                    { body: [] }
                );

                logger.success(
                    `[dev] Purged all slash commands in guild ${interaction.guild.id}`
                );

                log(
                    "WARN",
                    "Slash Commands Purged",
                    `Guild: **${interaction.guild.name}**\nGuild ID: \`${interaction.guild.id}\`\nTriggered by: <@${interaction.user.id}>`
                );

                return interaction.editReply("✅ All slash commands were deleted in this server.");
            } catch (err) {
                logger.error("Failed to purge commands:");
                console.error(err);

                log(
                    "ERROR",
                    "Purge Command Error",
                    `Failed to purge slash commands.\n\`\`\`${err.message}\`\`\``
                );

                return interaction.editReply("❌ Failed to purge commands. Check bot logs.");
            }
        }
    }
};
