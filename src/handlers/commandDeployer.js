const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

async function deployCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);

    const allCommands = Array.from(client.commands.values());

    try {
        if (config.environment === "production") {
            // ------------------------------------------------
            // PROD: GLOBAL COMMANDS ONLY
            // ------------------------------------------------

            const globalCommands = allCommands
                .filter(cmd => cmd.scope === "global")
                .map(cmd => cmd.data.toJSON());

            logger.info(
                `(PROD) Deploying ${globalCommands.length} GLOBAL commands...`
            );

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: globalCommands }
            );

            logger.success("(PROD) Global commands deployed.");

            log(
                "SUCCESS",
                "Global Commands Deployed",
                `**${globalCommands.length}** commands deployed globally.\n\n` +
                globalCommands.map(c => `• \`${c.name}\``).join("\n")
            );

        } else {
            // ------------------------------------------------
            // DEV: ALL LOADED COMMANDS → DEV GUILD
            // ------------------------------------------------

            const devCommands = allCommands.map(cmd => cmd.data.toJSON());

            logger.info(
                `(DEV) Deploying ${devCommands.length} commands to dev guild ${config.devGuildId}...`
            );

            await rest.put(
                Routes.applicationGuildCommands(
                    client.user.id,
                    config.devGuildId
                ),
                { body: devCommands }
            );

            logger.success("(DEV) Dev guild commands deployed.");

            log(
                "SUCCESS",
                "Dev Commands Deployed",
                `**${devCommands.length}** commands deployed to dev guild **${config.devGuildId}**.\n\n` +
                devCommands.map(c => `• \`${c.name}\``).join("\n")
            );
        }

    } catch (err) {
        logger.error("Failed to deploy commands.", {
            error: err?.stack || err.message,
        });

        log(
            "ERROR",
            "Command Deployment Failed",
            err?.message || String(err)
        );
    }
}

module.exports = deployCommands;
