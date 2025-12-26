const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { TOKEN } = require("./config");
const { startServer } = require("./server");
const { registerCommands } = require("./commands");

startServer();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

registerCommands(client);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error("interaction error:", err);
    // If something explodes before defer/reply, attempt an ephemeral reply
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Command error.", ephemeral: true }).catch(() => {});
    }
  }
});

client.login(TOKEN);
