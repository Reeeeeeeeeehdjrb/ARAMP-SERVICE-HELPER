const { google } = require("googleapis");
const { SHEET_ID, GOOGLE_CREDS_ENV } = require("./config");

const envName = GOOGLE_CREDS_ENV;

if (!process.env[envName]) {
  throw new Error(`Missing ${envName} environment variable`);
}

const creds = JSON.parse(
  Buffer.from(process.env[envName], "base64").toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function appendRow(tabName, valuesArray) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [valuesArray] },
  });
}

/**
 * XP sheet expected columns:
 * XP!A = Roblox Username  (key)
 * XP!B = XP
 * XP!C = NextXP
 * XP!D = Rank
 */
async function getXpRowByRobloxUsername(robloxUsername) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "XP!A2:D",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  const row = rows.find(
    (r) => String(r[0] || "").trim().toLowerCase() === String(robloxUsername).trim().toLowerCase()
  );

  if (!row) return null;

  return {
    key: row[0],
    xp: Number(row[1] ?? 0),
    nextXp: row[2] === "" || row[2] == null ? null : Number(row[2]),
    rank: String(row[3] ?? "").trim(),
  };
}

module.exports = { appendRow, getXpRowByRobloxUsername };
