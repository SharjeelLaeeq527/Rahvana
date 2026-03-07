// lib/googleSheets.ts
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";
const SHEET_NAME = "Feedback";

const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  : null;

function getAuth() {
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env variable is not set.");
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/**
 * New column order (A → H):
 *  A  User Email
 *  B  Page / Section
 *  C  Page URL
 *  D  Feedback Type
 *  E  Description
 *  F  Attachment
 *  G  Status          ← dropdown: Open / In Progress / Resolved
 *  H  Submitted At (PKT)
 */
export async function appendFeedbackToSheet(row: {
  userEmail: string;
  pageName: string;
  pageUrl: string;
  feedbackType: string;
  description: string;
  attachmentUrl: string;
  timestamp: string;
}) {
  if (!SPREADSHEET_ID) {
    console.warn("GOOGLE_SHEET_ID not set – skipping Google Sheets sync.");
    return;
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await ensureSheetHeaders(sheets);

  const values = [[
    row.userEmail,
    row.pageName,
    row.pageUrl,
    row.feedbackType,
    row.description,
    row.attachmentUrl,
    "Open",          // default status
    row.timestamp,
  ]];

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  // Find the row index that was just added and apply status dropdown + URL formatting
  const updatedRange = appendRes.data.updates?.updatedRange ?? "";
  const match = updatedRange.match(/(\d+)$/);
  if (match) {
    const rowIndex = parseInt(match[1]) - 1; // 0-indexed
    await applyRowFormatting(sheets, rowIndex);
  }
}

async function ensureSheetHeaders(
  sheets?: ReturnType<typeof google.sheets>,
) {
  if (!SPREADSHEET_ID) return;

  if (!sheets) {
    const auth = getAuth();
    sheets = google.sheets({ version: "v4", auth });
  }

  // Check if headers already exist
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
  });

  if (data.values?.[0]?.[0] === "User Email") return; // already initialised

  // Write header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:H1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "User Email",
        "Page / Section",
        "Page URL",
        "Feedback Type",
        "Description",
        "Attachment",
        "Status",
        "Submitted At (PKT)",
      ]],
    },
  });

  const sheetId = await getSheetTabId(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // ── Bold + teal header background ──────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.05, green: 0.60, blue: 0.60 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                wrapStrategy: "CLIP",
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy)",
          },
        },
        // ── Freeze header row ──────────────────────────────────────────────
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        // ── Set column widths (px) ─────────────────────────────────────────
        ...([220, 180, 320, 160, 380, 220, 130, 190] as const).map(
          (pixelSize, columnIndex) => ({
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: columnIndex, endIndex: columnIndex + 1 },
              properties: { pixelSize },
              fields: "pixelSize",
            },
          }),
        ),
        // ── Status column header: set data-validation for ALL data rows ─────
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 6, endColumnIndex: 7 },
            rule: {
              condition: {
                type: "ONE_OF_LIST",
                values: [
                  { userEnteredValue: "Open" },
                  { userEnteredValue: "In Progress" },
                  { userEnteredValue: "Resolved" },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // ── Row height for data rows ───────────────────────────────────────
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 1000 },
            properties: { pixelSize: 36 },
            fields: "pixelSize",
          },
        },
        // ── Alternating row colors (zebra) ─────────────────────────────────
        {
          addBanding: {
            bandedRange: {
              range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 8 },
              rowProperties: {
                headerColor: { red: 0.05, green: 0.60, blue: 0.60 },
                firstBandColor: { red: 1, green: 1, blue: 1 },
                secondBandColor: { red: 0.93, green: 0.98, blue: 0.98 },
              },
            },
          },
        },
        // ── Wrap description column (E) ────────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 4, endColumnIndex: 5 },
            cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
            fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
          },
        },
      ],
    },
  });
}

/** Applies status dropdown + makes URL in column C a hyperlink */
async function applyRowFormatting(
  sheets: ReturnType<typeof google.sheets>,
  rowIndex: number, // 0-based
) {
  const sheetId = await getSheetTabId(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // Centre-align status cell
        {
          repeatCell: {
            range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 6, endColumnIndex: 7 },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: "CENTER",
                textFormat: { bold: true },
              },
            },
            fields: "userEnteredFormat(horizontalAlignment,textFormat)",
          },
        },
        // Centre-align feedback type cell
        {
          repeatCell: {
            range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 3, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: { horizontalAlignment: "CENTER" },
            },
            fields: "userEnteredFormat(horizontalAlignment)",
          },
        },
      ],
    },
  });
}

export async function initSheetOnce() {
  await ensureSheetHeaders();
}

async function getSheetTabId(
  sheets: ReturnType<typeof google.sheets>,
): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tab  = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
  return tab?.properties?.sheetId ?? 0;
}
