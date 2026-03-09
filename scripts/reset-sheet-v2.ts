// Script to reset the Google Sheet headers with the NEW design
// Run: npx tsx scripts/reset-sheet-v2.ts

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

  console.log("Cleaning sheet...");
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

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:I1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetId = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME)?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // Header Formatting: Bold, centered, light gray background
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
        // Freeze header
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        // Column Widths
        ...([220, 200, 300, 150, 400, 250, 130, 130, 200] as const).map((pixelSize, i) => ({
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
            properties: { pixelSize },
            fields: "pixelSize",
          },
        })),
        // Status Dropdown: Not Started / In Progress / Completed
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
        // Priority Dropdown: Low / Medium / High / Critical
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
        // Vertical Alignment Top + Wrapping for Description & Attachments
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 0, endColumnIndex: 9 },
            cell: { userEnteredFormat: { verticalAlignment: "TOP" } },
            fields: "userEnteredFormat(verticalAlignment)",
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 4, endColumnIndex: 6 },
            cell: { userEnteredFormat: { wrapStrategy: "WRAP" } },
            fields: "userEnteredFormat(wrapStrategy)",
          },
        },
      ],
    },
  });

  console.log("✅ Reset complete! New design applied.");
}

main().catch(console.error);
