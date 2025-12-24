const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { TOKEN } = require("./config");
const { registerCommands } = require("./commands");

// Keep-alive server (Render + UptimeRobot)
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅xx"));
app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));

// Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

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
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Command error.", ephemeral: true });
    } else {
      await interaction.reply({ content: "Command error.", ephemeral: true });
    }
  }
});

client.login(TOKEN);
