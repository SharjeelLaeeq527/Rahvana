/**
 * visa-engine/logic/step-builder.ts
 *
 * Country-agnostic step builder.
 * Delegates all country-specific questions to the CountryData object.
 * No country-specific strings or logic in this file.
 */

import { Step, VisaExplorationAnswers, CountryData, FollowUpStep } from "../types";
import { ALL_COUNTRIES } from "../data/countries";
import { SUPPORTED_DESTINATIONS, getCountryData } from "../data/registry";
import { getCandidateCodesForCountry } from "./gate-engine";

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

/**
 * Checks if a step should be shown based on previous answers.
 */
function shouldShow(conditions: Record<string, string | string[]>, answers: VisaExplorationAnswers): boolean {
  for (const [key, expected] of Object.entries(conditions)) {
    const val = (answers as any)[key];
    if (Array.isArray(expected)) {
      if (!expected.includes(val)) return false;
    } else {
      if (val !== expected) return false;
    }
  }
  return true;
}

/**
 * Builds follow-up steps defined in the country data.
 */
function buildFollowUpSteps(a: VisaExplorationAnswers, cd: CountryData): Step[] {
  const steps: Step[] = [];
  for (const fs of cd.followUpSteps || []) {
    if (shouldShow(fs.showIf, a)) {
      steps.push({
        id: fs.id,
        type: fs.type,
        field: fs.field,
        title: fs.title,
        subtitle: fs.subtitle,
        options: fs.options,
        canProceed: !!(a as any)[fs.field],
      });
    }
  }
  return steps;
}

// ─────────────────────────────────────────────────────────────
// MAIN: buildSteps — fully country-agnostic
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

  // Generic follow-up steps from data
  steps.push(...buildFollowUpSteps(a, countryData));

  // Gate questions per candidate visa
  const candidates = getCandidateCodesForCountry(countryData, a);
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

export { ALL_COUNTRIES };
