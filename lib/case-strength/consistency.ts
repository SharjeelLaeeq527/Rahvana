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
 * Compare a DS-260 baseline against the I-130 baseline.
 *
 * Only fields present on BOTH sides are compared — a value the user hasn't
 * entered yet is not a "mismatch", it's simply not captured. Returns one entry
 * per differing field.
 */
export function compareBaselines(
  i130: BaselineDates | undefined | null,
  ds260: BaselineDates | undefined | null
): BaselineMismatch[] {
  if (!i130 || !ds260) return [];
  const mismatches: BaselineMismatch[] = [];

  for (const { field, label } of BASELINE_FIELDS) {
    const a = (i130[field] ?? "").trim();
    const b = (ds260[field] ?? "").trim();
    if (!a || !b) continue; // need both sides to compare
    if (a !== b) {
      mismatches.push({ field, label, i130Value: a, ds260Value: b });
    }
  }

  return mismatches;
}
