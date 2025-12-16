// ============================================================
// ASTRAL RELAY — DATABASE SCHEMA LOADER
// Loads and applies SQL schema files at startup.
// ============================================================

const fs = require("fs");
const path = require("path");
const db = require("../../services/database");
const logger = require("../../core/logger");

// ------------------------------------------------------------
// SCHEMA LOADER
// ------------------------------------------------------------

function loadSchemas() {
    const schemaDir = __dirname;

    const files = fs
        .readdirSync(schemaDir)
        .filter(file => file.endsWith(".sql"));

    logger.info(`Loading ${files.length} SQL schema files...`);

    for (const file of files) {
        const filePath = path.join(schemaDir, file);
        const sql = fs.readFileSync(filePath, "utf8");

        try {
            db.exec(sql);
            logger.success(`Applied schema: ${file}`);
        } catch (err) {
            logger.error("Failed to apply schema.", {
                file,
                error: err?.stack || err.message,
            });
            throw err; // schema failure should halt startup
        }
    }
}

module.exports = loadSchemas;
