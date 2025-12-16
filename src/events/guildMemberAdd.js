// ============================================================
// ASTRAL RELAY — GUILD MEMBER ADD EVENT
// Handles autoroles and welcome flow delegation.
// ============================================================

const { getAutoRoles } = require("../modules/autorole/autoroleStore");
const handleWelcome = require("../modules/welcome/welcomeHandler");
const logger = require("../core/logger");

module.exports = {
    name: "guildMemberAdd",

    async execute(member) {
        const guildId = member.guild.id;
        const memberId = member.id;

        // -----------------------------------------------------
        // AUTOROLE
        // -----------------------------------------------------

        const roles = getAutoRoles(guildId);

        if (!roles.length) {
            // Intentional no-op: autoroles not configured
            logger.debug("No autoroles configured for guild.", {
                guildId,
            });
        } else {
            try {
                await member.roles.add(roles);

                logger.success("Autoroles applied to new member.", {
                    memberId,
                    guildId,
                    roles,
                });
            } catch (err) {
                logger.error("Failed to apply autoroles.", {
                    memberId,
                    guildId,
                    error: err?.stack || err.message,
                });
            }
        }

        // -----------------------------------------------------
        // WELCOME MESSAGE
        // -----------------------------------------------------

        try {
            await handleWelcome(member);

            logger.info("Welcome handler executed.", {
                memberId,
                guildId,
            });
        } catch (err) {
            logger.error("Welcome handler failed.", {
                memberId,
                guildId,
                error: err?.stack || err.message,
            });
        }
    },
};
