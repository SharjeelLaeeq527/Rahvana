/**
 * visa-exploration-logic.ts
 *
 * ONE flat question flow. No phases, no headers, no "start checking" buttons.
 * Questions are ordered:
 *   1. Origin country
 *   2. Destination country
 *   3. Situation-specific questions (relationship, age, work type, etc.)
 *   4. USCIS eligibility gate questions for each candidate visa
 *
 * At the end, getEligibleVisas() returns only visas where
 * ALL gate questions were answered correctly per USCIS requirements.
 *
 * Sources:
 *   USCIS.gov · travel.state.gov · INA statutes cited per question
 */

import {
  US_VISAS,
  SUPPORTED_DESTINATIONS,
  VisaExplorationAnswers,
  GateQuestionsMap,
  Step,
} from "./visa-exploration-data";

// ─────────────────────────────────────────────────────────────
// DOWNSTREAM CLEAR MAP
// ─────────────────────────────────────────────────────────────
export const DOWNSTREAM_CLEAR_MAP: Record<string, string[]> = {
  origin:           ["destination","petitionerStatus","relationship","petitionerAge","beneficiaryAge","workBase","tempPurpose","gateAnswers"],
  destination:      ["petitionerStatus","relationship","petitionerAge","beneficiaryAge","workBase","tempPurpose","gateAnswers"],
  petitionerStatus: ["relationship","petitionerAge","beneficiaryAge","workBase","tempPurpose","gateAnswers"],
  relationship:     ["petitionerAge","beneficiaryAge","gateAnswers"],
  beneficiaryAge:   ["gateAnswers"],
  petitionerAge:    ["gateAnswers"],
  workBase:         ["gateAnswers"],
  tempPurpose:      ["gateAnswers"],
};

// ─────────────────────────────────────────────────────────────
// CANDIDATE CODES
// Based on discovery answers — which visas could possibly apply?
// ─────────────────────────────────────────────────────────────
export function getCandidateCodes(answers: VisaExplorationAnswers): string[] {
  if (!answers.destination || answers.destination !== "United States") return [];
  const { petitionerStatus, relationship, petitionerAge, beneficiaryAge, workBase, tempPurpose } = answers;
  const c: string[] = [];
  if (!petitionerStatus) return c;

  if (petitionerStatus === "US_CITIZEN") {
    if (relationship === "SPOUSE")        c.push("IR-1", "CR-1");
    if (relationship === "FIANCE")        c.push("K-1");
    if (relationship === "CHILD") {
      if (beneficiaryAge === "UNDER_21")  c.push("IR-2");
      if (beneficiaryAge === "OVER_21")   c.push("F1");
    }
    if (relationship === "MARRIED_CHILD") c.push("F3");
    if (relationship === "PARENT")        c.push("IR-5");
    if (relationship === "SIBLING")       c.push("F4");
  }
  if (petitionerStatus === "LPR") {
    if (relationship === "SPOUSE")        c.push("F2A");
    if (relationship === "CHILD") {
      if (beneficiaryAge === "UNDER_21")  c.push("F2A");
      if (beneficiaryAge === "OVER_21")   c.push("F2B");
    }
  }
  if (petitionerStatus === "NONE") {
    if (workBase === "EXTRAORDINARY")     c.push("EB-1A");
    if (workBase === "RESEARCHER")        c.push("EB-1B");
    if (workBase === "MANAGER")           c.push("EB-1C");
    if (workBase === "ADVANCED_DEGREE")   c.push("EB-2-NIW", "EB-2");
    if (workBase === "SKILLED")           c.push("EB-3");
    if (workBase === "INVESTOR")          c.push("EB-5");
  }
  if (petitionerStatus === "TEMP") {
    if (tempPurpose && ["TOURISM","MEDICAL","BUSINESS","FAMILY_VISIT"].includes(tempPurpose)) c.push("B1/B2");
    if (tempPurpose === "STUDY")              c.push("F-1");
    if (tempPurpose === "EXCHANGE")           c.push("J-1");
    if (tempPurpose === "WORK_SPECIALTY")     c.push("H-1B");
    if (tempPurpose === "WORK_TRANSFER")      c.push("L-1");
    if (tempPurpose === "WORK_EXTRAORDINARY") c.push("O-1");
    if (tempPurpose === "WORK_USMCA")         c.push("TN");
  }
  if (petitionerStatus === "HUMANITARIAN")    c.push("Asylum", "U-Visa");

  return [...new Set(c)];
}

