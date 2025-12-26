const { SlashCommandBuilder, REST, Routes, EmbedBuilder } = require("discord.js");
const { appendRow, getXpRowByNickname } = require("./sheets");
const { blockBar } = require("./progress");
const { CLIENT_ID, GUILD_ID, LOG_ROLE_ID } = require("./config");

function getDisplayName(member) {
  return member.nickname || member.user.username;
}

function hasRole(member, roleId) {
  if (!roleId) return true; // if not set, don't lock yourself out
  return member.roles.cache.has(roleId);
}

const ALLOWED_TYPES = [
  "Combat Training",
  "Patrol",
  "Recruitment Session",
  "Special Event",
  "Defense Training",
];

const commandsData = [
  new SlashCommandBuilder().setName("xp").setDescription("Check XP (from Google Sheets)"),

  new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log an event (restricted role)")
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
    .addStringOption((opt) => opt.setName("proof").setDescription("Ending proof").setRequired(true)),

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
      await interaction.deferReply({ ephemeral: false }); // ✅ prevents timeout

      try {
        const nickname = getDisplayName(interaction.member);
        const row = await getXpRowByNickname(nickname);

        if (!row) {
          return interaction.editReply(
            `No XP row found for **${nickname}** in the **XP** tab (XP!A).`
          );
        }

        const xp = row.xp;
        const nextXp = row.nextXp;
        const rank = row.rank || "Unknown";

        const bar = nextXp ? blockBar(xp, nextXp) : "████████████████████";
        const needed = nextXp ? Math.max(0, nextXp - xp) : null;

        const embed = new EmbedBuilder()
          .setTitle(`${nickname}`)
          .addFields(
            { name: "Rank", value: rank, inline: true },
            { name: "XP", value: String(xp), inline: true },
            {
              name: "Progress",
              value: nextXp ? `${bar}\n${xp}/${nextXp} (${needed} left)` : `${bar}\nNextXP not set`,
            }
          )
          .setColor(0x2f3136);

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error("xp error:", err);
        return interaction.editReply(
          "Sheets is slow/unavailable right now. Try again in a minute."
        );
      }
    },
  });

  // /log
  client.commands.set("log", {
    data: commandsData[1],
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true }); // ✅ prevents timeout

      try {
        if (!hasRole(interaction.member, LOG_ROLE_ID)) {
          return interaction.editReply("❌ You don’t have permission to use **/log**.");
        }

        const nickname = getDisplayName(interaction.member);
        const type = interaction.options.getString("type");

        // ✅ server-side validation (even though choices restrict it)
        if (!ALLOWED_TYPES.includes(type)) {
          return interaction.editReply("❌ Invalid event type.");
        }

        const attendeesRaw = interaction.options.getString("attendees"); // comma separated
        const proof = interaction.options.getString("proof");
        const timestamp = new Date().toISOString();

        // ✅ ONLY append logs (NO XP adds here)
        await appendRow("LOG", [timestamp, nickname, type, attendeesRaw, proof]);

        return interaction.editReply("✅ Logged to Google Sheets (LOG).");
      } catch (err) {
        console.error("log error:", err);
        return interaction.editReply(
          "Sheets is slow/unavailable right now. Your log may not have saved — try again."
        );
      }
    },
  });

  // /logselfpatrol
  client.commands.set("logselfpatrol", {
    data: commandsData[2],
    execute: async (interaction) => {
      await interaction.deferReply({ ephemeral: true }); // ✅ prevents timeout

      try {
        const nickname = getDisplayName(interaction.member);
        const start = interaction.options.getString("start");
        const end = interaction.options.getString("end");
        const proof = interaction.options.getString("proof");
        const timestamp = new Date().toISOString();

        // ✅ ONLY append logs (NO XP adds here)
        await appendRow("SELF_PATROL", [timestamp, nickname, start, end, proof]);

        return interaction.editReply("✅ Logged to Google Sheets (SELF_PATROL).");
      } catch (err) {
        console.error("logselfpatrol error:", err);
        return interaction.editReply(
          "Sheets is slow/unavailable right now. Your log may not have saved — try again."
        );
      }
    },
  });

  // Register slash commands once on startup
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  (async () => {
    try {
      console.log("Registering slash commands...");
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commandsData.map((c) => c.toJSON()),
      });
      console.log("Commands registered.");
    } catch (err) {
      console.error(err);
    }
  })();
}

module.exports = { registerCommands };
