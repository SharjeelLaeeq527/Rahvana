/**
 * visa-exploration-logic.ts
 *
 * Flow:
 *  1. Where are you from?
 *  2. Where do you want to go?
 *  3. Why do you want to go? (purpose — the key branching question)
 *  4. Purpose-specific follow-up questions
 *  5. USCIS eligibility gate questions (per candidate visa)
 *
 * Results: only visas that pass ALL gate questions are shown.
 *
 * Sources: USCIS.gov · travel.state.gov · INA statutes per question
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
  origin:       ["destination","purpose","sponsor","relationship","beneficiaryAge","petitionerAge","workBase","tempType","gateAnswers"],
  destination:  ["purpose","sponsor","relationship","beneficiaryAge","petitionerAge","workBase","tempType","gateAnswers"],
  purpose:      ["sponsor","relationship","beneficiaryAge","petitionerAge","workBase","tempType","gateAnswers"],
  sponsor:      ["relationship","beneficiaryAge","petitionerAge","gateAnswers"],
  relationship: ["beneficiaryAge","petitionerAge","gateAnswers"],
  beneficiaryAge:["gateAnswers"],
  petitionerAge: ["gateAnswers"],
  workBase:      ["gateAnswers"],
  tempType:      ["gateAnswers"],
};

// ─────────────────────────────────────────────────────────────
// CANDIDATE CODES  (before gate questions)
// ─────────────────────────────────────────────────────────────
export function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  if (!a.destination || !SUPPORTED_DESTINATIONS.includes(a.destination)) return [];
  if (!a.purpose) return [];
  const c: string[] = [];

  // ── LIVE PERMANENTLY (family) ─────────────────────────────
  if (a.purpose === "FAMILY") {
    if (a.sponsor === "US_CITIZEN") {
      if (a.relationship === "SPOUSE")         c.push("IR-1","CR-1");
      if (a.relationship === "FIANCE")         c.push("K-1");
      if (a.relationship === "CHILD") {
        if (a.beneficiaryAge === "UNDER_21")   c.push("IR-2");
        if (a.beneficiaryAge === "OVER_21")    c.push("F1");
      }
      if (a.relationship === "MARRIED_CHILD")  c.push("F3");
      if (a.relationship === "PARENT")         c.push("IR-5");
      if (a.relationship === "SIBLING")        c.push("F4");
    }
    if (a.sponsor === "LPR") {
      if (a.relationship === "SPOUSE")         c.push("F2A");
      if (a.relationship === "CHILD") {
        if (a.beneficiaryAge === "UNDER_21")   c.push("F2A");
        if (a.beneficiaryAge === "OVER_21")    c.push("F2B");
      }
    }
  }

  // ── LIVE PERMANENTLY (work / self) ────────────────────────
  if (a.purpose === "WORK_PERMANENT") {
    if (a.workBase === "EXTRAORDINARY")        c.push("EB-1A");
    if (a.workBase === "RESEARCHER")           c.push("EB-1B");
    if (a.workBase === "MANAGER")              c.push("EB-1C");
    if (a.workBase === "ADVANCED_DEGREE")      c.push("EB-2-NIW","EB-2");
    if (a.workBase === "SKILLED")              c.push("EB-3");
    if (a.workBase === "INVESTOR")             c.push("EB-5");
  }

  // ── VISIT / SHORT STAY ───────────────────────────────────
  if (a.purpose === "VISIT") {
    c.push("B1/B2");
  }

  // ── STUDY ────────────────────────────────────────────────
  if (a.purpose === "STUDY") {
    if (a.tempType === "ACADEMIC")             c.push("F-1");
    if (a.tempType === "EXCHANGE")             c.push("J-1");
    if (!a.tempType)                           c.push("F-1","J-1");
  }

  // ── WORK (temporary) ─────────────────────────────────────
  if (a.purpose === "WORK_TEMP") {
    if (a.tempType === "SPECIALTY")            c.push("H-1B");
    if (a.tempType === "TRANSFER")             c.push("L-1");
    if (a.tempType === "EXTRAORDINARY")        c.push("O-1");
    if (a.tempType === "USMCA")                c.push("TN");
  }

  // ── PROTECTION ───────────────────────────────────────────
  if (a.purpose === "PROTECTION") {
    c.push("Asylum","U-Visa");
  }

  return [...new Set(c)];
}

// ─────────────────────────────────────────────────────────────
// GATE QUESTIONS  (USCIS-verified eligibility requirements)
// ─────────────────────────────────────────────────────────────
export const GATE_QUESTIONS: GateQuestionsMap = {
  "IR-1": [
    { id:"legally_married", question:"Are you and the petitioner legally married?", source:"USCIS Form I-130 — bona fide marriage required", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES"], failMsg:"IR-1 requires a valid, legally recognized marriage.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"marriage_2yr", question:"At the time of U.S. admission, will your marriage be 2 years old or more?", source:"travel.state.gov — IR-1 vs CR-1: 2-year rule at time of admission", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration/immigrant-visa-for-spouse.html", passWith:["YES"], failMsg:"If married less than 2 years at admission, CR-1 applies instead — granting a conditional green card.", options:[{label:"Yes, 2 or more years",value:"YES"},{label:"No, less than 2 years",value:"NO"}] },
    { id:"prior_marriages", question:"Have all prior marriages of both parties been legally terminated?", source:"USCIS Form I-130 instructions", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES","NA"], failMsg:"All prior marriages must be legally terminated before a new marriage can be recognized for immigration purposes.", options:[{label:"Yes — or no prior marriages",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "CR-1": [
    { id:"legally_married", question:"Are you and the petitioner legally married?", source:"USCIS Form I-130", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES"], failMsg:"CR-1 requires a valid, legally recognized marriage.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"marriage_under_2yr", question:"At the time of U.S. admission, will the marriage be less than 2 years old?", source:"travel.state.gov — CR-1 applies when married < 2 years at admission", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration/immigrant-visa-for-spouse.html", passWith:["YES"], failMsg:"If married 2+ years at admission, IR-1 (unconditional green card) applies instead.", options:[{label:"Yes, less than 2 years",value:"YES"},{label:"No, 2 or more years",value:"NO"}] },
    { id:"prior_marriages", question:"Have all prior marriages of both parties been legally terminated?", source:"USCIS Form I-130", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES","NA"], failMsg:"All prior marriages must be legally terminated.", options:[{label:"Yes — or no prior marriages",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "K-1": [
    { id:"both_free", question:"Are both you and the petitioner currently unmarried and legally free to marry?", source:"USCIS — K-1: both parties must be legally free to marry (INA 214(d))", sourceUrl:"https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens", passWith:["YES"], failMsg:"Both parties must be legally free to marry. Any prior marriages must be legally terminated.", options:[{label:"Yes, both are free to marry",value:"YES"},{label:"No",value:"NO"}] },
    { id:"met_in_person", question:"Have you and the petitioner met in person at least once in the past 2 years?", source:"USCIS Form I-129F — in-person meeting within 2 years of filing", sourceUrl:"https://www.uscis.gov/i-129f", passWith:["YES","WAIVER"], failMsg:"USCIS requires an in-person meeting within 2 years. A waiver is possible only for extreme hardship or strict cultural/religious customs.", options:[{label:"Yes, we have met in person",value:"YES"},{label:"No — but a cultural or hardship waiver applies",value:"WAIVER"},{label:"No",value:"NO"}] },
    { id:"intent_90", question:"Do both parties genuinely intend to marry within 90 days of entering the U.S.?", source:"USCIS — K-1 marriage must occur within 90 days of admission", sourceUrl:"https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens", passWith:["YES"], failMsg:"K-1 requires a genuine intention to marry within 90 days. This period cannot be extended.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
  ],
  "IR-2": [
    { id:"under_21", question:"Is the child currently under 21 years of age?", source:"USCIS — IR-2 requires child to be under 21 at visa issuance", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["YES"], failMsg:"If 21 or older, F1 (Family Preference 1st) applies instead.", options:[{label:"Yes, under 21",value:"YES"},{label:"No, 21 or older",value:"NO"}] },
    { id:"unmarried", question:"Is the child currently unmarried?", source:"USCIS — IR-2 child must be unmarried", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["YES"], failMsg:"IR-2 requires the child to be unmarried. Married children fall under F3.", options:[{label:"Yes, unmarried",value:"YES"},{label:"No, married",value:"NO"}] },
    { id:"rel_type", question:"What is the nature of the parent-child relationship?", source:"USCIS — biological, step (before age 18), or adopted (before age 16) qualify", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["BIO","STEP_BEFORE_18","ADOPTED_BEFORE_16"], failMsg:"For stepchildren, the qualifying marriage must have occurred before the child turned 18. For adopted children, adoption must have occurred before age 16.", options:[{label:"Biological child",value:"BIO"},{label:"Stepchild — parent married before child turned 18",value:"STEP_BEFORE_18"},{label:"Adopted — adopted before child turned 16",value:"ADOPTED_BEFORE_16"},{label:"Stepchild — but marriage occurred after child turned 18",value:"STEP_LATE"},{label:"Adopted — adopted after child turned 16",value:"ADOPTED_LATE"}] },
  ],
  "IR-5": [
    { id:"petitioner_21", question:"Is the U.S. citizen child (the petitioner) at least 21 years old?", source:"USCIS — petitioner must be 21+ to petition for a parent (INA 201(b)(2)(A)(i))", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["YES"], failMsg:"The U.S. citizen must be at least 21 to petition for a parent.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
    { id:"parent_rel", question:"What is the nature of the parent relationship?", source:"USCIS — biological, step (before child turned 18), or adoptive (before age 16)", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["BIO","STEP_BEFORE_18","ADOPTIVE_BEFORE_16"], failMsg:"For step-parents, the marriage must have occurred before the U.S. citizen child turned 18.", options:[{label:"Biological parent",value:"BIO"},{label:"Step-parent — married before child turned 18",value:"STEP_BEFORE_18"},{label:"Adoptive parent — adopted before age 16",value:"ADOPTIVE_BEFORE_16"},{label:"Step-parent — marriage occurred after child turned 18",value:"STEP_LATE"}] },
  ],
  "F1": [
    { id:"over_21", question:"Is the son or daughter 21 years of age or older?", source:"USCIS — F1: Unmarried Sons and Daughters (21+) of U.S. Citizens", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F1 is for adult children (21+). For children under 21, IR-2 applies.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
    { id:"unmarried", question:"Is the son or daughter currently unmarried?", source:"USCIS — F1 requires unmarried status", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F1 is for unmarried sons/daughters. Married children of U.S. citizens fall under F3.", options:[{label:"Yes, unmarried",value:"YES"},{label:"No, married",value:"NO"}] },
  ],
  "F2A": [
    { id:"rel_type", question:"Is the beneficiary the spouse or an unmarried child under 21 of the LPR?", source:"USCIS — F2A: spouses and unmarried children under 21 of LPRs", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["SPOUSE","CHILD_UNDER_21"], failMsg:"F2A is only for spouses or unmarried children under 21. Children 21+ use F2B.", options:[{label:"Spouse of the LPR",value:"SPOUSE"},{label:"Unmarried child under 21",value:"CHILD_UNDER_21"},{label:"Child 21 or older",value:"CHILD_OVER_21"}] },
  ],
  "F2B": [
    { id:"over_21", question:"Is the son or daughter 21 years of age or older?", source:"USCIS — F2B: Unmarried Sons and Daughters (21+) of LPRs", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"For children under 21, F2A applies instead.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
    { id:"unmarried", question:"Is the son or daughter currently unmarried?", source:"USCIS — F2B requires unmarried status", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F2B is for unmarried sons/daughters only.", options:[{label:"Yes, unmarried",value:"YES"},{label:"No, married",value:"NO"}] },
  ],
  "F3": [
    { id:"married", question:"Is the son or daughter currently married?", source:"USCIS — F3: Married Sons and Daughters of U.S. Citizens", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F3 is for married children only. Unmarried adult children (21+) use F1.", options:[{label:"Yes, married",value:"YES"},{label:"No, unmarried",value:"NO"}] },
  ],
  "F4": [
    { id:"petitioner_21", question:"Is the U.S. citizen petitioner at least 21 years old?", source:"USCIS — petitioner must be 21+ to petition for a sibling", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"The U.S. citizen must be at least 21 to petition for a sibling.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
    { id:"common_parent", question:"Do you and the petitioner share at least one common parent?", source:"USCIS — must share at least one biological or legally adoptive parent", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["FULL","HALF","STEP_BEFORE_18"], failMsg:"Must share at least one biological or adoptive parent. Step-sibling relationships must have been established before age 18.", options:[{label:"Full siblings — same mother and father",value:"FULL"},{label:"Half siblings — share one parent",value:"HALF"},{label:"Step-siblings — relationship established before age 18",value:"STEP_BEFORE_18"},{label:"Step-siblings — relationship established after age 18",value:"STEP_LATE"}] },
  ],
  "EB-1A": [
    { id:"evidence", question:"Do you have evidence of extraordinary ability — a major international award (Nobel, Pulitzer, Olympic medal) OR at least 3 of the 10 USCIS criteria?", source:"USCIS — EB-1A: Aliens of Extraordinary Ability (INA 203(b)(1)(A))", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["MAJOR_AWARD","THREE_CRITERIA"], failMsg:"EB-1A requires one major international award, or evidence meeting at least 3 of 10 USCIS criteria.", options:[{label:"Yes — major international award",value:"MAJOR_AWARD"},{label:"Yes — at least 3 of the 10 USCIS criteria",value:"THREE_CRITERIA"},{label:"No",value:"NO"}] },
    { id:"sustained", question:"Is your extraordinary ability currently sustained — ongoing recognition, not just historical?", source:"USCIS — EB-1A requires sustained national or international acclaim", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"USCIS requires evidence of sustained acclaim, not just past recognition.", options:[{label:"Yes, ongoing",value:"YES"},{label:"Mostly historical",value:"NO"}] },
  ],
  "EB-1B": [
    { id:"recognition", question:"Are you internationally recognized as outstanding in a specific academic field?", source:"USCIS — EB-1B: Outstanding Professors and Researchers", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1B requires international recognition as outstanding in your academic field.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"three_years", question:"Do you have at least 3 years of teaching or research experience?", source:"USCIS — EB-1B requires at least 3 years experience", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"At least 3 years of teaching or research experience is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"job_offer", question:"Do you have a permanent job offer from a qualifying U.S. university, research institution, or employer?", source:"USCIS — EB-1B requires a permanent position; self-petition not allowed", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1B requires a permanent job offer. Unlike EB-1A, self-petition is not allowed.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "EB-1C": [
    { id:"one_year", question:"Have you been employed by the same company abroad for at least 1 continuous year in the past 3 years?", source:"USCIS — EB-1C: 1 year continuous employment in last 3 years (INA 203(b)(1)(C))", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1C requires at least 1 year of continuous employment outside the U.S. in the past 3 years.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"manager_exec", question:"Will you be working in a managerial or executive capacity in the U.S.?", source:"USCIS — EB-1C requires managerial or executive role", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1C is for managerial or executive roles only.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"corp_rel", question:"Is there a qualifying corporate relationship (parent, subsidiary, branch, or affiliate) between the two companies?", source:"USCIS — qualifying relationship between U.S. and foreign entity required", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"A parent, subsidiary, branch, or affiliate relationship between the companies is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "EB-2-NIW": [
    { id:"degree", question:"Do you hold a master's degree or higher — or a bachelor's degree plus at least 5 years of progressive experience — or have exceptional ability?", source:"USCIS — EB-2: Advanced Degree or Exceptional Ability (INA 203(b)(2))", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["ADVANCED","EXCEPTIONAL"], failMsg:"EB-2 requires a master's/PhD, bachelor's + 5 years progressive experience, or exceptional ability.", options:[{label:"Yes — master's or higher",value:"ADVANCED"},{label:"Yes — bachelor's + 5 years progressive experience",value:"ADVANCED"},{label:"Yes — exceptional ability (3 of 6 USCIS criteria)",value:"EXCEPTIONAL"},{label:"No",value:"NO"}] },
    { id:"nat_interest", question:"Can you show your work has substantial merit and national importance to the United States?", source:"USCIS — NIW 3-part test: substantial merit and national importance", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["YES"], failMsg:"The NIW requires showing your work has substantial merit and national importance.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
    { id:"well_positioned", question:"Are you well-positioned to advance this work — strong track record and a clear plan?", source:"USCIS — NIW test: well-positioned to advance the endeavor", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["YES"], failMsg:"USCIS must be convinced you have the background and ability to advance your stated work.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
  ],
  "EB-2": [
    { id:"degree", question:"Do you hold a master's degree or higher — or a bachelor's + 5 years progressive experience — or exceptional ability?", source:"USCIS — EB-2: Advanced Degree or Exceptional Ability", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["ADVANCED","EXCEPTIONAL"], failMsg:"EB-2 requires an advanced degree or exceptional ability.", options:[{label:"Yes — master's or higher",value:"ADVANCED"},{label:"Yes — bachelor's + 5 years progressive experience",value:"ADVANCED"},{label:"Yes — exceptional ability (3 of 6 criteria)",value:"EXCEPTIONAL"},{label:"No",value:"NO"}] },
    { id:"job_perm", question:"Do you have a permanent full-time U.S. job offer, and will the employer file a PERM Labor Certification?", source:"USCIS — Standard EB-2 requires job offer + PERM from Dept. of Labor", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["YES"], failMsg:"Standard EB-2 requires a permanent full-time job offer and an approved PERM Labor Certification.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "EB-3": [
    { id:"job_perm", question:"Do you have a permanent full-time U.S. job offer, and will the employer file a PERM Labor Certification?", source:"USCIS — EB-3: PERM + job offer required", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3", passWith:["YES"], failMsg:"EB-3 requires a permanent full-time job offer and an approved PERM Labor Certification.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"worker_type", question:"Which description best fits you?", source:"USCIS — EB-3: three sub-categories", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3", passWith:["SKILLED","PROFESSIONAL","OTHER"], failMsg:"Must qualify under one of the three EB-3 sub-categories.", options:[{label:"Skilled Worker — job requires at least 2 years training/experience",value:"SKILLED"},{label:"Professional — job requires a U.S. bachelor's degree or equivalent",value:"PROFESSIONAL"},{label:"Other Worker — unskilled labor",value:"OTHER"}] },
  ],
  "EB-5": [
    { id:"investment", question:"What is your planned investment amount?", source:"USCIS — EB-5 Reform and Integrity Act 2022: $1,050,000 standard or $800,000 TEA", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5-immigrant-investor", passWith:["STANDARD","TEA"], failMsg:"EB-5 requires a minimum of $800,000 in a TEA or $1,050,000 in a standard area.", options:[{label:"$1,050,000 or more (standard area)",value:"STANDARD"},{label:"$800,000+ in a rural or high-unemployment area (TEA)",value:"TEA"},{label:"Less than $800,000",value:"INSUFFICIENT"}] },
    { id:"jobs", question:"Will the investment create or preserve at least 10 permanent full-time jobs for qualifying U.S. workers?", source:"USCIS — EB-5 requires creation of at least 10 permanent jobs", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5-immigrant-investor", passWith:["YES"], failMsg:"EB-5 requires the investment to create or preserve at least 10 permanent full-time jobs.", options:[{label:"Yes — 10 or more jobs",value:"YES"},{label:"No / Unsure",value:"NO"}] },
  ],
  "B1/B2": [
    { id:"temp_intent", question:"Is the purpose of your visit temporary — do you plan to return to your home country afterward?", source:"travel.state.gov — B-1/B-2: must demonstrate nonimmigrant intent", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", passWith:["YES"], failMsg:"B-1/B-2 requires clear nonimmigrant intent — a foreign residence and strong ties ensuring return.", options:[{label:"Yes, temporary visit",value:"YES"},{label:"No, I plan to stay permanently",value:"NO"}] },
    { id:"home_ties", question:"Do you have strong ties to your home country that would ensure your return (job, family, property)?", source:"travel.state.gov — strong home ties required for B visa approval", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", passWith:["YES"], failMsg:"Consular officers look for strong home-country ties. Weak ties are a common reason for B visa denial.", options:[{label:"Yes, strong ties",value:"YES"},{label:"No / Weak ties",value:"NO"}] },
  ],
  "F-1": [
    { id:"i20", question:"Have you been accepted by a SEVP-certified U.S. school and received a Form I-20?", source:"USCIS — F-1 requires acceptance by a SEVP-certified institution", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment", passWith:["YES"], failMsg:"A Form I-20 from a SEVP-certified school is required before applying for an F-1 visa.", options:[{label:"Yes, I have a Form I-20",value:"YES"},{label:"Not yet",value:"NO"}] },
    { id:"funds", question:"Do you have sufficient funds to cover tuition and living expenses for the full duration of your studies?", source:"travel.state.gov — F-1 requires proof of financial support", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study.html", passWith:["YES"], failMsg:"Must demonstrate sufficient financial resources for the entire course of study.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
    { id:"intent", question:"Do you maintain a residence abroad and plan to return after completing your studies?", source:"travel.state.gov — F-1 requires demonstrated nonimmigrant intent", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study.html", passWith:["YES"], failMsg:"F-1 requires maintaining a foreign residence with no intention of abandoning it.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "J-1": [
    { id:"ds2019", question:"Have you been accepted into a DOS-designated exchange program and received a Form DS-2019?", source:"travel.state.gov — J-1 requires enrollment in a DOS-designated exchange program", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study/exchange.html", passWith:["YES"], failMsg:"A DS-2019 from a DOS-designated sponsor is required for a J-1 visa.", options:[{label:"Yes, I have a DS-2019",value:"YES"},{label:"No",value:"NO"}] },
    { id:"insurance", question:"Will you have qualifying health insurance for the duration of your program?", source:"22 CFR 62.14 — J-1 visitors must maintain State Dept.-standard health insurance", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study/exchange.html", passWith:["YES"], failMsg:"Health insurance meeting State Department minimum standards is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "H-1B": [
    { id:"specialty", question:"Does the U.S. job qualify as a specialty occupation — requiring at least a bachelor's degree in a specific field?", source:"USCIS — H-1B: Specialty Occupation Workers (INA 214(i))", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"H-1B is for specialty occupations that normally require a bachelor's degree or higher.", options:[{label:"Yes",value:"YES"},{label:"No / General position",value:"NO"}] },
    { id:"degree", question:"Do you hold a bachelor's degree or higher in the specific field the job requires?", source:"USCIS — degree must be directly related to the specialty occupation", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"Must hold a qualifying degree in the relevant field.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"employer", question:"Does a U.S. employer agree to sponsor you and file an LCA with the Department of Labor?", source:"USCIS — H-1B requires employer-filed LCA and I-129; cannot be self-petitioned", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"H-1B cannot be self-petitioned. A U.S. employer must file the LCA and Form I-129.", options:[{label:"Yes, employer will sponsor",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "L-1": [
    { id:"one_year", question:"Have you been continuously employed by the same company outside the U.S. for at least 1 year in the past 3 years?", source:"USCIS — L-1: 1 continuous year in last 3 years (INA 101(a)(15)(L))", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager", passWith:["YES"], failMsg:"At least 1 continuous year of employment outside the U.S. in the past 3 years is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"corp_rel", question:"Does the U.S. company have a qualifying relationship (parent, subsidiary, branch, or affiliate) with the foreign company?", source:"USCIS — qualifying corporate relationship required for L-1", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager", passWith:["YES"], failMsg:"A qualifying corporate relationship between the U.S. and foreign companies is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"role", question:"What will your role be in the U.S.?", source:"USCIS — L-1A for managers/executives; L-1B for specialized knowledge workers", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1b-intracompany-transferee-specialized-knowledge", passWith:["MANAGER","SPECIALIZED"], failMsg:"L-1 is for managerial, executive, or specialized knowledge roles only.", options:[{label:"Manager or Executive (L-1A)",value:"MANAGER"},{label:"Specialized knowledge worker (L-1B)",value:"SPECIALIZED"},{label:"General or entry-level position",value:"GENERAL"}] },
  ],
  "O-1": [
    { id:"evidence", question:"Do you have evidence of extraordinary ability — a major international award OR at least 3 of the 8 USCIS O-1 criteria?", source:"USCIS — O-1A: Extraordinary Ability in Science, Education, Business, or Athletics", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement", passWith:["MAJOR_AWARD","THREE_CRITERIA","O1B"], failMsg:"O-1A requires one major award or 3 of 8 USCIS criteria. O-1B requires a high level of achievement in arts/entertainment.", options:[{label:"Yes — major international award",value:"MAJOR_AWARD"},{label:"Yes — at least 3 of 8 O-1A USCIS criteria",value:"THREE_CRITERIA"},{label:"Yes — O-1B: high achievement in arts/entertainment/film",value:"O1B"},{label:"No",value:"NO"}] },
    { id:"employer", question:"Do you have a U.S. employer, agent, or sponsor who will file Form I-129?", source:"USCIS — O-1 cannot be self-petitioned", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement", passWith:["YES"], failMsg:"O-1 cannot be self-petitioned. A U.S. employer, agent, or sponsoring organization must file Form I-129.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "TN": [
    { id:"can_mex", question:"Are you a citizen of Canada or Mexico?", source:"USCIS — TN only available to Canadian and Mexican citizens under USMCA", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals", passWith:["YES"], failMsg:"TN status is exclusively for citizens of Canada or Mexico.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"occupation", question:"Does your job appear on the USMCA Schedule 2 list of qualifying occupations?", source:"USCIS — TN requires a USMCA-listed professional occupation", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals", passWith:["YES"], failMsg:"Only occupations listed in USMCA Appendix 1603.D.1 qualify for TN status.", options:[{label:"Yes, it is a listed USMCA occupation",value:"YES"},{label:"No / Unsure",value:"NO"}] },
    { id:"job_offer", question:"Do you have a specific job offer from a U.S. employer in that qualifying occupation?", source:"USCIS — TN requires a specific U.S. employer job offer", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals", passWith:["YES"], failMsg:"A specific job offer is required. Canadians apply at the port of entry; Mexicans apply at a U.S. consulate.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
  "Asylum": [
    { id:"present", question:"Are you physically present inside the United States or at a U.S. port of entry?", source:"USCIS — Asylum requires physical presence in the U.S. or at a port of entry (INA 208)", sourceUrl:"https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum", passWith:["YES","PORT"], failMsg:"Asylum can only be applied for from within the U.S. or at a port of entry. If outside the U.S., the Refugee program may apply.", options:[{label:"Yes, I am inside the U.S.",value:"YES"},{label:"I am at a U.S. port of entry",value:"PORT"},{label:"No, I am outside the U.S.",value:"NO"}] },
    { id:"one_year", question:"Are you filing within 1 year of your last arrival to the United States?", source:"USCIS — must file within 1 year of last U.S. arrival (exceptions for changed/extraordinary circumstances)", sourceUrl:"https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum", passWith:["YES","EXCEPTION"], failMsg:"Asylum must be filed within 1 year. Exceptions exist for changed or extraordinary circumstances.", options:[{label:"Yes, within 1 year",value:"YES"},{label:"No — but changed/extraordinary circumstances apply",value:"EXCEPTION"},{label:"No, and no exception applies",value:"NO"}] },
    { id:"ground", question:"Is your fear of persecution based on race, religion, nationality, political opinion, or membership in a particular social group?", source:"USCIS — one of the five protected grounds required", sourceUrl:"https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum", passWith:["YES"], failMsg:"Asylum requires persecution based on one of the five protected grounds.", options:[{label:"Yes — one of the five protected grounds",value:"YES"},{label:"No — other reasons (criminal, economic, etc.)",value:"NO"}] },
  ],
  "U-Visa": [
    { id:"crime", question:"Are you a victim of a qualifying crime — domestic violence, assault, sexual assault, trafficking, robbery, or related offenses?", source:"USCIS — U Visa: Qualifying Crimes list (INA 101(a)(15)(U))", sourceUrl:"https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status", passWith:["YES"], failMsg:"U Visa is only for victims of specific qualifying crimes listed in INA 101(a)(15)(U).", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    { id:"abuse", question:"Did you suffer substantial physical or mental abuse as a result of the crime?", source:"USCIS — must have suffered substantial abuse, not merely de minimis harm", sourceUrl:"https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status", passWith:["YES"], failMsg:"The U Visa requires substantial physical or mental abuse.", options:[{label:"Yes",value:"YES"},{label:"No / Minor harm only",value:"NO"}] },
    { id:"le_coop", question:"Are you willing to cooperate with law enforcement and can you obtain a Form I-918B certification?", source:"USCIS — must be helpful to law enforcement; I-918B certification required", sourceUrl:"https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status", passWith:["YES"], failMsg:"U Visa requires cooperation with law enforcement and a signed Form I-918B certification.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
  ],
};

// ─────────────────────────────────────────────────────────────
// EVALUATE GATE
// ─────────────────────────────────────────────────────────────
export function evaluateGate(visaCode: string, gateAnswersForVisa: Record<string,string> = {}) {
  const questions = GATE_QUESTIONS[visaCode] || [];
  for (const q of questions) {
    const answer = gateAnswersForVisa[q.id];
    if (!answer) return { eligible:false, incomplete:true, failedAt:q };
    if (!q.passWith.includes(answer)) return { eligible:false, incomplete:false, failedAt:q };
  }
  return { eligible:true, incomplete:false, failedAt:null };
}

export function getEligibleVisas(answers: VisaExplorationAnswers) {
  const candidates = getCandidateCodes(answers);
  const gate = answers.gateAnswers || {};
  return candidates
    .filter((code) => evaluateGate(code, gate[code] || {}).eligible)
    .map((code) => US_VISAS[code as keyof typeof US_VISAS])
    .filter(Boolean);
}

export function allGateAnswered(answers: VisaExplorationAnswers): boolean {
  const candidates = getCandidateCodes(answers);
  if (candidates.length === 0) return false;
  const gate = answers.gateAnswers || {};
  for (const code of candidates) {
    for (const q of (GATE_QUESTIONS[code] || [])) {
      if (!((gate[code] || {})[q.id])) return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// BUILD STEPS  — progressive reveal, single flat list
// ─────────────────────────────────────────────────────────────
export function buildSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  // ── Q1: Where are you from? ───────────────────────────────
  steps.push({
    id:"origin", type:"country", field:"origin", isDestination:false,
    title:"Where are you from?",
    subtitle:"Enter your country of origin or citizenship.",
    canProceed:!!a.origin,
  });

  // ── Q2: Where do you want to go? ─────────────────────────
  steps.push({
    id:"destination", type:"country", field:"destination", isDestination:true,
    title:"Where do you want to go?",
    subtitle:"Select your destination country.",
    canProceed:!!a.destination,
  });

  if (!a.destination) return steps;

  // Non-US
  if (!SUPPORTED_DESTINATIONS.includes(a.destination)) {
    steps.push({ id:"unsupported", type:"unsupported", isUnsupported:true, canProceed:false });
    return steps;
  }

  // ── Q3: Why do you want to go? ───────────────────────────
  steps.push({
    id:"purpose", type:"options", field:"purpose",
    title:"Why do you want to go there?",
    subtitle:"Tell us the purpose of your visit. This helps us find the right visa categories for you.",
    options:[
      { label:"Join or reunite with family", value:"FAMILY", sub:"A family member in the U.S. will sponsor me" },
      { label:"Settle permanently through work or investment", value:"WORK_PERMANENT", sub:"Employment-based or investor green card" },
      { label:"Visit for tourism, family, or medical reasons", value:"VISIT", sub:"Short-term stay — I plan to return home" },
      { label:"Study at a U.S. institution", value:"STUDY", sub:"Degree program, exchange, or language school" },
      { label:"Work temporarily", value:"WORK_TEMP", sub:"H-1B, L-1, O-1, TN, and similar work visas" },
      { label:"Seek safety or protection", value:"PROTECTION", sub:"Asylum or crime victim status" },
    ],
    canProceed:!!a.purpose,
  });

  if (!a.purpose) return steps;

  // ── FAMILY branch ─────────────────────────────────────────
  if (a.purpose === "FAMILY") {
    steps.push({
      id:"sponsor", type:"options", field:"sponsor",
      title:"What is your family member's U.S. immigration status?",
      subtitle:"The status of your sponsor determines which visa category applies.",
      options:[
        { label:"U.S. Citizen", value:"US_CITIZEN", sub:"Born in the U.S., naturalized, or through parents" },
        { label:"Lawful Permanent Resident (Green Card holder)", value:"LPR" },
      ],
      canProceed:!!a.sponsor,
    });

    if (a.sponsor === "US_CITIZEN") {
      steps.push({
        id:"relationship", type:"options", field:"relationship",
        title:"What is your relationship with the U.S. citizen?",
        options:[
          { label:"I am their spouse", value:"SPOUSE" },
          { label:"I am their fiancé(e)", value:"FIANCE" },
          { label:"I am their unmarried son or daughter", value:"CHILD" },
          { label:"I am their married son or daughter", value:"MARRIED_CHILD" },
          { label:"I am their parent", value:"PARENT" },
          { label:"I am their sibling", value:"SIBLING" },
        ],
        canProceed:!!a.relationship,
      });
      if (a.relationship === "CHILD") {
        steps.push({
          id:"beneficiaryAge", type:"grid", field:"beneficiaryAge",
          title:"How old are you?",
          subtitle:"Your age determines which visa category applies.",
          options:[{ label:"Under 21", value:"UNDER_21" },{ label:"21 or older", value:"OVER_21" }],
          canProceed:!!a.beneficiaryAge,
        });
      }
      if (a.relationship && ["PARENT","SIBLING"].includes(a.relationship)) {
        steps.push({
          id:"petitionerAge", type:"grid", field:"petitionerAge",
          title:"How old is the U.S. citizen?",
          subtitle:`To sponsor a ${a.relationship === "PARENT" ? "parent" : "sibling"}, the U.S. citizen must be at least 21.`,
          options:[{ label:"Under 21", value:"UNDER_21" },{ label:"21 or older", value:"OVER_21" }],
          canProceed:!!a.petitionerAge,
        });
      }
    }

    if (a.sponsor === "LPR") {
      steps.push({
        id:"relationship", type:"options", field:"relationship",
        title:"What is your relationship with the Green Card holder?",
        options:[
          { label:"I am their spouse", value:"SPOUSE" },
          { label:"I am their unmarried son or daughter", value:"CHILD" },
        ],
        canProceed:!!a.relationship,
      });
      if (a.relationship === "CHILD") {
        steps.push({
          id:"beneficiaryAge", type:"grid", field:"beneficiaryAge",
          title:"How old are you?",
          options:[{ label:"Under 21", value:"UNDER_21" },{ label:"21 or older", value:"OVER_21" }],
          canProceed:!!a.beneficiaryAge,
        });
      }
    }
  }

  // ── WORK PERMANENT branch ─────────────────────────────────
  if (a.purpose === "WORK_PERMANENT") {
    steps.push({
      id:"workBase", type:"options", field:"workBase",
      title:"What best describes your qualifications?",
      subtitle:"This determines which employment-based green card category applies to you.",
      options:[
        { label:"Extraordinary Ability (EB-1A)", value:"EXTRAORDINARY", sub:"Sustained national/international acclaim — self-petition allowed" },
        { label:"Outstanding Professor or Researcher (EB-1B)", value:"RESEARCHER", sub:"International recognition, 3+ years experience, job offer required" },
        { label:"Multinational Manager or Executive (EB-1C)", value:"MANAGER", sub:"Transferring to a U.S. branch of your current employer" },
        { label:"Advanced Degree / National Interest Waiver (EB-2 / NIW)", value:"ADVANCED_DEGREE", sub:"Master's or higher, or exceptional ability" },
        { label:"Skilled Worker or Professional (EB-3)", value:"SKILLED", sub:"2+ years training, bachelor's degree, or unskilled labor" },
        { label:"Investor (EB-5)", value:"INVESTOR", sub:"Invest $800K–$1.05M and create 10+ full-time U.S. jobs" },
      ],
      canProceed:!!a.workBase,
    });
  }

  // ── STUDY branch ──────────────────────────────────────────
  if (a.purpose === "STUDY") {
    steps.push({
      id:"tempType", type:"options", field:"tempType",
      title:"What type of program are you planning to join?",
      options:[
        { label:"Academic degree program", value:"ACADEMIC", sub:"College, university, or SEVP-certified institution (F-1)" },
        { label:"Exchange or cultural program", value:"EXCHANGE", sub:"DOS-designated exchange visitor program (J-1)" },
      ],
      canProceed:!!a.tempType,
    });
  }

  // ── WORK TEMP branch ──────────────────────────────────────
  if (a.purpose === "WORK_TEMP") {
    steps.push({
      id:"tempType", type:"options", field:"tempType",
      title:"What type of work will you be doing?",
      subtitle:"Different work types have different visa categories.",
      options:[
        { label:"Specialty occupation", value:"SPECIALTY", sub:"IT, engineering, finance, medicine — requires bachelor's degree (H-1B)" },
        { label:"Transfer within the same company", value:"TRANSFER", sub:"Moving to a U.S. branch of your current employer (L-1)" },
        { label:"Extraordinary ability in my field", value:"EXTRAORDINARY", sub:"National or international recognition (O-1)" },
        { label:"Professional under USMCA (Canada or Mexico only)", value:"USMCA", sub:"USMCA-listed occupations for Canadian/Mexican citizens (TN)" },
      ],
      canProceed:!!a.tempType,
    });
  }

  // ── GATE QUESTIONS per candidate visa ─────────────────────
  const candidates = getCandidateCodes(a);
  const gate = a.gateAnswers || {};

  for (const code of candidates) {
    const questions = GATE_QUESTIONS[code] || [];
    const visaObj = US_VISAS[code as keyof typeof US_VISAS];
    if (!visaObj || questions.length === 0) continue;
    const visaGate = gate[code] || {};

    for (const q of questions) {
      steps.push({
        id:`gate_${code}_${q.id}`,
        type:"gate_question",
        visaCode:code,
        visaLabel:visaObj.label,
        visaColor:visaObj.color,
        field:`gateAnswers.${code}.${q.id}`,
        questionId:q.id,
        title:q.question,
        subtitle:q.source,
        sourceUrl:q.sourceUrl,
        passWith:q.passWith,
        failMsg:q.failMsg,
        options:q.options,
        canProceed:!!visaGate[q.id],
      });
    }
  }

  return steps;
}