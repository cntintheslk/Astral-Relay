const db = require("../modules/database");

module.exports = {
    name: "guildMemberUpdate",

    async execute(oldMember, newMember) {
        const addedRoles = newMember.roles.cache.filter(
            role => !oldMember.roles.cache.has(role.id)
        );

        if (!addedRoles.size) return;

        const stmt = db.prepare(`
            INSERT OR IGNORE INTO role_assignments
            (guild_id, user_id, role_id, assigned_at)
            VALUES (?, ?, ?, ?)
        `);

        for (const role of addedRoles.values()) {
            stmt.run(
                newMember.guild.id,
                newMember.id,
                role.id,
                Date.now()
            );
        }
    }
};
