/**
 * visa-engine/data/us.ts
 *
 * Complete US visa data — extracted from the old monolithic files.
 * To add a new country, create a new file like this one and register it in registry.ts.
 */

import { T, CountryData, VisaExplorationAnswers, CandidateRule, FollowUpStep } from "../types";

// ─────────────────────────────────────────────────────────────
// CANDIDATE RULES (Declarative logic)
// ─────────────────────────────────────────────────────────────
const CANDIDATE_RULES: CandidateRule[] = [
  // Family - Citizen
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "SPOUSE" }, then: ["IR-1", "CR-1"] },
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "FIANCE" }, then: ["K-1"] },
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "CHILD", beneficiaryAge: "UNDER_21" }, then: ["IR-2"] },
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "CHILD", beneficiaryAge: "OVER_21" }, then: ["F1"] },
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "MARRIED_CHILD" }, then: ["F3"] },
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "PARENT", petitionerAge: "21 or older" }, then: ["IR-5"] },
  { if: { purpose: "FAMILY", sponsor: "US_CITIZEN", relationship: "SIBLING", petitionerAge: "21 or older" }, then: ["F4"] },
  
  // Family - LPR
  { if: { purpose: "FAMILY", sponsor: "LPR", relationship: "SPOUSE" }, then: ["F2A"] },
  { if: { purpose: "FAMILY", sponsor: "LPR", relationship: "CHILD", beneficiaryAge: "UNDER_21" }, then: ["F2A"] },
  { if: { purpose: "FAMILY", sponsor: "LPR", relationship: "CHILD", beneficiaryAge: "OVER_21" }, then: ["F2B"] },

  // Work Permanent
  { if: { purpose: "WORK_PERMANENT", workBase: "EXTRAORDINARY" }, then: ["EB-1A"] },
  { if: { purpose: "WORK_PERMANENT", workBase: "RESEARCHER" }, then: ["EB-1B"] },
  { if: { purpose: "WORK_PERMANENT", workBase: "MANAGER" }, then: ["EB-1C"] },
  { if: { purpose: "WORK_PERMANENT", workBase: "ADVANCED_DEGREE" }, then: ["EB-2-NIW", "EB-2"] },
  { if: { purpose: "WORK_PERMANENT", workBase: "SKILLED" }, then: ["EB-3"] },
  { if: { purpose: "WORK_PERMANENT", workBase: "INVESTOR" }, then: ["EB-5"] },

  // Visit / Study / Work Temp
  { if: { purpose: "VISIT" }, then: ["B1/B2"] },
  { if: { purpose: "STUDY", tempType: "ACADEMIC" }, then: ["F-1"] },
  { if: { purpose: "STUDY", tempType: "EXCHANGE" }, then: ["J-1"] },
  { if: { purpose: "WORK_TEMP", tempType: "SPECIALTY" }, then: ["H-1B"] },
  { if: { purpose: "WORK_TEMP", tempType: "TRANSFER" }, then: ["L-1"] },
  { if: { purpose: "WORK_TEMP", tempType: "EXTRAORDINARY" }, then: ["O-1"] },
  { if: { purpose: "WORK_TEMP", tempType: "USMCA" }, then: ["TN"] },
  { if: { purpose: "PROTECTION" }, then: ["Asylum", "U-Visa"] },
];

