// ─────────────────────────────────────────────────────────────────────────────
// Profile validation schema (single source of truth)
//
// Shared by BOTH the client (app/(main)/profile/page.tsx) and the server
// (app/api/profile/complete/route.ts) so the two never drift apart.
//
// The profile is PROGRESSIVE — users fill it in over time — so every field is
// optional. We only reject values that ARE present but malformed; we never force
// an empty field to be filled.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from "zod";
import type { MasterProfile } from "@/types/profile";

const CNIC_RE = /^\d{5}-\d{7}-\d$/; // 00000-0000000-0
const SSN_RE = /^\d{3}-?\d{2}-?\d{4}$/; // 9 digits, dashes optional
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Build the schema with `today` captured, so the "not in the future" checks are
 * deterministic for a given call (and unit-testable by passing a fixed date).
 */
export function makeProfileSchema(today: string) {
  const notFutureDate = (label: string) =>
    z
      .string()
      .optional()
      .refine((v) => !v || v <= today, {
        message: `${label} can't be in the future.`,
      });

  return z
    .object({
      dateOfBirth: notFutureDate("Date of birth"),
      passportIssueDate: z.string().optional(),
      passportExpiry: z.string().optional(),
      cnic: z
        .string()
        .optional()
        .refine((v) => !v || CNIC_RE.test(v.trim()), {
          message: "Format must be 00000-0000000-0.",
        }),
      ssn: z
        .string()
        .optional()
        .refine((v) => !v || SSN_RE.test(v.trim()), {
          message: "SSN must be 9 digits (e.g. 123-45-6789).",
        }),
      sponsor: z
        .object({
          email: z
            .string()
            .optional()
            .refine((v) => !v || EMAIL_RE.test(v), {
              message: "Enter a valid email address.",
            }),
          dateOfBirth: notFutureDate("Date of birth"),
        })
        // Unknown sponsor keys (name, passport, etc.) are ignored, not rejected.
        .partial()
        .passthrough()
        .optional(),
    })
    // Cross-field: passport expiry must come after the issue date.
    .passthrough()
    .superRefine((data, ctx) => {
      if (
        data.passportExpiry &&
        data.passportIssueDate &&
        data.passportExpiry <= data.passportIssueDate
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["passportExpiry"],
          message: "Expiry must be after the issue date.",
        });
      }
    });
}

/**
 * Validate a profile and return a FLAT error map keyed by dot-path
 * (e.g. `"sponsor.email"`), matching how the profile page reads
 * `errors["sponsor.email"]`. Returns `{}` when everything is valid.
 */
export function validateProfile(
  data: MasterProfile,
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  const result = makeProfileSchema(today).safeParse(data);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    // Keep the first message per field.
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
