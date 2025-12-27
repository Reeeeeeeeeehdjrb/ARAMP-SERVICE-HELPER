const { google } = require("googleapis");
const { SHEET_ID, GOOGLE_CREDS_ENV } = require("./config");

// Timeout helper so Sheets never hangs forever
function withTimeout(promise, ms, label = "timeout") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label)), ms)),
  ]);
}

if (!process.env[GOOGLE_CREDS_ENV]) {
  throw new Error(`Missing ${GOOGLE_CREDS_ENV} environment variable`);
}

const creds = JSON.parse(
  Buffer.from(process.env[GOOGLE_CREDS_ENV], "base64").toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function appendRow(tabName, valuesArray) {
  return withTimeout(
    sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [valuesArray] },
    }),
    8000,
    "Google Sheets append timeout"
  );
}

// XP tab layout: A=Nickname, B=XP, C=NextXP, D=Rank
async function getXpRowByNickname(nickname) {
  const res = await withTimeout(
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "XP!A2:D",
      valueRenderOption: "UNFORMATTED_VALUE",
    }),
    8000,
    "Google Sheets read timeout"
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
