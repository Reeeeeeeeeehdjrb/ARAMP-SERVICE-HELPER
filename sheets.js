const { google } = require("googleapis");
const { SHEET_ID, GOOGLE_CREDS_BASE64 } = require("./config");

if (!SHEET_ID) throw new Error("Missing SHEET_ID env var");
if (!GOOGLE_CREDS_BASE64) throw new Error("Missing GOOGLE_CREDS_BASE64 env var");

const creds = JSON.parse(Buffer.from(GOOGLE_CREDS_BASE64, "base64").toString("utf8"));

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      // backoff: 400ms, 900ms, 1600ms
      await sleep(400 + i * i * 500);
    }
  }
  throw lastErr;
}

async function appendRow(tabName, valuesArray) {
  return withRetry(async () => {
    return sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [valuesArray] }
    });
  });
}

// XP tab expected layout:
// A Nickname | B XP | C NextXP | D Rank
async function getXpRowByNickname(nickname) {
  return withRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "XP!A2:D",
      valueRenderOption: "UNFORMATTED_VALUE"
    });

    const rows = res.data.values || [];
    const row = rows.find((r) => String(r[0] || "").trim() === String(nickname).trim());
    if (!row) return null;

    const xp = Number(row[1] ?? 0);
    const nextXp = row[2] === "" || row[2] == null ? null : Number(row[2]);
    const rank = String(row[3] ?? "").trim();

    return { nickname: row[0], xp, nextXp, rank };
  });
}

module.exports = { appendRow, getXpRowByNickname };
