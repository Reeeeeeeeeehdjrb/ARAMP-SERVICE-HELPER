const { google } = require("googleapis");
const { SHEET_ID } = require("./config");

// 🔑 USE EXISTING ENV VAR NAME
const ENV_NAME = "GOOGLE_CREDS_BASE64";

if (!process.env[ENV_NAME]) {
  throw new Error(`Missing ${ENV_NAME} environment variable`);
}

const creds = JSON.parse(
  Buffer.from(process.env[ENV_NAME], "base64").toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Append logs ONLY (no XP logic)
async function appendRow(tabName, valuesArray) {
  return sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [valuesArray] },
  });
}

// Read XP ONLY (computed by Sheets formulas)
async function getXpRowByNickname(nickname) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "XP!A2:D",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  const row = rows.find(
    (r) => String(r[0] || "").trim() === String(nickname).trim()
  );

  if (!row) return null;

  return {
    nickname: row[0],
    xp: Number(row[1] ?? 0),
    nextXp: row[2] == null || row[2] === "" ? null : Number(row[2]),
    rank: String(row[3] ?? "").trim(),
  };
}

module.exports = { appendRow, getXpRowByNickname };
