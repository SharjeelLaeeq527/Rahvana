/**
 * visa-engine/data/germany.ts
 *
 * Germany visa data — Opportunity Card, EU Blue Card, Family, Study, Ausbildung.
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "WORK") {
    if (a.workStage === "OPPORTUNITY") c.push("DE-CHANCENKARTE");
    if (a.workStage === "BLUE_CARD")  c.push("DE-BLUE-CARD");
    if (a.workStage === "SKILLED")    c.push("DE-SKILLED-WORKER");
  }

  if (a.purpose === "FAMILY") {
    c.push("DE-FAMILY-REUNION");
  }

  if (a.purpose === "AUSBILDUNG") c.push("DE-AUSBILDUNG");
  if (a.purpose === "STUDY")      c.push("DE-STUDY");
  if (a.purpose === "VISIT")      c.push("DE-VISIT");
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
        { label: "Checking for jobs (Opportunity Card)", value: "OPPORTUNITY", sub: "New point-based system starting June 2024" },
        { label: "High-level job offer (EU Blue Card)", value: "BLUE_CARD" },
        { label: "Skilled professional with degree/training", value: "SKILLED" },
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
    { label: "Humanitarian / Asylum", value: "PROTECTION", sub: "Protection for those fearing persecution (BAMF procedure)" },
  ],
  getCandidateCodes,
  buildFollowUpSteps,
  visas: {
    "DE-CHANCENKARTE": {
      code: "Opportunity Card", label: "Chancenkarte — Opportunity Card", badge: "Points System", color: T.success,
      description: "Allows job seekers to stay in Germany for up to 1 year based on a points system.",
      criteria: ["Points system (6+ points).", "Basic German (A1) or English (B2).", "University degree or 2-year vocational training.", "Financial proof of ~€1,027 per month."],
      processing: "4 to 12 weeks.",
      forms: ["Contact German Embassy"],
    },
    "DE-BLUE-CARD": {
      code: "EU Blue Card", label: "EU Blue Card — Germany", badge: "High-Skilled Work", color: T.success,
      description: "A residence permit for high-skilled workers with a job offer and a minimum salary.",
      criteria: ["German/recognized degree.", "Concrete job offer in Germany.", "Minimum salary (€41,041 for shortage occupations; €45,300 for others).", "Employment contract for at least 6 months."],
      processing: "4 to 8 weeks.",
      forms: ["Residence Permit Application"],
    },
    "DE-SKILLED-WORKER": {
      code: "Skilled Worker", label: "Qualified Professional Visa", badge: "Work Permenant", color: T.success,
      description: "For people with recognized vocational training or a university degree and a job offer.",
      criteria: ["Recognized qualification.", "Concrete job offer.", "Professional license (if required for the field)."],
      processing: "3 to 6 months.",
      forms: ["National Visa Application"],
    },
    "DE-FAMILY-REUNION": {
      code: "Family Reunion", label: "Familienzusammenführung", badge: "Reunification", color: T.primary,
      description: "For family members (spouse/children) of people residing in Germany.",
      criteria: ["Sponsor must have a valid residence permit.", "Sufficient living space in Germany.", "Secure livelihood (income).", "Basic German (A1) for spouses in most cases."],
      processing: "3 to 6 months.",
      forms: ["National Visa Application"],
    },
    "DE-AUSBILDUNG": {
      code: "Ausbildung", label: "Vocational Training (Ausbildung)", badge: "Career Training", color: "#F59E0B",
      description: "A dual education system combining work experience and classroom study.",
      criteria: ["Contract for a vocational training position.", "Language skip (typically B1 German).", "Proof of financial means if salary is low."],
      processing: "2 to 4 months.",
      forms: ["Work Contract", "National Visa"],
    },
    "DE-STUDY": {
      code: "Student", label: "Student Visa — Germany", badge: "Study", color: "#6366F1",
      description: "For people with admission to a German higher education institution.",
      criteria: ["Certificate of university admission.", "Proof of financial resources (Blocked Account ~€11,208).", "Health insurance.", "Basic German or English proficiency based on course requirements."],
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
  },
  gateQuestions: {
    "DE-CHANCENKARTE": [
      { id: "points", question: "Do you score 6 or more points in the Opportunity Card point system?", source: "Make it in Germany — Chancenkarte points", sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card", passWith: ["YES"], failMsg: "Must score at least 6 points to be eligible.", options: [{ label: "Yes", value: "YES" }, { label: "No / Unsure", value: "NO" }] },
      { id: "language", question: "Do you have A1 German or B2 English proficiency?", source: "Language requirement — Chancenkarte", sourceUrl: "https://www.make-it-in-germany.com/en/", passWith: ["YES"], failMsg: "One of these is mandatory to get the opportunity card.", options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] },
    ],
    "DE-BLUE-CARD": [
      { id: "salary", question: "Does your job offer meet the minimum salary requirement (€45,300+ in 2024)?", source: "Blue Card Salary Threshold", sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card", passWith: ["YES", "SHORTAGE"], failMsg: "Job must meet the threshold (or slightly lower for MINT / IT professions).", options: [{ label: "Yes, over €45,300", value: "YES" }, { label: "Yes, shortage occupation (MINT/Doctor/IT) over €41,041", value: "SHORTAGE" }, { label: "No", value: "NO" }] },
    ],
    "DE-FAMILY-REUNION": [
      { id: "a1_german", question: "Do you have basic German language skills (Level A1)?", source: "Goethe Institute / UK Gov equivalent for Germany", sourceUrl: "https://www.make-it-in-germany.com/en/living-in-germany/family-reunification/spouses-non-eu", passWith: ["YES", "EXEMPT"], failMsg: "Spouses usually need A1 German unless exempt (e.g. Blue Card spouse).", options: [{ label: "Yes", value: "YES" }, { label: "I am exempt (university degree / spouse has Blue Card)", value: "EXEMPT" }, { label: "No", value: "NO" }] },
    ],
    "DE-AUSBILDUNG": [
      { id: "contract", question: "Do you have a signed vocational training contract with a German company?", source: "Make it in Germany — Ausbildung requirements", sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/vocational-training", passWith: ["YES"], failMsg: "Ausbildung requires a concrete contract first.", options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] },
      { id: "b1_german", question: "Is your German language level at least B1?", source: "Standard language requirement for Ausbildung", sourceUrl: "https://www.make-it-in-germany.com/en/", passWith: ["YES"], failMsg: "Most vocational schools require B1 German to follow the curriculum.", options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] },
    ],
  },
};
