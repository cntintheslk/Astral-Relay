const { getAutoRole } = require("../modules/autorole/autoroleStore");
const logger = require("../core/logger");

module.exports = {
    name: "guildMemberAdd",
    async execute(member) {
        const guildId = member.guild.id;
        const roleId = getAutoRole(guildId);

        if (!roleId) return;

        try {
            await member.roles.add(roleId);
            logger.success(`[autorole] Added ${roleId} to ${member.id}`);
        } catch (err) {
            logger.error(`[autorole] Failed to add autorole in guild ${guildId}: ${err.message}`);
        }
    }
};
