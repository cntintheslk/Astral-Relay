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


validateConfig(config);

// Check for missing bot token
if (!config.token) {
  logger.error("BOT_TOKEN environment variable is missing. Set it in Render.");
  process.exit(1);
}

// Load SQL schemas before the bot starts
loadSchemas();

const client = createClient();

// Load events
loadEvents(client);

// Global crash handlers
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:");
  console.error(err);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:");
  console.error(err);
});

// Start bot
client.login(config.token).catch((err) => {
  logger.error("Failed to login:");
  console.error(err);
});

app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
    res.send("Astral Relay is running.");
});

// GitHub webhook endpoint (even if not used yet)
app.post("/webhooks/github", (req, res) => {
    console.log("Received GitHub webhook:", req.body);
    res.status(200).send("OK");
});

// Start server
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);

    // Send to Discord bot log channel as well
    log(
        "INFO",
        "Web Server Started",
        `Webhook server running on **port ${PORT}**`
    );
});
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
    res.status(200).send("Astral Relay is running.");
});

// GitHub GET route (required for GitHub verification)
app.get("/webhooks/github", (req, res) => {
    res.status(200).send("GitHub Webhook Endpoint Active");
});

// ---------------------------------------------
// 🔽 THIS IS STEP 2 — PLACE IT RIGHT HERE 🔽
// ---------------------------------------------
app.post("/webhooks/github", (req, res) => {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    console.log(`[GitHub Webhook] Event: ${event}`);

    // Respond quickly so GitHub doesn't timeout
    res.status(200).json({ status: "received" });

    // Handle push events (example)
    if (event === "push") {
        const commits = payload.commits
            .map(c => `• **${c.message.trim()}** (${c.id.slice(0,7)}) by *${c.author.name}*`)
            .join("\n");

        const embed = {
            title: `📦 Push to ${payload.ref.replace("refs/heads/", "")}`,
            description: commits || "No commit messages.",
            color: 0x5865f2,
            timestamp: new Date(),
            footer: {
                text: `Repo: ${payload.repository.full_name}`
            }
        };

        const channel = client.channels.cache.get("YOUR_CHANNEL_ID");
        if (channel) channel.send({ embeds: [embed] });
    }
});
// ---------------------------------------------
// 🔼 END OF STEP 2 HANDLER 🔼
// ---------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));