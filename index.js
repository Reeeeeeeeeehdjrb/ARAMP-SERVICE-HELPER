const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { DISCORD_TOKEN } = require('./config');
const { registerCommands } = require('./commands');
const server = require('./server');

// Create Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel]
});

// Collection for commands
client.commands = new Collection();

// Register commands
registerCommands(client);

// On bot ready
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

// Interaction handling
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
});

// Log in
client.login(DISCORD_TOKEN);

// Start keepalive server
server();
