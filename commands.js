const {
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const { appendRow, getXpRowByNickname } = require("./sheets");
const { blockBar } = require("./progress");
const { CLIENT_ID, GUILD_ID, LOG_ROLE_ID } = require("./config");

function displayName(member) {
  return member?.nickname || member?.user?.username || "Unknown";
}

function hasLogRole(member) {
  if (!LOG_ROLE_ID) return true; // if not set, don't lock you out
  return member.roles?.cache?.has(LOG_ROLE_ID);
}

const commandsData = [
  new SlashCommandBuilder().setName("xp").setDescription("Check XP (from Google Sheets)"),

  new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log an event")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Event type")
        .setRequired(true)
        .addChoices(
          { name: "Combat Training", value: "Combat Training" },
          { name: "Patrol", value: "Patrol" },
          { name: "Recruitment Session", value: "Recruitment Session" },
          { name: "Special Event", value: "Special Event" },
          { name: "Defense Training", value: "Defense Training" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("attendees").setDescription("Comma separated attendees").setRequired(true)
    )
    .addStringOption((opt) => opt.setName("proof").setDescription("Proof").setRequired(true)),

  new SlashCommandBuilder()
    .setName("logselfpatrol")
    .setDescription("Log a self patrol")
    .addStringOption((opt) => opt.setName("start").setDescription("Start time").setRequired(true))
    .addStringOption((opt) => opt.setName("end").setDescription("End time").setRequired(true))
    .addStringOption((opt) => opt.setName("proof").setDescription("Proof").setRequired(true)),
];

function registerCommands(client) {
  // /xp
  client.commands.set("xp", {
    data: commandsData[0],
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });

      const nick = displayName(interaction.member);
      const row = await getXpRowByNickname(nick);

      if (!row) {
        return interaction.editReply(
          `No XP row found for **${nick}** in the **XP** tab.\nMake sure XP!A matches your server nickname exactly.`
        );
      }

      const { xp, nextXp, rank } = row;
      const bar = nextXp ? blockBar(xp, nextXp) : "████████████████████";
      const needed = nextXp ? Math.max(0, nextXp - xp) : null;

      const embed = new EmbedBuilder()
        .setTitle(`${nick}`)
        .addFields(
          { name: "Rank", value: rank || "Unknown", inline: true },
          { name: "XP", value: String(xp), inline: true },
          {
            name: "Progress",
            value: nextXp
              ? `${bar}\n${xp}/${nextXp} (${needed} left)`
              : `${bar}\nNextXP not set in sheet`,
          }
        )
        .setColor(0x2f3136);

      return interaction.editReply({ embeds: [embed] });
    },
  });

  // /log
  client.commands.set("log", {
    data: commandsData[1],
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });

      if (!hasLogRole(interaction.member)) {
        return interaction.editReply("❌ You don’t have permission to use **/log**.");
      }

      const nick = displayName(interaction.member);
      const type = interaction.options.getString("type");
      const attendees = interaction.options.getString("attendees");
      const proof = interaction.options.getString("proof");
      const timestamp = new Date().toISOString();

      await appendRow("LOG", [timestamp, nick, type, attendees, proof]);

      return interaction.editReply("✅ Logged to Google Sheets (LOG).");
    },
  });

  // /logselfpatrol
  client.commands.set("logselfpatrol", {
    data: commandsData[2],
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true });

      const nick = displayName(interaction.member);
      const start = interaction.options.getString("start");
      const end = interaction.options.getString("end");
      const proof = interaction.options.getString("proof");
      const timestamp = new Date().toISOString();

      await appendRow("SELF_PATROL", [timestamp, nick, start, end, proof]);

      return interaction.editReply("✅ Logged to Google Sheets (SELF_PATROL).");
    },
  });

  // Register slash commands (guild)
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  (async () => {
    try {
      console.log("Registering slash commands...");
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commandsData.map((c) => c.toJSON()),
      });
      console.log("✅ Slash commands registered");
    } catch (err) {
      console.error("❌ Slash command registration failed:", err);
    }
  })();
}

module.exports = { registerCommands };
