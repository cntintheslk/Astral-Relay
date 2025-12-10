// index.js
const createClient = require("./src/core/client");
const loadEvents = require("./src/handlers/events");
const logger = require("./src/core/logger");
require("./src/core/database");
const { loadSchemas } = require("./src/modules/_schema");
const validateConfig = require("./src/core/configValidator");
const config = require("./src/core/config");
const express = require("express");
const app = express();
const { log } = require("./src/core/discordLogger");

// Validate config
validateConfig(config);

// Ensure token exists
if (!config.token) {
    logger.error("BOT_TOKEN environment variable is missing. Set it in Render.");
    process.exit(1);
}

// Load SQL schemas
loadSchemas();

// Create Discord client
const client = createClient();

// Load Discord event handlers
loadEvents(client);

// Crash handlers
process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Promise Rejection:");
    console.error(err);
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:");
    console.error(err);
});

// ---- EXPRESS SETUP ----
app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
    res.send("Astral Relay is running.");
});

// GitHub GET verification
app.get("/webhooks/github", (req, res) => {
    res.status(200).send("GitHub Webhook Endpoint Active");
});

// GitHub POST webhook
app.post("/webhooks/github", (req, res) => {

    const event = req.headers["x-github-event"];
    const payload = req.body;

    console.log(`[GitHub Webhook] Event received: ${event}`);

    // Respond immediately
    res.status(200).json({ status: "received" });

    // Channel ID from environment
    const channel = client.channels.cache.get(process.env.BOT_CHANGELOGS);

    if (!channel) {
        console.error("Webhook Error: Unable to find BOT_CHANGELOGS channel:", process.env.BOT_CHANGELOGS);
        return;
    }

    if (event === "push") {
        const commits = payload.commits
            ?.map(c => `• **${c.message.trim()}** (${c.id.slice(0,7)}) by *${c.author.name}*`)
            .join("\n");

        channel.send({
            embeds: [{
                title: `📦 Push to ${payload.ref.replace("refs/heads/", "")}`,
                description: commits || "No commit messages.",
                color: 0x5865f2,
                timestamp: new Date(),
                footer: { text: `Repo: ${payload.repository.full_name}` }
            }]
        });
    }
});

// ---- STARTS ONLY WHEN BOT IS READY ----
client.once("ready", () => {
    console.log("[SUCCESS] Bot is ready. Starting webhook server...");

    const PORT = process.env.PORT || 10000;

    app.listen(PORT, () => {
        console.log(`Webhook server running on port ${PORT}`);
        log("INFO", "Webhook Server", `Webhook server running on **port ${PORT}**`);
    });
});

// Login after everything is set up
client.login(config.token);
