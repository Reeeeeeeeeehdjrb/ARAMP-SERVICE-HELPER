const { Client, GatewayIntentBits } = require("discord.js");

console.log("Starting minimal Discord test bot...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log("✅ BOT IS ONLINE");
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("error", (e) => console.error("Client error:", e));
client.on("warn", (w) => console.warn("Client warn:", w));
client.on("shardError", (e) => console.error("Shard error:", e));
client.on("invalidated", () => console.error("Client invalidated"));

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN missing");
  process.exit(1);
}

console.log("Attempting login...");
client.login(process.env.DISCORD_TOKEN);
