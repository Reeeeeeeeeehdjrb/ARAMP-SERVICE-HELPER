const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { registerCommands } = require("./commands");
const { DISCORD_TOKEN, PORT, GOOGLE_CREDS_ENV } = require("./config");

console.log("🚀 index.js loaded");

// Log ALL crashes / promise errors (this is what you were missing)
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

// Keep-alive server
const app = express();
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));

if (!process.env[GOOGLE_CREDS_ENV]) {
  console.error(`❌ Missing Google creds env var: ${GOOGLE_CREDS_ENV}`);
} else {
  console.log(`✅ Using Google creds env var: ${GOOGLE_CREDS_ENV}`);
}

if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing in Render env vars");
  process.exit(1);
} else {
  console.log(`✅ DISCORD_TOKEN present (length: ${String(DISCORD_TOKEN).length})`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

client.on("error", (e) => console.error("❌ Discord client error:", e));
client.on("shardError", (e) => console.error("❌ Discord shard error:", e));

registerCommands(client);

client.once("ready", () => {
  console.log(`✅ Discord READY event fired (${client.user.tag})`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error("❌ Command error:", err);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("Command error.");
      } else {
        await interaction.reply({ content: "Command error.", ephemeral: true });
      }
    } catch {}
  }
});

(async () => {
  try {
    console.log("🔑 Attempting Discord login...");
    await client.login(DISCORD_TOKEN);
  } catch (err) {
    console.error("❌ Discord login failed:", err);
    process.exit(1);
  }
})();
