/**
 * visa-engine/data/uk.ts
 * Last verified: March 2026
 * Sources: gov.uk/skilled-worker-visa, gov.uk/graduate-visa, gov.uk/health-care-worker-visa,
 *   gov.uk/uk-family-visa, gov.uk/student-visa, gov.uk/seasonal-worker-visa,
 *   gov.uk/global-talent, gov.uk/standard-visitor, nhsemployers.org, dawn.com
 */
import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];
  if (a.purpose === "FAMILY") {
    if (a.sponsorStatus === "BRITISH" || a.sponsorStatus === "SETTLED") {
      if (a.relationship === "SPOUSE") c.push("UK-FAMILY-SPOUSE");
      if (a.relationship === "FIANCE") c.push("UK-FAMILY-FIANCE");
    }
  }
  if (a.purpose === "WORK") {
    if (a.workType === "SKILLED")       c.push("UK-SKILLED-WORKER");
    if (a.workType === "HEALTH")        c.push("UK-HEALTH-CARE");
    if (a.workType === "GRADUATE")      c.push("UK-GRADUATE");
    if (a.workType === "SEASONAL")      c.push("UK-SEASONAL");
    if (a.workType === "GLOBAL_TALENT") c.push("UK-GLOBAL-TALENT");
    if (a.workType === "INNOVATOR")     c.push("UK-INNOVATOR-FOUNDER");
    if (a.workType === "HPI")           c.push("UK-HPI");
  }
  if (a.purpose === "STUDY") c.push("UK-STUDENT");
  if (a.purpose === "VISIT") c.push("UK-VISIT");
  if (a.purpose === "BUSINESS_INVEST") c.push("UK-INNOVATOR-FOUNDER");
  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];
  if (a.purpose === "FAMILY") {
    steps.push({
      id: "sponsorStatus", type: "options", field: "sponsorStatus",
      title: "What is your sponsor's status in the UK?",
      options: [
        { label: "British Citizen", value: "BRITISH" },
        { label: "Settled (Indefinite Leave to Remain)", value: "SETTLED" },
        { label: "On a work or student visa", value: "TEMP" },
      ],
      canProceed: !!a.sponsorStatus,
    });
    if (a.sponsorStatus && ["BRITISH", "SETTLED"].includes(a.sponsorStatus as string)) {
      steps.push({
        id: "relationship", type: "options", field: "relationship",
        title: "Your relationship to the sponsor?",
        options: [
          { label: "Spouse or partner", value: "SPOUSE" },
          { label: "Fiancé(e) or proposed civil partner", value: "FIANCE" },
          { label: "Child", value: "CHILD" },
        ],
        canProceed: !!a.relationship,
      });
    }
  }
  if (a.purpose === "WORK") {
    steps.push({
      id: "workType", type: "options", field: "workType",
      title: "What kind of work will you do?",
      options: [
        { label: "Skilled Worker", value: "SKILLED", sub: "Degree-level professional jobs with a licensed sponsor" },
        { label: "Health and Care Worker", value: "HEALTH", sub: "Doctors, nurses, and allied health professionals" },
        { label: "Graduate Visa", value: "GRADUATE", sub: "If you just finished a UK degree — no job offer needed" },
        { label: "Seasonal Worker", value: "SEASONAL", sub: "Agriculture and horticulture — up to 6 months" },
        { label: "Global Talent", value: "GLOBAL_TALENT", sub: "Exceptional leaders in tech, science, arts or academia" },
        { label: "High Potential Individual (HPI)", value: "HPI", sub: "For graduates of top 50 global universities" },
        { label: "Innovator Founder", value: "INNOVATOR", sub: "Start an innovative business in the UK" },
      ],
      canProceed: !!a.workType,
    });
  }
  return steps;
}

