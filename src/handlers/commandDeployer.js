const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

async function deployCommands(client) {
    const commandObjects = Array.from(client.commands.values());

    const commands = commandObjects.map(cmd => cmd.data.toJSON());
    const commandNames = commandObjects.map(cmd => `• \`${cmd.data.name}\``).join("\n");

    const rest = new REST({ version: "10" }).setToken(config.token);

    try {
        logger.info(
            `Deploying ${commands.length} slash commands to guild ${config.devGuildId}...`
        );

        await rest.put(
            Routes.applicationGuildCommands(client.user.id, config.devGuildId),
            { body: commands }
        );

        logger.success(`Guild slash command deployment complete.`);

        // Discord log
        log(
            "SUCCESS",
            "Slash Commands Deployed",
            `**${commands.length}** commands deployed to the development guild.\n` +
            `Guild ID: \`${config.devGuildId}\`\n\n` +
            `**Commands:**\n${commandNames}`
        );

    } catch (err) {
        logger.error("Failed to deploy slash commands:");
        console.error(err);

        log(
            "ERROR",
            "Slash Command Deployment Failed",
            `\`\`\`${err.message}\`\`\``
        );
    }
}

module.exports = deployCommands;
