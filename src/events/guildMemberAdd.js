const { getAutoRoles } = require("../modules/autorole/autoroleStore");
const handleWelcome = require("../modules/welcome/welcomeHandler");
const logger = require("../core/logger");

module.exports = {
    name: "guildMemberAdd",
    async execute(member) {

        /* ======================
           AUTOROLE (EXISTING)
        ====================== */
        const roles = getAutoRoles(member.guild.id);

        if (roles.length) {
            try {
                await member.roles.add(roles);
                logger.success(
                    `[autorole] Added roles [${roles.join(", ")}] to ${member.id}`
                );
            } catch (err) {
                logger.error(
                    `[autorole] Failed to add autoroles: ${err.message}`
                );
            }
        }

        /* ======================
           WELCOMER (NEW)
        ====================== */
        try {
            await handleWelcome(member);
        } catch (err) {
            logger.error(
                `[welcomer] Failed to send welcome for ${member.id}: ${err.message}`
            );
        }
    }
};
