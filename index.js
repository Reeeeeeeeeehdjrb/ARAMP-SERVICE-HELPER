const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { DISCORD_TOKEN, PORT } = require("./config");
const { registerCommands, registerSlashCommands } = require("./commands");

console.log("🚀 index.js loaded");

// Keep-alive HTTP server (Render + UptimeRobot)
const app = express();
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));

// Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Register command handlers
registerCommands(client);

client.once("ready", async () => {
  console.log(`✅ Discord READY event fired (${client.user.tag})`);
  try {
    console.log("Registering slash commands...");
    await registerSlashCommands();
    console.log("✅ Slash commands registered");
  } catch (e) {
    console.error("❌ Slash command registration failed:", e);
  }
});

client.on("error", (e) => console.error("Discord client error:", e));
client.on("shardError", (e) => console.error("Shard error:", e));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error("Command error:", err);

    // try to respond safely even if already deferred/replied
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
  } catch (e) {
    console.error("❌ Discord login failed:", e);
    process.exit(1);
  }
})();
