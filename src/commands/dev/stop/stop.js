const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const stopBot = require("../../stop");
const config = require("../../core/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Gracefully stop the bot (owners only)")
        // no Discord perms — we do our own owner check
        ,

    async execute(interaction) {
        const userId = interaction.user.id;

        // Owner check
        if (!config.owner_ids || !config.owner_ids.includes(userId)) {
            return interaction.reply({
                content: "❌ You are not authorised to run this command.",
                ephemeral: true
            });
        }

        // Acknowledge before shutdown
        await interaction.reply({
            content: "🛑 **Shutdown initiated.** The bot will go offline shortly.",
            ephemeral: true
        });

        // Small delay to ensure Discord receives the reply
        setTimeout(() => {
            stopBot(interaction.client, `Shutdown requested by owner ${userId}`);
        }, 1000);
    }
};
