const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { registerCommands } = require("./commands");
const { TOKEN } = require("./config");

// ── Keep-alive server (Render + UptimeRobot)
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));

// ── Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Register slash commands + handlers
registerCommands(client);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("❌ An error occurred.");
    } else {
      await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
    }
  }
});

client.login(TOKEN);
