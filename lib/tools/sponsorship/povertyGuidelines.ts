// ============================================================================
// I-864 Affidavit of Support - HHS Poverty Guidelines (authoritative source)
// ----------------------------------------------------------------------------
// For the federal Form I-864, the poverty guidelines differ across exactly
// three jurisdictions, NOT per individual state:
//   1. "contiguous" - 48 states + DC + US territories
//   2. "AK"         - Alaska (higher)
//   3. "HI"         - Hawaii (higher)
// 48 of the 50 states share the contiguous table.
//
// Figures below are the 2026 I-864P cycle (contiguous matches the values that
// previously shipped inline in the calculator; AK/HI cross-checked against the
// same cycle). Verify against https://www.uscis.gov/i-864p on each yearly update.
// ============================================================================

import { US_STATES } from "@/lib/formConfig/constants";

export type Jurisdiction = "contiguous" | "AK" | "HI";

type GuidelineTable = Record<number, { level100: number; level125: number }>;

interface JurisdictionGuidelines {
  table: GuidelineTable;
  additional: { level100: number; level125: number };
}

export const POVERTY_GUIDELINES_BY_JURISDICTION: Record<Jurisdiction, JurisdictionGuidelines> = {
  contiguous: {
    table: {
      2: { level100: 21640, level125: 27050 },
      3: { level100: 27320, level125: 34150 },
      4: { level100: 33000, level125: 41250 },
      5: { level100: 38680, level125: 48350 },
      6: { level100: 44360, level125: 55450 },
      7: { level100: 50040, level125: 62550 },
      8: { level100: 55720, level125: 69650 },
    },
    additional: { level100: 5680, level125: 7100 },
  },
  AK: {
    table: {
      2: { level100: 27050, level125: 33813 },
      3: { level100: 34150, level125: 42688 },
      4: { level100: 41250, level125: 51563 },
      5: { level100: 48350, level125: 60438 },
      6: { level100: 55450, level125: 69313 },
      7: { level100: 62550, level125: 78188 },
      8: { level100: 69650, level125: 87063 },
    },
    additional: { level100: 7100, level125: 8875 },
  },
  HI: {
    table: {
      2: { level100: 24890, level125: 31113 },
      3: { level100: 31420, level125: 39275 },
      4: { level100: 37950, level125: 47438 },
      5: { level100: 44480, level125: 55600 },
      6: { level100: 51010, level125: 63763 },
      7: { level100: 57540, level125: 71925 },
      8: { level100: 64070, level125: 80088 },
    },
    additional: { level100: 6530, level125: 8163 },
  },
};

// Backward-compatible export: the contiguous table (the historical default).
export const POVERTY_GUIDELINES: GuidelineTable = POVERTY_GUIDELINES_BY_JURISDICTION.contiguous.table;

export const ADDITIONAL_MEMBER_COST = POVERTY_GUIDELINES_BY_JURISDICTION.contiguous.additional;

const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  contiguous: "48 contiguous states and DC",
  AK: "Alaska",
  HI: "Hawaii",
};

export const getJurisdictionLabel = (jurisdiction: Jurisdiction): string =>
  JURISDICTION_LABELS[jurisdiction];

/**
 * Normalize a free-text state value or 2-letter code to one of the three
 * I-864 poverty-guideline jurisdictions. Unknown / empty input falls back to
 * "contiguous" (the safe default and the correct answer for 48 of 50 states).
 */
export const resolveJurisdiction = (stateRaw?: string | null): Jurisdiction => {
  if (!stateRaw) return "contiguous";
  const input = stateRaw.trim().toLowerCase();
  if (!input) return "contiguous";

  // Match either the 2-letter code (value) or the full name (label).
  const match = US_STATES.find(
    (s) => s.value.toLowerCase() === input || s.label.toLowerCase() === input
  );
  const code = match?.value ?? stateRaw.trim().toUpperCase();

  if (code === "AK") return "AK";
  if (code === "HI") return "HI";
  return "contiguous";
};

export const getSponsorshipThreshold = (
  householdSize: number,
  level: 100 | 125,
  jurisdiction: Jurisdiction = "contiguous"
): number => {
  const key = level === 100 ? "level100" : "level125";
  const { table, additional } = POVERTY_GUIDELINES_BY_JURISDICTION[jurisdiction];
  const size = Math.max(householdSize, 2);
  if (size <= 8) return table[size][key];
  const extraMembers = size - 8;
  return table[8][key] + extraMembers * additional[key];
};
