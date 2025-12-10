// src/core/logger.js

const chalk = require("chalk").default;
const config = require("./config");

const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"];
const currentLevelIndex = LEVELS.indexOf(config.logLevel.toUpperCase()) || 1;

function shouldLog(level) {
    return LEVELS.indexOf(level) >= currentLevelIndex;
}

module.exports = {
    debug(msg) {
        if (shouldLog("DEBUG")) console.log(chalk.gray(`[DEBUG]    ${msg}`));
    },
    info(msg) {
        if (shouldLog("INFO")) console.log(chalk.blue(`[INFO]     ${msg}`));
    },
    success(msg) {
        if (shouldLog("INFO")) console.log(chalk.green(`[SUCCESS]  ${msg}`));
    },
    warn(msg) {
        if (shouldLog("WARN")) console.log(chalk.yellow(`[WARN]     ${msg}`));
    },
    error(msg) {
        if (shouldLog("ERROR")) console.log(chalk.red(`[ERROR]    ${msg}`));
    }
};
