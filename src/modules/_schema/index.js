// src/modules/_schema/index.js

const fs = require("fs");
const path = require("path");
const { db } = require("../../core/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

module.exports = {
    loadSchemas() {
        const schemaDir = __dirname;

        const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".sql"));

        logger.info(`Loading ${files.length} SQL schema files...`);

        for (const file of files) {
            try {
                const filePath = path.join(schemaDir, file);
                const sql = fs.readFileSync(filePath, "utf8");

                db.exec(sql);

                logger.success(`Applied schema: ${file}`);
            } catch (err) {
                logger.error(`Failed to apply schema ${file}: ${err.message}`);
                log(
                    "ERROR",
                    "Schema Load Error",
                    `File: **${file}**\n\`\`\`${err.message}\`\`\``
                );
            }
        }
    },
};
