const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

async function deployCommands(client) {
    const commands = Array.from(client.commands.values())
        .map(cmd => cmd.data.toJSON());

    const rest = new REST({ version: "10" }).setToken(config.token);

    try {
        if (config.environment === "production") {
            logger.info(`(PROD) Deploying ${commands.length} GLOBAL commands...`);

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );

            logger.success("(PROD) Global commands deployed.");

            log(
                "SUCCESS",
                "Global Commands Deployed",
                `**${commands.length}** commands deployed globally.\n\n` +
                commands.map(c => `• \`${c.name}\``).join("\n")
            );

        } else {
            logger.info(`(DEV) Deploying ${commands.length} commands to dev guild ${config.devGuildId}...`);

            await rest.put(
                Routes.applicationGuildCommands(client.user.id, config.devGuildId),
                { body: commands }
            );

            logger.success("(DEV) Dev guild commands deployed.");

            log(
                "SUCCESS",
                "Dev Commands Deployed",
                `**${commands.length}** commands deployed to dev guild **${config.devGuildId}**.\n\n` +
                commands.map(c => `• \`${c.name}\``).join("\n")
            );
        }

    } catch (err) {
        logger.error("Failed to deploy commands:", err);

        log(
            "ERROR",
            "Command Deployment Failed",
            `\`\`\`${err.message}\`\`\``
        );
    }
}

module.exports = deployCommands;