// ─────────────────────────────────────────────────────────────
// GATE QUESTIONS
// Exact USCIS requirements per visa, asked as plain questions.
// Source URLs included for every requirement.
// ─────────────────────────────────────────────────────────────
export const GATE_QUESTIONS: GateQuestionsMap = {

  "IR-1": [
    {
      id: "legally_married",
      question: "Are you and the petitioner legally married?",
      source: "USCIS Form I-130 — bona fide marriage required",
      sourceUrl: "https://www.uscis.gov/i-130",
      passWith: ["YES"],
      failMsg: "IR-1 requires a valid, legally recognized marriage.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "marriage_2yr",
      question: "Has the marriage been 2 years or more at the time of U.S. admission?",
      source: "travel.state.gov — IR-1 vs CR-1: 2-year rule at time of admission",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration/immigrant-visa-for-spouse.html",
      passWith: ["YES"],
      failMsg: "If married less than 2 years, CR-1 applies instead. CR-1 grants a conditional green card.",
      options: [{ label: "Yes, 2 or more years", value: "YES" }, { label: "No, less than 2 years", value: "NO" }],
    },
    {
      id: "prior_marriages_resolved",
      question: "Have all prior marriages of both parties been legally terminated (divorce, death, or annulment)?",
      source: "USCIS Form I-130 instructions",
      sourceUrl: "https://www.uscis.gov/i-130",
      passWith: ["YES", "NA"],
      failMsg: "All prior marriages must be legally terminated before a new marriage can be recognized for immigration.",
      options: [{ label: "Yes — or there are no prior marriages", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "CR-1": [
    {
      id: "legally_married",
      question: "Are you and the petitioner legally married?",
      source: "USCIS Form I-130 — bona fide marriage required",
      sourceUrl: "https://www.uscis.gov/i-130",
      passWith: ["YES"],
      failMsg: "CR-1 requires a valid, legally recognized marriage.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "marriage_under_2yr",
      question: "Will the marriage be less than 2 years old at the time of U.S. admission?",
      source: "travel.state.gov — CR-1 applies when married < 2 years at admission",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration/immigrant-visa-for-spouse.html",
      passWith: ["YES"],
      failMsg: "If married 2+ years at admission, IR-1 (unconditional green card) applies instead.",
      options: [{ label: "Yes, less than 2 years", value: "YES" }, { label: "No, 2 or more years", value: "NO" }],
    },
    {
      id: "prior_marriages_resolved",
      question: "Have all prior marriages of both parties been legally terminated?",
      source: "USCIS Form I-130",
      sourceUrl: "https://www.uscis.gov/i-130",
      passWith: ["YES", "NA"],
      failMsg: "All prior marriages must be legally terminated.",
      options: [{ label: "Yes — or there are no prior marriages", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "K-1": [
    {
      id: "both_free_to_marry",
      question: "Are both you and the petitioner currently unmarried and legally free to marry?",
      source: "USCIS — K-1 both parties must be legally free to marry (INA 214(d))",
      sourceUrl: "https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens",
      passWith: ["YES"],
      failMsg: "Both parties must be legally free to marry. Any prior marriages must be legally terminated.",
      options: [{ label: "Yes, both are free to marry", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "met_in_person",
      question: "Have you and the petitioner met in person at least once in the past 2 years?",
      source: "USCIS Form I-129F — in-person meeting within 2 years of filing",
      sourceUrl: "https://www.uscis.gov/i-129f",
      passWith: ["YES", "WAIVER"],
      failMsg: "USCIS requires an in-person meeting within 2 years. A waiver exists for extreme hardship or strict cultural/religious customs only.",
      options: [
        { label: "Yes, we have met in person", value: "YES" },
        { label: "No — but a cultural or hardship waiver applies", value: "WAIVER" },
        { label: "No", value: "NO" },
      ],
    },
    {
      id: "intent_to_marry_90",
      question: "Do both parties genuinely intend to marry within 90 days of entering the U.S.?",
      source: "USCIS — K-1 marriage must occur within 90 days of admission, no extension",
      sourceUrl: "https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens",
      passWith: ["YES"],
      failMsg: "The K-1 requires a genuine intention to marry within 90 days. This period cannot be extended.",
      options: [{ label: "Yes", value: "YES" }, { label: "No / Unsure", value: "NO" }],
    },
  ],

  "IR-2": [
    {
      id: "child_under_21",
      question: "Is the child currently under 21 years of age?",
      source: "USCIS — IR-2 requires child to be under 21 at time of visa issuance",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen",
      passWith: ["YES"],
      failMsg: "If the child is 21 or older, F1 (Family Preference 1st) applies instead.",
      options: [{ label: "Yes, under 21", value: "YES" }, { label: "No, 21 or older", value: "NO" }],
    },
    {
      id: "child_unmarried",
      question: "Is the child currently unmarried?",
      source: "USCIS — IR-2 child must be unmarried",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen",
      passWith: ["YES"],
      failMsg: "IR-2 requires the child to be unmarried. Married children of U.S. citizens fall under F3.",
      options: [{ label: "Yes, unmarried", value: "YES" }, { label: "No, married", value: "NO" }],
    },
    {
      id: "relationship_type",
      question: "What is the nature of the parent-child relationship?",
      source: "USCIS — biological, step (marriage before child turned 18), or adopted (before age 16)",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen",
      passWith: ["BIO", "STEP_BEFORE_18", "ADOPTED_BEFORE_16"],
      failMsg: "For stepchildren, the qualifying marriage must have occurred before the child turned 18. For adopted children, adoption must have occurred before age 16.",
      options: [
        { label: "Biological child", value: "BIO" },
        { label: "Stepchild — parent married child's other parent before child turned 18", value: "STEP_BEFORE_18" },
        { label: "Adopted child — adopted before the child turned 16", value: "ADOPTED_BEFORE_16" },
        { label: "Stepchild — but marriage occurred after child turned 18", value: "STEP_LATE" },
        { label: "Adopted child — adopted after the child turned 16", value: "ADOPTED_LATE" },
      ],
    },
  ],

  "IR-5": [
    {
      id: "petitioner_over_21",
      question: "Is the U.S. citizen child (the petitioner) at least 21 years old?",
      source: "USCIS — petitioner must be 21+ to petition for a parent (INA 201(b)(2)(A)(i))",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen",
      passWith: ["YES"],
      failMsg: "The U.S. citizen must be at least 21 years old to petition for a parent.",
      options: [{ label: "Yes, 21 or older", value: "YES" }, { label: "No, under 21", value: "NO" }],
    },
    {
      id: "parent_relationship",
      question: "What is the nature of the parent relationship?",
      source: "USCIS — biological, step-parent (married before child turned 18), or adoptive (before age 16)",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen",
      passWith: ["BIO", "STEP_BEFORE_18", "ADOPTIVE_BEFORE_16"],
      failMsg: "For step-parents, the marriage must have occurred before the child (U.S. citizen) turned 18.",
      options: [
        { label: "Biological parent", value: "BIO" },
        { label: "Step-parent — married child's other parent before child turned 18", value: "STEP_BEFORE_18" },
        { label: "Adoptive parent — adopted the child before age 16", value: "ADOPTIVE_BEFORE_16" },
        { label: "Step-parent — marriage occurred after child turned 18", value: "STEP_LATE" },
      ],
    },
  ],

  "F1": [
    {
      id: "beneficiary_over_21",
      question: "Is the son or daughter 21 years of age or older?",
      source: "USCIS — F1: Unmarried Sons and Daughters (21+) of U.S. Citizens",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES"],
      failMsg: "F1 is for adult children (21+). For children under 21, IR-2 applies.",
      options: [{ label: "Yes, 21 or older", value: "YES" }, { label: "No, under 21", value: "NO" }],
    },
    {
      id: "beneficiary_unmarried",
      question: "Is the son or daughter currently unmarried?",
      source: "USCIS — F1 requires unmarried status",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES"],
      failMsg: "F1 is for unmarried sons/daughters only. Married children of U.S. citizens use F3.",
      options: [{ label: "Yes, unmarried", value: "YES" }, { label: "No, married", value: "NO" }],
    },
  ],

  "F2A": [
    {
      id: "relationship_type",
      question: "Is the beneficiary the spouse or an unmarried child under 21 of the LPR?",
      source: "USCIS — F2A covers spouses and unmarried children under 21 of LPRs",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["SPOUSE", "CHILD_UNDER_21"],
      failMsg: "F2A is only for spouses or unmarried children under 21 of LPRs. Children 21+ use F2B.",
      options: [
        { label: "Spouse of the LPR", value: "SPOUSE" },
        { label: "Unmarried child under 21", value: "CHILD_UNDER_21" },
        { label: "Child 21 or older", value: "CHILD_OVER_21" },
      ],
    },
  ],

  "F2B": [
    {
      id: "beneficiary_over_21",
      question: "Is the son or daughter 21 years of age or older?",
      source: "USCIS — F2B: Unmarried Sons and Daughters (21+) of LPRs",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES"],
      failMsg: "For children under 21 of an LPR, F2A applies instead.",
      options: [{ label: "Yes, 21 or older", value: "YES" }, { label: "No, under 21", value: "NO" }],
    },
    {
      id: "beneficiary_unmarried",
      question: "Is the son or daughter currently unmarried?",
      source: "USCIS — F2B requires unmarried status",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES"],
      failMsg: "F2B is for unmarried sons/daughters of LPRs only.",
      options: [{ label: "Yes, unmarried", value: "YES" }, { label: "No, married", value: "NO" }],
    },
  ],

  "F3": [
    {
      id: "beneficiary_is_married",
      question: "Is the son or daughter currently married?",
      source: "USCIS — F3: Married Sons and Daughters of U.S. Citizens",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES"],
      failMsg: "F3 is for married children only. Unmarried adult children (21+) of U.S. citizens use F1.",
      options: [{ label: "Yes, married", value: "YES" }, { label: "No, unmarried", value: "NO" }],
    },
  ],

  "F4": [
    {
      id: "petitioner_over_21",
      question: "Is the U.S. citizen petitioner at least 21 years old?",
      source: "USCIS — petitioner must be 21+ to petition for a sibling",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES"],
      failMsg: "The U.S. citizen must be at least 21 years old to petition for a brother or sister.",
      options: [{ label: "Yes, 21 or older", value: "YES" }, { label: "No, under 21", value: "NO" }],
    },
    {
      id: "sibling_relationship",
      question: "Do you and the petitioner share at least one common parent?",
      source: "USCIS — must share at least one biological or legally adoptive parent",
      sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
      passWith: ["YES_FULL", "YES_HALF", "YES_STEP_BEFORE_18"],
      failMsg: "Must share at least one biological or adoptive parent. Step-sibling relationships must have been established before age 18.",
      options: [
        { label: "Full siblings — same mother and father", value: "YES_FULL" },
        { label: "Half siblings — share one parent", value: "YES_HALF" },
        { label: "Step-siblings — relationship established before age 18", value: "YES_STEP_BEFORE_18" },
        { label: "Step-siblings — relationship established after age 18", value: "NO_STEP_LATE" },
      ],
    },
  ],

  "EB-1A": [
    {
      id: "evidence",
      question: "Do you have evidence of extraordinary ability — a major international award (Nobel, Pulitzer, Olympic medal) OR at least 3 of the 10 USCIS criteria?",
      source: "USCIS — EB-1A: Extraordinary Ability (INA 203(b)(1)(A))",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["MAJOR_AWARD", "THREE_CRITERIA"],
      failMsg: "EB-1A requires one major international award, or evidence meeting at least 3 of 10 USCIS criteria (prizes, publications, high salary, critical role, etc.).",
      options: [
        { label: "Yes — major international award", value: "MAJOR_AWARD" },
        { label: "Yes — at least 3 of the 10 USCIS criteria", value: "THREE_CRITERIA" },
        { label: "No", value: "NO" },
      ],
    },
    {
      id: "sustained",
      question: "Is your extraordinary ability currently sustained — not just historical?",
      source: "USCIS — EB-1A requires sustained national or international acclaim",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "USCIS requires evidence of sustained acclaim, not just past recognition.",
      options: [{ label: "Yes, ongoing recognition", value: "YES" }, { label: "No / Mostly historical", value: "NO" }],
    },
  ],

  "EB-1B": [
    {
      id: "recognition",
      question: "Are you internationally recognized as outstanding in a specific academic field?",
      source: "USCIS — EB-1B: Outstanding Professors and Researchers",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "EB-1B requires international recognition as outstanding in your specific academic field.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "three_years",
      question: "Do you have at least 3 years of teaching or research experience?",
      source: "USCIS — EB-1B requires at least 3 years experience",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "At least 3 years of teaching or research experience is required.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "job_offer",
      question: "Do you have a permanent job offer from a qualifying U.S. university, research institution, or employer?",
      source: "USCIS — EB-1B requires a permanent full-time position; self-petition not allowed",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "EB-1B requires a permanent job offer. Unlike EB-1A, self-petition is not allowed.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "EB-1C": [
    {
      id: "one_year_abroad",
      question: "Have you been employed by the same company abroad for at least 1 continuous year in the past 3 years?",
      source: "USCIS — EB-1C: 1 year continuous employment in last 3 years (INA 203(b)(1)(C))",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "EB-1C requires at least 1 year of continuous employment outside the U.S. within the past 3 years.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "manager_executive",
      question: "Will you be working in a managerial or executive capacity in the U.S.?",
      source: "USCIS — EB-1C requires managerial or executive role",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "EB-1C is for managerial or executive roles only.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "corporate_relationship",
      question: "Is there a qualifying corporate relationship (parent, subsidiary, branch, or affiliate) between the U.S. and foreign employers?",
      source: "USCIS — EB-1C requires a qualifying relationship between the two entities",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
      passWith: ["YES"],
      failMsg: "A parent, subsidiary, branch, or affiliate relationship between the two companies is required.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "EB-2-NIW": [
    {
      id: "advanced_degree",
      question: "Do you hold a master's degree or higher — or a bachelor's degree plus at least 5 years of progressive experience — or have exceptional ability?",
      source: "USCIS — EB-2: Advanced Degree or Exceptional Ability (INA 203(b)(2))",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2",
      passWith: ["YES_ADVANCED", "YES_EXCEPTIONAL"],
      failMsg: "EB-2 requires a master's/PhD, or bachelor's + 5 years progressive experience, or exceptional ability (3 of 6 USCIS criteria).",
      options: [
        { label: "Yes — master's degree or higher", value: "YES_ADVANCED" },
        { label: "Yes — bachelor's + 5 years progressive experience", value: "YES_ADVANCED" },
        { label: "Yes — exceptional ability (3 of 6 USCIS criteria)", value: "YES_EXCEPTIONAL" },
        { label: "No", value: "NO" },
      ],
    },
    {
      id: "national_interest",
      question: "Can you show that your work has substantial merit and national importance to the United States?",
      source: "USCIS — NIW 3-part Dhiab test: substantial merit and national importance",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2",
      passWith: ["YES"],
      failMsg: "The NIW requires showing your work has substantial merit and national importance (e.g., STEM, public health, arts, business).",
      options: [{ label: "Yes", value: "YES" }, { label: "No / Unsure", value: "NO" }],
    },
    {
      id: "well_positioned",
      question: "Are you well-positioned to advance this work — do you have a strong track record and a clear plan?",
      source: "USCIS — NIW test part 2: well-positioned to advance the endeavor",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2",
      passWith: ["YES"],
      failMsg: "USCIS must be convinced you have the background and ability to advance your stated work.",
      options: [{ label: "Yes — strong track record and plan", value: "YES" }, { label: "No / Unsure", value: "NO" }],
    },
  ],

  "EB-2": [
    {
      id: "advanced_degree",
      question: "Do you hold a master's degree or higher — or a bachelor's + 5 years progressive experience — or exceptional ability?",
      source: "USCIS — EB-2: Advanced Degree or Exceptional Ability",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2",
      passWith: ["YES_ADVANCED", "YES_EXCEPTIONAL"],
      failMsg: "EB-2 requires an advanced degree or exceptional ability.",
      options: [
        { label: "Yes — master's or higher", value: "YES_ADVANCED" },
        { label: "Yes — bachelor's + 5 years progressive experience", value: "YES_ADVANCED" },
        { label: "Yes — exceptional ability (3 of 6 criteria)", value: "YES_EXCEPTIONAL" },
        { label: "No", value: "NO" },
      ],
    },
    {
      id: "job_offer_perm",
      question: "Do you have a permanent full-time U.S. job offer, and will the employer file a PERM Labor Certification?",
      source: "USCIS — Standard EB-2 requires job offer + PERM from the Dept. of Labor",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2",
      passWith: ["YES"],
      failMsg: "Standard EB-2 requires a permanent full-time job offer and an approved PERM Labor Certification.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "EB-3": [
    {
      id: "job_offer_perm",
      question: "Do you have a permanent full-time U.S. job offer, and will the employer file a PERM Labor Certification?",
      source: "USCIS — EB-3 requires PERM + job offer",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3",
      passWith: ["YES"],
      failMsg: "EB-3 requires a permanent full-time U.S. job offer and an approved PERM Labor Certification.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "worker_type",
      question: "Which description best fits you?",
      source: "USCIS — EB-3: three sub-categories",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3",
      passWith: ["SKILLED", "PROFESSIONAL", "OTHER"],
      failMsg: "Must qualify under one of the three EB-3 sub-categories.",
      options: [
        { label: "Skilled Worker — job requires at least 2 years training/experience", value: "SKILLED" },
        { label: "Professional — job requires a U.S. bachelor's degree or equivalent", value: "PROFESSIONAL" },
        { label: "Other Worker — unskilled labor, less than 2 years training", value: "OTHER" },
      ],
    },
  ],

  "EB-5": [
    {
      id: "investment_amount",
      question: "What is your planned investment amount?",
      source: "USCIS — EB-5 Reform and Integrity Act 2022: $1,050,000 standard or $800,000 in a TEA",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5-immigrant-investor",
      passWith: ["STANDARD", "TEA"],
      failMsg: "EB-5 requires a minimum of $800,000 in a Targeted Employment Area or $1,050,000 in a standard area.",
      options: [
        { label: "$1,050,000 or more (standard area)", value: "STANDARD" },
        { label: "$800,000+ in a rural or high-unemployment area (TEA)", value: "TEA" },
        { label: "Less than $800,000", value: "INSUFFICIENT" },
      ],
    },
    {
      id: "create_jobs",
      question: "Will the investment create or preserve at least 10 permanent full-time jobs for qualifying U.S. workers?",
      source: "USCIS — EB-5 requires creation of at least 10 permanent full-time jobs",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5-immigrant-investor",
      passWith: ["YES"],
      failMsg: "EB-5 requires the investment to create or preserve at least 10 permanent full-time jobs for U.S. workers.",
      options: [{ label: "Yes — 10 or more jobs", value: "YES" }, { label: "No / Unsure", value: "NO" }],
    },
  ],

  "B1/B2": [
    {
      id: "temporary_intent",
      question: "Is your visit temporary — do you plan to return to your home country after the visit?",
      source: "travel.state.gov — B-1/B-2: must demonstrate nonimmigrant intent",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html",
      passWith: ["YES"],
      failMsg: "B-1/B-2 requires clear nonimmigrant intent — a foreign residence and strong ties ensuring return.",
      options: [{ label: "Yes, temporary visit", value: "YES" }, { label: "No, I plan to stay permanently", value: "NO" }],
    },
    {
      id: "home_ties",
      question: "Do you have strong ties to your home country that would ensure your return (job, family, property)?",
      source: "travel.state.gov — strong ties abroad required for B visa approval",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html",
      passWith: ["YES"],
      failMsg: "Consular officers look for strong home-country ties. Weak ties are a common reason for B visa denial.",
      options: [{ label: "Yes, strong ties", value: "YES" }, { label: "No / Weak ties", value: "NO" }],
    },
  ],

  "F-1": [
    {
      id: "i20",
      question: "Have you been accepted by a SEVP-certified U.S. school and received a Form I-20?",
      source: "USCIS — F-1 requires acceptance by a SEVP-certified institution",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment",
      passWith: ["YES"],
      failMsg: "A Form I-20 from a SEVP-certified school is required before applying for an F-1 visa.",
      options: [{ label: "Yes, I have a Form I-20", value: "YES" }, { label: "Not yet", value: "NO" }],
    },
    {
      id: "funds",
      question: "Do you have sufficient funds to cover tuition and living expenses for the full duration of your studies?",
      source: "travel.state.gov — F-1 requires proof of financial support",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/study.html",
      passWith: ["YES"],
      failMsg: "Must demonstrate sufficient financial resources for the entire course of study.",
      options: [{ label: "Yes", value: "YES" }, { label: "No / Unsure", value: "NO" }],
    },
    {
      id: "nonimmigrant_intent",
      question: "Do you maintain a residence abroad and plan to return after completing your studies?",
      source: "travel.state.gov — F-1 requires demonstrated nonimmigrant intent",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/study.html",
      passWith: ["YES"],
      failMsg: "F-1 requires maintaining a foreign residence with no intention of abandoning it.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "J-1": [
    {
      id: "ds2019",
      question: "Have you been accepted into a DOS-designated exchange program and received a Form DS-2019?",
      source: "travel.state.gov — J-1 requires enrollment in a DOS-designated exchange program",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/study/exchange.html",
      passWith: ["YES"],
      failMsg: "A DS-2019 from a DOS-designated sponsor is required for a J-1 visa.",
      options: [{ label: "Yes, I have a DS-2019", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "health_insurance",
      question: "Will you have qualifying health insurance coverage for the duration of your program?",
      source: "22 CFR 62.14 — J-1 exchange visitors must maintain State Dept.-standard health insurance",
      sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/study/exchange.html",
      passWith: ["YES"],
      failMsg: "Health insurance meeting State Department minimum standards is required for all J-1 visitors.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "H-1B": [
    {
      id: "specialty_occupation",
      question: "Does the U.S. job qualify as a specialty occupation — requiring at least a bachelor's degree in a specific field?",
      source: "USCIS — H-1B: Specialty Occupation Workers (INA 214(i))",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations",
      passWith: ["YES"],
      failMsg: "H-1B is for specialty occupations that normally require a bachelor's degree or higher in a specific field.",
      options: [{ label: "Yes", value: "YES" }, { label: "No / General position", value: "NO" }],
    },
    {
      id: "qualifying_degree",
      question: "Do you hold a bachelor's degree or higher (or equivalent) in the specific field the job requires?",
      source: "USCIS — degree must be directly related to the specialty occupation",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations",
      passWith: ["YES"],
      failMsg: "Must hold a qualifying degree in the relevant field.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "employer_sponsor",
      question: "Does a U.S. employer agree to sponsor you and file an LCA with the Department of Labor?",
      source: "USCIS — H-1B requires an employer-filed LCA and I-129; cannot be self-petitioned",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations",
      passWith: ["YES"],
      failMsg: "H-1B cannot be self-petitioned. A U.S. employer must file the LCA and Form I-129.",
      options: [{ label: "Yes, employer will sponsor", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "L-1": [
    {
      id: "one_year_abroad",
      question: "Have you been continuously employed by the same company outside the U.S. for at least 1 year in the past 3 years?",
      source: "USCIS — L-1: 1 continuous year in last 3 years (INA 101(a)(15)(L))",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager",
      passWith: ["YES"],
      failMsg: "At least 1 continuous year of employment outside the U.S. in the past 3 years is required.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "corporate_relationship",
      question: "Does the U.S. company have a qualifying relationship (parent, subsidiary, branch, or affiliate) with the foreign company?",
      source: "USCIS — qualifying corporate relationship required",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager",
      passWith: ["YES"],
      failMsg: "The U.S. and foreign companies must have a qualifying corporate relationship.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "role_type",
      question: "What will your role be in the U.S.?",
      source: "USCIS — L-1A for managers/executives; L-1B for specialized knowledge workers",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1b-intracompany-transferee-specialized-knowledge",
      passWith: ["MANAGER", "SPECIALIZED"],
      failMsg: "L-1 is for managerial, executive, or specialized knowledge roles only.",
      options: [
        { label: "Manager or Executive (L-1A)", value: "MANAGER" },
        { label: "Specialized knowledge worker (L-1B)", value: "SPECIALIZED" },
        { label: "General or entry-level position", value: "GENERAL" },
      ],
    },
  ],

  "O-1": [
    {
      id: "evidence",
      question: "Do you have evidence of extraordinary ability — a major international award OR at least 3 of the 8 USCIS O-1A criteria?",
      source: "USCIS — O-1A: Extraordinary Ability in Science, Education, Business, or Athletics",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement",
      passWith: ["MAJOR_AWARD", "THREE_CRITERIA", "O1B"],
      failMsg: "O-1A requires one major award OR 3 of 8 USCIS criteria. O-1B requires a high level of achievement in arts/entertainment.",
      options: [
        { label: "Yes — major international award", value: "MAJOR_AWARD" },
        { label: "Yes — at least 3 of 8 O-1A USCIS criteria", value: "THREE_CRITERIA" },
        { label: "Yes — O-1B: high achievement in arts/entertainment/film", value: "O1B" },
        { label: "No", value: "NO" },
      ],
    },
    {
      id: "employer_agent",
      question: "Do you have a U.S. employer, agent, or sponsor who will file Form I-129?",
      source: "USCIS — O-1 cannot be self-petitioned",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement",
      passWith: ["YES"],
      failMsg: "O-1 cannot be self-petitioned. A U.S. employer, agent, or sponsoring organization must file Form I-129.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "TN": [
    {
      id: "canada_mexico",
      question: "Are you a citizen of Canada or Mexico?",
      source: "USCIS — TN only available to Canadian and Mexican citizens under USMCA",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals",
      passWith: ["YES"],
      failMsg: "TN status is exclusively for citizens of Canada or Mexico.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "usmca_occupation",
      question: "Does your job appear on the USMCA Schedule 2 list of qualifying occupations (engineer, accountant, scientist, lawyer, nurse, etc.)?",
      source: "USCIS — TN requires a USMCA-listed professional occupation",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals",
      passWith: ["YES"],
      failMsg: "Only occupations listed in USMCA Appendix 1603.D.1 qualify for TN status.",
      options: [{ label: "Yes, it is a USMCA-listed occupation", value: "YES" }, { label: "No / Unsure", value: "NO" }],
    },
    {
      id: "job_offer",
      question: "Do you have a specific job offer from a U.S. employer in that qualifying occupation?",
      source: "USCIS — TN requires a specific U.S. employer job offer",
      sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals",
      passWith: ["YES"],
      failMsg: "A specific job offer is required. Canadians apply at the port of entry; Mexicans apply at a U.S. consulate.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],

  "Asylum": [
    {
      id: "present_in_us",
      question: "Are you physically present inside the United States or at a U.S. port of entry?",
      source: "USCIS — Asylum requires physical presence in the U.S. or at a port of entry (INA 208)",
      sourceUrl: "https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum",
      passWith: ["YES", "PORT_OF_ENTRY"],
      failMsg: "Asylum can only be applied for from within the U.S. or at a port of entry. If outside the U.S., the Refugee program may apply.",
      options: [
        { label: "Yes, I am inside the U.S.", value: "YES" },
        { label: "I am at a U.S. port of entry", value: "PORT_OF_ENTRY" },
        { label: "No, I am outside the U.S.", value: "NO" },
      ],
    },
    {
      id: "one_year",
      question: "Are you filing within 1 year of your last arrival to the United States?",
      source: "USCIS — must file within 1 year of last U.S. arrival (exceptions for changed/extraordinary circumstances)",
      sourceUrl: "https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum",
      passWith: ["YES", "EXCEPTION"],
      failMsg: "Asylum must be filed within 1 year. Exceptions exist for changed or extraordinary circumstances.",
      options: [
        { label: "Yes, within 1 year", value: "YES" },
        { label: "No — but changed/extraordinary circumstances apply", value: "EXCEPTION" },
        { label: "No, and no exception applies", value: "NO" },
      ],
    },
    {
      id: "persecution_ground",
      question: "Is your fear of persecution based on race, religion, nationality, political opinion, or membership in a particular social group?",
      source: "USCIS — one of the five protected grounds required",
      sourceUrl: "https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum",
      passWith: ["YES"],
      failMsg: "Asylum requires persecution based on one of the five protected grounds.",
      options: [
        { label: "Yes — one of the five protected grounds", value: "YES" },
        { label: "No — other reasons (criminal, economic, etc.)", value: "NO" },
      ],
    },
  ],

  "U-Visa": [
    {
      id: "qualifying_crime",
      question: "Are you a victim of a qualifying crime — domestic violence, assault, sexual assault, trafficking, robbery, extortion, or related offenses?",
      source: "USCIS — U Visa: Qualifying Crimes list (INA 101(a)(15)(U))",
      sourceUrl: "https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status",
      passWith: ["YES"],
      failMsg: "U Visa is only for victims of specific qualifying crimes listed in INA 101(a)(15)(U).",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
    {
      id: "substantial_abuse",
      question: "Did you suffer substantial physical or mental abuse as a result of the crime?",
      source: "USCIS — must have suffered substantial abuse, not merely de minimis harm",
      sourceUrl: "https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status",
      passWith: ["YES"],
      failMsg: "The U Visa requires substantial physical or mental abuse.",
      options: [{ label: "Yes", value: "YES" }, { label: "No / Minor harm only", value: "NO" }],
    },
    {
      id: "law_enforcement",
      question: "Are you willing to cooperate with law enforcement and can you obtain a certification (Form I-918B) from a qualifying agency?",
      source: "USCIS — must be helpful to law enforcement; I-918B certification required",
      sourceUrl: "https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status",
      passWith: ["YES"],
      failMsg: "U Visa requires cooperation with law enforcement and a signed Form I-918B certification.",
      options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// EVALUATE A SINGLE VISA
// ─────────────────────────────────────────────────────────────
export function evaluateGate(visaCode: string, gateAnswersForVisa: Record<string, string> = {}) {
  const questions = GATE_QUESTIONS[visaCode] || [];
  for (const q of questions) {
    const answer = gateAnswersForVisa[q.id];
    if (!answer) return { eligible: false, incomplete: true, failedAt: q };
    if (!q.passWith.includes(answer)) return { eligible: false, incomplete: false, failedAt: q };
  }
  return { eligible: true, incomplete: false, failedAt: null };
}

// ─────────────────────────────────────────────────────────────
// GET ELIGIBLE VISAS — final result
// ─────────────────────────────────────────────────────────────
export function getEligibleVisas(answers: VisaExplorationAnswers) {
  const candidates = getCandidateCodes(answers);
  const gateAnswers = answers.gateAnswers || {};
  return candidates
    .filter((code) => evaluateGate(code, gateAnswers[code] || {}).eligible)
    .map((code) => US_VISAS[code as keyof typeof US_VISAS])
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// BUILD ALL STEPS — one flat list
// Discovery questions first, then gate questions per candidate.
// ─────────────────────────────────────────────────────────────
export function buildSteps(answers: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  // ── 1. Origin ────────────────────────────────────────────
  steps.push({
    id: "origin", title: "Where are you currently from?",
    subtitle: "Enter your country of origin or citizenship.",
    type: "country", field: "origin", isDestination: false,
    canProceed: !!answers.origin,
  });

  // ── 2. Destination ───────────────────────────────────────
  steps.push({
    id: "destination", title: "Which country do you want to move to?",
    subtitle: "Select your intended destination country.",
    type: "country", field: "destination", isDestination: true,
    canProceed: !!answers.destination,
  });

  if (!answers.destination) return steps;

  if (!SUPPORTED_DESTINATIONS.includes(answers.destination)) {
    steps.push({ id: "unsupported", type: "unsupported", isUnsupported: true, canProceed: false });
    return steps;
  }

  // ── 3. How applying ──────────────────────────────────────
  steps.push({
    id: "petitionerStatus",
    title: "How are you planning to apply?",
    subtitle: "Select the option that best describes your situation.",
    type: "options", field: "petitionerStatus",
    options: [
      { label: "A U.S. Citizen is sponsoring me", value: "US_CITIZEN", sub: "Spouse, child, parent, sibling, or fiancé(e)" },
      { label: "A U.S. Permanent Resident is sponsoring me", value: "LPR", sub: "Green Card holder — spouse or unmarried child" },
      { label: "I am applying based on my own qualifications", value: "NONE", sub: "Employment, extraordinary ability, or investment" },
      { label: "I want to visit, study, or work temporarily", value: "TEMP", sub: "B-1/B-2, F-1, H-1B, L-1, and others" },
      { label: "I need humanitarian protection", value: "HUMANITARIAN", sub: "Asylum, crime victim" },
    ],
    canProceed: !!answers.petitionerStatus,
  });

  if (!answers.petitionerStatus) return steps;

  // ── 4a. US Citizen branch ────────────────────────────────
  if (answers.petitionerStatus === "US_CITIZEN") {
    steps.push({
      id: "relationship",
      title: "What is your relationship with the U.S. citizen?",
      type: "options", field: "relationship",
      options: [
        { label: "I am their spouse", value: "SPOUSE" },
        { label: "I am their fiancé(e)", value: "FIANCE" },
        { label: "I am their unmarried son or daughter", value: "CHILD" },
        { label: "I am their married son or daughter", value: "MARRIED_CHILD" },
        { label: "I am their parent", value: "PARENT" },
        { label: "I am their sibling", value: "SIBLING" },
      ],
      canProceed: !!answers.relationship,
    });
    if (answers.relationship === "CHILD") {
      steps.push({
        id: "beneficiaryAge", title: "How old are you?",
        subtitle: "Your age determines which visa category applies.",
        type: "grid", field: "beneficiaryAge",
        options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
        canProceed: !!answers.beneficiaryAge,
      });
    }
    if (answers.relationship && ["PARENT", "SIBLING"].includes(answers.relationship)) {
      steps.push({
        id: "petitionerAge",
        title: "How old is the U.S. citizen petitioner?",
        subtitle: `The U.S. citizen must be at least 21 to petition for a ${answers.relationship === "PARENT" ? "parent" : "sibling"}.`,
        type: "grid", field: "petitionerAge",
        options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
        canProceed: !!answers.petitionerAge,
      });
    }
  }

  // ── 4b. LPR branch ───────────────────────────────────────
  if (answers.petitionerStatus === "LPR") {
    steps.push({
      id: "relationship", title: "What is your relationship with the LPR?",
      type: "options", field: "relationship",
      options: [
        { label: "I am their spouse", value: "SPOUSE" },
        { label: "I am their unmarried son or daughter", value: "CHILD" },
      ],
      canProceed: !!answers.relationship,
    });
    if (answers.relationship === "CHILD") {
      steps.push({
        id: "beneficiaryAge", title: "How old are you?",
        type: "grid", field: "beneficiaryAge",
        options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
        canProceed: !!answers.beneficiaryAge,
      });
    }
  }

  // ── 4c. Employment branch ────────────────────────────────
  if (answers.petitionerStatus === "NONE") {
    steps.push({
      id: "workBase", title: "What best describes your qualifications?",
      subtitle: "This determines which employment-based category applies.",
      type: "options", field: "workBase",
      options: [
        { label: "Extraordinary Ability (EB-1A)", value: "EXTRAORDINARY", sub: "Sustained national/international acclaim — self-petition allowed" },
        { label: "Outstanding Professor or Researcher (EB-1B)", value: "RESEARCHER", sub: "International recognition, 3+ years experience, job offer required" },
        { label: "Multinational Manager or Executive (EB-1C)", value: "MANAGER", sub: "Transferring to U.S. branch of your current employer" },
        { label: "Advanced Degree / National Interest Waiver (EB-2 / NIW)", value: "ADVANCED_DEGREE", sub: "Master's or higher, or exceptional ability" },
        { label: "Skilled Worker or Professional (EB-3)", value: "SKILLED", sub: "2+ years training, bachelor's degree, or unskilled labor" },
        { label: "Investor (EB-5)", value: "INVESTOR", sub: "Invest $800K–$1.05M and create 10+ full-time U.S. jobs" },
      ],
      canProceed: !!answers.workBase,
    });
  }

  // ── 4d. Temporary branch ─────────────────────────────────
  if (answers.petitionerStatus === "TEMP") {
    steps.push({
      id: "tempPurpose", title: "What will you be doing in the United States?",
      subtitle: "Select the option that best describes your temporary visit.",
      type: "options", field: "tempPurpose",
      options: [
        { label: "Tourism, Vacation, or Family Visit", value: "TOURISM" },
        { label: "Medical Treatment", value: "MEDICAL" },
        { label: "Business Meetings or Conferences", value: "BUSINESS", sub: "Short-term; no local employment" },
        { label: "Academic Study", value: "STUDY", sub: "College, university, or SEVP-certified school" },
        { label: "Cultural or Educational Exchange Program", value: "EXCHANGE" },
        { label: "Work — Specialty Occupation (H-1B)", value: "WORK_SPECIALTY", sub: "IT, engineering, finance — requires bachelor's degree" },
        { label: "Work — Intracompany Transfer (L-1)", value: "WORK_TRANSFER", sub: "Moving to U.S. branch of your current employer" },
        { label: "Work — Extraordinary Ability (O-1)", value: "WORK_EXTRAORDINARY", sub: "National or international recognition in your field" },
        { label: "Work — TN Visa (Canada or Mexico only)", value: "WORK_USMCA" },
      ],
      canProceed: !!answers.tempPurpose,
    });
  }

  // ── 5. Gate questions for each candidate visa ────────────
  const candidates = getCandidateCodes(answers);
  const gateAnswers = answers.gateAnswers || {};

  for (const code of candidates) {
    const questions = GATE_QUESTIONS[code] || [];
    const visaObj = US_VISAS[code as keyof typeof US_VISAS];
    if (!visaObj || questions.length === 0) continue;

    const visaGate = gateAnswers[code] || {};

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

// ─────────────────────────────────────────────────────────────
// ALL GATE STEPS ANSWERED?
// ─────────────────────────────────────────────────────────────
export function allGateQuestionsAnswered(answers: VisaExplorationAnswers): boolean {
  const candidates = getCandidateCodes(answers);
  const gateAnswers = answers.gateAnswers || {};
  for (const code of candidates) {
    const questions = GATE_QUESTIONS[code] || [];
    const visaGate = gateAnswers[code] || {};
    for (const q of questions) {
      if (!visaGate[q.id]) return false;
    }
  }
  return candidates.length > 0;
}