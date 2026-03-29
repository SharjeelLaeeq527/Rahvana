import { GateQuestionsMap, VisaExplorationAnswers, CandidateRule, CountryData } from "../types";

/**
 * Checks if a set of answers matches a rule's conditions.
 */
function matches(ruleIf: Record<string, string | string[]>, answers: VisaExplorationAnswers): boolean {
  for (const [key, expected] of Object.entries(ruleIf)) {
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
 * Evaluates all candidate rules for a country and returns unique visa codes.
 */
export function evaluateCandidateRules(rules: CandidateRule[], answers: VisaExplorationAnswers): string[] {
  const codes = new Set<string>();
  for (const rule of rules) {
    if (matches(rule.if, answers)) {
      rule.then.forEach(c => codes.add(c));
    }
  }
  return Array.from(codes);
}

/**
 * Gets codes from either candidateRules or the fallback getCandidateCodes function.
 */
export function getCandidateCodesForCountry(cd: CountryData, a: VisaExplorationAnswers): string[] {
  const codes = evaluateCandidateRules(cd.candidateRules || [], a);
  if (cd.getCandidateCodes) {
    const fallback = cd.getCandidateCodes(a);
    fallback.forEach(c => { if (!codes.includes(c)) codes.push(c); });
  }
  return codes;
}

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
  countryData: CountryData
) {
  const candidates = getCandidateCodesForCountry(countryData, answers);
  const gate = answers.gateAnswers || {};
  return candidates
    .filter((code) => evaluateGate(code, countryData.gateQuestions, gate[code] || {}).eligible)
    .map((code) => countryData.visas[code])
    .filter(Boolean);
}

export function allGateAnswered(
  answers: VisaExplorationAnswers,
  countryData: CountryData
): boolean {
  const candidates = getCandidateCodesForCountry(countryData, answers);
  if (candidates.length === 0) return false;
  const gate = answers.gateAnswers || {};
  for (const code of candidates) {
    for (const q of countryData.gateQuestions[code] || []) {
      if (!(gate[code] || {})[q.id]) return false;
    }
  }
  return true;
}
