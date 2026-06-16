/**
 * Adds optional case-strength GROUNDING fields to Chapter 2 steps in ir-1.json.
 *
 * These fields are sourcing/documentation parity with Chapter 1 (risk_signals,
 * source_basis, etc.). They are NOT consumed by runtime logic — the checkers in
 * lib/case-strength hardcode their thresholds; these blocks record WHY those
 * values are what they are (FAM/INA/CFR citations) so the data file is the
 * defensible source of truth.
 *
 * ir-1.json is 2-space indented with CRLF line endings and MIXED array
 * formatting (some primitive arrays inline, some expanded), so no JSON
 * re-serializer reproduces it byte-for-byte. We therefore do a STRING-LEVEL
 * SPLICE: insert each block immediately after the target step's `"step_key"`
 * line, at 10-space property indent, CRLF, trailing comma. Re-running is a
 * no-op (each block is skipped if its key already exists in the file).
 *
 * Usage:  node scripts/add-chapter2-case-strength-fields.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "..", "data", "visa-category", "ir-1.json");

const PROP_INDENT = "          "; // 10 spaces — Chapter 2 steps' property level
const CRLF = "\r\n";

/** Render `"key": <value>,` as a CRLF block indented to the step property level. */
function renderBlock(key, value) {
  const json = JSON.stringify(value, null, 2);
  const lines = json.split("\n");
  // First line ("{") sits right after the key; every later line gets +10 spaces.
  const body = lines
    .map((l, i) => (i === 0 ? l : PROP_INDENT + l))
    .join(CRLF);
  return `${PROP_INDENT}"${key}": ${body},`;
}

// ── Field definitions, one per target step ─────────────────────────────────

const INSERTIONS = [
  {
    stepKey: "step_2_3",
    key: "consistency_requirements",
    value: {
      disclaimer:
        "Advisory consistency framework. The DS-260 must repeat the same facts filed on the I-130; form-to-form divergence is a leading cause of NVC delays and interview RFEs. Not an official adjudication rubric.",
      match_fields: [
        {
          id: "marriage_date",
          label: "Marriage date",
          baseline_source: "I-130 baseline captured at step_1_4",
          severity_on_mismatch: "critical",
        },
        {
          id: "petitioner_dob",
          label: "Petitioner date of birth",
          baseline_source: "I-130 baseline captured at step_1_4",
          severity_on_mismatch: "critical",
        },
        {
          id: "beneficiary_dob",
          label: "Beneficiary date of birth",
          baseline_source: "I-130 baseline captured at step_1_4",
          severity_on_mismatch: "critical",
        },
      ],
      mandatory_disclosures: [
        {
          id: "prior_marriage",
          trigger: "Any prior marriage declared at eligibility (q3.q3s1)",
          requirement:
            "List every prior marriage and how it ended; must match the I-130 and termination documents.",
          source_basis: "9 FAM 504.4; INA 212(a)(6)(C) — material misrepresentation",
        },
        {
          id: "prior_visa_refusal",
          trigger: "Prior U.S. visa refusal or application declared (q5.q5s1)",
          requirement:
            "Declare every prior U.S. visa refusal or application. Omission risks a misrepresentation finding.",
          source_basis: "9 FAM 504.4; INA 212(a)(6)(C) — 8 USC 1182(a)(6)(C)",
        },
        {
          id: "criminal_record",
          trigger: "Arrest, charge, or court/police record declared (q5.q5s2)",
          requirement:
            "Declare any arrest or charge and bring certified court and police records to the interview.",
          source_basis: "9 FAM 504.4; INA 212(a)(2) — 8 USC 1182(a)(2) criminal grounds",
        },
        {
          id: "prior_overstay",
          trigger: "Prior U.S. overstay / unlawful presence declared (q5.q5s4)",
          requirement:
            "Declare any unlawful presence; a provisional waiver (I-601A) may be needed before the interview.",
          source_basis:
            "9 FAM 504.4; INA 212(a)(9)(B) — 8 USC 1182(a)(9)(B) unlawful presence bars",
        },
      ],
      source_basis:
        "U.S. Department of State 9 FAM 504.4 (DS-260 adjudication); INA 212(a)(6)(C).",
    },
  },
  {
    stepKey: "step_2_4",
    key: "evidence_guidance",
    value: {
      disclaimer:
        "Civil-document requirements vary by country per the State Department Reciprocity Schedule. Confirm your country's specifics before relying on this general guidance.",
      guidance: [
        "Every foreign-language document needs a certified English translation.",
        "If either spouse had a prior marriage, include the termination document (divorce decree, annulment, or death certificate) for each.",
        "Police certificates are required from each country where the beneficiary lived 6+ months after age 16, per the reciprocity schedule.",
      ],
      source_basis:
        "9 FAM 504.4-4 (Police Certificate Requirement); travel.state.gov Reciprocity Schedule.",
    },
  },
  {
    stepKey: "step_2_5",
    key: "financial_requirements",
    value: {
      disclaimer:
        "Affidavit of Support thresholds are set by the annual HHS Poverty Guidelines and Form I-864 instructions. Figures below are the rule structure, not a specific year's dollar amounts.",
      minimum_income_percent: 125,
      active_duty_exception_percent: 100,
      guidance: [
        "Required income is 125% of the HHS Poverty Guideline for the sponsor's household size (100% if the petitioner is active-duty military sponsoring a spouse).",
        "Household size includes the sponsor, dependents, the intending immigrant, and anyone previously sponsored.",
        "Assets may cover an income shortfall, generally valued at 3x the gap (5x for some categories).",
        "Each sponsor files a separate I-864.",
      ],
      source_basis:
        "Form I-864 instructions; HHS Poverty Guidelines; INA 213A — 8 CFR 213a.",
    },
  },
  {
    stepKey: "step_2_7",
    key: "joint_sponsor_requirements",
    value: {
      disclaimer:
        "A joint sponsor is only needed when the petitioner cannot meet the income requirement alone. Advisory guidance — confirm against the current Form I-864/I-864A instructions.",
      guidance: [
        "A joint sponsor must be a U.S. citizen or LPR, at least 18, and domiciled in the United States.",
        "The joint sponsor must independently meet the 125% income requirement for their own household size — incomes are not combined with the petitioner's.",
        "A household member who is not the sponsor uses Form I-864A to contribute their income.",
        "The joint sponsor submits their own federal tax returns and proof of status.",
      ],
      source_basis: "Form I-864 / I-864A instructions; INA 213A — 8 CFR 213a.2.",
    },
  },
];

// ── Splice ──────────────────────────────────────────────────────────────────

let text = readFileSync(FILE, "utf8");
let inserted = 0;
const skipped = [];

for (const { stepKey, key, value } of INSERTIONS) {
  if (text.includes(`"${key}":`)) {
    skipped.push(`${key} (already present)`);
    continue;
  }
  const anchor = `${PROP_INDENT}"step_key": "${stepKey}",${CRLF}`;
  const idx = text.indexOf(anchor);
  if (idx === -1) {
    skipped.push(`${key} (anchor for ${stepKey} not found)`);
    continue;
  }
  const block = renderBlock(key, value) + CRLF;
  const at = idx + anchor.length;
  text = text.slice(0, at) + block + text.slice(at);
  inserted++;
}

// Validate the result parses as JSON before writing.
JSON.parse(text);

writeFileSync(FILE, text, "utf8");

console.log(`Inserted ${inserted} block(s).`);
if (skipped.length) console.log("Skipped:", skipped.join("; "));
