/**
 * visa-engine/logic/step-builder.ts
 *
 * Country-agnostic step builder.
 * Delegates all country-specific questions to the CountryData object.
 * No US-specific strings or logic in this file.
 *
 * FIX: Added "workType" to DOWNSTREAM_CLEAR_MAP for origin, destination,
 * and purpose rows. Previously, changing purpose/destination left a stale
 * workType value in state which was silently carried forward.
 * Also added workType: ["gateAnswers"] so changing workType clears gates.
 */

import { Step, VisaExplorationAnswers } from "../types";
import { ALL_COUNTRIES } from "../data/countries";
import { SUPPORTED_DESTINATIONS, getCountryData } from "../data/registry";

export const DOWNSTREAM_CLEAR_MAP: Record<string, string[]> = {
  origin:        ["destination", "purpose", "workType", "sponsor", "relationship", "beneficiaryAge", "petitionerAge", "workBase", "tempType", "gateAnswers"],
  destination:   ["purpose", "workType", "sponsor", "relationship", "beneficiaryAge", "petitionerAge", "workBase", "tempType", "gateAnswers"],
  purpose:       ["workType", "sponsor", "relationship", "beneficiaryAge", "petitionerAge", "workBase", "tempType", "gateAnswers"],
  sponsor:       ["relationship", "beneficiaryAge", "petitionerAge", "gateAnswers"],
  relationship:  ["beneficiaryAge", "petitionerAge", "gateAnswers"],
  beneficiaryAge:["gateAnswers"],
  petitionerAge: ["gateAnswers"],
  workBase:      ["gateAnswers"],
  tempType:      ["gateAnswers"],
  workType:      ["gateAnswers"],
};

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

  // Country-specific follow-up steps
  const purposeSteps = countryData.buildFollowUpSteps(a);
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

// Re-export ALL_COUNTRIES
export { ALL_COUNTRIES };