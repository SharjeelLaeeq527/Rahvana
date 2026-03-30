/**
 * visa-engine/data/canada.ts
 *
 * Canada visa data — Express Entry, Study Permit, Work Permit, Family Sponsorship, Visitor.
 *
 * Last verified: March 2026
 * Sources:
 *   - https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html
 *   - https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html
 *   - https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary.html
 *   - https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship.html
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "WORK_PERMANENT") {
    c.push("CA-EXPRESS-ENTRY");
  }

  if (a.purpose === "WORK_TEMP") {
    c.push("CA-WORK-PERMIT");
  }

  if (a.purpose === "STUDY") {
    c.push("CA-STUDY-PERMIT");
  }

  if (a.purpose === "FAMILY") {
    c.push("CA-FAMILY-SPONSOR");
  }

  if (a.purpose === "VISIT") {
    c.push("CA-VISITOR");
  }

  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  if (a.purpose === "FAMILY") {
    steps.push({
      id: "sponsor", type: "options", field: "sponsor",
      title: "Who is sponsoring you?",
      subtitle: "Your sponsor must be a Canadian citizen or permanent resident.",
      options: [
        { label: "My spouse or common-law partner", value: "SPOUSE", sub: "Legal marriage or 12+ months cohabitation" },
        { label: "My parent or grandparent", value: "PARENT", sub: "Includes Super Visa options" },
        { label: "Other relative", value: "OTHER" },
      ],
      canProceed: !!a.sponsor,
    });
  }

  if (a.purpose === "WORK_PERMANENT") {
    steps.push({
      id: "workBase", type: "options", field: "workBase",
      title: "Tell us about your background",
      subtitle: "Express Entry uses different programs based on your experience.",
      options: [
        { label: "I have 1+ year of skilled work experience OUTSIDE Canada", value: "FSW", sub: "Federal Skilled Worker Program" },
        { label: "I have 1+ year of skilled work experience INSIDE Canada", value: "CEC", sub: "Canadian Experience Class" },
        { label: "I am a skilled tradesperson (e.g. plumber, welder)", value: "FST", sub: "Federal Skilled Trades Program" },
      ],
      canProceed: !!a.workBase,
    });
  }

  return steps;
}

export const CANADA_DATA: CountryData = {
  country: "Canada",
  code: "CA",
  flag: "🇨🇦",
  purposes: [
    { label: "Settle Permanently (Skilled Work)", value: "WORK_PERMANENT", sub: "Express Entry — Federal Skilled Worker, CEC, or Skilled Trades" },
    { label: "Join Family (Sponsorship)", value: "FAMILY", sub: "Sponsor your spouse, partner, or parent to live in Canada" },
    { label: "Academic Study", value: "STUDY", sub: "Study at a Canadian college or university (DLI)" },
    { label: "Work Temporarily", value: "WORK_TEMP", sub: "Employer-specific or Open Work Permit for limited stay" },
    { label: "Visit / Tourism", value: "VISIT", sub: "Temporary Resident Visa (TRV) for short-term stays" },
  ],
  getCandidateCodes,
  buildFollowUpSteps,
  officialSources: [
    { label: "IRCC.Canada.ca", url: "https://www.canada.ca/en/services/immigration.html" },
  ],
  visas: {
    "CA-EXPRESS-ENTRY": {
      code: "Express Entry", label: "Express Entry — Permanent Residency", badge: "Permanent Resident", color: T.success,
      description: "Canada's points-based system for managing Permanent Residence applications for skilled workers.",
      criteria: [
        "Language proficiency (CLB 7+ in English or French).",
        "Educational Credential Assessment (ECA) for non-Canadian degrees.",
        "At least 1 year of continuous skilled work experience (NOC/TEER 0, 1, 2, or 3).",
        "Proof of funds (unless currently working in Canada).",
        "Medical and police clearance required.",
      ],
      processing: "Approximately 6 to 9 months.",
      forms: ["Express Entry Profile", "ITA Invitation to Apply"],
    },
    "CA-STUDY-PERMIT": {
      code: "Study Permit", label: "Study Permit — Canada", badge: "Study", color: "#6366F1",
      description: "Allows foreign nationals to study at designated learning institutions (DLI) in Canada.",
      criteria: [
        "Letter of Acceptance from a DLI.",
        "Provincial Attestation Letter (PAL) — NEW requirement since 2024 for most students.",
        "Proof of financial support (approx. $20,635 CAD plus tuition and travel).",
        "No criminal record and in good health.",
      ],
      processing: "4 to 16 weeks.",
      forms: ["IMM 1294", "IMM 5645 (Family Info)"],
    },
    "CA-WORK-PERMIT": {
      code: "Work Permit", label: "Temporary Work Permit", badge: "Work Temporary", color: "#0369a1",
      description: "For people who have a job offer in Canada or qualify for an open work permit.",
      criteria: [
        "A valid job offer from a Canadian employer (unless open permit).",
        "Labour Market Impact Assessment (LMIA) — if required by the role.",
        "Proof that you meet the requirements of the job.",
        "Proof of intent to leave Canada at the end of your stay.",
      ],
      processing: "2 to 4 months.",
      forms: ["IMM 1295", "Employer Offer Code"],
    },
    "CA-FAMILY-SPONSOR": {
      code: "Sponsorship", label: "Family Class Sponsorship", badge: "Reunification", color: T.primary,
      description: "For Canadian citizens and permanent residents to sponsor their loved ones.",
      criteria: [
        "Sponsor must be 18+ and live in Canada.",
        "Proof of relationship (Marriage certificate or common-law proof).",
        "Sponsor must sign an undertaking taking financial responsibility.",
        "No criminal background check for the applicant.",
      ],
      processing: "12 to 24 months (Spouses approx 12 months).",
      forms: ["IMM 1344", "IMM 0008", "IMM 5533"],
    },
    "CA-VISITOR": {
      code: "Visitor Visa", label: "Temporary Resident Visa (TRV)", badge: "Visitor", color: "#6366F1",
      description: "For people traveling to Canada for tourism, business, or to visit family.",
      criteria: [
        "Valid travel document (Passport).",
        "Proof of funds to support yourself and your family.",
        "Ties to your home country (Job, home, family assets).",
        "Intent to leave Canada at the end of your visit.",
      ],
      processing: "2 to 8 weeks.",
      forms: ["IMM 5257", "IMM 5645"],
    },
  },
  gateQuestions: {
    "CA-EXPRESS-ENTRY": [
      {
        id: "language_test",
        question: "Do you have valid language test results (IELTS/CELPIP) with at least CLB 7?",
        source: "IRCC — Express Entry language requirements",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements.html",
        passWith: ["YES"],
        failMsg: "CLB 7 is the minimum requirement for the Federal Skilled Worker program.",
        options: [{ label: "Yes", value: "YES" }, { label: "No / Not tested yet", value: "NO" }],
      },
      {
        id: "experience",
        question: "Do you have at least 1 year of continuous skilled work experience?",
        source: "IRCC — Skilled Worker requirements",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/federal-skilled-workers.html",
        passWith: ["YES"],
        failMsg: "Most Express Entry streams require at least 1 year of continuous skilled work experience.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "CA-STUDY-PERMIT": [
      {
        id: "letter_acceptance",
        question: "Do you have a letter of acceptance from a Designated Learning Institution (DLI)?",
        source: "IRCC — Study Permit requirements",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/eligibility.html",
        passWith: ["YES"],
        failMsg: "A letter of acceptance from a DLI is mandatory.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "CA-WORK-PERMIT": [
      {
        id: "job_offer",
        question: "Do you have a valid job offer from a Canadian employer?",
        source: "IRCC — Work Permit requirements",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/need-permit.html",
        passWith: ["YES", "OPEN"],
        failMsg: "Temporary work permits usually require a job offer or qualifying for an open work permit.",
        options: [
          { label: "Yes, I have an offer", value: "YES" },
          { label: "No, but I qualify for an Open Work Permit (e.g. PGWP, Spouse)", value: "OPEN" },
          { label: "No", value: "NO" },
        ],
      },
    ],
  },
};
