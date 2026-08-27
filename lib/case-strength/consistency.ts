/**
 * Cross-form consistency comparison.
 *
 * The I-130 captures a canonical baseline at step_1_4 (marriage date + both
 * dates of birth). The DS-260 (step_2_3) and later forms must repeat the SAME
 * values. Mismatches between forms are one of the most common causes of NVC
 * delays and interview RFEs — so we compare the values the user enters on the
 * DS-260 against the I-130 baseline and surface any divergence.
 *
 * Pure module — no side effects. Shared by the DS-260 capture component and the
 * step_2_3 case-strength checker so both agree on what counts as a mismatch.
 *
 * Sourcing: U.S. Department of State 9 FAM 504.4 (DS-260 adjudication);
 * INA 212(a)(6)(C) — material misrepresentation.
 */

export interface BaselineDates {
  marriageDate?: string;
  petitionerDateOfBirth?: string;
  beneficiaryDateOfBirth?: string;
}

export type BaselineField =
  | "marriageDate"
  | "petitionerDateOfBirth"
  | "beneficiaryDateOfBirth";

export interface BaselineMismatch {
  field: BaselineField;
  label: string;
  /** Value recorded on the I-130 baseline */
  i130Value: string;
  /** Value entered for the DS-260 */
  ds260Value: string;
}

/** The fields compared across forms, with human labels for advisories. */
export const BASELINE_FIELDS: { field: BaselineField; label: string }[] = [
  { field: "marriageDate", label: "Marriage date" },
  { field: "petitionerDateOfBirth", label: "Petitioner date of birth" },
  { field: "beneficiaryDateOfBirth", label: "Beneficiary date of birth" },
];

/**
 * ─── Generic, category-agnostic comparator ──────────────────────────────────
 *
 * This is the REUSABLE core. The IR-1 spouse case compares {marriageDate, both
 * DOBs}; the IR-5 parent case compares {petitioner DOB, parent DOB} and has no
 * marriage date at all. Instead of writing that diff twice, every category
 * passes its own `fields` list and this one function does the comparison.
 *
 * A "field config" is just `{ field, label }`:
 *   - `field` = the property name on the captured baseline object
 *   - `label` = the human text shown in the advisory
 */
export interface CrossFormField {
  field: string;
  label: string;
}

export interface CrossFormMismatch {
  field: string;
  label: string;
  /** Value recorded on the earlier form (e.g. the I-130 baseline) */
  aValue: string;
  /** Value recorded on the later form (e.g. the DS-260) */
  bValue: string;
}

/**
 * Compare two captured form-baselines field-by-field.
 *
 * Only fields present on BOTH sides are compared — a value the user hasn't
 * entered yet is not a "mismatch", it's simply not captured. Returns one entry
 * per differing field. Values are coerced to trimmed strings so date pickers,
 * numbers, and text inputs all compare cleanly.
 */
export function compareFields(
  a: Record<string, unknown> | undefined | null,
  b: Record<string, unknown> | undefined | null,
  fields: CrossFormField[]
): CrossFormMismatch[] {
  if (!a || !b) return [];
  const out: CrossFormMismatch[] = [];
  for (const { field, label } of fields) {
    const av = a[field] != null ? String(a[field]).trim() : "";
    const bv = b[field] != null ? String(b[field]).trim() : "";
    if (!av || !bv) continue; // need both sides to compare
    if (av !== bv) out.push({ field, label, aValue: av, bValue: bv });
  }
  return out;
}

/**
 * IR-1 convenience wrapper — kept so every existing spouse-flow caller (the
 * DS-260 capture component and the step_2_3 checker) works unchanged. It just
 * delegates to the generic `compareFields` with the IR-1 field list and maps
 * the generic result back onto the older `{i130Value, ds260Value}` shape.
 *
 * Only fields present on BOTH sides are compared. Returns one entry per
 * differing field.
 */
export function compareBaselines(
  i130: BaselineDates | undefined | null,
  ds260: BaselineDates | undefined | null
): BaselineMismatch[] {
  return compareFields(i130 as Record<string, unknown>, ds260 as Record<string, unknown>, BASELINE_FIELDS).map(
    (m) => ({
      field: m.field as BaselineField,
      label: m.label,
      i130Value: m.aValue,
      ds260Value: m.bValue,
    })
  );
}
