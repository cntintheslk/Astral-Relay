// modules/dbadmin/module.js
const logger = require("../../core/logger");
const db = require("../../services/database");

module.exports = {
    name: "dbadmin",
    description: "Development-only module for inspecting and managing internal database tables.",
    environment: "development", // Prevents loading on production bot

    init(client) {
        logger.info("[dbadmin] Initializing Database Admin module…");

        // This module is dev-only, so ensure environment matches
        if (process.env.ENVIRONMENT !== "development") {
            logger.warn("[dbadmin] Skipping — not in development environment.");
            return;
        }

        // Add dev-only commands dynamically if needed
        // (Your actual dev commands live in src/commands/dev/)
        logger.info("[dbadmin] DB Admin tools active.");

        // Example debug utility (expand later):
        client.dbadmin = {
            listTables() {
                const rows = db.prepare(
                    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                ).all();

                return rows.map(r => r.name);
            },
            get(table) {
                return db.prepare(`SELECT * FROM ${table}`).all();
            }
        };

        logger.success("[module:dbadmin] Initialized");
    }
};
