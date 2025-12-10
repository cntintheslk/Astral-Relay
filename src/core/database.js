// src/core/database.js
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const loadSchema = require("../modules/_schema");

const dataDir = path.join(__dirname, "../../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, "bot.db");
const db = new Database(dbPath);

// Performance & integrity tweaks
db.pragma("journal_mode = WAL");
// Enable foreign keys if we add constraints later
db.pragma("foreign_keys = ON");

// Load all schema files (system, registration, loa, logging, ...)
loadSchema(db);

module.exports = db;
