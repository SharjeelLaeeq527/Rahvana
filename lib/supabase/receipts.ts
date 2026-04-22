// lib/supabase/receipts.ts
// All Supabase operations for the receipt_records table.
// Server-side only — never import in client components.

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

export async function upsertReceiptRecord(
  supabase: any,
  record: any,
  userId: string
) {
  return await supabase
    .from("receipt_records")
    .insert({
      user_id: userId, // 🔥 CRITICAL (RLS depends on this)
      receipt_number: record.receipt_number,
      notice_date: record.notice_date,
      priority_date: record.priority_date,
      case_label: record.case_label,
      source: record.source,
      tracking_enabled: record.tracking_enabled,
      last_known_status: record.last_known_status,
      last_checked_at: record.last_checked_at,
    })
    .select()
    .single();
}

export async function getReceiptRecord(
  _receiptNumber: string,
  userId: string,
  supabase?: any   // ← add optional param
): Promise<{ data: ReceiptRecord | null; error: string | null }> {
  // Use passed-in client (has auth cookies) or fall back to createClient
  const db = supabase ?? createClient();

  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }

  return { data: rowToRecord(data), error: null };
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