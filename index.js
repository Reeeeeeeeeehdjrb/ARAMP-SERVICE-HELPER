const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { DISCORD_TOKEN } = require("./config");
const { registerCommands } = require("./commands");
const { startServer } = require("./server");

startServer();

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

  await command.execute(interaction);
});

client.login(DISCORD_TOKEN);
