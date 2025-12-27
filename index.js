// Minimal Discord login test bot (no commands, no sheets)

const { Client, GatewayIntentBits, Events } = require("discord.js");

// OPTIONAL: keep-alive web server for Render Web Service + UptimeRobot
const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("Discord test bot alive ✅"));
app.listen(PORT, () => console.log(`Keep-alive server listening on ${PORT}`));

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing");
  process.exit(1);
}

console.log(`✅ DISCORD_TOKEN present (length: ${process.env.DISCORD_TOKEN.length})`);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ LOGGED IN as ${c.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "Discord login test ✅" }],
    status: "online",
  });
});

client.on("error", (err) => console.error("❌ Client error:", err));
client.on("warn", (info) => console.warn("⚠️ Client warn:", info));
process.on("unhandledRejection", (err) => console.error("❌ UnhandledRejection:", err));

console.log("🔑 Attempting Discord login...");
client.login(process.env.DISCORD_TOKEN);
