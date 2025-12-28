const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { TOKEN } = require("./config");
const { registerCommands } = require("./commands");

// Keep-alive server (Render + UptimeRobot)
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

console.log("🚀 index.js loaded");

// Register commands + handlers
registerCommands(client);

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error("Command error:", err);

    // Try to respond safely
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("❌ Command error.");
      } else {
        await interaction.reply({ content: "❌ Command error.", flags: 64 });
      }
    } catch {}
  }
});

console.log("🔑 Attempting Discord login...");
client.login(TOKEN);
