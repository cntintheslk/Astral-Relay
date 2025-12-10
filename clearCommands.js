// clearCommands.js
const { REST, Routes } = require("discord.js");

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const DEV_GUILD_ID = process.env.DEV_GUILD_ID;
const GHST_GUILD_ID = process.env.GHST_GUILD_ID;

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Clearing GUILD commands...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID, GHST_GUILD_ID),
            { body: [] }
        );
        console.log("✓ Guild commands cleared.");

        console.log("Clearing GLOBAL commands...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: [] }
        );
        console.log("✓ Global commands cleared.");

        console.log("All legacy commands removed successfully.");
    } catch (err) {
        console.error("Failed to clear commands:");
        console.error(err);
    }
})();
