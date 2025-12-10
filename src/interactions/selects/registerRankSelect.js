const { log } = require("../../core/discordLogger");
const db = require("../../core/database");

module.exports = {
    idStartsWith: "registerRankSelect:",

    async execute(interaction) {
        const [_, ign] = interaction.customId.split(":");
        const rank = interaction.values[0];
        const guild = interaction.guild;
        const member = interaction.member;

        // ================================
        // 1. FETCH ROLE FROM DB
        // ================================

        const setting = db.prepare(`
            SELECT value FROM registration_settings
            WHERE guild_id = ? AND key = ?
        `).get(guild.id, `role_${rank}`);

        if (!setting) {
            return interaction.update({
                content: `❌ **This server has not configured the role for ${rank}.**  
Ask an admin to run the registration config command.`,
                components: []
            });
        }

        const roleId = setting.value;
        const role = guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.update({
                content: `❌ The configured role for **${rank}** is missing or deleted.`,
                components: []
            });
        }

        // ================================
        // 2. ASSIGN ROLE
        // ================================
        try {
            await member.roles.add(role);
        } catch (err) {
            log("ERROR", "Registration Role Error", `Failed to assign role.\n\`\`\`${err}\`\`\``);

            return interaction.update({
                content: `❌ I could not assign the **${rank}** role.  
Ensure I have the correct permissions.`,
                components: []
            });
        }

        // ================================
        // 3. SET NICKNAME
        // ================================
        const newNick = `[${rank}] | ${ign}`;

        try {
            await member.setNickname(newNick);
        } catch (err) {
            log("WARN", "Registration Nickname Warning",
                `Could not edit nickname for ${member.user.tag}\n\`\`\`${err}\`\`\``);

            // Continue even if nickname fails.
        }

        // ================================
        // 4. CONFIRM REGISTRATION
        // ================================
        await interaction.update({
            content: `### ✅ Registration Complete!\n**IGN:** ${ign}\n**Rank:** ${rank}\n\nYour roles and nickname have been updated.`,
            components: []
        });

        // ================================
        // 5. LOG TO DISCORD
        // ================================
        log(
            "SUCCESS",
            "New Registration",
            `**User:** ${member.user.tag}\n**IGN:** ${ign}\n**Rank:** ${rank}`
        );
    }
};
