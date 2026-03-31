/**
 * visa-engine/data/us.ts
 *
 * Complete US visa data — extracted from the old monolithic files.
 * To add a new country, create a new file like this one and register it in registry.ts.
 *
 * ──────────────────────────────────────────────────────────────────
 * VERIFICATION SOURCES & LAST REVIEWED: March 2026
 * ──────────────────────────────────────────────────────────────────
 *
 * Most of the US data was already accurate. Key updates applied:
 *
 * [H-1B]   Major 2025–2026 policy changes:
 *           https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/h-1b-cap-season
 *           https://www.ballardspahr.com/insights/alerts-and-articles/2025/09/h-1b-changes-100000-fee-entry-restrictions-and-weighted-lottery-system
 *           • Sep 19, 2025 Presidential Proclamation: $100,000 fee required for H-1B petitions
 *             for beneficiaries OUTSIDE the US (does NOT apply to change-of-status or extensions)
 *             The proclamation expires Sep 21, 2026. Legal challenges ongoing.
 *           • FY 2027 Lottery (effective Feb 27, 2026): New WEIGHTED selection system
 *             based on prevailing wage levels — higher-paid positions have a greater chance
 *             of selection. No longer purely random.
 *           • Annual caps unchanged: 65,000 regular + 20,000 U.S. master's = 85,000 total
 *           • Registration fee for FY 2027: $215 per beneficiary
 *           • The description, criteria, and process field have all been updated to reflect this.
 *
 * All other US visas (IR-1, CR-1, K-1, IR-2, IR-5, F1-F4, F2A, F2B,
 * EB-1A/B/C, EB-2/NIW, EB-3, EB-5, B1/B2, F-1, J-1, L-1, O-1, TN,
 * Asylum, U-Visa, E-2, R-1, P-1, P-3, DV-1) were verified against
 * USCIS.gov and travel.state.gov and found to be materially accurate.
 * No significant changes to the data for those categories.
 *
 * ──────────────────────────────────────────────────────────────────
 * General disclaimer: Not legal advice. Immigration law changes
 * frequently. Always verify current requirements at uscis.gov and
 * travel.state.gov. Consult a licensed immigration attorney.
 * ──────────────────────────────────────────────────────────────────
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

// ─────────────────────────────────────────────────────────────
// CANDIDATE CODES  (US-specific logic)
// ─────────────────────────────────────────────────────────────
function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  if (!a.purpose) return [];
  const c: string[] = [];

  if (a.purpose === "FAMILY") {
    if (a.sponsor === "US_CITIZEN") {
      if (a.relationship === "SPOUSE")        c.push("IR-1", "CR-1", "K-3");
      if (a.relationship === "FIANCE")        c.push("K-1");
      if (a.relationship === "CHILD") {
        if (a.beneficiaryAge === "UNDER_21")  c.push("IR-2", "K-2", "K-4");
        if (a.beneficiaryAge === "OVER_21")   c.push("F1");
      }
      if (a.relationship === "ORPHAN")        c.push("IR-3", "IR-4");
      if (a.relationship === "MARRIED_CHILD") c.push("F3");
      if (a.relationship === "PARENT")        c.push("IR-5");
      if (a.relationship === "SIBLING")       c.push("F4");
    }
    if (a.sponsor === "LPR") {
      if (a.relationship === "SPOUSE")        c.push("F2A");
      if (a.relationship === "CHILD") {
        if (a.beneficiaryAge === "UNDER_21")  c.push("F2A");
        if (a.beneficiaryAge === "OVER_21")   c.push("F2B");
      }
    }
  }

  if (a.purpose === "WORK_PERMANENT") {
    if (a.workBase === "EXTRAORDINARY")   c.push("EB-1A");
    if (a.workBase === "RESEARCHER")      c.push("EB-1B");
    if (a.workBase === "MANAGER")         c.push("EB-1C");
    if (a.workBase === "ADVANCED_DEGREE") c.push("EB-2-NIW", "EB-2");
    if (a.workBase === "SKILLED")         c.push("EB-3");
    if (a.workBase === "INVESTOR")        c.push("EB-5");
    if (a.workBase === "SPECIAL")         c.push("EB-4", "SI", "SQ");
  }

  if (a.purpose === "VISIT") c.push("B1/B2");
  if (a.purpose === "STUDY") {
    if (a.tempType === "ACADEMIC")  c.push("F-1", "F-2");
    if (a.tempType === "VOCATIONAL")c.push("M-1", "M-2");
    if (a.tempType === "EXCHANGE")  c.push("J-1", "J-2");
    if (!a.tempType)                c.push("F-1", "J-1", "M-1");
  }
  if (a.purpose === "WORK_TEMP") {
    if (a.tempType === "SPECIALTY")     c.push("H-1B", "H-4");
    if (a.tempType === "SEASONAL_AGRI") c.push("H-2A", "H-4");
    if (a.tempType === "SEASONAL_NON")  c.push("H-2B", "H-4");
    if (a.tempType === "TRAINEE")       c.push("H-3", "H-4");
    if (a.tempType === "TRANSFER")      c.push("L-1", "L-2");
    if (a.tempType === "EXTRAORDINARY") c.push("O-1", "O-2", "O-3");
    if (a.tempType === "ART_ATHLETE")   c.push("P-1", "P-2", "P-3", "P-4");
    if (a.tempType === "USMCA")         c.push("TN");
    if (a.tempType === "RELIGIOUS")     c.push("R-1", "R-2");
  }
  if (a.purpose === "TRANSIT")       c.push("C-1", "D", "C-1/D");
  if (a.purpose === "DIPLOMATIC")    c.push("A-1", "A-2", "G-1", "G-2", "G-3", "G-4", "G-5");
  if (a.purpose === "PROTECTION")    c.push("Asylum", "U-Visa", "T-Visa");
  if (a.purpose === "RELIGIOUS")     c.push("R-1");
  if (a.purpose === "ART_ATHLETE")   c.push("P-1", "P-3");
  if (a.purpose === "INVEST_TREATY") c.push("E-1", "E-2", "E-3");
  if (a.purpose === "LOTTERY")       c.push("DV-1");
  if (a.purpose === "MEDIA")         c.push("I-Visa");

  return [...new Set(c)];
}

// ─────────────────────────────────────────────────────────────
// FOLLOW-UP STEPS (US-specific wizard sequence)
// ─────────────────────────────────────────────────────────────
function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
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
          { label: "I am an orphan child",                value: "ORPHAN",         sub: "To be adopted or already adopted by a U.S. citizen" },
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
        { label: "I'm exceptional in my field",                               value: "EXTRAORDINARY",  sub: "Major awards or significant recognition in sciences, arts, education, business, or athletics" },
        { label: "I'm a professor or researcher",                             value: "RESEARCHER",      sub: "I have international recognition and 3+ years of academic experience" },
        { label: "I'm a manager or executive at a company with U.S. offices", value: "MANAGER",        sub: "My company has a branch, subsidiary, or parent company there" },
        { label: "I have an advanced degree or strong expertise",             value: "ADVANCED_DEGREE", sub: "Master's, PhD, or a bachelor's with 5+ years of experience" },
        { label: "I'm a skilled worker or professional",                      value: "SKILLED",         sub: "2+ years of training/experience, or a bachelor's degree" },
        { label: "I'm a 'Special Immigrant' (Religious, SIV, etc.)",          value: "SPECIAL",         sub: "Religious workers, certain Afghan/Iraqi employees, etc. (EB-4/SI/SQ)" },
        { label: "I want to invest money and create jobs",                    value: "INVESTOR",        sub: "I can invest $800K–$1.05M in a U.S. business that creates 10+ jobs" },
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
        { label: "A degree program at a college or university", value: "ACADEMIC",   sub: "Bachelor's, Master's, PhD, or professional degree (F-1)" },
        { label: "A vocational or technical program",           value: "VOCATIONAL", sub: "Technical, trade, or other non-academic training (M-1)" },
        { label: "An exchange or cultural program",             value: "EXCHANGE",   sub: "Research, teaching, internship, or cultural exchange (J-1)" },
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
        { label: "A professional/specialty job",                  value: "SPECIALTY",     sub: "IT, engineering, finance, medicine — the kind of job that needs a degree (H-1B)" },
        { label: "Seasonal Agricultural work",                    value: "SEASONAL_AGRI", sub: "Farming, harvesting, or other seasonal agri-work (H-2A)" },
        { label: "Seasonal Non-Agricultural work",                value: "SEASONAL_NON",  sub: "Hospitality, construction, or other temporary labor (H-2B)" },
        { label: "I'm a trainee in a U.S. program",              value: "TRAINEE",       sub: "Training not available in my home country (H-3)" },
        { label: "My company is sending me to their U.S. office", value: "TRANSFER",      sub: "Same company, different country — internal transfer (L-1)" },
        { label: "I'm at the top of my field",                    value: "EXTRAORDINARY", sub: "Nationally or internationally recognized in science, arts, etc. (O-1/O-2)" },
        { label: "I'm a professional athlete or entertainer",    value: "ART_ATHLETE",   sub: "Individual or group performances, or culturally unique programs (P-1/P-2/P-3)" },
        { label: "Religious work",                                value: "RELIGIOUS",     sub: "Working for a non-profit religious organization (R-1)" },
        { label: "I'm from Canada or Mexico with a USMCA profession", value: "USMCA",    sub: "Specific professional occupations listed in USMCA (TN)" },
      ],
      canProceed: !!a.tempType,
    });
  }

  if (a.purpose === "INVEST_TREATY") {
    steps.push({
      id: "tempType", type: "options", field: "tempType",
      title: "Select your investment or trade role",
      options: [
        { label: "Treaty Trader",   value: "TRADER",   sub: "Carrier of substantial trade between U.S. and treaty country (E-1)" },
        { label: "Treaty Investor", value: "INVESTOR", sub: "Direct and develop operations of an enterprise you have invested in (E-2)" },
        { label: "Specialty Occupation (Australia)", value: "AUSTRALIA", sub: "For Australian nationals in specialty occupations (E-3)" },
      ],
      canProceed: !!a.tempType,
    });
  }

  if (a.purpose === "TRANSIT") {
    steps.push({
      id: "transitType", type: "options", field: "transitType",
      title: "Are you transiting or a crew member?",
      options: [
        { label: "Just transiting through the U.S.", value: "TRANSIT", sub: "Immediate and continuous transit to another country (C-1)" },
        { label: "I'm a crew member",                value: "CREW",    sub: "Serving on a sea vessel or aircraft (D / C-1/D)" },
      ],
      canProceed: true,
    });
  }

  return steps;
}

// ─────────────────────────────────────────────────────────────
// US COUNTRY DATA
// ─────────────────────────────────────────────────────────────
export const US_DATA: CountryData = {
  country: "United States",
  code: "US",
  flag: "🇺🇸",
  getCandidateCodes,
  buildFollowUpSteps,
  officialSources: [
    { label: "USCIS.gov", url: "https://www.uscis.gov" },
    { label: "travel.state.gov", url: "https://travel.state.gov" },
  ],

  purposes: [
    { label: "Be with family",                                value: "FAMILY",        sub: "Someone in my family is already there (or will be), and I want to join them" },
    { label: "Settle permanently through work or investment", value: "WORK_PERMANENT", sub: "I want to build my career or invest — and stay long-term" },
    { label: "Just visit — tourism, family trip, or medical", value: "VISIT",         sub: "A short trip — I'll be coming back home after" },
    { label: "Study at a school or university",               value: "STUDY",         sub: "I want to get a degree, take courses, or join an exchange program" },
    { label: "Work there temporarily",                        value: "WORK_TEMP",     sub: "I have a job offer or my company wants to send me — but I'm not settling forever" },
    { label: "Transit / Crew member",                         value: "TRANSIT",       sub: "Passing through the U.S. or working on a ship/airline" },
    { label: "Diplomat / Official",                           value: "DIPLOMATIC",    sub: "Representing a foreign government or international organization" },
    { label: "I need safety or protection",                   value: "PROTECTION",    sub: "I'm in danger because of my race, religion, nationality, or political views — or I'm a crime victim" },
    { label: "Investment / Treaty Trade",                     value: "INVEST_TREATY", sub: "My country has a treaty with the U.S. and I want to invest or trade" },
    { label: "Religious Work",                                value: "RELIGIOUS",     sub: "I want to work for a religious non-profit or church" },
    { label: "Arts, Athletics, or Entertainment",             value: "ART_ATHLETE",   sub: "I'm a professional athlete, artist, or performer" },
    { label: "Diversity Visa (Green Card Lottery)",           value: "LOTTERY",       sub: "I want to apply for the annual US Green Card lottery program" },
    { label: "Media / Journalist",                            value: "MEDIA",         sub: "I work for a foreign media outlet (press, radio, film)" },
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
    "IR-3": {
      code: "IR-3", label: "Orphan Adopted Abroad", badge: "Immediate Relative", color: T.primary,
      description: "For an orphan who is adopted abroad by a U.S. citizen.",
      criteria: ["Adoption was completed abroad.", "U.S. citizen child and at least one adoptive parent saw the child before or during the adoption process."],
      processing: "Varies.",
      forms: ["I-600", "DS-260"],
    },
    "IR-4": {
      code: "IR-4", label: "Orphan to be Adopted in U.S.", badge: "Immediate Relative", color: T.primary,
      description: "For an orphan who is coming to the U.S. to be adopted by a U.S. citizen.",
      criteria: ["Child is coming to the U.S. for adoption.", "Prospective adoptive parents have legal custody of the child."],
      processing: "Varies.",
      forms: ["I-600", "DS-260"],
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
    "K-3": {
      code: "K-3", label: "Spouse of U.S. Citizen", badge: "Non-Immigrant", color: "#7C3AED",
      description: "For the spouse of a U.S. citizen while awaiting the processing of an immigrant visa petition (I-130).",
      criteria: ["Married to a U.S. citizen.", "Form I-130 must have already been filed.", "Allows the spouse to enter the U.S. and adjust status."],
      processing: "Varies (often similar to I-130 times).",
      forms: ["I-129F", "I-130"],
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
      description: "For professionals in specialty occupations requiring at least a bachelor's degree. Subject to an annual cap of 85,000 visas (65,000 regular + 20,000 for U.S. master's holders). Beginning with FY 2027, selection uses a WEIGHTED system based on prevailing wage levels — higher-paid positions have a greater chance of selection. Additionally, a Presidential Proclamation (Sep 2025) requires a $100,000 fee for H-1B petitions filed for beneficiaries currently outside the United States (expires Sep 2026; does not apply to change-of-status or extensions).",
      criteria: [
        "Position must qualify as a specialty occupation requiring at least a bachelor's degree in a specific field.",
        "Applicant must hold the qualifying degree or equivalent combination of education and experience.",
        "U.S. employer must file a Labor Condition Application (LCA) with the Department of Labor and pay the prevailing wage.",
        "Subject to annual cap: 65,000 regular cap + 20,000 additional for U.S. master's degree holders = 85,000 total per fiscal year.",
        "FY 2027 onwards: lottery selection is WEIGHTED — registrations linked to higher prevailing wage levels have a greater probability of selection. This replaced the purely random system starting February 2026.",
        "Important (Sep 2025): If the beneficiary is OUTSIDE the US at time of filing, the employer must pay an additional $100,000 fee under the Presidential Proclamation (Proclamation 10973, expires Sep 21, 2026). Does NOT apply to change-of-status filings.",
        "Visa Integrity Fee (2026): A mandatory $250 fee for all non-immigrant H and L petition filings.",
      ],
      processing: "6–8 months after lottery selection. Premium processing available (expedited to 15 business days for an additional fee, increased from March 1, 2026).",
      forms: ["LCA (Labor Condition Application)", "I-129", "DS-160 (if consular processing)"],
    },

    "L-1": {
      code: "L-1", label: "Intracompany Transferee", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For employees transferring to a U.S. branch, subsidiary, or affiliate. L-1A for managers/executives; L-1B for specialized knowledge.",
      criteria: [
        "Employed by the same company outside the U.S. for 1 continuous year within the last 3 years.",
        "L-1A: transferring in a managerial or executive capacity.",
        "L-1B: transferring in a specialized knowledge capacity.",
        "Qualifying corporate relationship required.",
        "Visa Integrity Fee (2026): A mandatory $250 fee for all non-immigrant H and L petition filings.",
      ],
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
    "E-2": {
      code: "E-2", label: "Treaty Investor", badge: "Non-Immigrant · Investment", color: T.warning,
      description: "Allows nationals of treaty countries to be admitted to the U.S. when investing a substantial amount of capital in a U.S. business.",
      criteria: ["Must be a national of a treaty country (e.g., Pakistan).", "Must have invested, or be actively in the process of investing, a substantial amount.", "Must be seeking entry solely to develop and direct the investment enterprise."],
      processing: "2–4 months.",
      forms: ["DS-160", "DS-156E"],
    },
    "R-1": {
      code: "R-1", label: "Religious Worker", badge: "Non-Immigrant · Religion", color: "#8B5CF6",
      description: "For people coming to the U.S. temporarily to be employed at least part-time by a non-profit religious organization.",
      criteria: ["Must be a member of a religious denomination for at least 2 years.", "Coming to work as a minister or in a religious vocation/occupation.", "Must work for a bona fide non-profit religious organization."],
      processing: "6–10 months.",
      forms: ["I-129", "DS-160"],
    },
    "P-1": {
      code: "P-1", label: "Athlete / Group Performer", badge: "Non-Immigrant · Arts", color: "#EC4899",
      description: "For internationally recognized athletes or members of an entertainment group.",
      criteria: ["Athlete: internationally recognized.", "Group: must have been together for at least 1 year.", "Specific competition or performance required."],
      processing: "2–4 months.",
      forms: ["I-129", "DS-160"],
    },
    "P-3": {
      code: "P-3", label: "Culturally Unique Artist", badge: "Non-Immigrant · Arts", color: "#EC4899",
      description: "For artists or entertainers coming to the U.S. to perform, teach, or coach under a program that is culturally unique.",
      criteria: ["Program must be culturally unique.", "Evidence of excellence and uniqueness required.", "Coming for the purpose of developing, interpreting, representing, coaching, or teaching."],
      processing: "2–4 months.",
      forms: ["I-129", "DS-160"],
    },
    "DV-1": {
      code: "DV-1", label: "Diversity Visa", badge: "Immigrant Lottery", color: T.success,
      description: "Annual lottery program for individuals from countries with historically low rates of immigration to the United States.",
      criteria: ["Must be a native of a qualifying country.", "Must have at least a high school education or 2 years of qualifying work experience.", "Must be selected in the annual lottery."],
      processing: "Annual cycle; selection usually in May.",
      forms: ["DS-5501 (electronic entry)", "DS-260 (if selected)"],
    },
    "H-2A": {
      code: "H-2A", label: "Temporary Agricultural Worker", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For agricultural work of a temporary or seasonal nature.",
      criteria: ["Must have a job offer from a U.S. employer for temporary agricultural work.", "Employer must obtain a temporary labor certification from the DOL.", "Must be from a designated eligible country."],
      processing: "1–3 months.",
      forms: ["I-129", "DS-160"],
    },
    "H-2B": {
      code: "H-2B", label: "Temporary Non-Agricultural Worker", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For non-agricultural work of a temporary or seasonal nature.",
      criteria: ["Must have a job offer for temporary non-agricultural work.", "Employer must prove there are no U.S. workers available.", "Subject to an annual cap (66,000 per year)."],
      processing: "1–3 months.",
      forms: ["I-129", "DS-160"],
    },
    "H-3": {
      code: "H-3", label: "Non-Immigrant Trainee", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For training in any field of endeavor, other than graduate medical education or training, that is not available in the home country.",
      criteria: ["Must be invited by an individual or organization for training.", "Training must not be available in your home country.", "Must not be engaged in productive employment unless incidental to training."],
      processing: "2–4 months.",
      forms: ["I-129", "DS-160"],
    },
    "H-4": {
      code: "H-4", label: "Dependent of H Visa Holder", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children under 21 of H-1B, H-2A, H-2B, or H-3 visa holders.",
      criteria: ["Must be the spouse or unmarried child (under 21) of a principal H visa holder.", "Principal must maintain valid H status."],
      processing: "Varies; usually processed with principal.",
      forms: ["I-539", "DS-160"],
    },
    "L-2": {
      code: "L-2", label: "Dependent of L-1 Holder", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children under 21 of L-1A or L-1B visa holders.",
      criteria: ["Spouse or unmarried child under 21 of an L-1 holder.", "Principal must maintain valid L-1 status.", "Spouses are authorized to work in the U.S. (incident to status)."],
      processing: "Varies; usually same as principal.",
      forms: ["I-539", "DS-160"],
    },
    "C-1": {
      code: "C-1", label: "Transit Visa", badge: "Non-Immigrant · Transit", color: "#475569",
      description: "For individuals in immediate and continuous transit through the United States en route to another country.",
      criteria: ["Must show immediate and continuous transit.", "Must have a ticket or other evidence of transportation to destination.", "Must have permission to enter your destination country."],
      processing: "Days to weeks.",
      forms: ["DS-160"],
    },
    "D": {
      code: "D", label: "Crewmember Visa", badge: "Non-Immigrant · Crew", color: "#475569",
      description: "For crewmembers serving onboard a sea vessel or aircraft in the United States.",
      criteria: ["Must be a crewmember on a vessel or aircraft.", "The vessel/aircraft must be in the U.S. temporarily.", "Must intend to depart on a vessel/aircraft within 29 days."],
      processing: "Days to weeks.",
      forms: ["DS-160"],
    },
    "C-1/D": {
      code: "C-1/D", label: "Transit/Crewmember Visa", badge: "Non-Immigrant · Crew", color: "#475569",
      description: "A combination visa for crewmembers transiting to join a vessel or aircraft.",
      criteria: ["Qualify as both a transit traveler and a crewmember."],
      processing: "Days to weeks.",
      forms: ["DS-160"],
    },
    "E-1": {
      code: "E-1", label: "Treaty Trader", badge: "Non-Immigrant · Trade", color: T.warning,
      description: "For nationals of a country with which the United States maintains a treaty of commerce and navigation who are coming to engage in substantial trade.",
      criteria: ["Must be a national of a treaty country.", "Engagement in substantial trade primarily between the U.S. and the treaty country."],
      processing: "2–4 months.",
      forms: ["DS-160", "DS-156E"],
    },
    "E-3": {
      code: "E-3", label: "Specialty Occupation (Australia)", badge: "Non-Immigrant · Work", color: "#0369a1",
      description: "For Australian nationals coming to the U.S. to perform services in a specialty occupation.",
      criteria: ["Must be an Australian citizen.", "Possess a bachelor's degree or higher in the specialty field.", "Have a legitimate offer of employment in the U.S."],
      processing: "1–2 months.",
      forms: ["LCA", "DS-160"],
    },
    "A-1": {
      code: "A-1", label: "Diplomat / Government Official", badge: "Official", color: "#1e293b",
      description: "For ambassadors, public ministers, career diplomatic or consular officers, and their immediate family members.",
      criteria: ["Must be traveling to the U.S. on behalf of your national government to engage solely in official activities."],
      processing: "Varies.",
      forms: ["DS-1648"],
    },
    "A-2": {
      code: "A-2", label: "Other Government Official", badge: "Official", color: "#1e293b",
      description: "For other accredited officials and employees of foreign governments and their immediate family members.",
      criteria: ["Must be traveling to the U.S. to engage in official government business."],
      processing: "Varies.",
      forms: ["DS-1648"],
    },
    "G-1": {
      code: "G-1", label: "Rep of International Org (Principal)", badge: "Official", color: "#1e293b",
      description: "Members of a permanent mission of a recognized government to an international organization.",
      criteria: ["Accredited representative of a government to an international organization (like the UN or World Bank)."],
      processing: "Varies.",
      forms: ["DS-1648"],
    },
    "G-2": {
      code: "G-2", label: "Other Rep of recognized government", badge: "Official", color: "#1e293b",
      description: "Representatives of a recognized government traveling to the U.S. temporarily to attend meetings of a designated international organization.",
      criteria: ["Official representative of a recognized government."],
      processing: "Varies.",
      forms: ["DS-1648"],
    },
    "G-4": {
      code: "G-4", label: "International Org Officer/Employee", badge: "Official", color: "#1e293b",
      description: "Individual who is heading to the U.S. to take up an appointment at a designated international organization (e.g., UN, IMF).",
      criteria: ["Must have an appointment from a designated international organization."],
      processing: "Varies.",
      forms: ["DS-1648"],
    },
    "O-2": {
      code: "O-2", label: "Essential Support for O-1", badge: "Non-Immigrant · Support", color: "#94a3b8",
      description: "For individuals who will accompany an O-1 artist or athlete to assist in a specific event or performance.",
      criteria: ["Must be an integral part of the O-1's actual performance.", "Must have critical skills and experience with the O-1 that are not of a general nature."],
      processing: "2–4 months.",
      forms: ["I-129", "DS-160"],
    },
    "O-3": {
      code: "O-3", label: "Dependent of O-1/O-2", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children of O-1 and O-2 visa holders.",
      criteria: ["Spouse or unmarried child under 21 of an O-1 or O-2 holder."],
      processing: "Varies.",
      forms: ["DS-160"],
    },
    "P-2": {
      code: "P-2", label: "Artist/Entertainer (Exchange Program)", badge: "Non-Immigrant · Arts", color: "#EC4899",
      description: "For artists or entertainers who will perform under a reciprocal exchange program between a U.S. organization and an organization in another country.",
      criteria: ["Must be coming to perform under a reciprocal exchange program.", "Possess skills comparable to those of the U.S. artists/entertainers taking part in the program outside the U.S."],
      processing: "2-4 months.",
      forms: ["I-129", "DS-160"],
    },
    "P-4": {
      code: "P-4", label: "Dependent of P-1, P-2, or P-3", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children of P-1, P-2, and P-3 visa holders.",
      criteria: ["Spouse or unmarried child under 21 of a P-1, P-2, or P-3 holder."],
      processing: "Varies.",
      forms: ["DS-160"],
    },
    "F-2": {
      code: "F-2", label: "Dependent of F-1 Student", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children of F-1 student visa holders.",
      criteria: ["Spouse or unmarried child under 21 of an F-1 holder.", "Principal must maintain full-time student status."],
      processing: "Varies.",
      forms: ["DS-160", "I-20 (Dependent)"],
    },
    "M-2": {
      code: "M-2", label: "Dependent of M-1 Student", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children of M-1 vocational student visa holders.",
      criteria: ["Spouse or unmarried child under 21 of an M-1 holder."],
      processing: "Varies.",
      forms: ["DS-160", "I-20 (Dependent)"],
    },
    "J-2": {
      code: "J-2", label: "Dependent of J-1 Exchange Visitor", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children of J-1 exchange visitor visa holders.",
      criteria: ["Spouse or unmarried child under 21 of a J-1 holder.", "J-2 holders may apply for work authorization (EAD)."],
      processing: "Varies.",
      forms: ["DS-160", "DS-2019 (Dependent)"],
    },
    "R-2": {
      code: "R-2", label: "Dependent of R-1 Holder", badge: "Non-Immigrant · Dependent", color: "#94a3b8",
      description: "For spouses and children of R-1 religious worker visa holders.",
      criteria: ["Spouse or unmarried child under 21 of an R-1 holder."],
      processing: "Varies.",
      forms: ["DS-160"],
    },
    "K-2": {
      code: "K-2", label: "Child of K-1 Fiance(e)", badge: "Non-Immigrant", color: "#7C3AED",
      description: "For the child of a K-1 fiancé(e) visa holder.",
      criteria: ["Unmarried child under 21 of a K-1 holder.", "Must be listed on the I-129F petition."],
      processing: "Processed with K-1.",
      forms: ["DS-160"],
    },
    "K-4": {
      code: "K-4", label: "Child of K-3 Spouse", badge: "Non-Immigrant", color: "#7C3AED",
      description: "For the child of a K-3 visa holder.",
      criteria: ["Unmarried child under 21 of a K-3 holder."],
      processing: "Processed with K-3.",
      forms: ["DS-160"],
    },
    "EB-4": {
      code: "EB-4", label: "Special Immigrants", badge: "Employment — 4th Preference", color: T.success,
      description: "A category for various special classes of immigrants including religious workers, special education teachers, and certain retirees.",
      criteria: ["Must meet the specific requirements of one of the many sub-groups (e.g., Religious worker).", "Most require Form I-360."],
      processing: "12–24 months.",
      forms: ["I-360", "DS-260 or I-485"],
    },
    "SI": {
      code: "SI", label: "SIV — Iraqi/Afghan Translators", badge: "Special Immigrant", color: T.success,
      description: "For certain Iraqi and Afghan nationals who worked as translators/interpreters for the U.S. Armed Forces.",
      criteria: ["Served as a translator/interpreter directly with the U.S. Armed Forces.", "Obtain a letter of recommendation from a General or Flag Officer."],
      processing: "Varies.",
      forms: ["I-360", "DS-260"],
    },
    "SQ": {
      code: "SQ", label: "SIV — Iraqi/Afghan Employees", badge: "Special Immigrant", color: T.success,
      description: "For certain Iraqi and Afghan nationals who were employed by or on behalf of the U.S. government.",
      criteria: ["Employed by or on behalf of the U.S. government for at least one year.", "Experienced an ongoing serious threat because of that employment."],
      processing: "Varies.",
      forms: ["I-360", "DS-260"],
    },
    "I-Visa": {
      code: "I", label: "Media / Journalist Visa", badge: "Non-Immigrant · Media", color: "#475569",
      description: "For representatives of foreign media (press, radio, film, or other information media) traveling to the U.S. to engage in their profession.",
      criteria: ["Must be a representative of a foreign media outlet.", "Engaged in qualifying information-dissemination activities.", "Must have credentials from the media organization."],
      processing: "Days to weeks.",
      forms: ["DS-160", "Employer support letter"],
    },
    "T-Visa": {
      code: "T", label: "Trafficking Victim Visa", badge: "Humanitarian", color: "#DC2626",
      description: "For victims of severe forms of human trafficking who are in the U.S. and assist law enforcement.",
      criteria: ["Victim of a severe form of human trafficking.", "Physically present in the U.S. on account of trafficking.", "Complied with reasonable requests for assistance from law enforcement.", "Would suffer extreme hardship involving unusual and severe harm if removed."],
      processing: "12-24 months.",
      forms: ["I-914"],
    },
    "M-Visa": {
      code: "M-1", label: "Vocational Student Visa", badge: "Non-Immigrant · Study", color: "#6366F1",
      description: "For students attending vocational or other non-academic programs (e.g., flight school, technical training).",
      criteria: ["Accepted by a SEVP-certified vocational institution.", "Obtain Form I-20.", "Sufficient funds for duration of study.", "Nonimmigrant intent."],
      processing: "Days to weeks.",
      forms: ["I-20", "DS-160", "SEVIS fee"],
    },
    "Q-Visa": {
      code: "Q-1", label: "Cultural Exchange Visitor", badge: "Non-Immigrant · Exchange", color: "#6366F1",
      description: "For participants in international cultural exchange programs that provide practical training and employment and the sharing of history, culture, and traditions.",
      criteria: ["Program must be designated by USCIS.", "Participant must be at least 18 years old.", "Must be able to communicate effectively about their home country's culture."],
      processing: "2-4 months.",
      forms: ["I-129", "DS-160"],
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
      { id:"specialty", question:"Does the U.S. job qualify as a specialty occupation — requiring at least a bachelor's degree in a specific field?", source:"USCIS — H-1B: Specialty Occupation Workers", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"H-1B is for specialty occupations requiring a bachelor's or higher.", options:[{label:"Yes",value:"YES"},{label:"No / General position",value:"NO"}] },
      { id:"degree", question:"Do you hold a bachelor's degree or higher in the specific field — or an equivalent combination of education and experience?", source:"USCIS — degree must be directly related to the specialty occupation", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"Must hold a qualifying degree or equivalent in the relevant field.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"employer", question:"Does a U.S. employer agree to sponsor you and file a Labor Condition Application (LCA)?", source:"USCIS — H-1B requires employer-filed LCA and I-129 (cannot be self-petitioned)", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations", passWith:["YES"], failMsg:"H-1B cannot be self-petitioned. An employer must sponsor you, file the LCA with the Department of Labor, and submit Form I-129.", options:[{label:"Yes, employer will sponsor",value:"YES"},{label:"No",value:"NO"}] },
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
    "E-2": [
      { id:"treaty_country", question:"Are you a national of an E-2 treaty country (e.g., Pakistan, UK, Germany)?", source:"USCIS — E-2 requires treaty nationality", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-2-treaty-investors", passWith:["YES"], failMsg:"E-2 is only for nationals of treaty countries.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"substantial", question:"Are you investing a 'substantial' amount of capital (typically $100k+)?", source:"USCIS — E-2 requires substantial investment", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-2-treaty-investors", passWith:["YES"], failMsg:"USCIS requires the investment to be substantial in relation to the business cost.", options:[{label:"Yes",value:"YES"},{label:"No / Low amount",value:"NO"}] },
      { id:"control", question:"Do you have at least 50% ownership or operational control of the enterprise?", source:"USCIS — must develop and direct the investment", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-2-treaty-investors", passWith:["YES"], failMsg:"Must have the power to develop and direct the enterprise.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "R-1": [
      { id:"member_2yr", question:"Have you been a member of the religious denomination for at least the last 2 years?", source:"USCIS — R-1 requires 2-year membership", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/r-1-nonimmigrant-religious-workers", passWith:["YES"], failMsg:"R-1 requires 2 years of prior membership.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"non_profit", question:"Is your U.S. employer a bona-fide non-profit religious organization?", source:"USCIS — employer must be a 501(c)(3) religious non-profit", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/r-1-nonimmigrant-religious-workers", passWith:["YES"], failMsg:"Employer must qualify as a religious non-profit.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "P-1": [
      { id:"int_recog", question:"Are you internationally recognized as outstanding in your sport or group?", source:"USCIS — P-1: internationally recognized", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/p-1a-internationally-recognized-athlete", passWith:["YES"], failMsg:"P-1 requires international recognition.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "DV-1": [
      { id:"education", question:"Do you have at least a high school education or 2 years of qualifying work experience?", source:"Dept of State — DV Lottery requirements", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-instructions.html", passWith:["YES"], failMsg:"Minimum education or work experience is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"passport", question:"Do you have a valid international passport?", source:"DV entry requirement", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-instructions.html", passWith:["YES"], failMsg:"A valid passport is required for entry.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "H-2A": [
      { id:"ag_offer", question:"Do you have a temporary or seasonal agricultural job offer in the U.S.?", source:"USCIS — H-2A requirement", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-2a-temporary-agricultural-workers", passWith:["YES"], failMsg:"H-2A requires a specific agricultural job offer.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"labor_cert", question:"Has your employer obtained a temporary labor certification from the Department of Labor?", source:"USCIS — H-2A labor certification", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-2a-temporary-agricultural-workers", passWith:["YES"], failMsg:"A valid labor certification is mandatory.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "H-2B": [
      { id:"non_ag_offer", question:"Do you have a temporary or seasonal non-agricultural job offer in the U.S.?", source:"USCIS — H-2B requirement", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-2b-temporary-non-agricultural-workers", passWith:["YES"], failMsg:"H-2B requires a specific non-agricultural job offer.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"labor_cert", question:"Has your employer obtained a temporary labor certification from the Department of Labor?", source:"USCIS — H-2B labor certification", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-2b-temporary-non-agricultural-workers", passWith:["YES"], failMsg:"A valid labor certification is mandatory.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "C-1": [
      { id:"transit_intent", question:"Are you in immediate and continuous transit through the U.S. to another country?", source:"travel.state.gov — C-1 transit", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/other-visas/transit.html", passWith:["YES"], failMsg:"C-1 requires immediate and continuous transit.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "D": [
      { id:"crew_status", question:"Are you a crewmember serving on a sea vessel or aircraft?", source:"travel.state.gov — D visa", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/other-visas/crewmember-visas.html", passWith:["YES"], failMsg:"D visa is for serving crewmembers only.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "E-1": [
      { id:"treaty_national", question:"Are you a national of a treaty country?", source:"USCIS — E-1 Treaty Trader", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-1-treaty-traders", passWith:["YES"], failMsg:"E-1 requires treaty country nationality.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
      { id:"trade_volume", question:"Will you engage in 'substantial trade' primarily between the U.S. and your country?", source:"USCIS — E-1 trade requirement", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-1-treaty-traders", passWith:["YES"], failMsg:"Substantial trade volume is required.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "E-3": [
      { id:"aus_citizen", question:"Are you a citizen of Australia?", source:"USCIS — E-3 for Australians", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-3-specialty-occupation-workers-from-australia", passWith:["YES"], failMsg:"E-3 is exclusively for Australian citizens.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "K-3": [
      { id:"i130_filed", question:"Has your U.S. citizen spouse already filed Form I-130 for you?", source:"USCIS — K-3 spouse requirement", sourceUrl:"https://www.uscis.gov/family/family-of-us-citizens/visas-for-spouses-of-us-citizens-k-3", passWith:["YES"], failMsg:"K-3 requires a pending I-130 petition.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "EB-4": [
      { id:"special_class", question:"Do you belong to a recognized special immigrant category (e.g., Religious Worker, Special Education Teacher)?", source:"USCIS — EB-4 categories", sourceUrl:"https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fourth-preference-eb-4", passWith:["YES"], failMsg:"Must meet specific criteria for a recognized special class.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "SQ": [
      { id:"threat", question:"Have you experienced an ongoing serious threat because of your employment by the U.S. government?", source:"Dept of State — SIV SQ", sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/immigrate/special-immg-visa-afghans-employed-us-gov.html", passWith:["YES"], failMsg:"SQ requires evidence of a serious threat.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "H-4": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal H-visa holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "L-2": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal L-1 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "F-2": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal F-1 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "M-2": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal M-1 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "J-2": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal J-1 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "O-3": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal O-1/O-2 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "P-4": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal P-1/P-2/P-3 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "R-2": [{ id:"dependent_rel", question:"Are you the spouse or unmarried child under 21 of the principal R-1 holder?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "IR-3": [
      { id:"adopted_abroad", question:"Was the adoption completed abroad and did both parents see the child?", source:"USCIS — IR-3 Orphan Adoption", sourceUrl:"https://www.uscis.gov/adoption/adoption-process/bringing-your-internationally-adopted-child-to-the-united-states", passWith:["YES"], failMsg:"IR-3 requires adoption completion abroad.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "IR-4": [
      { id:"adopt_in_us", question:"Is the child coming to the U.S. specifically to be adopted?", source:"USCIS — IR-4 process", sourceUrl:"https://www.uscis.gov/adoption/adoption-process/bringing-your-internationally-adopted-child-to-the-united-states", passWith:["YES"], failMsg:"IR-4 is for children who will be adopted in the U.S.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] },
    ],
    "K-2": [{ id:"dependent_rel", question:"Are you the unmarried child under 21 of a K-1 fiancé(e)?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
    "K-4": [{ id:"dependent_rel", question:"Are you the unmarried child under 21 of a K-3 spouse?", source:"USCIS", sourceUrl:"https://www.uscis.gov", passWith:["YES"], failMsg:"Required to be a qualifying dependent.", options:[{label:"Yes",value:"YES"},{label:"No",value:"NO"}] }],
  },
};