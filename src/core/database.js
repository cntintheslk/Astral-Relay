// src/core/database.js
const Database = require("better-sqlite3");
const logger = require("./logger");
const { log } = require("./discordLogger");
const path = require("path");
const fs = require("fs");

// Ensure /data exists (Render persistent disk)
const DB_PATH = new Database("/data/astral_relay.sqlite");
if (!fs.existsSync("/data")) fs.mkdirSync("/data");

const db = new Database(DB_PATH, (err) => {
    if (err) {
        logger.error("Failed to open SQLite database:");
        console.error(err);

        log(
            "ERROR",
            "Database Error",
            `Failed to open SQLite database.\n\`\`\`${err.message}\`\`\``
        );
        return;
    }

    logger.success("SQLite database loaded successfully.");
    log("SUCCESS", "Database Ready", "SQLite database connected successfully.");
});

module.exports = db;
