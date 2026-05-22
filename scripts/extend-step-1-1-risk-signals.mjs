// Extend step_1_1.risk_signals with quest-derivable patterns.
// These map directly to existing eligibility-suite questions:
//   q3 (prior marriages)
//   q5s1 (prior visa refusal / fraud)
//   q5s4 (unlawful presence / overstay)
//   q5s5 (financial sponsorship concern)
//
// Each pattern includes its INA / 8 CFR / USCIS Policy Manual source basis.
import fs from "node:fs";

const path = "./data/visa-category/ir-1.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const ch1 = data.chapters[0];
const s1 = ch1.steps.find((s) => s.step_key === "step_1_1");

const additional = [
  {
    id: "prior_visa_refusal_or_fraud",
    title: "Prior U.S. visa refusal, deportation, or fraud allegation",
    trigger_field: "eligibility_quest_q5s1",
    severity: "critical",
    advisory:
      "Any prior visa refusal, deportation, removal order, or fraud/misrepresentation allegation must be disclosed and documented in the petition. Misrepresentation under INA 212(a)(6)(C) creates a permanent inadmissibility bar unless waived. Consult an immigration attorney before filing — this is not a DIY scenario.",
    source_basis: "INA Section 212(a)(6)(C) — 8 USC Section 1182(a)(6)(C) — misrepresentation bar",
  },
  {
    id: "unlawful_presence_history",
    title: "Beneficiary has accumulated unlawful presence in the U.S.",
    trigger_field: "eligibility_quest_q5s4",
    severity: "critical",
    advisory:
      "Unlawful presence triggers the 3-year or 10-year bar under INA 212(a)(9)(B) once the beneficiary departs the U.S. for consular processing. A provisional unlawful presence waiver (Form I-601A) may be required before the visa interview. Consult an immigration attorney to determine the correct path before filing.",
    source_basis: "INA Section 212(a)(9)(B) — 8 USC Section 1182(a)(9)(B) — unlawful presence bars",
  },
  {
    id: "financial_sponsorship_concern",
    title: "Petitioner income may not meet the 125% poverty guideline",
    trigger_field: "eligibility_quest_q5s5",
    severity: "warning",
    advisory:
      "The Affidavit of Support (Form I-864) requires the petitioner to demonstrate income at or above 125% of the federal poverty guideline for the household size. If the petitioner cannot meet this on their own, a joint sponsor or qualifying assets will be needed. Plan for this now to avoid an RFE at the NVC stage.",
    source_basis:
      "INA Section 213A — 8 USC Section 1183a — Affidavit of Support requirement; Form I-864 instructions",
  },
  {
    id: "beneficiary_criminal_history",
    title: "Beneficiary has arrest, charge, or conviction",
    trigger_field: "eligibility_quest_q5s2",
    severity: "critical",
    advisory:
      "Any arrest, charge, or conviction — anywhere in the world — must be disclosed and may trigger an inadmissibility bar under INA 212(a)(2). Certified court dispositions and police records will be required. Some convictions are waivable; others are permanent bars. Consult an immigration attorney to evaluate impact before filing.",
    source_basis:
      "INA Section 212(a)(2) — 8 USC Section 1182(a)(2) — criminal-related grounds of inadmissibility",
  },
];

// Append to existing risk_signals.patterns (skip if id already present)
const existingIds = new Set(s1.risk_signals.patterns.map((p) => p.id));
for (const pattern of additional) {
  if (!existingIds.has(pattern.id)) {
    s1.risk_signals.patterns.push(pattern);
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 10));
console.log("step_1_1.risk_signals.patterns count:", s1.risk_signals.patterns.length);
console.log("Pattern ids:");
s1.risk_signals.patterns.forEach((p) => console.log("  -", p.severity.padEnd(10), p.id));
