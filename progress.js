const { getUserData, addXP } = require('./sheets');
const { LOG_CHANNEL_ID } = require('./config');

function progressBar(current, next) {
  const total = 20;
  const percent = Math.min(current / next, 1);
  const filled = Math.floor(total * percent);
  return '█'.repeat(filled) + '░'.repeat(total - filled);
}

async function awardXP(client, nickname, amount) {
  const before = await getUserData(nickname);
  if (!before) return;

  await addXP(nickname, amount);

  const after = await getUserData(nickname);
  if (!after) return;

  // 🔔 RANK-UP DETECTION (SHEET-BASED)
  if (before.rank !== after.rank) {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    await channel.send(
      `🎉 **${nickname} ranked up!**\n` +
      `**${before.rank} → ${after.rank}**`
    );
  }

  return { before, after };
}

module.exports = { awardXP, progressBar };
