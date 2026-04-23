// lib/supabase/receipts.ts

// DEPRECATED: All receipt data should now be stored in the case_data table (see journey/data-access.ts)
// This file is retained for legacy migration only. Do not use in new code.

import { createClient } from "./client";
import type { ReceiptRecord } from "@/lib/register-receipt";

const TABLE = "receipt_records";

function rowToRecord(row: Record<string, any>): ReceiptRecord {
  return {
    receiptNumber:   row.receipt_number,
    noticeDate:      row.notice_date    ?? "",
    priorityDate:    row.priority_date  ?? "",
    caseLabel:       row.case_label     ?? "",
    source:          row.source,
    trackingEnabled: row.tracking_enabled,
    lastKnownStatus: row.last_known_status,
    lastCheckedAt:   row.last_checked_at,
    savedAt:         row.saved_at,
  };
}


// DEPRECATED: Use upsertCaseDataDB from journey/data-access.ts
export async function upsertReceiptRecord() {
  throw new Error("upsertReceiptRecord is deprecated. Use upsertCaseDataDB for journey-based receipt storage.");
}


// DEPRECATED: Use getCaseDataByKeyDB from journey/data-access.ts
export async function getReceiptRecord() {
  throw new Error("getReceiptRecord is deprecated. Use getCaseDataByKeyDB for journey-based receipt storage.");
}

export async function listReceiptRecords(
  userId: string
): Promise<{ data: ReceiptRecord[]; error: string | null }> {
  const db = createClient();

  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("[listReceiptRecords]", error.message);
    return { data: [], error: error.message };
  }

  return { data: (data ?? []).map(rowToRecord), error: null };
}