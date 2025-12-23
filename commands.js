const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { XP_RANKS, LOG_CHANNEL_ID } = require('./config');
const { getXP, updateXP, appendLog } = require('./sheets');
const { createProgressBar } = require('./progress');

function registerCommands(client) {
    // /xp command
    client.commands.set('xp', {
        data: new SlashCommandBuilder().setName('xp').setDescription('Check your XP and rank'),
        async execute(interaction) {
            const nickname = interaction.member.nickname || interaction.user.username;
            const xp = await getXP(nickname);

            // Determine rank and next rank
            let currentRank = XP_RANKS[0];
            let nextRank = null;
            for (let i = 0; i < XP_RANKS.length; i++) {
                if (xp >= XP_RANKS[i].xp) currentRank = XP_RANKS[i];
                if (XP_RANKS[i].xp > xp) {
                    nextRank = XP_RANKS[i];
                    break;
                }
            }
            if (!nextRank) nextRank = currentRank; // max rank

            const progressBar = createProgressBar(xp - currentRank.xp, nextRank.xp - currentRank.xp);

            const embed = new EmbedBuilder()
                .setTitle(`📊 XP Progress — ${nickname}`)
                .setDescription(`🏅 Current Rank: ${currentRank.name}\n🎯 Next Rank: ${nextRank.name}\nXP: ${xp} / ${nextRank.xp}\n${progressBar}`)
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed] });
        }
    });

    // /log command
    client.commands.set('log', {
        data: new SlashCommandBuilder()
            .setName('log')
            .setDescription('Log an event')
            .addStringOption(opt => opt.setName('event').setDescription('Event type').setRequired(true))
            .addStringOption(opt => opt.setName('attendees').setDescription('Comma-separated attendees').setRequired(true))
            .addStringOption(opt => opt.setName('proof').setDescription('Proof link').setRequired(true)),
        async execute(interaction) {
            const nickname = interaction.member.nickname || interaction.user.username;
            const eventType = interaction.options.getString('event');
            const attendees = interaction.options.getString('attendees');
            const proof = interaction.options.getString('proof');
            const timestamp = new Date().toISOString();

            await appendLog('Log', [timestamp, nickname, eventType, attendees, proof]);

            // Award XP to user
            await updateXP(nickname, 10);

            // Notify log channel if exists
            if (LOG_CHANNEL_ID) {
                const channel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
                channel.send(`📝 New log entry: ${nickname} for ${eventType}`);
            }

            await interaction.reply({ content: 'Log submitted successfully!', ephemeral: true });
        }
    });

    // /logselfpatrol command
    client.commands.set('logselfpatrol', {
        data: new SlashCommandBuilder()
            .setName('logselfpatrol')
            .setDescription('Log your patrol')
            .addStringOption(opt => opt.setName('start').setDescription('Start time').setRequired(true))
            .addStringOption(opt => opt.setName('end').setDescription('End time').setRequired(true))
            .addStringOption(opt => opt.setName('proof').setDescription('Proof link').setRequired(true)),
        async execute(interaction) {
            const nickname = interaction.member.nickname || interaction.user.username;
            const startTime = interaction.options.getString('start');
            const endTime = interaction.options.getString('end');
            const proof = interaction.options.getString('proof');
            const timestamp = new Date().toISOString();

            await appendLog('Self Patrol Log', [timestamp, nickname, startTime, endTime, proof]);

            // Award XP based on duration (simplified)
            await updateXP(nickname, 5);

            await interaction.reply({ content: 'Self patrol logged successfully!', ephemeral: true });
        }
    });
}

module.exports = { registerCommands };
