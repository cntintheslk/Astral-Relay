// src/core/database.js

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const logger = require("./logger");
const { log } = require("./discordLogger");

// Path to database file
const dbPath = path.join(__dirname, "../../data/astral_relay.sqlite");

// Ensure /data directory exists
const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db;

try {
    db = new Database(dbPath);
    logger.success("SQLite database loaded successfully.");
} catch (err) {
    logger.error("Failed to load SQLite database:");
    console.error(err);
}

module.exports = {
    db,

    run(query, params = []) {
        try {
            return db.prepare(query).run(params);
        } catch (err) {
            logger.error(`DB RUN ERROR: ${err.message}`);
            log("ERROR", "Database Run Error", `\`\`\`${err.message}\`\`\``);
            throw err;
        }
    },

    get(query, params = []) {
        try {
            return db.prepare(query).get(params);
        } catch (err) {
            logger.error(`DB GET ERROR: ${err.message}`);
            log("ERROR", "Database Get Error", `\`\`\`${err.message}\`\`\``);
            throw err;
        }
    },

    all(query, params = []) {
        try {
            return db.prepare(query).all(params);
        } catch (err) {
            logger.error(`DB ALL ERROR: ${err.message}`);
            log("ERROR", "Database All Error", `\`\`\`${err.message}\`\`\``);
            throw err;
        }
    }
};
