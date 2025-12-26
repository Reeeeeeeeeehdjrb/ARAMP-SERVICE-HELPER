const { google } = require("googleapis");
const { SHEET_ID } = require("./config");

// ✅ USE YOUR EXISTING ENV VAR NAME
const ENV_NAME = "GOOGLE_CREDS_BASE64";

if (!process.env[ENV_NAME]) throw new Error(`Missing ${ENV_NAME} environment variable`);
if (!SHEET_ID) throw new Error("Missing SHEET_ID environment variable");

const creds = JSON.parse(Buffer.from(process.env[ENV_NAME], "base64").toString("utf8"));

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Promise timeout wrapper
async function withTimeout(promise, ms, label = "Sheets request") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

// Retry wrapper (handles temporary Google hiccups)
async function withRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      // backoff: 0.5s, 1s, 2s
      await sleep(500 * Math.pow(2, i));
    }
  }
  throw lastErr;
}

async function appendRow(tabName, valuesArray) {
  return withRetry(() =>
    withTimeout(
      sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${tabName}!A:Z`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [valuesArray] },
      }),
      8000,
      "appendRow"
    )
  );
}

// XP tab expected layout: A=Nickname, B=XP, C=NextXP, D=Rank
async function getXpRowByNickname(nickname) {
  const res = await withRetry(() =>
    withTimeout(
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "XP!A2:D",
        valueRenderOption: "UNFORMATTED_VALUE",
      }),
      8000,
      "getXpRowByNickname"
    )
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
