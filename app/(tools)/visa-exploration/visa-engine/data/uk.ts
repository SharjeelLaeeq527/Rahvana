/**
 * visa-engine/data/uk.ts
 *
 * UK visa data — Family, Work, Study, Visit.
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "FAMILY") {
    if (a.sponsorStatus === "BRITISH" || a.sponsorStatus === "SETTLED") {
      if (a.relationship === "SPOUSE") c.push("UK-FAMILY-SPOUSE");
      if (a.relationship === "FIANCE") c.push("UK-FAMILY-FIANCE");
    }
  }

  if (a.purpose === "WORK") {
    if (a.workType === "SKILLED") c.push("UK-SKILLED-WORKER");
    if (a.workType === "HEALTH")  c.push("UK-HEALTH-CARE");
    if (a.workType === "GRADUATE")c.push("UK-GRADUATE");
  }

  if (a.purpose === "STUDY") c.push("UK-STUDENT");
  if (a.purpose === "VISIT") c.push("UK-VISIT");

  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  if (a.purpose === "FAMILY") {
    steps.push({
      id: "sponsorStatus", type: "options", field: "sponsorStatus",
      title: "What is your sponsor's status in the UK?",
      options: [
        { label: "British Citizen", value: "BRITISH" },
        { label: "Settled (Indefinite Leave to Remain)", value: "SETTLED" },
        { label: "On a work or student visa", value: "TEMP" },
      ],
      canProceed: !!a.sponsorStatus,
    });
    if (a.sponsorStatus && ["BRITISH", "SETTLED"].includes(a.sponsorStatus as string)) {
      steps.push({
        id: "relationship", type: "options", field: "relationship",
        title: "Your relationship to the sponsor?",
        options: [
          { label: "Spouse or partner", value: "SPOUSE" },
          { label: "Fiancé(e) or proposed civil partner", value: "FIANCE" },
          { label: "Child", value: "CHILD" },
        ],
        canProceed: !!a.relationship,
      });
    }
  }

  if (a.purpose === "WORK") {
    steps.push({
      id: "workType", type: "options", field: "workType",
      title: "What kind of work will you do?",
      options: [
        { label: "Skilled Worker", value: "SKILLED", sub: "General professional jobs with a sponsor" },
        { label: "Health and Care Worker", value: "HEALTH", sub: "Doctors, nurses, and adult social care" },
        { label: "Graduate Visa", value: "GRADUATE", sub: "If you just finished a degree in the UK" },
      ],
      canProceed: !!a.workType,
    });
  }

  return steps;
}

export const UK_DATA: CountryData = {
  country: "United Kingdom",
  code: "UK",
  flag: "🇬🇧",
  purposes: [
    { label: "Family / Join a partner", value: "FAMILY", sub: "Join your spouse or family member who is already in the UK" },
    { label: "Work in the UK", value: "WORK", sub: "Skilled worker, health care, or other professional routes" },
    { label: "Study", value: "STUDY", sub: "Short-term or long-term academic courses" },
    { label: "Visit / Tourism", value: "VISIT", sub: "Vacation, business meetings, or short medical treatment" },
  ],
  getCandidateCodes,
  buildFollowUpSteps,
  visas: {
    "UK-FAMILY-SPOUSE": {
      code: "Family (Spouse)", label: "Family Visa — Spouse", badge: "Settlement", color: T.primary,
      description: "For spouses or partners of British citizens or people with settled status.",
      criteria: ["Partner is British or has ILR.", "Proof of genuine relationship.", "Meet financial requirement (£29,000 income).", "English language requirement."],
      processing: "8 to 24 weeks.",
      forms: ["Apply Online"],
    },
    "UK-SKILLED-WORKER": {
      code: "Skilled Worker", label: "Skilled Worker Visa", badge: "Work", color: T.success,
      description: "The primary route for non-UK nationals to work in a qualifying profession.",
      criteria: ["Job offer from a licensed sponsor.", "Certificate of Sponsorship (CoS).", "Appropriate salary (usually £38,700).", "English at B1 level."],
      processing: "3 to 8 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-STUDENT": {
      code: "Student", label: "Student Visa", badge: "Study", color: "#6366F1",
      description: "For people aged 16 or over who want to study a course in the UK.",
      criteria: ["Unconditional offer (CAS) from a licensed student sponsor.", "Proof of financial support.", "English language proficiency."],
      processing: "3 weeks (outside UK).",
      forms: ["Apply Online", "CAS"],
    },
    "UK-VISIT": {
      code: "Standard Visitor", label: "Standard Visitor Visa", badge: "Visit", color: "#6366F1",
      description: "For tourism, business, study (up to 6 months), and other permitted activities.",
      criteria: ["Leave the UK at the end of visit.", "Can support yourself during the trip.", "Do not intend to work or live permanently."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
  },
  gateQuestions: {
    "UK-FAMILY-SPOUSE": [
      { id: "income", question: "Does your family income meet the £29,000 annual requirement?", source: "UK Gov — Family financial requirement", sourceUrl: "https://www.gov.uk/uk-family-visa/proof-income", passWith: ["YES"], failMsg: "You must prove an annual income of at least £29,000.", options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] },
      { id: "english", question: "Can you prove your knowledge of English (Level A1 or higher)?", source: "UK Gov — English requirement", sourceUrl: "https://www.gov.uk/uk-family-visa/knowledge-of-english", passWith: ["YES"], failMsg: "An English test or degree taught in English is required.", options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] },
    ],
    "UK-SKILLED-WORKER": [
      { id: "cos", question: "Do you have a Certificate of Sponsorship (CoS) from a UK employer?", source: "UK Gov — Skilled Worker requirements", sourceUrl: "https://www.gov.uk/skilled-worker-visa", passWith: ["YES"], failMsg: "A job offer and CoS are mandatory.", options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] },
      { id: "salary", question: "Is your offer salary at least £38,700 (or the 'going rate' for the job)?", source: "UK Gov — Salary thresholds 2024", sourceUrl: "https://www.gov.uk/skilled-worker-visa/your-job", passWith: ["YES", "LOWER"], failMsg: "Most roles require at least £38,700 unless you qualify for a lower rate (e.g., student switch).", options: [{ label: "Yes", value: "YES" }, { label: "No — but I qualify for a lower threshold", value: "LOWER" }, { label: "No", value: "NO" }] },
    ],
  },
};
