/**
 * visa-engine/logic/step-builder.ts
 *
 * Country-agnostic step builder.
 * Delegates all country-specific questions to the CountryData object.
 * No US-specific strings or logic in this file.
 */

import { Step, VisaExplorationAnswers, CountryData } from "../types";
import { ALL_COUNTRIES } from "../data/countries";
import { SUPPORTED_DESTINATIONS, getCountryData } from "../data/registry";

export const DOWNSTREAM_CLEAR_MAP: Record<string, string[]> = {
  origin:        ["destination", "purpose", "sponsor", "relationship", "beneficiaryAge", "petitionerAge", "workBase", "tempType", "gateAnswers"],
  destination:   ["purpose", "sponsor", "relationship", "beneficiaryAge", "petitionerAge", "workBase", "tempType", "gateAnswers"],
  purpose:       ["sponsor", "relationship", "beneficiaryAge", "petitionerAge", "workBase", "tempType", "gateAnswers"],
  sponsor:       ["relationship", "beneficiaryAge", "petitionerAge", "gateAnswers"],
  relationship:  ["beneficiaryAge", "petitionerAge", "gateAnswers"],
  beneficiaryAge:["gateAnswers"],
  petitionerAge: ["gateAnswers"],
  workBase:      ["gateAnswers"],
  tempType:      ["gateAnswers"],
};

// ─────────────────────────────────────────────────────────────
// US-specific follow-up steps (injected by US data)
// This function is called from VisaExplorationTool and builds
// all mid-wizard steps using the country's own purposes list.
// ─────────────────────────────────────────────────────────────
function buildUSPurposeSteps(a: VisaExplorationAnswers, cd: CountryData): Step[] {
  const steps: Step[] = [];

  if (a.purpose === "FAMILY") {
    steps.push({
      id: "sponsor", type: "options", field: "sponsor",
      title: "What is your family member's status there?",
      subtitle: "The person who will help bring you there — what kind of status do they have?",
      options: [
        { label: "They are a U.S. Citizen", value: "US_CITIZEN", sub: "Born there, naturalized, or got citizenship through parents" },
        { label: "They have a Green Card (Permanent Resident)", value: "LPR", sub: "They live there permanently but aren't a citizen yet" },
      ],
      canProceed: !!a.sponsor,
    });

    if (a.sponsor === "US_CITIZEN") {
      steps.push({
        id: "relationship", type: "options", field: "relationship",
        title: "What is your relationship with this person?",
        subtitle: "How are you related to the U.S. citizen? Different relationships lead to different visa categories.",
        options: [
          { label: "I am their husband or wife",           value: "SPOUSE",        sub: "We are legally married" },
          { label: "I am their fiancé(e)",                 value: "FIANCE",        sub: "We're engaged but not married yet" },
          { label: "I am their unmarried son or daughter", value: "CHILD",         sub: "I'm not married" },
          { label: "I am their married son or daughter",   value: "MARRIED_CHILD", sub: "I'm married" },
          { label: "I am their parent (mother or father)", value: "PARENT" },
          { label: "I am their brother or sister",         value: "SIBLING" },
        ],
        canProceed: !!a.relationship,
      });
      if (a.relationship === "CHILD") {
        steps.push({
          id: "beneficiaryAge", type: "grid", field: "beneficiaryAge",
          title: "How old are you?",
          subtitle: "Your age makes a big difference in which visa category applies.",
          options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
          canProceed: !!a.beneficiaryAge,
        });
      }
      if (a.relationship && ["PARENT", "SIBLING"].includes(a.relationship)) {
        steps.push({
          id: "petitionerAge", type: "grid", field: "petitionerAge",
          title: "How old is the U.S. citizen?",
          subtitle: `To bring a ${a.relationship === "PARENT" ? "parent" : "sibling"} to the U.S., the citizen must be at least 21.`,
          options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
          canProceed: !!a.petitionerAge,
        });
      }
    }

    if (a.sponsor === "LPR") {
      steps.push({
        id: "relationship", type: "options", field: "relationship",
        title: "What is your relationship with the Green Card holder?",
        subtitle: "Green Card holders can bring certain family members. Select your relationship.",
        options: [
          { label: "I am their husband or wife",           value: "SPOUSE" },
          { label: "I am their unmarried son or daughter", value: "CHILD" },
        ],
        canProceed: !!a.relationship,
      });
      if (a.relationship === "CHILD") {
        steps.push({
          id: "beneficiaryAge", type: "grid", field: "beneficiaryAge",
          title: "How old are you?",
          subtitle: "This determines whether you fall under category F2A or F2B.",
          options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
          canProceed: !!a.beneficiaryAge,
        });
      }
    }
  }

  if (a.purpose === "WORK_PERMANENT") {
    steps.push({
      id: "workBase", type: "options", field: "workBase",
      title: "Tell us a bit about yourself",
      subtitle: "Which of these sounds most like you? We'll explain everything later.",
      options: [
        { label: "I'm exceptional in my field",                        value: "EXTRAORDINARY",  sub: "Major awards or significant recognition in sciences, arts, education, business, or athletics" },
        { label: "I'm a professor or researcher",                      value: "RESEARCHER",      sub: "I have international recognition and 3+ years of academic experience" },
        { label: "I'm a manager or executive at a company with U.S. offices", value: "MANAGER", sub: "My company has a branch, subsidiary, or parent company there" },
        { label: "I have an advanced degree or strong expertise",      value: "ADVANCED_DEGREE", sub: "Master's, PhD, or a bachelor's with 5+ years of experience" },
        { label: "I'm a skilled worker or professional",               value: "SKILLED",         sub: "2+ years of training/experience, or a bachelor's degree" },
        { label: "I want to invest money and create jobs",             value: "INVESTOR",        sub: "I can invest $800K–$1.05M in a U.S. business that creates 10+ jobs" },
      ],
      canProceed: !!a.workBase,
    });
  }

  if (a.purpose === "STUDY") {
    steps.push({
      id: "tempType", type: "options", field: "tempType",
      title: "What kind of program are you interested in?",
      subtitle: "This helps us figure out the right visa type for your studies.",
      options: [
        { label: "A degree program at a college or university", value: "ACADEMIC", sub: "Bachelor's, Master's, PhD, or professional degree at a certified institution" },
        { label: "An exchange or cultural program",             value: "EXCHANGE", sub: "Research, teaching, au pair, internship, or cultural exchange sponsored program" },
      ],
      canProceed: !!a.tempType,
    });
  }

  if (a.purpose === "WORK_TEMP") {
    steps.push({
      id: "tempType", type: "options", field: "tempType",
      title: "What kind of work will you be doing?",
      subtitle: "Different types of work have different visa options. Pick the one closest to your situation.",
      options: [
        { label: "A professional/specialty job",               value: "SPECIALTY",     sub: "IT, engineering, finance, medicine — the kind of job that needs a degree (H-1B)" },
        { label: "My company is sending me to their U.S. office", value: "TRANSFER",  sub: "Same company, different country — internal transfer (L-1)" },
        { label: "I'm at the top of my field",                 value: "EXTRAORDINARY", sub: "Nationally or internationally recognized in science, arts, education, business, or athletics (O-1)" },
        { label: "I'm from Canada or Mexico with a USMCA profession", value: "USMCA", sub: "Specific professional occupations listed in the USMCA trade agreement (TN)" },
      ],
      canProceed: !!a.tempType,
    });
  }

  return steps;
}

