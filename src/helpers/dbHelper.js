// src/core/dbHelpers.js
const db = require("./database");
const { log } = require("../core/discordLogger");
const logger = require("../core/logger");

// --------------------
// RUN (INSERT/UPDATE/DELETE)
// --------------------
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                logger.error(`DB RUN Error: ${err.message}`);
                log("ERROR", "Database Query Error", `\`\`\`${err.message}\`\`\``);
                return reject(err);
            }
            resolve(this);
        });
    });
}

// --------------------
// GET (single row)
// --------------------
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, function (err, row) {
            if (err) {
                logger.error(`DB GET Error: ${err.message}`);
                log("ERROR", "Database Query Error", `\`\`\`${err.message}\`\`\``);
                return reject(err);
            }
            resolve(row);
        });
    });
}

// --------------------
// ALL (multiple rows)
// --------------------
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, function (err, rows) {
            if (err) {
                logger.error(`DB ALL Error: ${err.message}`);
                log("ERROR", "Database Query Error", `\`\`\`${err.message}\`\`\``);
                return reject(err);
            }
            resolve(rows);
        });
    });
}

module.exports = { run, get, all };
