// index.js
const createClient = require("./src/core/client");
const loadEvents = require("./src/handlers/events");
const logger = require("./src/core/logger");
require("./src/services/database");
const { loadSchemas } = require("./src/modules/_schema");
const validateConfig = require("./src/core/configValidator");
const config = require("./src/core/config");
const express = require("express");
const app = express();
const { log } = require("./src/core/discordLogger");

 // --------------- BOT DISABLED GUARD ----------------
if (process.env.BOT_DISABLED === "true") {
    console.log("[system] BOT_DISABLED=true — staying offline.");
    setInterval(() => {}, 1000); // keep process alive
}

// --------------- CONFIG VALIDATION ----------------
validateConfig(config);

// --------------- TOKEN VALIDATION ----------------
if (!config.token) {
    logger.error("BOT_TOKEN environment variable is missing. Set it in Render.");
    process.exit(1);
}

// --------------- LOAD SQL SCHEMA ----------------
loadSchemas();

// --------------- CREATE DISCORD CLIENT ----------------
const client = createClient();

// --------------- DISCORD EVENT HANDLER ----------------
loadEvents(client);

// --------------- CRASH HANDLER ----------------
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

// --------------- HEALTH CHECK ROUTE ----------------
app.get("/", (req, res) => {
    res.status(200).send("Astral Relay is running.");
});

// --------------- GITHUB VALIDATION ----------------
app.get("/webhooks/github", (req, res) => {
    res.status(200).send("GitHub Webhook Endpoint Active");
});

// --------------- GITHUB WEBHOOK VALIDATION ----------------
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

    setTimeout(() => {
        app.listen(PORT, () => {
            console.log(`Webhook server running on port ${PORT}`);

            log("INFO", "Webhook Server", `Webhook server running on **port ${PORT}**`);
        });
    }, 500); // 0.5 second buffer
});

// --------------- DAILY AUTORESTART AT 00:00 UTC ----------------
function scheduleDailyRestart() {
    const now = new Date();

    // Next midnight UTC
    const next = new Date(now);
    next.setUTCHours(0, 0, 0, 0);

    // If we've already passed today's 00:00 UTC, go to tomorrow
    if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
    }

    const msUntilRestart = next.getTime() - now.getTime();

    console.log(
        `[system] Scheduled daily restart at 00:00 UTC in ${Math.round(
            msUntilRestart / 1000
        )} seconds.`
    );

    setTimeout(() => {
        console.log("[system] Daily scheduled restart: exiting process with code 0.");
        // You can log to Discord here if you want, but keep it simple:
        process.exit(0);
    }, msUntilRestart);
}

// call this once on startup
scheduleDailyRestart();


// --------------- CLIENT LOGIN ----------------
client.login(config.token).catch((err) => {
    logger.error("Failed to login:");
    console.error(err);
});
