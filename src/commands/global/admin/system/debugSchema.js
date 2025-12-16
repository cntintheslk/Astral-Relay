const { SlashCommandBuilder } = require("discord.js");
const db = require("../../../../services/database");

module.exports = {
    scope: "global",
    data: new SlashCommandBuilder()
        .setName("dbschema")
        .setDescription("Prints the live registrations table schema to logs (dev only)"),

    async execute(interaction) {
        if (interaction.user.id !== "423511842648752139") {
            return interaction.reply({ content: "Nope.", ephemeral: true });
        }

        const schema = db.prepare("PRAGMA table_info(registrations);").all();

        console.log("=== LIVE REGISTRATIONS SCHEMA ===");
        console.table(schema);
        console.log("=================================");

        return interaction.reply({
            content: "Schema printed to logs.",
            ephemeral: true
        });
    }
};
