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
    { label: "Settle Permanently (Skilled Work)", value: "WORK_PERMANENT", sub: "Express Entry — Healthcare, STEM, Trade, or Transport priorities" },
    { label: "Join Family (Sponsorship)", value: "FAMILY", sub: "Sponsor spouse, partner, or parent (including 2026 Super Visa updates)" },
    { label: "Academic Study", value: "STUDY", sub: "Regular study stream — SDS program has been discontinued" },
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
      description: "Canada's 2026 points-based system with a strong focus on Category-Based Selection for priority sectors.",
      criteria: [
        "Language proficiency (CLB 7+ requirement; French proficiency is a high-priority category).",
        "Educational Credential Assessment (ECA) for non-Canadian degrees.",
        "At least 1 year of continuous skilled work experience in a NOC/TEER 0, 1, 2, or 3 role.",
        "Priority for: Healthcare, STEM, Skilled Trades, Transport, and Medical Research.",
        "Proof of funds required (approx. $14,000+ CAD for single applicant).",
      ],
      processing: "6 to 9 months.",
      forms: ["Express Entry Profile", "ITA (Invitation to Apply)"],
    },
    "CA-STUDY-PERMIT": {
      code: "Study Permit", label: "Study Permit — Canada", badge: "Study", color: "#6366F1",
      description: "Allows foreign nationals to study at DLIs. Note: SDS was discontinued in Nov 2024 for all countries.",
      criteria: [
        "Letter of Acceptance (LOA) from a Designated Learning Institution.",
        "Provincial Attestation Letter (PAL) is mandatory for undergraduate levels.",
        "Verified 2026 Cost-of-Living: $22,895 CAD (single applicant, excluding tuition/travel).",
        "Clear study plan and proof of intent to leave Canada after studies.",
      ],
      processing: "8 to 14 weeks (Regular Stream).",
      forms: ["IMM 1294", "IMM 5645 (Family Information)"],
    },
    "CA-WORK-PERMIT": {
      code: "Work Permit", label: "Temporary Work Permit", badge: "Work Temporary", color: "#0369a1",
      description: "For people who have a job offer in Canada or qualify for an open work permit.",
      criteria: [
        "A valid job offer supported by a Labour Market Impact Assessment (LMIA), unless exempt.",
        "Verification of professional qualifications (e.g., license for regulated trades).",
        "Proof of financial resources to self-support during stay.",
        "Biometrics required for Pakistani applicants (standard procedure).",
      ],
      processing: "2 to 5 months.",
      forms: ["IMM 1295", "Employer Offer Code"],
    },
    "CA-FAMILY-SPONSOR": {
      code: "Sponsorship", label: "Family Class Sponsorship", badge: "Reunification", color: T.primary,
      description: "Allows Canadian citizens/PRs to sponsor loved ones. Spousal processing remains priority.",
      criteria: [
        "Sponsor must sign an 'Undertaking' (financial responsibility for 3-20 years).",
        "Proof of relationship (Marriage certificate, common-law cohabitation proof).",
        "Parent/Grandparent sponsorship via lottery system or Super Visa option.",
        "Medical and police checks for the sponsored person.",
      ],
      processing: "12 months (Spouse) to 24+ months (Parents).",
      forms: ["IMM 1344", "IMM 0008", "IMM 5533"],
    },
    "CA-VISITOR": {
      code: "Visitor Visa", label: "Temporary Resident Visa (TRV)", badge: "Visitor", color: "#6366F1",
      description: "Standard visitor visa for tourism, family visits, or business trips.",
      criteria: [
        "Valid proof of funds (bank statements for last 4-6 months).",
        "Proof of strong ties to home country (employment, assets, family).",
        "Invitation letter if visiting family or friends in Canada.",
        "Police clearance may be requested depending on stay duration.",
      ],
      processing: "3 to 10 weeks.",
      forms: ["IMM 5257", "IMM 5645"],
    },
  },
  gateQuestions: {
    "CA-EXPRESS-ENTRY": [
      {
        id: "language_test",
        question: "Do you have valid language test results (IELTS/CELPIP) with at least CLB 7 in all skills?",
        source: "IRCC — Express Entry language requirements",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements.html",
        passWith: ["YES"],
        failMsg: "CLB 7 is the mandatory minimum for Express Entry. Applicants without this cannot enter the pool.",
        options: [{ label: "Yes", value: "YES" }, { label: "No / Not tested yet", value: "NO" }],
      },
      {
        id: "priority_sector",
        question: "Is your work experience in any of these priority sectors: Healthcare, STEM, Trades, Transport, or Agriculture?",
        source: "IRCC — Category-Based Selection 2026",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations/category-based-selection.html",
        passWith: ["YES", "NO"],
        failMsg: "", // No fatal failure here, just impacts score
        options: [
          { label: "Yes — I work in a priority sector", value: "YES" },
          { label: "No — but I have other skilled experience", value: "NO" },
        ],
      },
    ],
    "CA-STUDY-PERMIT": [
      {
        id: "funds_2026",
        question: "Do you have proof of at least $22,895 CAD for living expenses (separate from tuition fees)?",
        source: "IRCC — Study Permit Financial Requirements 2026",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/eligibility.html#funds",
        passWith: ["YES"],
        failMsg: "As of 2026, the mandatory cost-of-living proof for a single student is $22,895 CAD. Applications with insufficient funds are rejected.",
        options: [{ label: "Yes", value: "YES" }, { label: "No / My funds are lower", value: "NO" }],
      },
      {
        id: "pal_check",
        question: "Do you have a Provincial Attestation Letter (PAL) from the province where you will study?",
        source: "IRCC — Provincial Attestation Letter requirement",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html#attestation",
        passWith: ["YES", "EXEMPT"],
        failMsg: "A PAL is mandatory for most undergraduate and college students. Without it, the application is incomplete.",
        options: [
          { label: "Yes, I have my PAL", value: "YES" },
          { label: "Exempt (e.g., Master's, PhD, or primary/secondary student)", value: "EXEMPT" },
          { label: "No", value: "NO" },
        ],
      },
    ],
    "CA-WORK-PERMIT": [
      {
        id: "lmia_status",
        question: "Do you have a valid Job Offer supported by a positive LMIA or a valid LMIA-exempt code?",
        source: "IRCC — Work Permit Job Offer requirements",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/need-permit.html",
        passWith: ["YES", "OPEN"],
        failMsg: "Most temporary work permits require a job offer with an LMIA or qualifying for an Open Work Permit (e.g., PGWP or SOWP in approved cases).",
        options: [
          { label: "Yes, I have an LMIA-supported offer", value: "YES" },
          { label: "I qualify for an Open Work Permit", value: "OPEN" },
          { label: "No", value: "NO" },
        ],
      },
    ],
  },
};
