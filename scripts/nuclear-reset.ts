// Script to TOTAL RESET the sheet: Remove colors, banding, and old data.
// Run: npx tsx scripts/nuclear-reset.ts

import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = "Feedback";

async function main() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 1. Get sheet ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tab = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
  
  if (!tab) {
    console.error(`❌ Error: Could not find tab named "${SHEET_NAME}". Please make sure your tab is renamed to "Feedback".`);
    return;
  }
  const sheetId = tab.properties?.sheetId ?? 0;

  console.log("🚀 Starting Nuclear Reset...");

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // Clear ALL values and formatting in the entire sheet
        {
          updateCells: {
            range: { sheetId },
            fields: "userEnteredFormat,userEnteredValue"
          }
        },
        // Delete ALL banding (zebra colors) - This is what caused the sticky green background
        {
          deleteBanding: { bandedRangeId: 0 } // Try to delete first banding
        }
      ],
    },
  }).catch(e => console.log("Note: Banding 0 already gone or error."));

  // Clear values just in case
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
  });

  const headers = [
    "Originator",
    "Page / Section",
    "Page URL",
    "Type",
    "Description",
    "Attachments",
    "Status",
    "Priority",
    "Submitted At (PKT)",
  ];

  // 2. Set New Headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:I1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });

  // 3. Apply Clean Professional Style (No Teal, No Banding)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // Professional Gray Header
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 9 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
                backgroundColor: { red: 0.96, green: 0.96, blue: 0.96 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)",
          },
        },
        // Freeze Header
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        // Column Widths
        ...([220, 180, 250, 140, 400, 250, 130, 110, 200] as const).map((pixelSize, i) => ({
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
            properties: { pixelSize },
            fields: "pixelSize",
          },
        })),
        // Setup Status Dropdown for future rows (Clean White BG)
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 6, endColumnIndex: 7 },
            rule: {
              condition: { type: "ONE_OF_LIST", values: [{ userEnteredValue: "Not Started" }, { userEnteredValue: "In Progress" }, { userEnteredValue: "Completed" }] },
              showCustomUi: true, strict: true,
            },
          },
        },
        // Setup Priority Dropdown
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 7, endColumnIndex: 8 },
            rule: {
              condition: { type: "ONE_OF_LIST", values: [{ userEnteredValue: "Low" }, { userEnteredValue: "Medium" }, { userEnteredValue: "High" }, { userEnteredValue: "Critical" }] },
              showCustomUi: true, strict: true,
            },
          },
        },
        // Text Wrapping + Top Align
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 0, endColumnIndex: 9 },
            cell: { userEnteredFormat: { verticalAlignment: "TOP", wrapStrategy: "WRAP" } },
            fields: "userEnteredFormat(verticalAlignment,wrapStrategy)",
          },
        }
      ],
    },
  });

  console.log("✅ NUCLEAR RESET COMPLETE! Sheet is now clean White/Gray.");
}

main().catch(console.error);
