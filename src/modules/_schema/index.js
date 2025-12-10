const fs = require("fs");
const path = require("path");
const db = require("../../core/database");
const logger = require("../../core/logger");
const { log } = require("../../core/discordLogger");

function loadSchemas() {
    const schemaDir = path.join(__dirname);
    const files = fs.readdirSync(schemaDir).filter(f => f.endsWith(".sql"));

    logger.info(`Loading ${files.length} SQL schema files...`);
    log("INFO", "DB Schema Loader", `Loading **${files.length}** schema files.`);

    for (const file of files) {
        const filePath = path.join(schemaDir, file);
        const sql = fs.readFileSync(filePath, "utf8");

        db.exec(sql, (err) => {
            if (err) {
                logger.error(`Failed to apply schema: ${file}`);
                console.error(err);

                log(
                    "ERROR",
                    "Schema Load Error",
                    `Schema: \`${file}\`\n\`\`\`${err.message}\`\`\``
                );
                return;
            }

            logger.success(`Applied schema: ${file}`);
            log("SUCCESS", "Schema Applied", `\`${file}\` successfully applied.`);
        });
    }
}

module.exports = { loadSchemas };
