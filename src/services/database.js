// ============================================================
// Astral Relay — Core Database Initialisation
// ============================================================

const Database = require("better-sqlite3");
const logger = require("./logger");

// ============================================================
// CONFIGURATION
// ============================================================

// Render persistent disk location
// NOTE: This path must exist on the Render instance
const DB_PATH = "/data/astral_relay.sqlite";

// ============================================================
// DATABASE INITIALISATION
// ============================================================

let db;

try {
    // Attempt to open (or create) the SQLite database
    db = new Database(DB_PATH);

    // Log successful initialisation
    logger.success(`SQLite database opened at ${DB_PATH}`);

} catch (err) {
    // Critical failure — database is required for operation
    logger.error("Failed to open SQLite database");

    // Log detailed error information safely
    logger.error(err?.stack || err?.message || String(err));

    // Exit immediately to prevent partial startup
    process.exit(1);
}

// ============================================================
// EXPORT
// ============================================================

// Export the live database instance for use across the application
module.exports = db;
