module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,

  SHEET_ID: process.env.SHEET_ID,

  // ✅ DO NOT CHANGE THIS NAME AGAIN
  GOOGLE_CREDS_BASE64: process.env.GOOGLE_CREDS_BASE64,

  LOG_ROLE_ID: process.env.LOG_ROLE_ID || "",

  PORT: process.env.PORT || 10000
};
