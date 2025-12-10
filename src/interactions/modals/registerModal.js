const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    id: "registerModal",

    async execute(interaction) {
        const ign = interaction.fields.getTextInputValue("ign");

        // Dynamically load rank options later from DB or config
        const rankOptions = [
            { label: "R1", value: "R1" },
            { label: "R2", value: "R2" },
            { label: "R3", value: "R3" },
            { label: "R4", value: "R4" },
            { label: "R5", value: "R5" }
        ];

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`registerRankSelect:${ign}`)
            .setPlaceholder("Select your rank")
            .addOptions(rankOptions);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            content: `Hello **${ign}**!  
Please choose your rank to continue.`,
            components: [row],
            ephemeral: true
        });
    }
};
