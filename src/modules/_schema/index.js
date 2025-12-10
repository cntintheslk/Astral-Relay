// src/modules/_schema/index.js
const fs = require("fs");
const path = require("path");

// Simple schema loader: runs all .sql files in this folder against the DB
function loadSchema(db) {
  const schemaDir = __dirname;

  const files = fs
    .readdirSync(schemaDir)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // alphabetical so system.sql runs first

  for (const file of files) {
    const fullPath = path.join(schemaDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");

    if (!sql.trim()) continue;

    try {
      db.exec(sql);
    } catch (err) {
      console.error(`[SCHEMA] Failed to apply ${file}:`, err);
      throw err;
    }
  }
}

module.exports = loadSchema;
