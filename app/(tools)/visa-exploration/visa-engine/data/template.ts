/**
 * visa-engine/data/template.ts
 *
 * Use this template to add a new country.
 * (1) Copy this file to [country].ts
 * (2) Fill in the data
 * (3) Register in registry.ts
 */

import { T, CountryData, VisaExplorationAnswers } from "../types";

// ─────────────────────────────────────────────────────────────
// CANDIDATE CODES  (Country-specific logic)
// ─────────────────────────────────────────────────────────────
function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  if (!a.purpose) return [];
  const c: string[] = [];

  // TODO: Add logic to filter visa codes based on user answers
  // Example: if (a.purpose === "STUDY") c.push("STUDENT_VISA_1");

  return [...new Set(c)];
}

// ─────────────────────────────────────────────────────────────
// COUNTRY DATA
// ─────────────────────────────────────────────────────────────
export const TEMPLATE_DATA: CountryData = {
  country: "Template Country",
  code: "TC",
  flag: "🌐",
  getCandidateCodes,

  purposes: [
    { label: "Study", value: "STUDY", sub: "Pursue education" },
    { label: "Work",  value: "WORK",  sub: "Professional opportunities" },
    // ... add more purposes
  ],

  visas: {
    "STUDENT_VISA_1": {
      code: "S1", label: "Student Visa", badge: "Non-Immigrant", color: T.primary,
      description: "Description of the student visa.",
      criteria: ["Criterion 1", "Criterion 2"],
      processing: "2–4 weeks",
      forms: ["Form A", "Form B"],
    },
    // ... add more visas
  },

  gateQuestions: {
    "STUDENT_VISA_1": [
      { 
        id: "enrolled", 
        question: "Are you enrolled in a university?", 
        source: "Official Immigration Website", 
        sourceUrl: "https://example.gov", 
        passWith: ["YES"], 
        failMsg: "You must be enrolled to qualify.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
      // ... add more questions
    ],
  },
};
