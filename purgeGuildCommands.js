// purgeGuildCommands.js
require("dotenv").config();
const { REST, Routes } = require("discord.js");

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.DEV_GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error("❌ Missing BOT_TOKEN, CLIENT_ID, or DEV_GUILD_ID in env.");
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log(`🧹 Attempting to purge commands in guild: ${guildId}`);

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: [] }
        );

        console.log("✅ Successfully deleted ALL guild slash commands.");
        console.log("➡️ Restart the bot to redeploy fresh commands.");
    } catch (err) {
        console.error("❌ Failed to purge guild commands:");
        console.error(err);
    }
})();
