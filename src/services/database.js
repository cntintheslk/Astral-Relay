// src/core/database.js

const Database = require("better-sqlite3");
const logger = require("../core/logger");
const { log } = require("../core/discordLogger");

// Render persistent disk lives at /data/
const DB_PATH = "/data/astral_relay.sqlite";

let db;

try {
    db = new Database(DB_PATH);

    logger.success(`SQLite database opened at ${DB_PATH}`);
    log("SUCCESS", "Database Ready", `Database initialized at:\n\`${DB_PATH}\``);

} catch (err) {
    logger.error("Failed to open SQLite database:");
    console.error(err);

    log(
        "ERROR",
        "Database Failure",
        `Could not open SQLite database.\n\`\`\`${err.message}\`\`\``
    );

    process.exit(1);
}

module.exports = db;
