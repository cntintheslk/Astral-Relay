// ============================================================
// ASTRAL RELAY — COMMAND DEPLOYER
// Registers slash commands with Discord.
// Enforces environment safety and scope-based deployment.
// ============================================================

const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

// ------------------------------------------------------------
// INTERNAL HELPERS
// ------------------------------------------------------------

/**
 * Returns validated command objects.
 * Commands missing a scope are skipped with a warning.
 */
function getValidatedCommands(client) {
    const valid = [];

    for (const cmd of client.commands.values()) {
        if (!cmd.scope) {
            logger.warn("Command missing scope — skipped.", {
                name: cmd.data?.name,
                file: cmd.filePath || "unknown",
            });
            continue;
        }

        valid.push(cmd);
    }

    return valid;
}

/**
 * Converts commands to Discord JSON payloads.
 */
function toJSON(commands) {
    return commands.map(cmd => cmd.data.toJSON());
}

// ------------------------------------------------------------
// STANDARD DEPLOYMENT (STARTUP)
// ------------------------------------------------------------

async function deployCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const commands = getValidatedCommands(client);

    try {
        // =====================================================
        // PRODUCTION — GLOBAL COMMANDS ONLY
        // =====================================================
        if (config.environment === "production") {
            const globalCommands = commands.filter(
                cmd => cmd.scope === "global"
            );

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
        // DEVELOPMENT — ALL COMMANDS TO DEV GUILD
        // =====================================================
        } else {
            if (!config.devGuildId) {
                throw new Error("DEV_GUILD_ID is not configured.");
            }

            logger.info(
                `(DEV) Deploying ${commands.length} commands to dev guild ${config.devGuildId}.`
            );

            await rest.put(
                Routes.applicationGuildCommands(
                    client.user.id,
                    config.devGuildId
                ),
                { body: toJSON(commands) }
            );

            logger.success("(DEV) Dev guild command deployment complete.");

            log(
                "SUCCESS",
                "Dev Commands Deployed",
                `**${commands.length}** commands deployed to dev guild **${config.devGuildId}**.\n\n` +
                commands.map(c => `• \`${c.data.name}\``).join("\n")
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
// CALLED BY /system refresh
// ------------------------------------------------------------

async function refreshCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const commands = getValidatedCommands(client);

    logger.warn("Manual slash command refresh initiated.", {
        environment: config.environment,
        commandCount: commands.length,
    });

    // =========================================================
    // PRODUCTION — GLOBAL WIPE + REDEPLOY
    // =========================================================
    if (config.environment === "production") {
        const globalCommands = commands.filter(
            cmd => cmd.scope === "global"
        );

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
            { body: toJSON(commands) }
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
