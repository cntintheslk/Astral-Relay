// ============================================================
// ASTRAL RELAY — COMMAND DEPLOYER
// Handles global, guild, and forced refresh deployments.
// ============================================================

const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

function getAllCommands(client) {
    return Array.from(client.commands.values());
}

function toJSON(commands) {
    return commands.map(cmd => cmd.data.toJSON());
}

// ------------------------------------------------------------
// STANDARD DEPLOY (USED ON STARTUP)
// ------------------------------------------------------------

async function deployCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const allCommands = getAllCommands(client);

    try {
        if (config.environment === "production") {
            // ---------------------------------------------
            // PROD — GLOBAL COMMANDS ONLY
            // ---------------------------------------------

            const globalCommands = allCommands
                .filter(cmd => cmd.scope === "global")
                .map(cmd => cmd.data.toJSON());

            logger.info(
                `(PROD) Deploying ${globalCommands.length} global commands...`
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
            // ---------------------------------------------
            // DEV — ALL LOADED COMMANDS → DEV GUILD
            // ---------------------------------------------

            const devCommands = toJSON(allCommands);

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
        logger.error("Command deployment failed.", {
            error: err?.stack || err.message,
        });

        log(
            "ERROR",
            "Command Deployment Failed",
            err?.message || String(err)
        );
    }
}

// ------------------------------------------------------------
// FORCED REFRESH (WIPE + REDEPLOY)
// ------------------------------------------------------------

async function refreshCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const allCommands = getAllCommands(client);

    logger.warn("Forcing slash command refresh.", {
        environment: config.environment,
        commandCount: allCommands.length,
    });

    if (config.environment === "production") {
        // ---------------------------------------------
        // PROD — GLOBAL WIPE + REDEPLOY
        // ---------------------------------------------

        const globalCommands = allCommands
            .filter(cmd => cmd.scope === "global");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }
        );

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: toJSON(globalCommands) }
        );

    } else {
        // ---------------------------------------------
        // DEV — GUILD WIPE + REDEPLOY
        // ---------------------------------------------

        await rest.put(
            Routes.applicationGuildCommands(
                client.user.id,
                config.devGuildId
            ),
            { body: [] }
        );

        await rest.put(
            Routes.applicationGuildCommands(
                client.user.id,
                config.devGuildId
            ),
            { body: toJSON(allCommands) }
        );
    }

    logger.success("Slash command refresh completed.");
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
    deployCommands,
    refreshCommands,
};