export const UK_DATA: CountryData = {
  country: "United Kingdom",
  code: "UK",
  flag: "🇬🇧",
  officialSources: [
    { label: "GOV.UK — Visas & Immigration", url: "https://www.gov.uk/browse/visas-immigration" },
  ],
  purposes: [
    { label: "Family / Join a partner", value: "FAMILY", sub: "Join your spouse or family member who is already in the UK" },
    { label: "Work in the UK", value: "WORK", sub: "Skilled Worker, Health & Care, Graduate, or Global Talent / HPI" },
    { label: "Study", value: "STUDY", sub: "Short-term or long-term academic courses at a licensed UK institution" },
    { label: "Visit / Tourism", value: "VISIT", sub: "Vacation, business meetings, or short medical treatment" },
    { label: "Business & Innovation", value: "BUSINESS_INVEST", sub: "Innovator Founder visa for entrepreneurs" },
  ],
  getCandidateCodes,
  buildFollowUpSteps,
  visas: {
    "UK-FAMILY-SPOUSE": {
      code: "Family (Spouse)", label: "Family Visa — Spouse / Partner", badge: "Settlement", color: T.primary,
      description: "For spouses or partners of British citizens or people with settled status (ILR).",
      criteria: [
        "Partner is a British citizen or has Indefinite Leave to Remain (ILR).",
        "Proof of genuine, subsisting relationship.",
        "Sponsor must meet the minimum income requirement of £29,000 per year (gross). [Verified March 2026 — MAC review June 2025 left threshold unchanged]",
        "English language requirement (A1 level minimum).",
        "Adequate accommodation in the UK.",
      ],
      processing: "8 to 24 weeks.",
      forms: ["Apply Online — GOV.UK"],
    },
    "UK-FAMILY-FIANCE": {
      code: "Family (Fiancé)", label: "Fiancé(e) Visa — UK", badge: "Settlement", color: T.primary,
      description: "Allows a fiancé(e) or proposed civil partner of a British citizen or settled person to enter the UK to get married.",
      criteria: [
        "Partner is a British citizen or has Indefinite Leave to Remain (ILR).",
        "Genuine intention to marry within 6 months of arrival.",
        "Sponsor must meet the £29,000 income threshold.",
        "English language requirement (A1 level).",
        "Must apply for spouse visa after marriage to remain in the UK.",
      ],
      processing: "8 to 24 weeks.",
      forms: ["Apply Online — GOV.UK"],
    },
    "UK-SKILLED-WORKER": {
      code: "Skilled Worker", label: "Skilled Worker Visa", badge: "Work", color: T.success,
      description: "Primary route for non-UK nationals to work in a qualifying degree-level profession with a licensed sponsor.",
      criteria: [
        "Job offer from a UK Home Office licensed sponsor with a Certificate of Sponsorship (CoS).",
        "Minimum salary of £41,700/year or the going rate for the occupation, whichever is higher. [Updated July 2025]",
        "Lower thresholds available: new entrants/ISL roles (£33,400), relevant PhD (£37,500), STEM PhD (£33,400).",
        "Role must be at RQF Level 6 (degree-level) from 22 July 2025 — lower-skilled roles are no longer eligible.",
        "English proficiency at B1 level.",
      ],
      processing: "3 weeks (outside UK).",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-HEALTH-CARE": {
      code: "Health & Care Worker", label: "Health and Care Worker Visa", badge: "Work", color: T.success,
      description: "Specialist route for doctors, nurses, and allied health professionals. Lower fees and no Immigration Health Surcharge.",
      criteria: [
        "Job offer from a licensed NHS, NHS supplier, or CQC-registered care provider with a CoS.",
        "Minimum salary of £25,000/year or the occupation going rate, whichever is higher.",
        "Professional registration with relevant UK regulatory body (NMC for nurses, GMC for doctors, HCPC, etc.).",
        "English proficiency at B1 level.",
        "Note: Care worker (SOC 6135) and senior care worker (SOC 6136) roles closed to new overseas applicants from 22 July 2025.",
      ],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-GRADUATE": {
      code: "Graduate Visa", label: "Graduate Visa (Post-Study Work)", badge: "Work", color: "#6366F1",
      description: "Allows international students who completed a UK degree to live and work freely in the UK. No job offer required.",
      criteria: [
        "Completed an eligible degree (Bachelor's, Master's, or PhD) at a UK higher education provider.",
        "Held a valid Student visa during studies and must apply from inside the UK.",
        "Stay permitted: at least 18 months for Bachelor's/Master's; 3 years for PhD graduates.",
        "No job offer or minimum salary required — any type of work is allowed.",
        "Note: UK Immigration White Paper (May 2025) proposed abolishing this route in future. Check gov.uk for latest status before applying.",
      ],
      processing: "8 weeks (inside UK).",
      forms: ["Online Application — GOV.UK"],
    },
    "UK-SEASONAL": {
      code: "Seasonal Worker", label: "Seasonal Worker Visa", badge: "Temporary Work", color: "#F59E0B",
      description: "Allows workers in agriculture and horticulture to come to the UK for up to 6 months. No prior job offer letter needed — apply through an approved operator.",
      criteria: [
        "Must apply through a UK government-approved seasonal work operator (e.g. Concordia, Fruitful Jobs, Pro-Force).",
        "Work limited to agriculture, horticulture, or poultry dressing.",
        "Maximum stay: 6 months. Must leave UK at end of permission.",
        "No English language test required.",
        "Available to Pakistani nationals.",
      ],
      processing: "3 weeks.",
      forms: ["Apply through approved operator", "Online Application — GOV.UK"],
    },
    "UK-GLOBAL-TALENT": {
      code: "Global Talent", label: "Global Talent Visa", badge: "No Sponsor Needed", color: "#6366F1",
      description: "For leaders and emerging leaders in science, digital technology, arts, or academia. No job offer required.",
      criteria: [
        "Must be endorsed by an approved UK endorsing body (Tech Nation/UKRI for tech, British Academy for humanities, Royal Academy of Engineering, etc.).",
        "Either a recognised leader ('Exceptional Talent') or a promising emerging leader ('Exceptional Promise').",
        "No job offer required — can work for multiple employers or be self-employed.",
        "Fast route to settlement: 3 years for Exceptional Talent, 5 years for Exceptional Promise.",
      ],
      processing: "8 weeks.",
      forms: ["Endorsement application (via endorsing body)", "Online Visa Application — GOV.UK"],
    },
    "UK-STUDENT": {
      code: "Student Visa", label: "Student Visa — UK", badge: "Study", color: "#6366F1",
      description: "For people aged 16 or over who want to study a course at a licensed UK institution.",
      criteria: [
        "Unconditional offer (CAS) from a licensed UK student sponsor.",
        "Proof of financial support (tuition fees + living costs).",
        "English language proficiency (as required by your institution).",
        "TB (tuberculosis) test certificate — mandatory for Pakistani applicants who lived in Pakistan in the last 6 months. Test from a UKVI-approved clinic only.",
        "Pakistan note (2025–26): Visa refusal rates from Pakistan ~18%. Choose accredited universities carefully — some have paused Pakistani admissions. Strong financial evidence and clear academic intent are critical.",
      ],
      processing: "3 weeks (outside UK).",
      forms: ["Apply Online — GOV.UK", "CAS from institution", "TB Test — UKVI approved clinic (IOM Pakistan)"],
    },
    "UK-VISIT": {
      code: "Standard Visitor", label: "Standard Visitor Visa", badge: "Visit", color: "#6366F1",
      description: "For tourism, business, short study (up to 6 months), and other permitted activities in the UK.",
      criteria: [
        "Genuine intention to leave the UK at the end of visit.",
        "Ability to financially support yourself during the trip.",
        "No intention to work or settle permanently.",
        "Pakistan update (2026): UK visit visas for Pakistanis are now e-visas — digital record, no physical sticker. Keep your passport after biometrics. Generate a share code to prove your status at the border.",
      ],
      processing: "3 weeks.",
      forms: ["Online Application — GOV.UK", "Biometrics at VFS Global (Pakistan)"],
    },
    "UK-INNOVATOR-FOUNDER": {
      code: "Innovator Founder", label: "Innovator Founder Visa", badge: "Business", color: T.success,
      description: "For individuals who want to set up an innovative business in the UK. The business must be endorsed by an approved body and be 'new, innovative, and scalable'.",
      criteria: [
        "Endorsement letter from an approved body (e.g. Envestors, Innovator International).",
        "Business must be a new idea (no trading yet), innovative, and have potential for growth/scaling.",
        "No set minimum investment funds (abolished in 2023), but you must have enough to run the business.",
        "English B2 level mandatory.",
      ],
      processing: "3 weeks.",
      forms: ["Endorsement Application", "Online Visa Application — GOV.UK"],
    },
    "UK-HPI": {
      code: "HPI Visa", label: "High Potential Individual", badge: "No Job Needed", color: T.success,
      description: "For recent graduates of top-ranked global universities who want to work in the UK. No job offer required.",
      criteria: [
        "Must have graduated from an eligible university (top 50 on at least two global rankings lists) in the last 5 years.",
        "Qualification must be at least a bachelor's degree.",
        "English B1 level mandatory (unless already held a UK visa with English requirement).",
        "Maintenance funds of £1,270 for at least 28 days.",
      ],
      processing: "3 weeks.",
      forms: ["Ecctis verification (qualification check)", "Online Visa Application — GOV.UK"],
    },
  },
  gateQuestions: {
    "UK-FAMILY-SPOUSE": [
      {
        id: "income",
        question: "Does your sponsor's gross annual income meet the £29,000 minimum requirement?",
        source: "UK Gov — Family visa financial requirement (verified March 2026)",
        sourceUrl: "https://www.gov.uk/uk-family-visa/proof-income-partner",
        passWith: ["YES"],
        failMsg: "The UK-based sponsor must earn at least £29,000 gross/year. Cash savings can top up shortfalls (minimum £88,500 savings required to rely on savings alone).",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
      {
        id: "english",
        question: "Can you prove your English language knowledge (at least A1 level)?",
        source: "UK Gov — English language requirement for family visa",
        sourceUrl: "https://www.gov.uk/uk-family-visa/knowledge-of-english",
        passWith: ["YES"],
        failMsg: "An approved English language test, or a degree taught in English, is required.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "UK-FAMILY-FIANCE": [
      {
        id: "income",
        question: "Does your sponsor's gross annual income meet the £29,000 minimum requirement?",
        source: "UK Gov — Family visa financial requirement",
        sourceUrl: "https://www.gov.uk/uk-family-visa/proof-income-partner",
        passWith: ["YES"],
        failMsg: "The UK-based sponsor must earn at least £29,000 gross per year.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "UK-SKILLED-WORKER": [
      {
        id: "cos",
        question: "Do you have a Certificate of Sponsorship (CoS) from a licensed UK employer?",
        source: "UK Gov — Skilled Worker visa requirements",
        sourceUrl: "https://www.gov.uk/skilled-worker-visa",
        passWith: ["YES"],
        failMsg: "A job offer and Certificate of Sponsorship (CoS) from a Home Office licensed employer are mandatory.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
      {
        id: "salary",
        question: "Does your salary meet the Skilled Worker threshold (22 July 2025 rules)?",
        source: "UK Gov — Skilled Worker salary thresholds (July 2025)",
        sourceUrl: "https://www.gov.uk/skilled-worker-visa/your-job",
        passWith: ["YES", "NEW_ENTRANT", "TRANSITIONAL"],
        failMsg: "New applicants need £41,700 (or going rate). New entrants/ISL/PhD roles: £33,400–£37,500. Extending existing pre-July-2025 RQF 3–5 visa: £31,300.",
        options: [
          { label: "Yes — general application, salary ≥ £41,700 (or going rate)", value: "YES" },
          { label: "Yes — new entrant / PhD / ISL role, salary ≥ £33,400–£37,500", value: "NEW_ENTRANT" },
          { label: "Yes — extending a pre-July-2025 visa at lower rate (£31,300)", value: "TRANSITIONAL" },
          { label: "No", value: "NO" },
        ],
      },
    ],
    "UK-HEALTH-CARE": [
      {
        id: "cos",
        question: "Do you have a Certificate of Sponsorship (CoS) from a licensed NHS or CQC-registered care provider?",
        source: "UK Gov — Health and Care Worker visa",
        sourceUrl: "https://www.gov.uk/health-care-worker-visa",
        passWith: ["YES"],
        failMsg: "A CoS from a licensed NHS, NHS supplier, or CQC-registered adult social care provider is required.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
      {
        id: "registration",
        question: "Are you registered (or eligible to register) with the relevant UK regulatory body (NMC, GMC, HCPC, etc.)?",
        source: "NHS Employers — Health and Care Worker Visa",
        sourceUrl: "https://www.nhsemployers.org/articles/skilled-worker-health-and-care-visa",
        passWith: ["YES"],
        failMsg: "Professional registration with a UK regulatory body (NMC for nurses, GMC for doctors, HCPC for allied health) is required.",
        options: [{ label: "Yes", value: "YES" }, { label: "No / In process", value: "NO" }],
      },
    ],
    "UK-SEASONAL": [
      {
        id: "operator",
        question: "Have you registered with or been accepted by a UK government-approved seasonal work operator?",
        source: "UK Gov — Seasonal Worker visa",
        sourceUrl: "https://www.gov.uk/seasonal-worker-visa",
        passWith: ["YES"],
        failMsg: "You must be placed by an approved operator (e.g. Concordia, Fruitful Jobs, Pro-Force). You cannot apply independently without an operator.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "UK-GLOBAL-TALENT": [
      {
        id: "endorsement",
        question: "Have you received (or are applying for) an endorsement from an approved UK endorsing body (Tech Nation/UKRI, British Academy, Royal Academy of Engineering, etc.)?",
        source: "UK Gov — Global Talent visa endorsement",
        sourceUrl: "https://www.gov.uk/global-talent",
        passWith: ["YES", "APPLYING"],
        failMsg: "An endorsement from an approved UK endorsing body is the mandatory first step. Without it, you cannot apply for the visa.",
        options: [
          { label: "Yes — already endorsed", value: "YES" },
          { label: "Currently applying for endorsement", value: "APPLYING" },
          { label: "No", value: "NO" },
        ],
      },
    ],
    "UK-INNOVATOR-FOUNDER": [
      {
        id: "endorsement_biz",
        question: "Do you have an endorsement letter from an approved UK body for your business idea?",
        source: "UK Gov — Innovator Founder visa endorsement",
        sourceUrl: "https://www.gov.uk/innovator-founder-visa",
        passWith: ["YES"],
        failMsg: "You must first apply to and be endorsed by one of the 4 approved bodies (Envestors, Innovator International, etc.) before applying for the visa.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "UK-HPI": [
      {
        id: "university_rank",
        question: "Is your university on the 'Global Universities List' for the year you graduated (top 50 globally)?",
        source: "UK Gov — High Potential Individual university list",
        sourceUrl: "https://www.gov.uk/high-potential-individual-visa/eligibility",
        passWith: ["YES"],
        failMsg: "The HPI visa is only for graduates from a specific list of top 50 global universities. Check the official list for your graduation year on GOV.UK.",
        options: [{ label: "Yes", value: "YES" }, { label: "No / Unsure", value: "NO" }],
      },
    ],
  },
};