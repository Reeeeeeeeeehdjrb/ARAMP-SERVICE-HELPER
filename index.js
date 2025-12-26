const { Client, Collection, GatewayIntentBits, REST, Routes } = require("discord.js");
const { startServer } = require("./server");
const { registerCommands } = require("./commands");
const { DISCORD_TOKEN, CLEAR_GLOBAL_COMMANDS, CLIENT_ID } = require("./config");

startServer();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

registerCommands(client);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // OPTIONAL ONE-TIME FIX:
  // If you have a “wrong /xp” still showing, it’s usually a GLOBAL command.
  // Set CLEAR_GLOBAL_COMMANDS=1 in Render ONCE, deploy, then set it back to 0/remove.
  if (CLEAR_GLOBAL_COMMANDS) {
    try {
      const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
      console.log("✅ Cleared GLOBAL commands (set CLEAR_GLOBAL_COMMANDS back to 0 now).");
    } catch (e) {
      console.error("Failed to clear global commands:", e);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    const msg = "Command error (check bot logs).";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN);
