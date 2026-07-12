// components/ReceiptFormatChip.tsx
//
// Inline validator chip for USCIS receipt numbers (I-797C format).
//
// Behavior:
//   - Empty input             → no chip
//   - Less than 13 chars      → neutral "keep typing" hint (no error)
//   - 13 chars, valid + known → green chip with service-center name
//   - 13 chars, valid format,
//     unknown prefix          → amber chip with note
//   - 13 chars, invalid       → red chip with format guidance
//
// Validation logic lives in lib/case-strength/validators.ts.

import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Pencil } from "lucide-react";
import { validateReceiptNumber } from "@/lib/case-strength";

interface ReceiptFormatChipProps {
  value: string;
  className?: string;
}

const FULL_LENGTH = 13;

export function ReceiptFormatChip({ value, className }: ReceiptFormatChipProps) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  // While the user is still typing — don't flash a red error mid-input.
  if (trimmed.length < FULL_LENGTH) {
    return (
      <div
        className={
          "mt-1 inline-flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[12px] leading-snug " +
          (className ?? "")
        }
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          color: "#475569",
        }}
        role="status"
        aria-live="polite"
      >
        <Pencil size={13} className="mt-[1px] shrink-0" />
        <span>
          Keep typing — {trimmed.length}/{FULL_LENGTH} characters. Format: 3 letters + 10 digits.
        </span>
      </div>
    );
  }

  // Full-length input — validate
  const result = validateReceiptNumber(trimmed);

  let bg = "#fef2f2";
  let border = "#fecaca";
  let fg = "#991b1b";
  let Icon = AlertCircle;
  let text = result.message ?? "Invalid format";

  if (result.valid && result.service_center) {
    bg = "#ecfdf5";
    border = "#a7f3d0";
    fg = "#065f46";
    Icon = CheckCircle2;
    text = `Format OK · ${result.service_center}`;
  } else if (result.valid && !result.service_center) {
    bg = "#fffbeb";
    border = "#fde68a";
    fg = "#92400e";
    Icon = AlertTriangle;
    text = result.message ?? "Format OK, but service center prefix is unrecognized.";
  }

  return (
    <div
      className={
        "mt-1 inline-flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[12px] leading-snug " +
        (className ?? "")
      }
      style={{ background: bg, border: `1px solid ${border}`, color: fg }}
      role="status"
      aria-live="polite"
    >
      <Icon size={13} className="mt-[1px] shrink-0" />
      <span>{text}</span>
    </div>
  );
}
