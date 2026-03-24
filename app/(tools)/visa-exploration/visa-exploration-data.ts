// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
export const T = {
  primary:      "#0D6E6E",
  primaryLight: "#E8F4F4",
  primaryDark:  "#095555",
  text:         "#1a2332",
  textMuted:    "#6b7280",
  textLight:    "#9ca3af",
  border:       "#e5e7eb",
  bg:           "#f8fafa",
  white:        "#ffffff",
  success:      "#059669",
  successLight: "#ecfdf5",
  warning:      "#d97706",
  warningLight: "#fffbeb",
};

// ─────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────
export interface VisaInfo {
  code: string;
  label: string;
  badge: string;
  color: string;
  description: string;
  criteria: string[];
  processing: string;
  forms: string[];
}

export type VisaDataMap = Record<string, VisaInfo>;

export interface GateQuestion {
  id: string;
  question: string;
  source: string;
  sourceUrl: string;
  passWith: string[];
  failMsg: string;
  options: { label: string; value: string }[];
}

export type GateQuestionsMap = Record<string, GateQuestion[]>;

export interface VisaExplorationAnswers {
  origin?: string;
  destination?: string;
  purpose?: string;
  sponsor?: string;
  relationship?: string;
  beneficiaryAge?: string;
  petitionerAge?: string;
  workBase?: string;
  tempType?: string;
  gateAnswers?: Record<string, Record<string, string>>;
  [key: string]: any;
}

export interface Step {
  id: string;
  type: "country" | "options" | "grid" | "unsupported" | "gate_question" | "info";
  field?: string;
  title?: string;
  subtitle?: string;
  canProceed: boolean;
  isUnsupported?: boolean;
  isDestination?: boolean;
  options?: { label: string; value: string; sub?: string; disabled?: boolean; emoji?: string }[];
  visaCode?: string;
  visaLabel?: string;
  visaColor?: string;
  questionId?: string;
  passWith?: string[];
  failMsg?: string;
  sourceUrl?: string;
  hint?: string;
}

// ─────────────────────────────────────────────────────────────
// SUPPORTED DESTINATIONS
// ─────────────────────────────────────────────────────────────
export const SUPPORTED_DESTINATIONS = ["United States"];

// ─────────────────────────────────────────────────────────────
// COUNTRIES
// ─────────────────────────────────────────────────────────────
export const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba",
  "Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Mozambique","Myanmar","Namibia","Nauru","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama",
  "Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
  "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen",
  "Zambia","Zimbabwe",
];

