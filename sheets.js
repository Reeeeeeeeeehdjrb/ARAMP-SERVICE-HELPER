const { google } = require("googleapis");
const { SHEET_ID, GOOGLE_CREDS_BASE64 } = require("./config");

if (!SHEET_ID) throw new Error("Missing SHEET_ID env var");
if (!GOOGLE_CREDS_BASE64) throw new Error("Missing GOOGLE_CREDS_BASE64 env var");

const creds = JSON.parse(Buffer.from(GOOGLE_CREDS_BASE64, "base64").toString("utf8"));

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Simple timeout wrapper so Sheets can't hang forever
async function withTimeout(promise, ms, label = "request") {
  let t;
  const timeout = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(t);
  }
}

async function appendRow(tabName, valuesArray) {
  return withTimeout(
    sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [valuesArray] },
    }),
    10000,
    "appendRow"
  );
}

// EXPECTED XP TAB:
// XP!A = Nickname
// XP!B = XP
// XP!C = NextXP
// XP!D = Rank
async function getXpRowByNickname(nickname) {
  const res = await withTimeout(
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "XP!A2:D",
      valueRenderOption: "UNFORMATTED_VALUE",
    }),
    10000,
    "getXpRowByNickname"
  );

  const rows = res.data.values || [];
  const row = rows.find((r) => String(r[0] || "").trim() === String(nickname).trim());
  if (!row) return null;

  const xp = Number(row[1] ?? 0);
  const nextXp = row[2] === "" || row[2] == null ? null : Number(row[2]);
  const rank = String(row[3] ?? "").trim();

  return { nickname: row[0], xp, nextXp, rank };
}

module.exports = { appendRow, getXpRowByNickname };
