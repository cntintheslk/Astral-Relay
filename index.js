// ============================================================
// Astral Relay — Application Entry Point
// ============================================================

const createClient = require("./src/core/client");
const loadEvents = require("./src/handlers/events");
const logger = require("./src/core/logger");
require("./src/services/database");
const loadSchemas = require("./src/modules/_schema");
const validateConfig = require("./src/core/configValidator");
const config = require("./src/core/config");
const loadCommands = require("./src/handlers/commands")
const express = require("express");
const app = express();

// ============================================================
// BOT DISABLED GUARD
// ============================================================

if (process.env.BOT_DISABLED === "true") {
    logger.warn("BOT_DISABLED=true — staying offline.");
    setInterval(() => {}, 1000);
}

// ============================================================
// CONFIG VALIDATION
// ============================================================

validateConfig(config);

// ============================================================
// TOKEN VALIDATION
// ============================================================

if (!config.token) {
    logger.critical("BOT_TOKEN environment variable is missing.");
    process.exit(1);
}

// ============================================================
// LOAD SQL SCHEMA
// ============================================================

loadSchemas();

// ============================================================
// CREATE DISCORD CLIENT
// ============================================================

const client = createClient();

// ============================================================
// DISCORD COMMAND LOADER
// ============================================================

loadCommands(client);
// ============================================================
// DISCORD EVENT HANDLERS
// ============================================================

loadEvents(client);

// ============================================================
// PROCESS CRASH HANDLERS
// ============================================================

process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Promise Rejection", {
        error: err?.stack || err?.message || String(err),
    });
});

process.on("uncaughtException", (err) => {
    logger.critical("Uncaught Exception", {
        error: err?.stack || err?.message || String(err),
    });
});

// ============================================================
// EXPRESS SETUP
// ============================================================

app.use(express.json());

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (_req, res) => {
    res.status(200).send("Astral Relay is running.");
});

// ============================================================
// GITHUB WEBHOOK VALIDATION
// ============================================================

app.get("/webhooks/github", (_req, res) => {
    res.status(200).send("GitHub Webhook Endpoint Active");
});

// ============================================================
// GITHUB WEBHOOK HANDLER
// ============================================================

app.post("/webhooks/github", (req, res) => {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    logger.info("GitHub webhook received.", { event });

    res.status(200).json({ status: "received" });

    const channelId = process.env.BOT_CHANGELOGS;
    const channel = client.channels.cache.get(channelId);

    if (!channel) {
        logger.warn("BOT_CHANGELOGS channel not found.", { channelId });
        return;
    }

    if (event === "push") {
        const commits = payload.commits
            ?.map(c => `• **${c.message.trim()}** (${c.id.slice(0, 7)})`)
            .join("\n");

        channel.send({
            embeds: [{
                title: `📦 Push to ${payload.ref.replace("refs/heads/", "")}`,
                description: commits || "No commit messages.",
                color: 0x5865f2,
                timestamp: new Date(),
                footer: { text: `Repo: ${payload.repository.full_name}` },
            }],
        });
    }
});

// ============================================================
// START WEB SERVER AFTER BOT READY
// ============================================================

client.once("ready", () => {
    logger.success("Bot is ready.");

    const PORT = process.env.PORT || 10000;

    setTimeout(() => {
        app.listen(PORT, () => {
            logger.success("Webhook server running.", { port: PORT });
        });
    }, 500);
});

// ============================================================
// DAILY AUTO-RESTART (00:00 UTC)
// ============================================================

function scheduleDailyRestart() {
    const now = new Date();
    const next = new Date(now);

    next.setUTCHours(0, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

    const seconds = Math.round((next - now) / 1000);

    logger.info("Daily restart scheduled.", {
        target: "00:00 UTC",
        secondsUntilRestart: seconds,
    });

    setTimeout(() => {
        logger.warn("Daily scheduled restart executing.");
        process.exit(0);
    }, next - now);
}

scheduleDailyRestart();

// ============================================================
// LOGIN
// ============================================================

client.login(config.token).catch(err => {
    logger.critical("Failed to login to Discord.", {
        error: err?.stack || err?.message || String(err),
    });
});
