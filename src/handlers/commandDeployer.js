// ============================================================
// ASTRAL RELAY — COMMAND DEPLOYER
// Registers slash commands with Discord.
// Enforces environment safety and scope-based deployment.
// ============================================================

const { REST, Routes } = require("discord.js");
const config = require("../core/config");
const logger = require("../core/logger");

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
        if (!cmd?.data?.name) {
            logger.warn("Invalid command object skipped.", {
                file: cmd?.filePath || "unknown",
            });
            continue;
        }

        if (!cmd.scope) {
            logger.warn("Command missing scope — skipped.", {
                name: cmd.data.name,
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
// STANDARD DEPLOYMENT (CALLED ON STARTUP)
// ------------------------------------------------------------

async function deployCommands(client) {
    const rest = new REST({ version: "10" }).setToken(config.token);
    const commands = getValidatedCommands(client);

    if (!commands.length) {
        logger.warn("No valid commands found to deploy.");
        return;
    }

    try {
        // =====================================================
        // PRODUCTION — GLOBAL COMMANDS ONLY
        // =====================================================
        if (config.environment === "production") {
            const globalCommands = commands.filter(
                cmd => cmd.scope === "global"
            );

            logger.info("(PROD) Deploying global commands.", {
                count: globalCommands.length,
            });

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: toJSON(globalCommands) }
            );

            logger.success("Global command deployment complete.", {
                count: globalCommands.length,
            });

        // =====================================================
        // DEVELOPMENT — ALL COMMANDS TO DEV GUILD
        // =====================================================
        } else {
            if (!config.devGuildId) {
                throw new Error("DEV_GUILD_ID is not configured.");
            }

            logger.info("(DEV) Deploying commands to dev guild.", {
                guildId: config.devGuildId,
                count: commands.length,
            });

            await rest.put(
                Routes.applicationGuildCommands(
                    client.user.id,
                    config.devGuildId
                ),
                { body: toJSON(commands) }
            );

            logger.success("Dev guild command deployment complete.", {
                guildId: config.devGuildId,
                count: commands.length,
            });
        }

    } catch (err) {
        logger.critical("Command deployment failed.", {
            error: err?.stack || err?.message || String(err),
        });

        throw err; // allow ready.js to report fatal startup failures
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

    if (!commands.length) {
        logger.warn("No commands available to refresh.");
        return;
    }

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

    logger.success("Slash command refresh completed successfully.", {
        environment: config.environment,
        count: commands.length,
    });
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
    deployCommands,
    refreshCommands,
};
