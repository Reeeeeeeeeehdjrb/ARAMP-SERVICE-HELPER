const { google } = require("googleapis");
const { SHEET_ID, GOOGLE_CREDS_ENV } = require("./config");

function mustGetEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

const base64 = mustGetEnv(GOOGLE_CREDS_ENV);

let creds;
try {
  creds = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
} catch (e) {
  throw new Error(
    `Failed to decode/parse ${GOOGLE_CREDS_ENV}. Make sure it's base64 of the FULL JSON file (one line).`
  );
}

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Append a row to a tab
async function appendRow(tabName, valuesArray) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [valuesArray] },
  });
}

// Reads XP data from XP tab
// Expected: XP!A=Nickname, B=XP, C=NextXP, D=Rank
async function getXpRowByNickname(nickname) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "XP!A2:D",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  const row = rows.find((r) => String(r[0] || "").trim() === String(nickname).trim());
  if (!row) return null;

  return {
    nickname: String(row[0] || "").trim(),
    xp: Number(row[1] ?? 0),
    nextXp: row[2] === "" || row[2] == null ? null : Number(row[2]),
    rank: String(row[3] ?? "").trim(),
  };
}

module.exports = { appendRow, getXpRowByNickname };
