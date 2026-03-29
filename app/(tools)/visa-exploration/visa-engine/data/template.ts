/**
 * visa-engine/data/template.ts
 *
 * Use this template to add a new country.
 * (1) Copy this file to [country].ts
 * (2) Fill in the data
 * (3) Register in registry.ts
 */

import { T, CountryData, CandidateRule, FollowUpStep } from "../types";

// ─────────────────────────────────────────────────────────────
// CANDIDATE RULES (Declarative logic)
// ─────────────────────────────────────────────────────────────
const CANDIDATE_RULES: CandidateRule[] = [
  { 
    if: { purpose: "STUDY" }, 
    then: ["STUDENT_VISA_1"] 
  },
  // Add more rules here
];

// ─────────────────────────────────────────────────────────────
// FOLLOW-UP STEPS
// ─────────────────────────────────────────────────────────────
const FOLLOW_UP_STEPS: FollowUpStep[] = [
  {
    id: "enrolment_status", 
    type: "options", 
    field: "isEnrolled",
    title: "Are you already enrolled?",
    showIf: { purpose: "STUDY" },
    options: [
      { label: "Yes", value: "YES" },
      { label: "No", value: "NO" },
    ],
  },
  // Add more follow-up steps here
];

// ─────────────────────────────────────────────────────────────
// COUNTRY DATA
// ─────────────────────────────────────────────────────────────
export const TEMPLATE_DATA: CountryData = {
  country: "Template Country",
  code: "TC",
  flag: "🌐",
  purposes: [
    { label: "Study", value: "STUDY", sub: "Pursue education" },
    { label: "Work",  value: "WORK",  sub: "Professional opportunities" },
  ],
  candidateRules: CANDIDATE_RULES,
  followUpSteps: FOLLOW_UP_STEPS,

  visas: {
    "STUDENT_VISA_1": {
      code: "S1", label: "Student Visa", badge: "Non-Immigrant", color: T.primary,
      description: "Description of the student visa.",
      criteria: ["Criterion 1", "Criterion 2"],
      processing: "2–4 weeks",
      forms: ["Form A", "Form B"],
    },
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
    ],
  },
};
