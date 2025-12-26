module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,

  SHEET_ID: process.env.SHEET_ID,

  // Role restriction for /log
  LOG_ROLE_ID: process.env.LOG_ROLE_ID,

  // Service account base64 (supports either env var name)
  GOOGLE_B64:
    process.env.GOOGLE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_CREDS_BASE64 ||
    "",

  // Optional: set to "1" once to wipe global commands (fixes “wrong /xp” showing up)
  CLEAR_GLOBAL_COMMANDS: process.env.CLEAR_GLOBAL_COMMANDS === "1"
};
