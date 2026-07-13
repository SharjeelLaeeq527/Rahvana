// lib/document-ocr/crossCheck.ts
// Compares freshly-extracted passport fields against values already stored on
// the user's profile, and reports where they disagree.
//
// The point is to catch real differences (e.g. a different passport number)
// WITHOUT raising false alarms over formatting ("1990-01-15" vs "15/01/1990",
// "PAKISTAN" vs "Pakistan", extra spaces, etc.). So every value is normalized
// before it is compared.

import type { PassportFields } from "./passportParser";

export interface FieldComparison {
  /** canonical key, e.g. "passportNumber" | "name.first" */
  key: keyof PassportFields;
  /** human label for the UI */
  label: string;
  oldValue: string;
  newValue: string;
}

export interface CrossCheckResult {
  /** keys where stored value matched the extracted value (after normalize) */
  matches: FieldComparison[];
  /** keys where stored value differs from the extracted value */
  mismatches: FieldComparison[];
  /** extracted keys that had no stored value to compare against */
  newFields: FieldComparison[];
}

const FIELD_LABELS: Record<keyof PassportFields, string> = {
  "name.first": "Given name",
  "name.last": "Surname",
  dateOfBirth: "Date of birth",
  sex: "Sex",
  nationality: "Nationality",
  passportNumber: "Passport number",
  passportIssueDate: "Passport issue date",
  passportPlaceOfIssue: "Place of issue",
  passportBookNumber: "Passport book number",
  passportExpiry: "Passport expiry",
  passportCountry: "Issuing country",
};

/** ISO date keys get date-aware normalization; everything else is text. */
const DATE_KEYS: ReadonlySet<keyof PassportFields> = new Set([
  "dateOfBirth",
  "passportExpiry",
  "passportIssueDate",
]);

/** Treat "M" / "Male" (and "F" / "Female") as the same value. */
function normalizeSex(value: string): string {
  const v = value.trim().toUpperCase();
  if (v === "M" || v === "MALE") return "MALE";
  if (v === "F" || v === "FEMALE") return "FEMALE";
  return v;
}

/** Loose text normalize: trim, collapse spaces, drop punctuation, upper-case. */
function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toUpperCase()
    .trim();
}

/** Pull a comparable YYYYMMDD out of common date shapes; falls back to text. */
function normalizeDate(value: string): string {
  const trimmed = value.trim();

  // Already ISO: 1990-01-15
  const iso = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) {
    return `${iso[1]}${iso[2].padStart(2, "0")}${iso[3].padStart(2, "0")}`;
  }

  // Day-first: 15/01/1990 or 15-01-90
  const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmy) {
    let year = Number(dmy[3]);
    if (year < 100) year = year >= 40 ? 1900 + year : 2000 + year;
    return `${year}${dmy[2].padStart(2, "0")}${dmy[1].padStart(2, "0")}`;
  }

  return normalizeText(trimmed);
}

function normalizeFor(key: keyof PassportFields, value: string): string {
  if (key === "sex") return normalizeSex(value);
  return DATE_KEYS.has(key) ? normalizeDate(value) : normalizeText(value);
}

/**
 * Compare extracted passport fields with previously-stored values.
 *
 * @param extracted fields just read from the uploaded passport
 * @param stored    the matching values currently on the profile (may be partial)
 */
export function crossCheckPassport(
  extracted: PassportFields,
  stored: Partial<Record<keyof PassportFields, string | undefined>>
): CrossCheckResult {
  const matches: FieldComparison[] = [];
  const mismatches: FieldComparison[] = [];
  const newFields: FieldComparison[] = [];

  (Object.keys(extracted) as (keyof PassportFields)[]).forEach((key) => {
    const newValue = (extracted[key] ?? "").toString().trim();
    if (!newValue) return;

    const oldValue = (stored[key] ?? "").toString().trim();
    const comparison: FieldComparison = {
      key,
      label: FIELD_LABELS[key],
      oldValue,
      newValue,
    };

    if (!oldValue) {
      newFields.push(comparison);
      return;
    }

    if (normalizeFor(key, oldValue) === normalizeFor(key, newValue)) {
      matches.push(comparison);
    } else {
      mismatches.push(comparison);
    }
  });

  return { matches, mismatches, newFields };
}

// ─── Generic cross-check (any docType) ───────────────────────────────────────────
// The upload modals are docType-agnostic (passport, marriage, …). They know the
// fields to confirm only as `{ key, label }[]` descriptors from the OCR registry,
// so they need a comparison that works on arbitrary dot-path keys rather than the
// passport-specific shape above. Same normalization rules; key→normalizer is
// chosen by the key name (sex/gender → sex, anything date-ish → date, else text).

export interface GenericFieldComparison {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface GenericCrossCheckResult {
  matches: GenericFieldComparison[];
  mismatches: GenericFieldComparison[];
  newFields: GenericFieldComparison[];
}

/** Date-like dot-path keys: dateOfBirth, passportExpiry, relationship.marriageDate, … */
const DATE_KEY_PATTERN = /(date|dob|expiry|birth)/i;
const SEX_KEY_PATTERN = /(sex|gender)/i;

function normalizeGeneric(key: string, value: string): string {
  if (SEX_KEY_PATTERN.test(key)) return normalizeSex(value);
  if (DATE_KEY_PATTERN.test(key)) return normalizeDate(value);
  return normalizeText(value);
}

/**
 * Compare freshly-extracted fields against stored values for a given field set.
 *
 * @param extracted values just read from the uploaded document (keyed by dot-path)
 * @param stored    matching values currently on the profile (keyed by the same paths)
 * @param fields    the field descriptors to check (from getOcrDocTypeMeta(...).fields)
 */
export function crossCheckFields(
  extracted: Record<string, string | undefined>,
  stored: Record<string, string | undefined>,
  fields: ReadonlyArray<{ key: string; label: string }>
): GenericCrossCheckResult {
  const matches: GenericFieldComparison[] = [];
  const mismatches: GenericFieldComparison[] = [];
  const newFields: GenericFieldComparison[] = [];

  for (const { key, label } of fields) {
    const newValue = (extracted[key] ?? "").toString().trim();
    if (!newValue) continue;

    const oldValue = (stored[key] ?? "").toString().trim();
    const comparison: GenericFieldComparison = { key, label, oldValue, newValue };

    if (!oldValue) {
      newFields.push(comparison);
    } else if (normalizeGeneric(key, oldValue) === normalizeGeneric(key, newValue)) {
      matches.push(comparison);
    } else {
      mismatches.push(comparison);
    }
  }

  return { matches, mismatches, newFields };
}
