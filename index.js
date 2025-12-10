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

// --------------- EXPRESS SETUP ----------------
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
    res.status(200).send("Astral Relay is running.");
});

// GitHub GET verification
app.get("/webhooks/github", (req, res) => {
    res.status(200).send("GitHub Webhook Endpoint Active");
});

// GitHub POST Webhook
app.post("/webhooks/github", (req, res) => {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    console.log(`[GitHub Webhook] Event received: ${event}`);

    // Always respond immediately so GitHub does not retry
    res.status(200).json({ status: "received" });

    // What channel to send to in Discord
    const changeLogChannel = client.channels.cache.get(process.env.BOT_CHANGELOGS);

    if (!changeLogChannel) {
        console.error("Webhook Error: Unable to find BOT_CHANGELOGS channel:", process.env.BOT_CHANGELOGS);
        return;
    }

    // Process push events → send changelog
    if (event === "push") {
        const commits = payload.commits
            ?.map(c => `• **${c.message.trim()}** (${c.id.slice(0,7)})`)
            .join("\n");

        changeLogChannel.send({
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

// --------------- START SERVER AFTER BOT IS READY ----------------
client.once("ready", () => {
    console.log("[SUCCESS] Bot is ready. Starting webhook server...");

    const PORT = process.env.PORT || 10000;

    // Fix #2 — small delay ensures Render finishes warm-up before binding to port
    setTimeout(() => {
        app.listen(PORT, () => {
            console.log(`Webhook server running on port ${PORT}`);

            // Optional: send startup logs to Discord's system log channel
            log("INFO", "Webhook Server", `Webhook server running on **port ${PORT}**`);
        });
    }, 500); // 0.5 second buffer
});

// Login after everything is set up
client.login(config.token).catch((err) => {
    logger.error("Failed to login:");
    console.error(err);
});
