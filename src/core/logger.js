const chalk = require("chalk");

function log(type, message) {
  const tag = `[${type}]`.padEnd(10);

  const colours = {
    INFO: chalk.blue,
    SUCCESS: chalk.green,
    WARN: chalk.yellow,
    ERROR: chalk.red,
  };

  const colour = colours[type] || ((x) => x);
  console.log(colour(tag), message);
}

module.exports = {
  info: (m) => log("INFO", m),
  success: (m) => log("SUCCESS", m),
  warn: (m) => log("WARN", m),
  error: (m) => log("ERROR", m),
};
