// lib/candidate/visaCategory.ts
// Base visa category parsing, shared by the candidate key helpers and journeyConfig.

import type { VisaCategory } from "@/lib/document-vault/types";

/**
 * Explicit "could not resolve a visa category" sentinel (decision 5). `getBaseVisaCategory`
 * returns this for empty/null/unresolvable input instead of silently defaulting to IR-5, so a
 * mis-mapped or missing `journey_type` surfaces as UNKNOWN rather than masquerading as a real
 * parent journey. Callers that need a concrete category must guard against it explicitly.
 * (Cast once here, matching the existing `as VisaCategory` style in this file.)
 */
export const UNKNOWN_VISA_CATEGORY = "UNKNOWN" as VisaCategory;

/**
 * Extracts base visa category ("IR-5", "IR-1", "IR-2", "CR-1", etc.)
 * from any raw journey type, candidate key, or compound string.
 * Returns UNKNOWN_VISA_CATEGORY when the input is empty/null or cleans to nothing - it does
 * NOT default to IR-5 (decision 5, explicit unknown).
 */
export function getBaseVisaCategory(journeyTypeOrVisa?: string | null): VisaCategory {
  if (!journeyTypeOrVisa) return UNKNOWN_VISA_CATEGORY;
  const cleaned = journeyTypeOrVisa.split("_")[0].split(":")[0].trim();
  const normalized = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.startsWith("ir5")) return "IR-5";
  if (normalized.startsWith("ir1")) return "IR-1";
  if (normalized.startsWith("ir2")) return "IR-2";
  if (normalized.startsWith("cr1")) return "CR-1";
  if (normalized.startsWith("cr2")) return "CR-2";
  if (normalized === "f1") return "F-1 Student Visa";

  if (/^[a-zA-Z]+[0-9]+$/.test(cleaned)) {
    const formatted = cleaned.replace(/^([a-zA-Z]+)([0-9]+)$/, "$1-$2").toUpperCase();
    return formatted as VisaCategory;
  }
  return (cleaned.toUpperCase() as VisaCategory) || UNKNOWN_VISA_CATEGORY;
}