// ─────────────────────────────────────────────────────────────
// US VISA DEFINITIONS  (source: USCIS.gov / travel.state.gov)
// ─────────────────────────────────────────────────────────────
export const US_VISAS: VisaDataMap = {
  "IR-1": {
    code:"IR-1", label:"Spouse of U.S. Citizen", badge:"Immediate Relative", color:T.primary,
    description:"Permanent immigrant visa for the foreign spouse of a U.S. citizen who have been married 2 or more years.",
    criteria:["Petitioner must be a U.S. citizen.","Must be legally married — bona fide marriage (not entered into for immigration purposes).","Married 2 or more years at time of U.S. admission.","Petitioner files Form I-130 and must meet income requirements (≥125% Federal Poverty Level)."],
    processing:"Approximately 12–18 months. No annual quota — immediate relative category.",
    forms:["I-130","DS-260","I-864"],
  },
  "CR-1": {
    code:"CR-1", label:"Conditional Spouse of U.S. Citizen", badge:"Immediate Relative", color:T.primary,
    description:"Same as IR-1 but for couples married less than 2 years. Green card is conditional for 2 years.",
    criteria:["Petitioner must be a U.S. citizen.","Legally married — bona fide marriage required.","Married less than 2 years at time of admission.","Must file Form I-751 jointly before the conditional card expires."],
    processing:"Approximately 12–18 months. No annual quota.",
    forms:["I-130","DS-260","I-864","I-751 (later)"],
  },
  "K-1": {
    code:"K-1", label:"Fiancé(e) Visa", badge:"Non-Immigrant → Immigrant", color:"#7C3AED",
    description:"Allows the foreign fiancé(e) of a U.S. citizen to enter the U.S. and marry within 90 days.",
    criteria:["Petitioner must be a U.S. citizen — not available to LPRs.","Both parties must be legally free to marry.","Must intend to marry within 90 days of U.S. entry.","Must have met in person at least once within 2 years before filing (waiver possible).","Petitioner must meet income requirements."],
    processing:"Approximately 6–12 months for K-1; Adjustment of Status after marriage takes 8–12 months more.",
    forms:["I-129F","DS-160","I-485 (after marriage)"],
  },
  "IR-2": {
    code:"IR-2", label:"Child of U.S. Citizen", badge:"Immediate Relative", color:T.primary,
    description:"Immigrant visa for an unmarried child under 21 of a U.S. citizen.",
    criteria:["Child must be unmarried and under 21 years old.","Must be a biological, step-, or adopted child of a U.S. citizen.","For stepchildren: qualifying marriage must have occurred before the child turned 18.","For adopted children: adoption must have occurred before age 16."],
    processing:"Approximately 6–14 months. No annual quota.",
    forms:["I-130","DS-260"],
  },
  "IR-5": {
    code:"IR-5", label:"Parent of U.S. Citizen", badge:"Immediate Relative", color:T.primary,
    description:"Immigrant visa for the parent of a U.S. citizen who is at least 21 years old.",
    criteria:["The U.S. citizen petitioner must be at least 21 years old.","Must prove biological or legal parent-child relationship.","For step-parents: the qualifying marriage must have occurred before the child turned 18."],
    processing:"Approximately 6–14 months.",
    forms:["I-130","DS-260","I-864"],
  },
  "F1": {
    code:"F1", label:"Unmarried Adult Child of U.S. Citizen", badge:"Family Preference — 1st", color:"#0369a1",
    description:"For unmarried sons and daughters aged 21 or older of U.S. citizens. Subject to annual caps.",
    criteria:["Petitioner must be a U.S. citizen.","Beneficiary must be unmarried and 21 or older.","Subject to annual numerical limits — wait times vary by nationality."],
    processing:"6–10+ years depending on nationality.",
    forms:["I-130","DS-260","I-864"],
  },
  "F2A": {
    code:"F2A", label:"Spouse / Child of Permanent Resident", badge:"Family Preference — 2A", color:"#0369a1",
    description:"For spouses and unmarried children under 21 of Lawful Permanent Residents.",
    criteria:["Petitioner must be a Lawful Permanent Resident (Green Card holder).","Beneficiary must be the spouse or unmarried child under 21.","Subject to annual numerical limits."],
    processing:"Approximately 2–4 years.",
    forms:["I-130","DS-260","I-864"],
  },
  "F2B": {
    code:"F2B", label:"Unmarried Adult Child of Permanent Resident", badge:"Family Preference — 2B", color:"#0369a1",
    description:"For unmarried sons and daughters aged 21 or older of Lawful Permanent Residents.",
    criteria:["Petitioner must be a Lawful Permanent Resident.","Beneficiary must be unmarried and 21 or older.","Subject to annual numerical limits."],
    processing:"5–10+ years.",
    forms:["I-130","DS-260","I-864"],
  },
  "F3": {
    code:"F3", label:"Married Child of U.S. Citizen", badge:"Family Preference — 3rd", color:"#0369a1",
    description:"For married sons and daughters of U.S. citizens, regardless of age.",
    criteria:["Petitioner must be a U.S. citizen.","Beneficiary must be a married son or daughter (any age).","Subject to annual limits — waits of 10+ years are common."],
    processing:"10–15+ years.",
    forms:["I-130","DS-260","I-864"],
  },
  "F4": {
    code:"F4", label:"Sibling of U.S. Citizen", badge:"Family Preference — 4th", color:"#0369a1",
    description:"For brothers and sisters of U.S. citizens. The petitioner must be at least 21.",
    criteria:["Petitioner must be a U.S. citizen and at least 21 years old.","Must share at least one biological or adoptive parent.","Includes half-siblings and step-siblings (relationship before age 18).","Subject to annual caps — longest waits in the preference system."],
    processing:"15–25+ years for high-demand nationalities.",
    forms:["I-130","DS-260","I-864"],
  },
  "EB-1A": {
    code:"EB-1A", label:"Extraordinary Ability", badge:"Employment — 1st Preference", color:T.success,
    description:"For individuals with extraordinary ability in sciences, arts, education, business, or athletics. Self-petition allowed.",
    criteria:["One major international award OR at least 3 of 10 USCIS criteria.","Evidence of sustained national or international acclaim.","No employer or PERM labor certification required — self-petition is allowed."],
    processing:"6–12 months. Premium processing available.",
    forms:["I-140 (self-petition)","DS-260 or I-485"],
  },
  "EB-1B": {
    code:"EB-1B", label:"Outstanding Professor / Researcher", badge:"Employment — 1st Preference", color:T.success,
    description:"For internationally recognized professors and researchers in a specific academic field.",
    criteria:["International recognition as outstanding in the specific academic field.","At least 3 years of teaching or research experience.","Permanent job offer from a qualifying U.S. university, research institution, or employer."],
    processing:"6–12 months.",
    forms:["I-140","DS-260 or I-485"],
  },
  "EB-1C": {
    code:"EB-1C", label:"Multinational Manager / Executive", badge:"Employment — 1st Preference", color:T.success,
    description:"For executives and managers transferring to a U.S. branch, subsidiary, or affiliate.",
    criteria:["Employed outside the U.S. by the same company for at least 1 continuous year in the last 3 years.","Must come to work in a managerial or executive capacity in the U.S.","Qualifying corporate relationship must exist between the U.S. and foreign entity."],
    processing:"6–12 months. Premium processing available.",
    forms:["I-140","DS-260 or I-485"],
  },
  "EB-2-NIW": {
    code:"EB-2 NIW", label:"National Interest Waiver", badge:"Employment — 2nd Preference", color:T.success,
    description:"Advanced degree professional or exceptional ability — national interest waiver allows self-petition with no employer needed.",
    criteria:["Advanced degree (master's or higher), or bachelor's + 5 years progressive experience, or exceptional ability.","Must satisfy 3-part test: substantial merit, well-positioned to advance the endeavor, and beneficial to waive job offer/PERM.","No employer or PERM labor certification required."],
    processing:"12–24+ months. Longer backlogs for India and China-born applicants.",
    forms:["I-140 (self-petition)","DS-260 or I-485"],
  },
  "EB-2": {
    code:"EB-2", label:"Advanced Degree Professional", badge:"Employment — 2nd Preference", color:T.success,
    description:"For professionals with advanced degrees or exceptional ability. Requires a job offer and PERM labor certification.",
    criteria:["Master's degree or higher, or bachelor's + 5 years progressive experience, or exceptional ability.","Requires a permanent full-time job offer from a U.S. employer.","Employer must obtain PERM labor certification from the Department of Labor."],
    processing:"2–5+ years.",
    forms:["PERM (employer)","I-140","DS-260 or I-485"],
  },
  "EB-3": {
    code:"EB-3", label:"Skilled Worker / Professional", badge:"Employment — 3rd Preference", color:T.success,
    description:"For skilled workers, professionals with a bachelor's degree, or unskilled workers.",
    criteria:["Requires a permanent full-time job offer and PERM labor certification.","Skilled Workers: position requires at least 2 years of training or experience.","Professionals: must hold a U.S. bachelor's degree or equivalent."],
    processing:"3–7+ years.",
    forms:["PERM (employer)","I-140","DS-260 or I-485"],
  },
  "EB-5": {
    code:"EB-5", label:"Immigrant Investor", badge:"Investment", color:T.warning,
    description:"For investors who invest capital in a U.S. commercial enterprise that creates jobs for U.S. workers.",
    criteria:["Standard investment: $1,050,000 in a new commercial enterprise.","TEA: $800,000 in a rural or high-unemployment area.","Must create or preserve at least 10 permanent full-time jobs for U.S. workers.","Investment must be 'at risk' — no guaranteed return."],
    processing:"24–48+ months.",
    forms:["I-526E","DS-260 or I-485"],
  },
  "B1/B2": {
    code:"B-1/B-2", label:"Visitor — Business / Tourism", badge:"Non-Immigrant · Visit", color:"#6366F1",
    description:"Temporary visits for business meetings (B-1) or tourism, vacation, family visits, or medical treatment (B-2).",
    criteria:["Visit must be temporary with a specific, limited purpose.","Must have sufficient funds to cover expenses in the U.S.","Must have a residence abroad and strong ties ensuring return.","Must not intend to work or study in the U.S."],
    processing:"Days to a few weeks depending on the embassy.",
    forms:["DS-160"],
  },
  "F-1": {
    code:"F-1", label:"Academic Student Visa", badge:"Non-Immigrant · Study", color:"#6366F1",
    description:"For full-time academic study at a SEVP-certified U.S. college, university, or academic institution.",
    criteria:["Must be accepted by a SEVP-certified institution and obtain Form I-20.","Must be enrolled as a full-time student.","Sufficient funds to support yourself throughout study.","Must maintain a residence abroad."],
    processing:"Days to a few weeks. Apply at least 120 days before program start.",
    forms:["I-20 (from school)","DS-160","SEVIS fee"],
  },
  "J-1": {
    code:"J-1", label:"Exchange Visitor", badge:"Non-Immigrant · Exchange", color:"#6366F1",
    description:"For participants in approved exchange visitor programs: students, researchers, professors, au pairs, and more.",
    criteria:["Must be accepted into a DOS-designated exchange visitor program and obtain Form DS-2019.","Sufficient English proficiency and financial support for the program duration.","Required health insurance coverage.","Some J-1 holders subject to 2-year home residency requirement after the program."],
    processing:"Days to a few weeks at the embassy.",
    forms:["DS-2019 (from sponsor)","DS-160","SEVIS fee"],
  },
  "H-1B": {
    code:"H-1B", label:"Specialty Occupation Worker", badge:"Non-Immigrant · Work", color:"#0369a1",
    description:"For professionals in specialty occupations (IT, engineering, finance, medicine, etc.) requiring at least a bachelor's degree.",
    criteria:["Position must qualify as a specialty occupation requiring specialized knowledge and a bachelor's degree.","Applicant must hold the qualifying degree or equivalent.","U.S. employer must file a Labor Condition Application (LCA) with the Department of Labor.","Subject to annual cap of 65,000 (+20,000 for U.S. master's holders) — selection by lottery."],
    processing:"6–8 months after lottery selection. Premium processing available.",
    forms:["LCA","I-129","DS-160"],
  },
  "L-1": {
    code:"L-1", label:"Intracompany Transferee", badge:"Non-Immigrant · Work", color:"#0369a1",
    description:"For employees transferring to a U.S. branch, subsidiary, or affiliate. L-1A for managers/executives; L-1B for specialized knowledge workers.",
    criteria:["Employed by the same company outside the U.S. for 1 continuous year within the last 3 years.","L-1A: transferring in a managerial or executive capacity.","L-1B: transferring in a specialized knowledge capacity.","Qualifying corporate relationship must exist between U.S. and foreign entity."],
    processing:"1–4 months. Premium processing available.",
    forms:["I-129","DS-160"],
  },
  "O-1": {
    code:"O-1", label:"Extraordinary Ability / Achievement", badge:"Non-Immigrant · Work", color:"#0369a1",
    description:"For individuals with extraordinary ability in science, education, business, or athletics (O-1A), or arts/entertainment (O-1B).",
    criteria:["O-1A: one major international award OR at least 3 of 8 USCIS criteria.","O-1B: distinguished by a degree of skill substantially above the ordinary.","Must have a specific job offer — employer or agent must file on your behalf."],
    processing:"2–4 months. Premium processing available.",
    forms:["I-129","DS-160"],
  },
  "TN": {
    code:"TN", label:"TN Visa — USMCA Professional", badge:"Non-Immigrant · Work", color:"#0369a1",
    description:"For Canadian and Mexican citizens working in qualifying professional occupations under USMCA.",
    criteria:["Must be a citizen of Canada or Mexico.","Must work in a USMCA-listed professional occupation.","Must have a U.S. employer with a specific job offer."],
    processing:"Immediate for Canadian citizens at port of entry. 1–3 months for Mexican citizens.",
    forms:["Employer letter","DS-160 (Mexican citizens)"],
  },
  "Asylum": {
    code:"Asylum", label:"Asylum", badge:"Humanitarian", color:"#DC2626",
    description:"Protection for individuals who have suffered or fear persecution based on race, religion, nationality, political opinion, or membership in a particular social group.",
    criteria:["Must be physically present in the U.S. or at a port of entry.","Past persecution or a well-founded fear of future persecution.","Based on one of five protected grounds.","Must apply within 1 year of last U.S. arrival (certain exceptions apply)."],
    processing:"Affirmative asylum: 6 months to several years. Defensive: tied to immigration court.",
    forms:["I-589"],
  },
  "U-Visa": {
    code:"U Visa", label:"Crime Victim Visa", badge:"Humanitarian", color:"#DC2626",
    description:"For victims of qualifying crimes who suffered substantial abuse and cooperated with law enforcement.",
    criteria:["Victim of a qualifying crime (domestic violence, assault, trafficking, robbery, etc.).","Suffered substantial physical or mental abuse.","Helpful to law enforcement in the investigation or prosecution.","Must obtain a law enforcement certification (Form I-918B)."],
    processing:"4–7+ years due to annual cap of 10,000.",
    forms:["I-918","I-918B (law enforcement cert)"],
  },
};