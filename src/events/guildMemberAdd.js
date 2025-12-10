const { getAutoRoles } = require("../modules/autorole/autoroleStore");
const logger = require("../core/logger");

module.exports = {
    name: "guildMemberAdd",
    async execute(member) {
        const roles = getAutoRoles(member.guild.id);
        if (!roles.length) return;

        try {
            await member.roles.add(roles);
            logger.success(`[autorole] Added roles [${roles.join(", ")}] to ${member.id}`);
        } catch (err) {
            logger.error(`[autorole] Failed to add autoroles: ${err.message}`);
        }
    }
};
