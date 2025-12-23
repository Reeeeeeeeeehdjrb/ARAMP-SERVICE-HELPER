const { google } = require('googleapis');
const { SHEET_ID, GOOGLE_JSON_B64 } = require('./config');

const credentials = JSON.parse(Buffer.from(GOOGLE_JSON_B64, 'base64').toString('utf8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function getXP(nickname) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'XP!A:B' });
  const rows = res.data.values || [];
  const row = rows.find(r => r[0] === nickname);
  return row ? parseInt(row[1]) : 0;
}

async function updateXP(nickname, amount) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'XP!A:B' });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] === nickname);
  if (rowIndex >= 0) {
    rows[rowIndex][1] = parseInt(rows[rowIndex][1]) + amount;
  } else {
    rows.push([nickname, amount]);
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'XP!A:B',
    valueInputOption: 'RAW',
    resource: { values: rows }
  });
}

async function appendLog(sheetName, rowArray) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    resource: { values: [rowArray] }
  });
}

module.exports = { getXP, updateXP, appendLog };

