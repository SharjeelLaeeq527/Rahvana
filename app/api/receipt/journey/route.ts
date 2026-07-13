// POST/GET /api/receipt/journey?journeyId=...  (store/fetch receipt in case_data)
import { NextRequest, NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import { upsertCaseDataDB, getCaseDataByKeyDB } from "@/lib/journey/data-access";
import { isValidReceiptNumber, normalizeReceipt } from "@/lib/register-receipt";

const RECEIPT_KEY = "uscis_receipt_number";

// GET: fetch receipt data for a journey
export async function GET(req: NextRequest) {
  const journeyId = req.nextUrl.searchParams.get("journeyId");
  if (!journeyId) {
    return NextResponse.json({ error: "Missing journeyId" }, { status: 400 });
  }
  try {
    const caseData = await getCaseDataByKeyDB(journeyId, RECEIPT_KEY);
    if (!caseData) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }
    return NextResponse.json({
      receipt_number: caseData.data_value?.receiptNumber,
      notice_date: caseData.data_value?.noticeDate,
      priority_date: caseData.data_value?.priorityDate,
      case_label: caseData.data_value?.caseLabel,
      source: caseData.data_value?.source,
      tracking_enabled: true,
      last_known_status: caseData.data_value?.lastKnownStatus || "Case Was Received",
      last_checked_at: caseData.data_value?.lastCheckedAt,
      saved_at: caseData.updated_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: upsert receipt data for a journey
export async function POST(req: NextRequest) {
  const journeyId = req.nextUrl.searchParams.get("journeyId");
  if (!journeyId) {
    return NextResponse.json({ error: "Missing journeyId" }, { status: 400 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: msg(E.CASE_DATA_VALIDATION_FAILED) }, { status: 400 });
  }
  const { receiptNumber, noticeDate, priorityDate, caseLabel, source } = body;
  if (!receiptNumber || !isValidReceiptNumber(normalizeReceipt(receiptNumber))) {
    return NextResponse.json({ error: msg(E.USCIS_INVALID_RECEIPT) }, { status: 400 });
  }
  if (!source || !["manual", "upload"].includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }
  // Compose value for case_data
  const now = new Date().toISOString();
  const receiptData = {
    receiptNumber: normalizeReceipt(receiptNumber),
    noticeDate: noticeDate ?? null,
    priorityDate: priorityDate ?? null,
    caseLabel: caseLabel ?? null,
    source,
    trackingEnabled: true,
    lastKnownStatus: "Case Was Received",
    lastCheckedAt: now,
  };
  try {
    const caseData = await upsertCaseDataDB(journeyId, RECEIPT_KEY, {
      data_key: RECEIPT_KEY,
      data_value: receiptData,
      data_type: "object",
      label: "USCIS Receipt Number",
      description: "USCIS receipt and related info for this journey",
      source,
      is_verified: false,
    });
    return NextResponse.json({
      receipt_number: caseData.data_value?.receiptNumber,
      notice_date: caseData.data_value?.noticeDate,
      priority_date: caseData.data_value?.priorityDate,
      case_label: caseData.data_value?.caseLabel,
      source: caseData.data_value?.source,
      tracking_enabled: true,
      last_known_status: caseData.data_value?.lastKnownStatus || "Case Was Received",
      last_checked_at: caseData.data_value?.lastCheckedAt,
      saved_at: caseData.updated_at,
    });
  } catch (error: any) {
    console.error("/api/receipt/journey POST error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
