const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { awardXP, progressBar } = require('./progress');
const { getUserData } = require('./sheets');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('xp')
      .setDescription('Check your XP and rank'),
    async execute(interaction) {
      const nickname =
        interaction.member.nickname || interaction.user.username;

      const data = await getUserData(nickname);
      if (!data)
        return interaction.reply({ content: 'No XP record found.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(`${nickname}`)
        .addFields(
          { name: 'Rank', value: data.rank, inline: true },
          { name: 'XP', value: `${data.xp}`, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('log')
      .setDescription('Log an event')
      .addStringOption(o => o.setName('type').setRequired(true))
      .addStringOption(o => o.setName('attendees').setRequired(true))
      .addStringOption(o => o.setName('proof').setRequired(true)),
    async execute(interaction) {
      const nickname =
        interaction.member.nickname || interaction.user.username;

      await awardXP(interaction.client, nickname, 5);
      await interaction.reply({ content: 'Log submitted.', ephemeral: true });
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('logselfpatrol')
      .setDescription('Log a self patrol')
      .addStringOption(o => o.setName('start').setRequired(true))
      .addStringOption(o => o.setName('end').setRequired(true))
      .addStringOption(o => o.setName('proof').setRequired(true)),
    async execute(interaction) {
      const nickname =
        interaction.member.nickname || interaction.user.username;

      await awardXP(interaction.client, nickname, 3);
      await interaction.reply({ content: 'Self patrol logged.', ephemeral: true });
    }
  }
];
