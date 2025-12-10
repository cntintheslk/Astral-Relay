// src/core/config.js

module.exports = {
  token: process.env.BOT_TOKEN,
  environment: process.env.NODE_ENV || "production",
  logChannelId: process.env.LOG_CHANNEL_ID,
  devGuildId: process.env.DEV_GUILD_ID,
};
