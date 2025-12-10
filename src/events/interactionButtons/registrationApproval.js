const db = require("../../core/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

module.exports = {
    async handle(interaction) {
        if (!interaction.isButton()) return;
        const id = interaction.customId;

        // APPROVE
        if (id.startsWith("approve_")) {
            const regId = id.split("_")[1];

            const reg = db.prepare(`SELECT * FROM registrations WHERE id = ?`).get(regId);
            if (!reg) return interaction.reply({ content: "Registration not found.", flags: 64 });

            const guild = interaction.guild;
            const member = await guild.members.fetch(reg.user_id);

            // Fetch role config
            const settings = db.prepare(`
                SELECT * FROM registration_settings WHERE guild_id = ?
            `).get(guild.id);

            const rankField = `role_${reg.rank.toLowerCase()}`;
            const roleId = settings[rankField];

            // Update DB
            db.prepare(`
                UPDATE registrations
                SET status = 'approved', approved_by = ?
                WHERE id = ?
            `).run(interaction.user.id, regId);

            // Assign role
            if (roleId) {
                await member.roles.add(roleId);
            }

            // Set nickname
            const nick = `[${reg.rank}] | ${reg.ign}`;
            if (member.manageable) {
                await member.setNickname(nick).catch(() => {});
            }

            log(
                "SUCCESS",
                "Registration Approved",
                `User: <@${reg.user_id}>\nRank: **${reg.rank}**\nIGN: \`${reg.ign}\`\nApproved by: <@${interaction.user.id}>`
            );

            return interaction.update({
                content: `✅ **Approved** <@${reg.user_id}> as **${reg.rank}**`,
                embeds: [],
                components: []
            });
        }

        // DENY
        if (id.startsWith("deny_")) {
            const regId = id.split("_")[1];

            db.prepare(`
                UPDATE registrations
                SET status = 'denied'
                WHERE id = ?
            `).run(regId);

            log(
                "WARN",
                "Registration Denied",
                `Registration ID: ${regId}\nDenied by: <@${interaction.user.id}>`
            );

            return interaction.update({
                content: `❌ Registration **denied**.`,
                embeds: [],
                components: []
            });
        }
    }
};
