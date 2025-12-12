const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

async function deployCommands(client) {
    const allCommands = Array.from(client.commands.values());

    // Split commands by category
    const globalCommands = allCommands
        .filter(cmd => cmd.category === "global")
        .map(cmd => cmd.data.toJSON());

    const devCommands = allCommands
        .filter(cmd => cmd.category === "dev")
        .map(cmd => cmd.data.toJSON());

    const rest = new REST({ version: "10" }).setToken(config.token);

    try {
        if (config.environment === "production") {
            // ======================================================
            //  PRODUCTION MODE  →  GLOBAL COMMANDS ONLY
            // ======================================================
            logger.info(`(PROD) Deploying ${globalCommands.length} GLOBAL commands...`);

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: globalCommands }
            );

            logger.success("(PROD) Global commands deployed.");

            log(
                "SUCCESS",
                "Global Commands Deployed",
                `**${globalCommands.length}** global commands deployed.\n\n` +
                globalCommands.map(c => `• \`${c.name}\``).join("\n")
            );

        } else {
            // ======================================================
            //  DEVELOPMENT MODE  →  DEV GUILD COMMANDS ONLY
            // ======================================================
            logger.info(`(DEV) Deploying ${devCommands.length} DEV commands to guild ${config.devGuildId}...`);

            await rest.put(
                Routes.applicationGuildCommands(client.user.id, config.devGuildId),
                { body: devCommands }
            );

            logger.success("(DEV) Dev guild commands deployed.");

            log(
                "SUCCESS",
                "Dev Commands Deployed",
                `**${devCommands.length}** dev commands deployed to guild **${config.devGuildId}**.\n\n` +
                devCommands.map(c => `• \`${c.name}\``).join("\n")
            );
        }

    } catch (err) {
        logger.error("Failed to deploy commands:");
        console.error(err);

        log(
            "ERROR",
            "Command Deployment Failed",
            `\`\`\`${err.message}\`\`\``
        );
    }
}

module.exports = deployCommands;
