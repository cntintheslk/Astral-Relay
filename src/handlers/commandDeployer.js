// ============================================================
// ASTRAL RELAY — COMMAND DEPLOYER
// Responsible for registering slash commands with Discord.
// Enforces environment safety and scope-based deployment.
// ============================================================

const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

// ------------------------------------------------------------
// INTERNAL UTILITIES
// ------------------------------------------------------------

/**
 * Returns all loaded command objects.
 */
function getAllCommands(client) {
    return Array.from(client.commands.values());
}

/**
 * Converts command definitions to Discord JSON payloads.
 */
function toJSON(commands) {
    return commands.map(cmd => cmd.data.toJSON());
}

// ------------------------------------------------------------
// STANDARD DEPLOYMENT (CALLED ON STARTUP)
// ------------------------------------------------------------

async function deployCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const allCommands = getAllCommands(client);

    try {
        // =====================================================
        // PRODUCTION — GLOBAL COMMANDS ONLY
        // =====================================================
        if (config.environment === "production") {
            const globalCommands = allCommands
                .filter(cmd => cmd.scope === "global");

            logger.info(
                `(PROD) Deploying ${globalCommands.length} global commands.`
            );

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: toJSON(globalCommands) }
            );

            logger.success("(PROD) Global command deployment complete.");

            log(
                "SUCCESS",
                "Global Commands Deployed",
                `**${globalCommands.length}** commands deployed globally.\n\n` +
                globalCommands.map(c => `• \`${c.data.name}\``).join("\n")
            );

        // =====================================================
        // DEVELOPMENT — ALL LOADED COMMANDS TO DEV GUILD
        // =====================================================
        } else {
            const devCommands = toJSON(allCommands);

            logger.info(
                `(DEV) Deploying ${devCommands.length} commands to dev guild ${config.devGuildId}.`
            );

            await rest.put(
                Routes.applicationGuildCommands(
                    client.user.id,
                    config.devGuildId
                ),
                { body: devCommands }
            );

            logger.success("(DEV) Dev guild command deployment complete.");

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
// DEV-ONLY SAFETY IS ENFORCED BY CALLER
// ------------------------------------------------------------

async function refreshCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const allCommands = getAllCommands(client);

    logger.warn("Manual slash command refresh initiated.", {
        environment: config.environment,
        commandCount: allCommands.length,
    });

    // =========================================================
    // PRODUCTION — GLOBAL WIPE + REDEPLOY (OWNER-GATED)
    // =========================================================
    if (config.environment === "production") {
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

    // =========================================================
    // DEVELOPMENT — DEV GUILD WIPE + REDEPLOY
    // =========================================================
    } else {
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

    logger.success("Slash command refresh completed successfully.");
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
    deployCommands,
    refreshCommands,
};
