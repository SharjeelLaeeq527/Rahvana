/**
 * visa-engine/data/germany.ts
 *
 * Germany visa data — Opportunity Card, EU Blue Card, Family, Study, Ausbildung.
 *
 * Last verified: March 2026
 * Sources:
 *   - https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card
 *   - https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card
 *   - https://www.make-it-in-germany.com/en/visa-residence/family-reunification/spouses-joining-citizens-non-eu
 *   - https://www.make-it-in-germany.com/en/visa-residence/types/training
 *   - https://www.make-it-in-germany.com/en/visa-residence/types/student-visa
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "WORK") {
    if (a.workStage === "OPPORTUNITY") c.push("DE-CHANCENKARTE");
    if (a.workStage === "BLUE_CARD")  c.push("DE-BLUE-CARD");
    if (a.workStage === "SKILLED")    c.push("DE-SKILLED-WORKER");
    if (a.workStage === "FREELANCE")  c.push("DE-FREELANCE");
  }

  if (a.purpose === "FAMILY") {
    c.push("DE-FAMILY-REUNION");
  }

  if (a.purpose === "AUSBILDUNG") c.push("DE-AUSBILDUNG");
  if (a.purpose === "STUDY")      c.push("DE-STUDY");
  if (a.purpose === "VISIT")      c.push("DE-VISIT");
  if (a.purpose === "SELF_EMPLOYED") c.push("DE-FREELANCE");
  if (a.purpose === "PROTECTION") c.push("DE-ASYLUM");

  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  if (a.purpose === "WORK") {
    steps.push({
      id: "workStage", type: "options", field: "workStage",
      title: "Where are you in your work search?",
      options: [
        { label: "Checking for jobs (Opportunity Card)", value: "OPPORTUNITY", sub: "Point-based job search visa — launched June 2024" },
        { label: "High-level job offer (EU Blue Card)", value: "BLUE_CARD" },
        { label: "Skilled professional with degree/training", value: "SKILLED" },
        { label: "Freelancer / Self-Employed", value: "FREELANCE", sub: "For artists, engineers, or business owners" },
      ],
      canProceed: !!a.workStage,
    });
  }

  if (a.purpose === "FAMILY") {
    steps.push({
      id: "relationship", type: "options", field: "relationship",
      title: "Who are you joining in Germany?",
      options: [
        { label: "My spouse (husband/wife)", value: "SPOUSE" },
        { label: "My parent", value: "PARENT" },
        { label: "My child", value: "CHILD" },
      ],
      canProceed: !!a.relationship,
    });
  }

  return steps;
}

export const GERMANY_DATA: CountryData = {
  country: "Germany",
  code: "DE",
  flag: "🇩🇪",
  purposes: [
    { label: "Work or Job Search", value: "WORK", sub: "Opportunity Card, EU Blue Card, or skilled professional visa" },
    { label: "Join family (Reunification)", value: "FAMILY", sub: "Join your spouse or family members already living in Germany" },
    { label: "Vocational Training (Ausbildung)", value: "AUSBILDUNG", sub: "Parallel work and study program — very popular for non-EU citizens" },
    { label: "Academic Study", value: "STUDY", sub: "Bachelor's, Master's, or PhD at a German university" },
    { label: "Visit / Tourism", value: "VISIT", sub: "Schengen visa for short-term stays" },
    { label: "Self-Employed / Business", value: "SELF_EMPLOYED", sub: "Start a business or work as a freelancer in Germany" },
    { label: "Humanitarian / Asylum", value: "PROTECTION", sub: "Protection for those fearing persecution (BAMF procedure)" },
  ],
  getCandidateCodes,
  buildFollowUpSteps,
  getCountryNotes: (a) => {
    const notes = [];
    if (a.origin?.toLowerCase() === "pakistan") {
      notes.push("⚠️ Official 2026 Policy: The German Embassy in Islamabad usually conducts a mandatory verification of all Pakistani documents (birth, marriage certificates, degrees). This can add ~€350–€400 in fees and 3–4 months to processing.");
    }
    return notes;
  },
  officialSources: [
    { label: "Make-it-in-Germany.com", url: "https://www.make-it-in-germany.com/en/" },
  ],
  visas: {
    "DE-CHANCENKARTE": {
      code: "Opportunity Card", label: "Chancenkarte — Opportunity Card", badge: "Points System", color: T.success,
      description: "Allows job seekers to stay in Germany for up to 1 year based on a points system.",
      criteria: [
        "Points system (6+ points).",
        "Basic German (A1) or English (B2).",
        "University degree or 2-year vocational training.",
        // ✅ Updated: was €1,027/month — official figure raised to €1,091/month in 2025
        // Source: https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card
        "Financial proof of at least €1,091 per month.",
      ],
      processing: "4 to 12 weeks.",
      forms: ["Contact German Embassy"],
    },
    "DE-BLUE-CARD": {
      code: "EU Blue Card", label: "EU Blue Card — Germany", badge: "High-Skilled Work", color: T.success,
      description: "A residence permit for high-skilled workers with a job offer and a minimum salary.",
      criteria: [
        "German/recognized degree.",
        "Concrete job offer in Germany.",
        // ✅ Updated: was €41,041 / €45,300 — thresholds raised for 2026
        // Source: https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card
        "Minimum salary (€45,934 for shortage occupations — MINT, IT, Medicine; €50,700 for all other roles).",
        "Employment contract for at least 6 months.",
      ],
      processing: "4 to 8 weeks.",
      forms: ["Residence Permit Application"],
    },
    "DE-SKILLED-WORKER": {
      code: "Skilled Worker", label: "Qualified Professional Visa", badge: "Work Permanent", color: T.success,
      description: "For people with recognized vocational training or a university degree and a job offer.",
      criteria: ["Recognized qualification.", "Concrete job offer.", "Professional license (if required for the field)."],
      processing: "3 to 6 months.",
      forms: ["National Visa Application"],
    },
    "DE-FAMILY-REUNION": {
      code: "Family Reunion", label: "Familienzusammenführung", badge: "Reunification", color: T.primary,
      description: "For family members (spouse/children) of people residing in Germany.",
      criteria: [
        "Sponsor must have a valid residence permit.",
        "Sufficient living space in Germany.",
        "Secure livelihood (income).",
        "Basic German (A1) for spouses — exemptions apply (e.g. spouse of EU Blue Card holder, or applicant holds a university degree).",
      ],
      processing: "3 to 6 months.",
      forms: ["National Visa Application"],
    },
    "DE-AUSBILDUNG": {
      code: "Ausbildung", label: "Vocational Training (Ausbildung)", badge: "Career Training", color: "#F59E0B",
      description: "A dual education system combining work experience and classroom study.",
      criteria: [
        "Contract for a vocational training position.",
        // ✅ Fixed typo: was "Language skip" — corrected to "Language requirement"
        // Source: https://www.make-it-in-germany.com/en/visa-residence/types/training
        "Language requirement: typically B1 German.",
        "Proof of financial means if training salary is insufficient.",
      ],
      processing: "4 to 12 weeks.",
      forms: ["Work Contract", "National Visa"],
    },
    "DE-STUDY": {
      code: "Student", label: "Student Visa — Germany", badge: "Study", color: "#6366F1",
      description: "For people with admission to a German higher education institution.",
      criteria: [
        "Certificate of university admission.",
        // ✅ Updated: was ~€11,208 — raised to €11,904/year from Winter Semester 2024 (€992/month × 12)
        // Source: https://www.make-it-in-germany.com/en/visa-residence/types/student-visa
        "Proof of financial resources (Blocked Account — €11,904 per year as of Winter 2024).",
        "Health insurance.",
        "Basic German or English proficiency based on course requirements.",
      ],
      processing: "6 to 12 weeks.",
      forms: ["Schengen/National Visa Form"],
    },
    "DE-VISIT": {
      code: "Schengen Visa", label: "Schengen Visa (Visit/Business)", badge: "C-Type Visa", color: "#6366F1",
      description: "Short stays in the Schengen area for up to 90 days for tourism or business.",
      criteria: ["Valid passport.", "Travel health insurance (€30k coverage).", "Proof of funds.", "Proof of accommodation."],
      processing: "2 weeks.",
      forms: ["Schengen Visa Form"],
    },
    "DE-ASYLUM": {
      code: "Asylum", label: "Humanitarian Protection", badge: "Asylum", color: "#DC2626",
      description: "Seeking protection in Germany under the Geneva Refugee Convention or subsidiary protection.",
      criteria: ["Physical presence in Germany.", "Fear of persecution or serious harm in home country.", "Process managed by BAMF."],
      processing: "Indeterminate (months to years).",
      forms: ["BAMF Application"],
    },
    "DE-FREELANCE": {
      code: "Freelance/Self-Employed", label: "Self-Employment Visa", badge: "Business", color: T.primary,
      description: "For individuals who want to start a business or work as a freelancer (liberal professions like doctors, engineers, artists).",
      criteria: [
        "Business plan that serves an economic interest or regional need in Germany.",
        "Proof of financial sustainability for the business and yourself.",
        "Evidence of professional qualifications.",
        "For over-45s: Proof of adequate old-age pension provision.",
        "Pakistan note (2026): Highly scrutinized. Requires absolute clarity on how your business generates value in Germany.",
      ],
      processing: "3 to 6 months.",
      forms: ["Business Plan", "Financing Plan", "National Visa Application"],
    },
  },
  gateQuestions: {
    "DE-CHANCENKARTE": [
      {
        id: "points",
        question: "Do you score 6 or more points in the Opportunity Card point system?",
        source: "Make it in Germany — Chancenkarte points calculator",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card",
        passWith: ["YES"],
        failMsg: "Must score at least 6 points to be eligible for the Opportunity Card.",
        options: [{ label: "Yes", value: "YES" }, { label: "No / Unsure", value: "NO" }],
      },
      {
        id: "language",
        question: "Do you have A1 German or B2 English proficiency?",
        source: "Language requirement — Chancenkarte (Make it in Germany)",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card",
        passWith: ["YES"],
        failMsg: "One of these language levels is mandatory to qualify for the Opportunity Card.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "DE-BLUE-CARD": [
      {
        id: "salary",
        // ✅ Updated question text and options to reflect 2026 salary thresholds
        // Source: https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card
        question: "Does your job offer meet the minimum salary requirement for the EU Blue Card (2026 thresholds)?",
        source: "EU Blue Card Salary Thresholds 2026 — Make it in Germany",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card",
        passWith: ["YES", "SHORTAGE"],
        failMsg: "Your job offer must meet the threshold: €50,700 general, or €45,934 for shortage occupations (MINT, IT, Medicine).",
        options: [
          { label: "Yes — general role, salary ≥ €50,700", value: "YES" },
          { label: "Yes — shortage occupation (MINT / IT / Doctor), salary ≥ €45,934", value: "SHORTAGE" },
          { label: "No", value: "NO" },
        ],
      },
    ],
    "DE-FAMILY-REUNION": [
      {
        id: "a1_german",
        question: "Do you have basic German language skills (Level A1)?",
        source: "Family Reunification — Spouses joining non-EU citizens (Make it in Germany)",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/family-reunification/spouses-joining-citizens-non-eu",
        passWith: ["YES", "EXEMPT"],
        failMsg: "Spouses usually need A1 German unless an exemption applies (e.g. spouse holds EU Blue Card, or applicant has a university degree).",
        options: [
          { label: "Yes", value: "YES" },
          { label: "I am exempt (university degree / spouse has Blue Card)", value: "EXEMPT" },
          { label: "No", value: "NO" },
        ],
      },
    ],
    "DE-AUSBILDUNG": [
      {
        id: "contract",
        question: "Do you have a signed vocational training contract with a German company?",
        source: "Make it in Germany — Vocational Training Visa requirements",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/training",
        passWith: ["YES"],
        failMsg: "Ausbildung visa requires a concrete signed training contract first.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
      {
        id: "b1_german",
        question: "Is your German language level at least B1?",
        source: "Language requirement for Ausbildung — Make it in Germany",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/training",
        passWith: ["YES"],
        failMsg: "Most vocational schools require B1 German to follow the training curriculum.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "DE-FREELANCE": [
      {
        id: "qualification_de",
        question: "Do you have a university degree or professional qualification recognized in Germany for your field?",
        source: "Self-Employment Visa — Recognition of Qualifications (Make it in Germany)",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/self-employment",
        passWith: ["YES"],
        failMsg: "Freelancing in Germany (especially for 'liberal professions' like engineering or medicine) requires recognized qualifications. Most artistic or media roles also require proof of professional status.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
      {
        id: "economic_interest",
        question: "Does your proposed business serve an economic interest or regional need in Germany?",
        source: "Legal requirement — § 21 Residence Act",
        sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/self-employment",
        passWith: ["YES"],
        failMsg: "For most business owners, you must prove that your business will benefit the German economy. This is usually verified by local trade chambers (IHK).",
        options: [{ label: "Yes", value: "YES" }, { label: "I am a freelancer (Art/Engineering/PhD) — Regional need requirement is relaxed", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
  },
};