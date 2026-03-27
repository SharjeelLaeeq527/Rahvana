/**
 * visa-engine/logic/gate-engine.ts
 *
 * Country-agnostic gate evaluation.
 * Receives visa data from the registry — no country names hard-coded here.
 */

import { GateQuestionsMap, VisaExplorationAnswers } from "../types";

export function evaluateGate(
  visaCode: string,
  gateQuestions: GateQuestionsMap,
  gateAnswersForVisa: Record<string, string> = {}
) {
  const questions = gateQuestions[visaCode] || [];
  for (const q of questions) {
    const answer = gateAnswersForVisa[q.id];
    if (!answer) return { eligible: false, incomplete: true, failedAt: q };
    if (!q.passWith.includes(answer)) return { eligible: false, incomplete: false, failedAt: q };
  }
  return { eligible: true, incomplete: false, failedAt: null };
}

export function getEligibleVisas(
  answers: VisaExplorationAnswers,
  getCandidateCodes: (a: VisaExplorationAnswers) => string[],
  gateQuestions: GateQuestionsMap,
  visas: Record<string, unknown>
) {
  const candidates = getCandidateCodes(answers);
  const gate = answers.gateAnswers || {};
  return candidates
    .filter((code) => evaluateGate(code, gateQuestions, gate[code] || {}).eligible)
    .map((code) => visas[code])
    .filter(Boolean);
}

export function allGateAnswered(
  answers: VisaExplorationAnswers,
  getCandidateCodes: (a: VisaExplorationAnswers) => string[],
  gateQuestions: GateQuestionsMap
): boolean {
  const candidates = getCandidateCodes(answers);
  if (candidates.length === 0) return false;
  const gate = answers.gateAnswers || {};
  for (const code of candidates) {
    for (const q of gateQuestions[code] || []) {
      if (!(gate[code] || {})[q.id]) return false;
    }
  }
  return true;
}
