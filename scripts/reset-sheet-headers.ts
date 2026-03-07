// Script to reset the Google Sheet headers
// Run: npx tsx scripts/reset-sheet-headers.ts

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

  // 1. Clear entire sheet
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
  });

  console.log("✅ Sheet cleared");

  // 2. Write new headers
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
  console.log("✅ Headers written");

  // 3. Get sheet tab ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tab  = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
  const sheetId = tab?.properties?.sheetId ?? 0;

  // 4. Apply formatting
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // Bold + teal header
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.05, green: 0.60, blue: 0.60 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)",
          },
        },
        // Freeze row 1
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        // Column widths: Email, Page/Section, Page URL, Type, Description, Attachment, Status, Timestamp
        ...([220, 180, 320, 160, 380, 220, 130, 200] as const).map(
          (pixelSize, columnIndex) => ({
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: columnIndex, endIndex: columnIndex + 1 },
              properties: { pixelSize },
              fields: "pixelSize",
            },
          }),
        ),
        // Status dropdown for all data rows
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
        // Row height
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 1000 },
            properties: { pixelSize: 36 },
            fields: "pixelSize",
          },
        },
        // Wrap description column (E = index 4)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 4, endColumnIndex: 5 },
            cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
            fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
          },
        },
        // Zebra banding (already exists – skip if error)
      ],
    },
  });

  console.log("✅ Formatting applied");
  console.log("🎉 Sheet reset complete! New columns:");
  console.log("   A: User Email | B: Page / Section | C: Page URL");
  console.log("   D: Feedback Type | E: Description | F: Attachment");
  console.log("   G: Status (dropdown) | H: Submitted At (PKT)");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
