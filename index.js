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
const githubWebhook = require("./src/webhooks/github");

app.use("/webhooks", githubWebhook(client));

app.listen(PORT, () => {
    console.log(`[WEBHOOK] Listening on port ${PORT}`);
});


// Start bot
client.login(config.token).catch((err) => {
  logger.error("Failed to login:");
  console.error(err);
});

const PORT = process.env.PORT || 3000;

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

