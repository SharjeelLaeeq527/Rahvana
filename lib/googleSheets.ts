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
 * New column order (A → I):
 *  A  Originator (Email)
 *  B  Page / Section
 *  C  Page URL
 *  D  Type
 *  E  Description
 *  F  Attachments
 *  G  Status          ← Dropdown: Not Started / In Progress / Completed
 *  H  Priority        ← Dropdown: Low / Medium / High / Critical
 *  I  Submitted At (PKT)
 */
export async function appendFeedbackToSheet(row: {
  userEmail: string;
  pageName: string;
  pageUrl: string;
  feedbackType: string;
  description: string;
  attachmentUrls: string; // Newline separated URLs
  timestamp: string;
  priority?: string;
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
    row.attachmentUrls,
    "Not Started",   // Default status
    row.priority || "Medium",
    row.timestamp,
  ]];

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

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

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
  });

  if (data.values?.[0]?.[0] === "Originator") return;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:I1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "Originator",
        "Page / Section",
        "Page URL",
        "Type",
        "Description",
        "Attachments",
        "Status",
        "Priority",
        "Submitted At (PKT)",
      ]],
    },
  });

  const sheetId = await getSheetTabId(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // Header Formatting: Bold, centered, light gray background (no more teal)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 9 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        // Column Widths
        ...([220, 200, 300, 150, 400, 250, 130, 110, 200] as const).map((pixelSize, i) => ({
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
            properties: { pixelSize },
            fields: "pixelSize",
          },
        })),
        // Status Dropdown
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 6, endColumnIndex: 7 },
            rule: {
              condition: {
                type: "ONE_OF_LIST",
                values: [
                  { userEnteredValue: "Not Started" },
                  { userEnteredValue: "In Progress" },
                  { userEnteredValue: "Completed" },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // Priority Dropdown
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 7, endColumnIndex: 8 },
            rule: {
              condition: {
                type: "ONE_OF_LIST",
                values: [
                  { userEnteredValue: "Low" },
                  { userEnteredValue: "Medium" },
                  { userEnteredValue: "High" },
                  { userEnteredValue: "Critical" },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // Wrapping for description
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 4, endColumnIndex: 5 },
            cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
            fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
          },
        },
      ],
    },
  });
}

async function applyRowFormatting(
  sheets: ReturnType<typeof google.sheets>,
  rowIndex: number,
) {
  const sheetId = await getSheetTabId(sheets);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 6, endColumnIndex: 8 },
            cell: { userEnteredFormat: { horizontalAlignment: "CENTER", textFormat: { bold: true } } },
            fields: "userEnteredFormat(horizontalAlignment,textFormat)",
          },
        },
      ],
    },
  });
}

async function getSheetTabId(sheets: ReturnType<typeof google.sheets>): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tab = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
  return tab?.properties?.sheetId ?? 0;
}
