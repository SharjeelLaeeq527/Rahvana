// lib/register-receipt/index.ts
// Shared types, validation helpers, and the core registration logic.
// Import from here in both the Next.js API route and the React component.

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RegistrationSource = "manual" | "upload";

export interface RegisterReceiptPayload {
  receiptNumber: string;
  noticeDate?: string;
  priorityDate?: string;
  caseLabel?: string;
  source: RegistrationSource;
}

export interface ReceiptRecord {
  receiptNumber: string;
  noticeDate: string;
  priorityDate: string;
  caseLabel: string;
  source: RegistrationSource;
  trackingEnabled: boolean;
  lastKnownStatus: string;
  lastCheckedAt: string;
  savedAt: string;
}

export interface RegisterReceiptError {
  error: string;
}

export type RegisterReceiptResponse = ReceiptRecord | RegisterReceiptError;

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function normalizeReceipt(v: string): string {
  return (v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidReceiptNumber(v: string): boolean {
  return /^[A-Z]{3}\d{10}$/.test(normalizeReceipt(v));
}

export function fmtDate(v: string): string {
  if (!v) return "Not saved";
  const d = new Date(v + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(v: string): string {
  const d = new Date(v);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildTimelineItems(record: ReceiptRecord) {
  const items: { title: string; sub: string }[] = [
    {
      title: "Tracking enabled",
      sub: "Rahvana stored the receipt details and turned on status monitoring for this case.",
    },
    {
      title: "Receipt registered",
      sub: `Receipt number ${record.receiptNumber} saved via ${
        record.source === "upload" ? "notice upload" : "manual entry"
      }.`,
    },
  ];

  if (record.priorityDate) {
    items.push({
      title: "Priority date saved",
      sub: "Saved for case records. For IR-1 this is useful to retain but should not dominate the tracking experience.",
    });
  }

  items.push({
    title: record.lastKnownStatus,
    sub: "Initial baseline status stored so future changes can be detected and surfaced.",
  });

  return items;
}

// ─── Core registration logic (used by the API route) ──────────────────────────

export function buildReceiptRecord(payload: RegisterReceiptPayload): any {
  const now = new Date().toISOString();

  return {
    receipt_number: normalizeReceipt(payload.receiptNumber),
    notice_date: payload.noticeDate ?? null,
    priority_date: payload.priorityDate ?? null,
    case_label: payload.caseLabel ?? null,
    source: payload.source,

    tracking_enabled: true,
    last_known_status: "Case Was Received",
    last_checked_at: now,
    saved_at: now,
  };
}
