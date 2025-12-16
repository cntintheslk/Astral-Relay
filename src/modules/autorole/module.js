// modules/autorole/module.js
const logger = require("../../core/logger");
const db = require("../../core/database");

module.exports = {
    name: "autorole",
    module: "autorole",
    description: "Automatically assigns configured roles to new members.",
    environment: "production", // Only load in production (optional)

    init(client) {
        logger.info("[autorole] Initializing Autorole module…");

        // Ensure table exists (safety)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS autoroles (
                guild_id TEXT PRIMARY KEY,
                role_ids TEXT
            )
        `).run();

        // Listen for member joins
        client.on("guildMemberAdd", async member => {
            const row = db.prepare("SELECT role_ids FROM autoroles WHERE guild_id = ?")
                .get(member.guild.id);

            if (!row || !row.role_ids) return;

            const roles = JSON.parse(row.role_ids);

            try {
                await member.roles.add(roles);
                logger.success(`[autorole] Assigned ${roles.length} roles to ${member.user.tag}`);
            } catch (err) {
                logger.error(`[autorole] Failed to assign roles: ${err.message}`);
            }
        });

        logger.success("[module:autorole] Initialized");
    }
};