// ─────────────────────────────────────────────────────────────
// FOLLOW-UP STEPS
// ─────────────────────────────────────────────────────────────
const FOLLOW_UP_STEPS: FollowUpStep[] = [
  {
    id: "sponsor", type: "options", field: "sponsor",
    title: "What is your family member's status there?",
    subtitle: "The person who will help bring you there — what kind of status do they have?",
    showIf: { purpose: "FAMILY" },
    options: [
      { label: "They are a U.S. Citizen", value: "US_CITIZEN", sub: "Born there, naturalized, or got citizenship through parents" },
      { label: "They have a Green Card (Permanent Resident)", value: "LPR", sub: "They live there permanently but aren't a citizen yet" },
    ],
  },
  {
    id: "rel_citizen", type: "options", field: "relationship",
    title: "What is your relationship with this person?",
    subtitle: "How are you related to the U.S. citizen?",
    showIf: { purpose: "FAMILY", sponsor: "US_CITIZEN" },
    options: [
      { label: "I am their husband or wife",           value: "SPOUSE",        sub: "We are legally married" },
      { label: "I am their fiancé(e)",                 value: "FIANCE",        sub: "We're engaged but not married yet" },
      { label: "I am their unmarried son or daughter", value: "CHILD",         sub: "I'm not married" },
      { label: "I am their married son or daughter",   value: "MARRIED_CHILD", sub: "I'm married" },
      { label: "I am their parent (mother or father)", value: "PARENT" },
      { label: "I am their brother or sister",         value: "SIBLING" },
    ],
  },
  {
    id: "rel_lpr", type: "options", field: "relationship",
    title: "What is your relationship with the Green Card holder?",
    showIf: { purpose: "FAMILY", sponsor: "LPR" },
    options: [
      { label: "I am their husband or wife",           value: "SPOUSE" },
      { label: "I am their unmarried son or daughter", value: "CHILD" },
    ],
  },
  {
    id: "child_age", type: "grid", field: "beneficiaryAge",
    title: "How old are you?",
    showIf: { purpose: "FAMILY", relationship: "CHILD" },
    options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
  },
  {
    id: "petitioner_age", type: "grid", field: "petitionerAge",
    title: "How old is the U.S. citizen?",
    showIf: { purpose: "FAMILY", relationship: ["PARENT", "SIBLING"] },
    options: [{ label: "Under 21", value: "UNDER_21" }, { label: "21 or older", value: "OVER_21" }],
  },
  {
    id: "work_base", type: "options", field: "workBase",
    title: "Tell us a bit about yourself",
    showIf: { purpose: "WORK_PERMANENT" },
    options: [
      { label: "I'm exceptional in my field",                        value: "EXTRAORDINARY",  sub: "Major awards or significant recognition" },
      { label: "I'm a professor or researcher",                      value: "RESEARCHER",      sub: "I have international recognition" },
      { label: "I'm a manager or executive",                         value: "MANAGER",         sub: "At a company with U.S. offices" },
      { label: "I have an advanced degree",                          value: "ADVANCED_DEGREE", sub: "Master's, PhD, or bachelor's + 5yrs" },
      { label: "I'm a skilled worker or professional",               value: "SKILLED",         sub: "2+ years experience or bachelor's" },
      { label: "I want to invest money",                             value: "INVESTOR",        sub: "Invest $800K+ and create 10+ jobs" },
    ],
  },
  {
    id: "study_type", type: "options", field: "tempType",
    title: "What kind of program are you interested in?",
    showIf: { purpose: "STUDY" },
    options: [
      { label: "Degree program (College/University)", value: "ACADEMIC" },
      { label: "Exchange or cultural program",        value: "EXCHANGE" },
    ],
  },
  {
    id: "work_temp_type", type: "options", field: "tempType",
    title: "What kind of work will you be doing?",
    showIf: { purpose: "WORK_TEMP" },
    options: [
      { label: "Professional/specialty job",     value: "SPECIALTY" },
      { label: "Intracompany transfer",          value: "TRANSFER" },
      { label: "Top of my field",                value: "EXTRAORDINARY" },
      { label: "Canada/Mexico professional",    value: "USMCA" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// US COUNTRY DATA
// ─────────────────────────────────────────────────────────────
export const US_DATA: CountryData = {
  country: "United States",
  code: "US",
  flag: "🇺🇸",
  candidateRules: CANDIDATE_RULES,
  followUpSteps: FOLLOW_UP_STEPS,

  purposes: [
    { label: "Be with family",                           value: "FAMILY",        sub: "Someone in my family is already there (or will be), and I want to join them" },
    { label: "Settle permanently through work or investment", value: "WORK_PERMANENT", sub: "I want to build my career or invest — and stay long-term" },
    { label: "Just visit — tourism, family trip, or medical", value: "VISIT",         sub: "A short trip — I'll be coming back home after" },
    { label: "Study at a school or university",          value: "STUDY",         sub: "I want to get a degree, take courses, or join an exchange program" },
    { label: "Work there temporarily",                   value: "WORK_TEMP",     sub: "I have a job offer or my company wants to send me — but I'm not settling forever" },
    { label: "I need safety or protection",              value: "PROTECTION",    sub: "I'm in danger because of my race, religion, nationality, or political views — or I'm a crime victim" },
  ],

  visas: {
    "IR-1": {
      code: "IR-1", label: "Spouse of U.S. Citizen", badge: "Immediate Relative", color: T.primary,
      description: "Permanent immigrant visa for the foreign spouse of a U.S. citizen who have been married 2 or more years.",
      criteria: ["Petitioner must be a U.S. citizen.", "Must be legally married — bona fide marriage.", "Married 2 or more years at time of U.S. admission.", "Petitioner meets income requirements (≥125% FPL)."],
      processing: "Approximately 12–18 months. No annual quota.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "CR-1": {
      code: "CR-1", label: "Conditional Spouse of U.S. Citizen", badge: "Immediate Relative", color: T.primary,
      description: "Same as IR-1 but for couples married less than 2 years. Green card is conditional for 2 years.",
      criteria: ["Petitioner must be a U.S. citizen.", "Legally married — bona fide marriage required.", "Married less than 2 years at time of admission.", "Must file Form I-751 jointly before card expires."],
      processing: "Approximately 12–18 months. No annual quota.",
      forms: ["I-130", "DS-260", "I-864", "I-751 (later)"],
    },
    "K-1": {
      code: "K-1", label: "Fiancé(e) Visa", badge: "Non-Immigrant → Immigrant", color: "#7C3AED",
      description: "Allows the foreign fiancé(e) of a U.S. citizen to enter the U.S. and marry within 90 days.",
      criteria: ["Petitioner must be a U.S. citizen.", "Both parties must be legally free to marry.", "Must intend to marry within 90 days of U.S. entry.", "Must have met in person at least once within 2 years before filing.", "Petitioner must meet income requirements."],
      processing: "Approximately 6–12 months for K-1; AOS after marriage takes 8–12 months more.",
      forms: ["I-129F", "DS-160", "I-485 (after marriage)"],
    },
    "IR-2": {
      code: "IR-2", label: "Child of U.S. Citizen", badge: "Immediate Relative", color: T.primary,
      description: "Immigrant visa for an unmarried child under 21 of a U.S. citizen.",
      criteria: ["Child must be unmarried and under 21 years old.", "Must be a biological, step-, or adopted child of a U.S. citizen.", "For stepchildren: qualifying marriage before child turned 18.", "For adopted children: adoption before age 16."],
      processing: "Approximately 6–14 months. No annual quota.",
      forms: ["I-130", "DS-260"],
    },
    "IR-5": {
      code: "IR-5", label: "Parent of U.S. Citizen", badge: "Immediate Relative", color: T.primary,
      description: "Immigrant visa for the parent of a U.S. citizen who is at least 21 years old.",
      criteria: ["The U.S. citizen petitioner must be at least 21 years old.", "Must prove biological or legal parent-child relationship.", "For step-parents: qualifying marriage before child turned 18."],
      processing: "Approximately 6–14 months.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "F1": {
      code: "F1", label: "Unmarried Adult Child of U.S. Citizen", badge: "Family Preference — 1st", color: "#0369a1",
      description: "For unmarried sons and daughters aged 21 or older of U.S. citizens. Subject to annual caps.",
      criteria: ["Petitioner must be a U.S. citizen.", "Beneficiary must be unmarried and 21 or older.", "Subject to annual numerical limits — wait times vary by nationality."],
      processing: "6–10+ years depending on nationality.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "F2A": {
      code: "F2A", label: "Spouse / Child of Permanent Resident", badge: "Family Preference — 2A", color: "#0369a1",
      description: "For spouses and unmarried children under 21 of Lawful Permanent Residents.",
      criteria: ["Petitioner must be a Lawful Permanent Resident (Green Card holder).", "Beneficiary must be the spouse or unmarried child under 21.", "Subject to annual numerical limits."],
      processing: "Approximately 2–4 years.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "F2B": {
      code: "F2B", label: "Unmarried Adult Child of Permanent Resident", badge: "Family Preference — 2B", color: "#0369a1",
      description: "For unmarried sons and daughters aged 21 or older of Lawful Permanent Residents.",
      criteria: ["Petitioner must be a Lawful Permanent Resident.", "Beneficiary must be unmarried and 21 or older.", "Subject to annual numerical limits."],
      processing: "5–10+ years.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "F3": {
      code: "F3", label: "Married Child of U.S. Citizen", badge: "Family Preference — 3rd", color: "#0369a1",
      description: "For married sons and daughters of U.S. citizens, regardless of age.",
      criteria: ["Petitioner must be a U.S. citizen.", "Beneficiary must be a married son or daughter (any age).", "Subject to annual limits — waits of 10+ years are common."],
      processing: "10–15+ years.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "F4": {
      code: "F4", label: "Sibling of U.S. Citizen", badge: "Family Preference — 4th", color: "#0369a1",
      description: "For brothers and sisters of U.S. citizens. The petitioner must be at least 21.",
      criteria: ["Petitioner must be a U.S. citizen and at least 21 years old.", "Must share at least one biological or adoptive parent.", "Includes half-siblings and step-siblings (before age 18).", "Subject to annual caps — longest waits in the preference system."],
      processing: "15–25+ years for high-demand nationalities.",
      forms: ["I-130", "DS-260", "I-864"],
    },
    "EB-1A": {
      code: "EB-1A", label: "Extraordinary Ability", badge: "Employment — 1st Preference", color: T.success,
      description: "For individuals with extraordinary ability in sciences, arts, education, business, or athletics. Self-petition allowed.",
      criteria: ["One major international award OR at least 3 of 10 USCIS criteria.", "Evidence of sustained national or international acclaim.", "No employer or PERM required — self-petition allowed."],
      processing: "6–12 months. Premium processing available.",
      forms: ["I-140 (self-petition)", "DS-260 or I-485"],
    },
    "EB-1B": {
      code: "EB-1B", label: "Outstanding Professor / Researcher", badge: "Employment — 1st Preference", color: T.success,
      description: "For internationally recognized professors and researchers in a specific academic field.",
      criteria: ["International recognition as outstanding in the specific academic field.", "At least 3 years of teaching or research experience.", "Permanent job offer from a qualifying U.S. university, research institution, or employer."],
      processing: "6–12 months.",
      forms: ["I-140", "DS-260 or I-485"],
    },
    "EB-1C": {
      code: "EB-1C", label: "Multinational Manager / Executive", badge: "Employment — 1st Preference", color: T.success,
      description: "For executives and managers transferring to a U.S. branch, subsidiary, or affiliate.",
      criteria: ["Employed outside the U.S. by the same company for at least 1 continuous year in the last 3 years.", "Must come to work in a managerial or executive capacity.", "Qualifying corporate relationship must exist."],
      processing: "6–12 months. Premium processing available.",
      forms: ["I-140", "DS-260 or I-485"],
    },
    "EB-2-NIW": {
      code: "EB-2 NIW", label: "National Interest Waiver", badge: "Employment — 2nd Preference", color: T.success,
      description: "Advanced degree professional or exceptional ability — national interest waiver allows self-petition.",
      criteria: ["Advanced degree or exceptional ability.", "Must satisfy 3-part NIW test: substantial merit, well-positioned, beneficial to waive PERM.", "No employer or PERM required."],
      processing: "12–24+ months. Longer backlogs for India and China-born applicants.",
      forms: ["I-140 (self-petition)", "DS-260 or I-485"],
    },
    "EB-2": {
      code: "EB-2", label: "Advanced Degree Professional", badge: "Employment — 2nd Preference", color: T.success,
      description: "For professionals with advanced degrees or exceptional ability. Requires a job offer and PERM.",
      criteria: ["Master's degree or higher, or bachelor's + 5 years progressive experience.", "Requires a permanent full-time job offer.", "Employer must obtain PERM labor certification."],
      processing: "2–5+ years.",
      forms: ["PERM (employer)", "I-140", "DS-260 or I-485"],
    },
    "EB-3": {
      code: "EB-3", label: "Skilled Worker / Professional", badge: "Employment — 3rd Preference", color: T.success,
      description: "For skilled workers, professionals with a bachelor's degree, or unskilled workers.",
      criteria: ["Requires a permanent full-time job offer and PERM labor certification.", "Skilled Workers: position requires at least 2 years of training or experience.", "Professionals: must hold a U.S. bachelor's degree or equivalent."],
      processing: "3–7+ years.",
      forms: ["PERM (employer)", "I-140", "DS-260 or I-485"],
    },
    "EB-5": {
      code: "EB-5", label: "Immigrant Investor", badge: "Investment", color: T.warning,
      description: "For investors who invest capital in a U.S. commercial enterprise that creates jobs.",
      criteria: ["Standard investment: $1,050,000 in a new commercial enterprise.", "TEA: $800,000 in a rural or high-unemployment area.", "Must create or preserve at least 10 permanent full-time jobs.", "Investment must be 'at risk'."],
      processing: "24–48+ months.",
      forms: ["I-526E", "DS-260 or I-485"],
    },
    "B1/B2": {
      code: "B-1/B-2", label: "Visitor — Business / Tourism", badge: "Non-Immigrant · Visit", color: "#6366F1",
      description: "Temporary visits for business meetings (B-1) or tourism, vacation, family visits, or medical treatment (B-2).",
      criteria: ["Visit must be temporary with a specific, limited purpose.", "Must have sufficient funds to cover U.S. expenses.", "Must have a residence abroad and strong ties ensuring return.", "Must not intend to work or study in the U.S."],
      processing: "Days to a few weeks depending on the embassy.",
      forms: ["DS-160"],
    },
    "F-1": {
      code: "F-1", label: "Academic Student Visa", badge: "Non-Immigrant · Study", color: "#6366F1",
      description: "For full-time academic study at a SEVP-certified U.S. college, university, or academic institution.",
      criteria: ["Must be accepted by a SEVP-certified institution and obtain Form I-20.", "Must be enrolled as a full-time student.", "Sufficient funds to support yourself throughout study.", "Must maintain a residence abroad."],
      processing: "Days to a few weeks. Apply at least 120 days before program start.",
      forms: ["I-20 (from school)", "DS-160", "SEVIS fee"],
    },
    "J-1": {
      code: "J-1", label: "Exchange Visitor", badge: "Non-Immigrant · Exchange", color: "#6366F1",
      description: "For participants in approved exchange visitor programs: students, researchers, professors, au pairs, and more.",
      criteria: ["Must be accepted into a DOS-designated exchange visitor program and obtain Form DS-2019.", "Sufficient English proficiency and financial support.", "Required health insurance coverage.", "Some J-1 holders subject to 2-year home residency requirement."],
      processing: "Days to a few weeks at the embassy.",
      forms: ["DS-2019 (from sponsor)", "DS-160", "SEVIS fee"],
    },
    "H-1B": {
      code: "H-1B", label: "Specialty Occupation Worker", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For professionals in specialty occupations requiring at least a bachelor's degree.",
      criteria: ["Position must qualify as a specialty occupation.", "Applicant must hold the qualifying degree or equivalent.", "U.S. employer must file an LCA with the Department of Labor.", "Subject to annual cap of 65,000 (+20,000 for U.S. master's holders) — lottery selection."],
      processing: "6–8 months after lottery selection. Premium processing available.",
      forms: ["LCA", "I-129", "DS-160"],
    },
    "L-1": {
      code: "L-1", label: "Intracompany Transferee", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For employees transferring to a U.S. branch, subsidiary, or affiliate. L-1A for managers/executives; L-1B for specialized knowledge.",
      criteria: ["Employed by the same company outside the U.S. for 1 continuous year within the last 3 years.", "L-1A: transferring in a managerial or executive capacity.", "L-1B: transferring in a specialized knowledge capacity.", "Qualifying corporate relationship required."],
      processing: "1–4 months. Premium processing available.",
      forms: ["I-129", "DS-160"],
    },
    "O-1": {
      code: "O-1", label: "Extraordinary Ability / Achievement", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For individuals with extraordinary ability in science, education, business, or athletics (O-1A), or arts/entertainment (O-1B).",
      criteria: ["O-1A: one major international award OR at least 3 of 8 USCIS criteria.", "O-1B: distinguished by a degree of skill substantially above the ordinary.", "Must have a specific job offer — employer or agent must file on your behalf."],
      processing: "2–4 months. Premium processing available.",
      forms: ["I-129", "DS-160"],
    },
    "TN": {
      code: "TN", label: "TN Visa — USMCA Professional", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For Canadian and Mexican citizens working in qualifying professional occupations under USMCA.",
      criteria: ["Must be a citizen of Canada or Mexico.", "Must work in a USMCA-listed professional occupation.", "Must have a U.S. employer with a specific job offer."],
      processing: "Immediate for Canadian citizens at port of entry. 1–3 months for Mexican citizens.",
      forms: ["Employer letter", "DS-160 (Mexican citizens)"],
    },
    "Asylum": {
      code: "Asylum", label: "Asylum", badge: "Humanitarian", color: "#DC2626",
      description: "Protection for individuals who have suffered or fear persecution based on race, religion, nationality, political opinion, or membership in a particular social group.",
      criteria: ["Must be physically present in the U.S. or at a port of entry.", "Past persecution or a well-founded fear of future persecution.", "Based on one of five protected grounds.", "Must apply within 1 year of last U.S. arrival (certain exceptions apply)."],
      processing: "Affirmative asylum: 6 months to several years. Defensive: tied to immigration court.",
      forms: ["I-589"],
    },
    "U-Visa": {
      code: "U Visa", label: "Crime Victim Visa", badge: "Humanitarian", color: "#DC2626",
      description: "For victims of qualifying crimes who suffered substantial abuse and cooperated with law enforcement.",
      criteria: ["Victim of a qualifying crime (domestic violence, assault, trafficking, robbery, etc.).", "Suffered substantial physical or mental abuse.", "Helpful to law enforcement in the investigation or prosecution.", "Must obtain a law enforcement certification (Form I-918B)."],
      processing: "4–7+ years due to annual cap of 10,000.",
      forms: ["I-918", "I-918B (law enforcement cert)"],
    },
  },

  gateQuestions: {
    "IR-1": [
      { id:"legally_married", question:"Are you and the petitioner legally married?", source:"USCIS Form I-130 — bona fide marriage required", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES"], failMsg:"IR-1 requires a valid, legally recognized marriage.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"marriage_2yr", question:"At the time of U.S. admission, will your marriage be 2 years old or more?", source:"travel.state.gov — IR-1 vs CR-1: 2-year rule", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration/immigrant-visa-for-spouse.html", passWith:["YES"], failMsg:"If married less than 2 years at admission, CR-1 applies instead.", options:[{label:"Yes, 2 or more years",value:"YES"},{label:"No, less than 2 years",value:"NO"}] },
      { id:"prior_marriages", question:"Have all prior marriages of both parties been legally terminated?", source:"USCIS Form I-130 instructions", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES","NA"], failMsg:"All prior marriages must be legally terminated.", options:[{label:"Yes — or no prior marriages",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "CR-1": [
      { id:"legally_married", question:"Are you and the petitioner legally married?", source:"USCIS Form I-130", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES"], failMsg:"CR-1 requires a valid, legally recognized marriage.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"marriage_under_2yr", question:"At the time of U.S. admission, will the marriage be less than 2 years old?", source:"travel.state.gov — CR-1 applies when married < 2 years", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration/immigrant-visa-for-spouse.html", passWith:["YES"], failMsg:"If married 2+ years at admission, IR-1 applies instead.", options:[{label:"Yes, less than 2 years",value:"YES"},{label:"No, 2 or more years",value:"NO"}] },
      { id:"prior_marriages", question:"Have all prior marriages of both parties been legally terminated?", source:"USCIS Form I-130", sourceUrl:"https://www.uscis.gov/i-130", passWith:["YES","NA"], failMsg:"All prior marriages must be legally terminated.", options:[{label:"Yes — or no prior marriages",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "K-1": [
      { id:"both_free", question:"Are both you and the petitioner currently unmarried and legally free to marry?", source:"USCIS — K-1: both parties must be legally free to marry", sourceUrl:"https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens", passWith:["YES"], failMsg:"Both parties must be legally free to marry.", options:[{label:"Yes, both are free to marry",value:"YES"},{label:"No",value:"NO"}] },
      { id:"met_in_person", question:"Have you and the petitioner met in person at least once in the past 2 years?", source:"USCIS Form I-129F — in-person meeting within 2 years", sourceUrl:"https://www.uscis.gov/i-129f", passWith:["YES","WAIVER"], failMsg:"USCIS requires an in-person meeting within 2 years. A waiver is possible for extreme hardship or cultural customs.", options:[{label:"Yes, we have met in person",value:"YES"},{label:"No — but a cultural or hardship waiver applies",value:"WAIVER"},{label:"No",value:"NO"}] },
      { id:"intent_90", question:"Do both parties genuinely intend to marry within 90 days of entering the U.S.?", source:"USCIS — K-1 marriage must occur within 90 days", sourceUrl:"https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens", passWith:["YES"], failMsg:"K-1 requires a genuine intention to marry within 90 days.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
    ],
    "IR-2": [
      { id:"under_21", question:"Is the child currently under 21 years of age?", source:"USCIS — IR-2 requires child to be under 21", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["YES"], failMsg:"If 21 or older, F1 applies instead.", options:[{label:"Yes, under 21",value:"YES"},{label:"No, 21 or older",value:"NO"}] },
      { id:"unmarried", question:"Is the child currently unmarried?", source:"USCIS — IR-2 child must be unmarried", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["YES"], failMsg:"IR-2 requires the child to be unmarried.", options:[{label:"Yes, unmarried",value:"YES"},{label:"No, married",value:"NO"}] },
      { id:"rel_type", question:"What is the nature of the parent-child relationship?", source:"USCIS — biological, step (before age 18), or adopted (before age 16) qualify", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["BIO","STEP_BEFORE_18","ADOPTED_BEFORE_16"], failMsg:"For stepchildren, qualifying marriage must have occurred before child turned 18. For adopted, adoption before age 16.", options:[{label:"Biological child",value:"BIO"},{label:"Stepchild — parent married before child turned 18",value:"STEP_BEFORE_18"},{label:"Adopted — adopted before child turned 16",value:"ADOPTED_BEFORE_16"},{label:"Stepchild — marriage after child turned 18",value:"STEP_LATE"},{label:"Adopted — adopted after child turned 16",value:"ADOPTED_LATE"}] },
    ],
    "IR-5": [
      { id:"petitioner_21", question:"Is the U.S. citizen child (the petitioner) at least 21 years old?", source:"USCIS — petitioner must be 21+ to petition for a parent", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["YES"], failMsg:"The U.S. citizen must be at least 21 to petition for a parent.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
      { id:"parent_rel", question:"What is the nature of the parent relationship?", source:"USCIS — biological, step (before child turned 18), or adoptive (before age 16)", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen", passWith:["BIO","STEP_BEFORE_18","ADOPTIVE_BEFORE_16"], failMsg:"For step-parents, the marriage must have occurred before the U.S. citizen child turned 18.", options:[{label:"Biological parent",value:"BIO"},{label:"Step-parent — married before child turned 18",value:"STEP_BEFORE_18"},{label:"Adoptive parent — adopted before age 16",value:"ADOPTIVE_BEFORE_16"},{label:"Step-parent — marriage after child turned 18",value:"STEP_LATE"}] },
    ],
    "F1": [
      { id:"over_21", question:"Is the son or daughter 21 years of age or older?", source:"USCIS — F1: Unmarried Sons and Daughters (21+)", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F1 is for adult children (21+). For children under 21, IR-2 applies.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
      { id:"unmarried", question:"Is the son or daughter currently unmarried?", source:"USCIS — F1 requires unmarried status", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F1 is for unmarried sons/daughters. Married children use F3.", options:[{label:"Yes, unmarried",value:"YES"},{label:"No, married",value:"NO"}] },
    ],
    "F2A": [
      { id:"rel_type", question:"Is the beneficiary the spouse or an unmarried child under 21 of the LPR?", source:"USCIS — F2A: spouses and unmarried children under 21 of LPRs", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["SPOUSE","CHILD_UNDER_21"], failMsg:"F2A is only for spouses or unmarried children under 21.", options:[{label:"Spouse of the LPR",value:"SPOUSE"},{label:"Unmarried child under 21",value:"CHILD_UNDER_21"},{label:"Child 21 or older",value:"CHILD_OVER_21"}] },
    ],
    "F2B": [
      { id:"over_21", question:"Is the son or daughter 21 years of age or older?", source:"USCIS — F2B: Unmarried Sons and Daughters (21+) of LPRs", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"For children under 21, F2A applies instead.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
      { id:"unmarried", question:"Is the son or daughter currently unmarried?", source:"USCIS — F2B requires unmarried status", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F2B is for unmarried sons/daughters only.", options:[{label:"Yes, unmarried",value:"YES"},{label:"No, married",value:"NO"}] },
    ],
    "F3": [
      { id:"married", question:"Is the son or daughter currently married?", source:"USCIS — F3: Married Sons and Daughters of U.S. Citizens", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"F3 is for married children only.", options:[{label:"Yes, married",value:"YES"},{label:"No, unmarried",value:"NO"}] },
    ],
    "F4": [
      { id:"petitioner_21", question:"Is the U.S. citizen petitioner at least 21 years old?", source:"USCIS — petitioner must be 21+ to petition for a sibling", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["YES"], failMsg:"The U.S. citizen must be at least 21.", options:[{label:"Yes, 21 or older",value:"YES"},{label:"No, under 21",value:"NO"}] },
      { id:"common_parent", question:"Do you and the petitioner share at least one common parent?", source:"USCIS — must share at least one biological or legally adoptive parent", sourceUrl:"https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants", passWith:["FULL","HALF","STEP_BEFORE_18"], failMsg:"Must share at least one biological or adoptive parent.", options:[{label:"Full siblings — same mother and father",value:"FULL"},{label:"Half siblings — share one parent",value:"HALF"},{label:"Step-siblings — relationship before age 18",value:"STEP_BEFORE_18"},{label:"Step-siblings — relationship after age 18",value:"STEP_LATE"}] },
    ],
    "EB-1A": [
      { id:"evidence", question:"Do you have evidence of extraordinary ability — a major international award OR at least 3 of the 10 USCIS criteria?", source:"USCIS — EB-1A: Aliens of Extraordinary Ability", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["MAJOR_AWARD","THREE_CRITERIA"], failMsg:"EB-1A requires one major international award, or evidence meeting at least 3 of 10 USCIS criteria.", options:[{label:"Yes — major international award",value:"MAJOR_AWARD"},{label:"Yes — at least 3 of the 10 USCIS criteria",value:"THREE_CRITERIA"},{label:"No",value:"NO"}] },
      { id:"sustained", question:"Is your extraordinary ability currently sustained — ongoing recognition, not just historical?", source:"USCIS — EB-1A requires sustained national or international acclaim", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"USCIS requires evidence of sustained acclaim.", options:[{label:"Yes, ongoing",value:"YES"},{label:"Mostly historical",value:"NO"}] },
    ],
    "EB-1B": [
      { id:"recognition", question:"Are you internationally recognized as outstanding in a specific academic field?", source:"USCIS — EB-1B: Outstanding Professors and Researchers", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1B requires international recognition.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"three_years", question:"Do you have at least 3 years of teaching or research experience?", source:"USCIS — EB-1B requires at least 3 years experience", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"At least 3 years required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"job_offer", question:"Do you have a permanent job offer from a qualifying U.S. university, research institution, or employer?", source:"USCIS — EB-1B requires a permanent position", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1B requires a permanent job offer.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "EB-1C": [
      { id:"one_year", question:"Have you been employed by the same company abroad for at least 1 continuous year in the past 3 years?", source:"USCIS — EB-1C: 1 year continuous employment", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1C requires at least 1 year of continuous employment.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"manager_exec", question:"Will you be working in a managerial or executive capacity in the U.S.?", source:"USCIS — EB-1C requires managerial or executive role", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"EB-1C is for managerial or executive roles only.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"corp_rel", question:"Is there a qualifying corporate relationship between the two companies?", source:"USCIS — qualifying relationship required", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", passWith:["YES"], failMsg:"A parent, subsidiary, branch, or affiliate relationship is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "EB-2-NIW": [
      { id:"degree", question:"Do you hold a master's degree or higher — or a bachelor's + 5 years progressive experience — or exceptional ability?", source:"USCIS — EB-2: Advanced Degree or Exceptional Ability", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["ADVANCED","EXCEPTIONAL"], failMsg:"EB-2 requires a master's/PhD, bachelor's + 5 years, or exceptional ability.", options:[{label:"Yes — master's or higher",value:"ADVANCED"},{label:"Yes — bachelor's + 5 years progressive experience",value:"ADVANCED"},{label:"Yes — exceptional ability (3 of 6 USCIS criteria)",value:"EXCEPTIONAL"},{label:"No",value:"NO"}] },
      { id:"nat_interest", question:"Can you show your work has substantial merit and national importance to the United States?", source:"USCIS — NIW 3-part test", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["YES"], failMsg:"The NIW requires showing substantial merit and national importance.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
      { id:"well_positioned", question:"Are you well-positioned to advance this work — strong track record and a clear plan?", source:"USCIS — NIW test: well-positioned to advance the endeavor", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["YES"], failMsg:"USCIS must be convinced you can advance your stated work.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
    ],
    "EB-2": [
      { id:"degree", question:"Do you hold a master's degree or higher — or a bachelor's + 5 years — or exceptional ability?", source:"USCIS — EB-2", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["ADVANCED","EXCEPTIONAL"], failMsg:"EB-2 requires an advanced degree or exceptional ability.", options:[{label:"Yes — master's or higher",value:"ADVANCED"},{label:"Yes — bachelor's + 5 years",value:"ADVANCED"},{label:"Yes — exceptional ability",value:"EXCEPTIONAL"},{label:"No",value:"NO"}] },
      { id:"job_perm", question:"Do you have a permanent full-time U.S. job offer with PERM Labor Certification?", source:"USCIS — Standard EB-2 requires job offer + PERM", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", passWith:["YES"], failMsg:"Standard EB-2 requires a permanent job offer and PERM.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "EB-3": [
      { id:"job_perm", question:"Do you have a permanent full-time U.S. job offer with PERM Labor Certification?", source:"USCIS — EB-3 requires PERM + job offer", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3", passWith:["YES"], failMsg:"EB-3 requires a permanent job offer and PERM.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"worker_type", question:"Which description best fits you?", source:"USCIS — EB-3 sub-categories", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3", passWith:["SKILLED","PROFESSIONAL","OTHER"], failMsg:"Must qualify under one EB-3 sub-category.", options:[{label:"Skilled Worker — 2+ years training/experience",value:"SKILLED"},{label:"Professional — U.S. bachelor's degree required",value:"PROFESSIONAL"},{label:"Other Worker — unskilled labor",value:"OTHER"}] },
    ],
    "EB-5": [
      { id:"investment", question:"What is your planned investment amount?", source:"USCIS — EB-5 Reform and Integrity Act 2022", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5-immigrant-investor", passWith:["STANDARD","TEA"], failMsg:"EB-5 requires minimum $800,000 (TEA) or $1,050,000 (standard).", options:[{label:"$1,050,000+ (standard area)",value:"STANDARD"},{label:"$800,000+ in a rural/high-unemployment area (TEA)",value:"TEA"},{label:"Less than $800,000",value:"INSUFFICIENT"}] },
      { id:"jobs", question:"Will the investment create at least 10 permanent full-time jobs?", source:"USCIS — EB-5 requires 10+ permanent jobs", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5-immigrant-investor", passWith:["YES"], failMsg:"Must create or preserve at least 10 permanent jobs.", options:[{label:"Yes — 10 or more jobs",value:"YES"},{label:"No / Unsure",value:"NO"}] },
    ],
    "B1/B2": [
      { id:"temp_intent", question:"Is the purpose of your visit temporary — do you plan to return home afterward?", source:"travel.state.gov — B-1/B-2 requires nonimmigrant intent", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", passWith:["YES"], failMsg:"B-1/B-2 requires clear nonimmigrant intent.", options:[{label:"Yes, temporary visit",value:"YES"},{label:"No, I plan to stay permanently",value:"NO"}] },
      { id:"home_ties", question:"Do you have strong ties to your home country (job, family, property)?", source:"travel.state.gov — strong home ties required", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", passWith:["YES"], failMsg:"Consular officers look for strong home-country ties.", options:[{label:"Yes, strong ties",value:"YES"},{label:"No / Weak ties",value:"NO"}] },
    ],
    "F-1": [
      { id:"i20", question:"Have you been accepted by a SEVP-certified U.S. school and received a Form I-20?", source:"USCIS — F-1 requires acceptance by a SEVP-certified institution", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment", passWith:["YES"], failMsg:"A Form I-20 from a SEVP-certified school is required.", options:[{label:"Yes, I have a Form I-20",value:"YES"},{label:"Not yet",value:"NO"}] },
      { id:"funds", question:"Do you have sufficient funds for tuition and living expenses?", source:"travel.state.gov — F-1 requires proof of financial support", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study.html", passWith:["YES"], failMsg:"Must demonstrate sufficient financial resources.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
      { id:"intent", question:"Do you maintain a residence abroad and plan to return after studies?", source:"travel.state.gov — F-1 requires nonimmigrant intent", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study.html", passWith:["YES"], failMsg:"F-1 requires maintaining a foreign residence.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "J-1": [
      { id:"ds2019", question:"Have you been accepted into a DOS-designated exchange program and received a Form DS-2019?", source:"travel.state.gov — J-1 requires DOS-designated program", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study/exchange.html", passWith:["YES"], failMsg:"A DS-2019 from a DOS-designated sponsor is required.", options:[{label:"Yes, I have a DS-2019",value:"YES"},{label:"No",value:"NO"}] },
      { id:"insurance", question:"Will you have qualifying health insurance for the duration?", source:"22 CFR 62.14 — J-1 health insurance requirement", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/study/exchange.html", passWith:["YES"], failMsg:"Health insurance meeting State Department standards is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "H-1B": [
      { id:"specialty", question:"Does the U.S. job qualify as a specialty occupation — requiring at least a bachelor's degree?", source:"USCIS — H-1B: Specialty Occupation Workers", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"H-1B is for specialty occupations requiring a bachelor's or higher.", options:[{label:"Yes",value:"YES"},{label:"No / General position",value:"NO"}] },
      { id:"degree", question:"Do you hold a bachelor's degree or higher in the specific field?", source:"USCIS — degree must be directly related", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"Must hold a qualifying degree in the relevant field.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"employer", question:"Does a U.S. employer agree to sponsor you?", source:"USCIS — H-1B requires employer-filed LCA and I-129", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"H-1B cannot be self-petitioned.", options:[{label:"Yes, employer will sponsor",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "L-1": [
      { id:"one_year", question:"Have you been continuously employed by the same company outside the U.S. for at least 1 year in the past 3 years?", source:"USCIS — L-1 requires 1 continuous year", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager", passWith:["YES"], failMsg:"At least 1 continuous year required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"corp_rel", question:"Does the U.S. company have a qualifying relationship with the foreign company?", source:"USCIS — qualifying corporate relationship required", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager", passWith:["YES"], failMsg:"A qualifying corporate relationship is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"role", question:"What will your role be in the U.S.?", source:"USCIS — L-1A for managers/executives; L-1B for specialized knowledge", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1b-intracompany-transferee-specialized-knowledge", passWith:["MANAGER","SPECIALIZED"], failMsg:"L-1 is for managerial, executive, or specialized knowledge roles only.", options:[{label:"Manager or Executive (L-1A)",value:"MANAGER"},{label:"Specialized knowledge worker (L-1B)",value:"SPECIALIZED"},{label:"General or entry-level position",value:"GENERAL"}] },
    ],
    "O-1": [
      { id:"evidence", question:"Do you have evidence of extraordinary ability — a major award OR at least 3 of the 8 O-1 criteria?", source:"USCIS — O-1A: Extraordinary Ability", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement", passWith:["MAJOR_AWARD","THREE_CRITERIA","O1B"], failMsg:"O-1A requires one major award or 3 of 8 criteria.", options:[{label:"Yes — major international award",value:"MAJOR_AWARD"},{label:"Yes — at least 3 of 8 O-1A criteria",value:"THREE_CRITERIA"},{label:"Yes — O-1B: arts/entertainment",value:"O1B"},{label:"No",value:"NO"}] },
      { id:"employer", question:"Do you have a U.S. employer, agent, or sponsor who will file Form I-129?", source:"USCIS — O-1 cannot be self-petitioned", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement", passWith:["YES"], failMsg:"O-1 cannot be self-petitioned.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "TN": [
      { id:"can_mex", question:"Are you a citizen of Canada or Mexico?", source:"USCIS — TN only for Canadian and Mexican citizens", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals", passWith:["YES"], failMsg:"TN status is exclusively for citizens of Canada or Mexico.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"occupation", question:"Does your job appear on the USMCA list of qualifying occupations?", source:"USCIS — TN requires a USMCA-listed occupation", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals", passWith:["YES"], failMsg:"Only USMCA-listed occupations qualify.", options:[{label:"Yes",value:"YES"},{label:"No / Unsure",value:"NO"}] },
      { id:"job_offer", question:"Do you have a specific job offer from a U.S. employer?", source:"USCIS — TN requires specific U.S. employer job offer", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals", passWith:["YES"], failMsg:"A specific job offer is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "Asylum": [
      { id:"present", question:"Are you physically present inside the United States or at a U.S. port of entry?", source:"USCIS — Asylum requires physical presence in the U.S.", sourceUrl:"https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum", passWith:["YES","PORT"], failMsg:"Asylum can only be applied for from within the U.S. or at a port of entry.", options:[{label:"Yes, I am inside the U.S.",value:"YES"},{label:"I am at a U.S. port of entry",value:"PORT"},{label:"No, I am outside the U.S.",value:"NO"}] },
      { id:"one_year", question:"Are you filing within 1 year of your last arrival to the United States?", source:"USCIS — must file within 1 year (exceptions exist)", sourceUrl:"https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum", passWith:["YES","EXCEPTION"], failMsg:"Must file within 1 year. Exceptions exist for changed/extraordinary circumstances.", options:[{label:"Yes, within 1 year",value:"YES"},{label:"No — but changed/extraordinary circumstances apply",value:"EXCEPTION"},{label:"No, and no exception applies",value:"NO"}] },
      { id:"ground", question:"Is your fear of persecution based on race, religion, nationality, political opinion, or membership in a particular social group?", source:"USCIS — one of the five protected grounds required", sourceUrl:"https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum", passWith:["YES"], failMsg:"Asylum requires persecution based on one of the five protected grounds.", options:[{label:"Yes — one of the five protected grounds",value:"YES"},{label:"No — other reasons",value:"NO"}] },
    ],
    "U-Visa": [
      { id:"crime", question:"Are you a victim of a qualifying crime — domestic violence, assault, sexual assault, trafficking, robbery, or related offenses?", source:"USCIS — U Visa: Qualifying Crimes list", sourceUrl:"https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status", passWith:["YES"], failMsg:"U Visa is only for victims of specific qualifying crimes.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"abuse", question:"Did you suffer substantial physical or mental abuse as a result of the crime?", source:"USCIS — must have suffered substantial abuse", sourceUrl:"https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status", passWith:["YES"], failMsg:"The U Visa requires substantial abuse.", options:[{label:"Yes",value:"YES"},{label:"No / Minor harm only",value:"NO"}] },
      { id:"le_coop", question:"Are you willing to cooperate with law enforcement and can you obtain a Form I-918B certification?", source:"USCIS — must be helpful to law enforcement", sourceUrl:"https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status", passWith:["YES"], failMsg:"U Visa requires cooperation with law enforcement.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
  },
};
