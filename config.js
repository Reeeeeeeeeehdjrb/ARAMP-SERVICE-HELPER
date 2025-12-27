module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,

  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,

  SHEET_ID: process.env.SHEET_ID,

  // keep-alive web port
  PORT: process.env.PORT || 3000,

  // Google service account base64 JSON (keep the name stable)
  GOOGLE_CREDS_ENV: "GOOGLE_CREDS_BASE64",

  // optional restriction for /log
  LOG_ROLE_ID: process.env.LOG_ROLE_ID || null,
};