// ─────────────────────────────────────────────────────────────
// MAIN: buildSteps — country-agnostic shell
// ─────────────────────────────────────────────────────────────
export function buildSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  // Q1: Origin
  steps.push({
    id: "origin", type: "country", field: "origin", isDestination: false,
    title: "Where are you from?",
    subtitle: "Tell us your country of citizenship. This helps us figure out what options are available for you.",
    hint: "Start typing your country name...",
    canProceed: !!a.origin,
  });

  // Q2: Destination
  steps.push({
    id: "destination", type: "country", field: "destination", isDestination: true,
    title: "Where do you want to go?",
    subtitle: "Which country are you interested in visiting, studying, working, or settling in?",
    hint: "Start typing a country name...",
    canProceed: !!a.destination,
  });

  if (!a.destination) return steps;

  // Unsupported destination
  if (!SUPPORTED_DESTINATIONS.includes(a.destination)) {
    steps.push({ id: "unsupported", type: "unsupported", isUnsupported: true, canProceed: false });
    return steps;
  }

  const countryData = getCountryData(a.destination);
  if (!countryData) return steps;

  // Q3: Purpose (from country data — no hard-coding)
  steps.push({
    id: "purpose", type: "options", field: "purpose",
    title: "What would you like to do there?",
    subtitle: "Don't worry if you're not sure — just pick the option closest to what you have in mind.",
    options: countryData.purposes,
    canProceed: !!a.purpose,
  });

  if (!a.purpose) return steps;

  // Country-specific follow-up steps (US uses inline builder)
  const purposeSteps = buildUSPurposeSteps(a, countryData);
  steps.push(...purposeSteps);

  // Gate questions per candidate visa
  const candidates = countryData.getCandidateCodes(a);
  const gate = a.gateAnswers || {};

  for (const code of candidates) {
    const questions = countryData.gateQuestions[code] || [];
    const visaObj = countryData.visas[code];
    if (!visaObj || questions.length === 0) continue;
    const visaGate = gate[code] || {};

    for (const q of questions) {
      steps.push({
        id: `gate_${code}_${q.id}`,
        type: "gate_question",
        visaCode: code,
        visaLabel: visaObj.label,
        visaColor: visaObj.color,
        field: `gateAnswers.${code}.${q.id}`,
        questionId: q.id,
        title: q.question,
        subtitle: q.source,
        sourceUrl: q.sourceUrl,
        passWith: q.passWith,
        failMsg: q.failMsg,
        options: q.options,
        canProceed: !!visaGate[q.id],
      });
    }
  }

  return steps;
}

// Re-export ALL_COUNTRIES so VisaExplorationTool only needs one import path
export { ALL_COUNTRIES };
