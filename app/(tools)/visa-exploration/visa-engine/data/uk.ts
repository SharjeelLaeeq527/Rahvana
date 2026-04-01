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
      if (a.relationship === "PARENT") c.push("UK-FAMILY-PARENT");
      if (a.relationship === "CHILD")  c.push("UK-FAMILY-CHILD");
    }
    if (a.sponsorStatus === "TEMP") {
      c.push("UK-DEPENDENT");
    }
  }

  if (a.purpose === "WORK") {
    if (a.workType === "SKILLED")       c.push("UK-SKILLED-WORKER");
    if (a.workType === "HEALTH")        c.push("UK-HEALTH-CARE");
    if (a.workType === "RELIGIOUS")     c.push("UK-MINISTER-RELIGION", "UK-TEMP-RELIGIOUS");
    if (a.workType === "ICT")           c.push("UK-ICT");
    if (a.workType === "GLOBAL_TALENT") c.push("UK-GLOBAL-TALENT");
    if (a.workType === "SCALE_UP")      c.push("UK-SCALE-UP");
    if (a.workType === "HPI")           c.push("UK-HPI");
    if (a.workType === "GRADUATE")      c.push("UK-GRADUATE");
    if (a.workType === "CREATIVE")      c.push("UK-TEMP-CREATIVE");
    if (a.workType === "CHARITY")       c.push("UK-TEMP-CHARITY");
    if (a.workType === "GAE")           c.push("UK-TEMP-GAE");
    if (a.workType === "SEASONAL")      c.push("UK-SEASONAL");
  }

  if (a.purpose === "STUDY") {
    if (a.studyType === "LONG")      c.push("UK-STUDENT");
    if (a.studyType === "CHILD")     c.push("UK-CHILD-STUDENT");
    if (a.studyType === "SHORT")     c.push("UK-SHORT-STUDY");
    if (!a.studyType)                c.push("UK-STUDENT");
  }

  if (a.purpose === "VISIT") {
    if (a.visitType === "TOURISM")   c.push("UK-VISITOR-STANDARD");
    if (a.visitType === "MARRIAGE")  c.push("UK-VISITOR-MARRIAGE");
    { if (a.visitType === "PAID")    c.push("UK-VISITOR-PAID"); }
    if (!a.visitType)                c.push("UK-VISITOR-STANDARD");
  }

  if (a.purpose === "TRANSIT")       c.push("UK-TRANSIT-DIRECT", "UK-TRANSIT-VISITOR");

  if (a.purpose === "BUSINESS_INVEST") {
    c.push("UK-INNOVATOR-FOUNDER", "UK-EXPANSION-WORKER", "UK-START-UP");
  }

  if (a.purpose === "SETTLEMENT") {
    if (a.settleRoute === "LONG")    c.push("UK-ILR-LONG");
    if (a.settleRoute === "WORK")    c.push("UK-ILR-WORK");
    if (a.settleRoute === "FAMILY")  c.push("UK-ILR-FAMILY");
    if (a.settleRoute === "REFUGEE") c.push("UK-ILR-PROTECTION");
  }

  if (a.purpose === "SPECIAL") {
    c.push("UK-ANCESTRY", "UK-FRONTIER");
  }

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
        { label: "On a work or student visa", value: "TEMP", sub: "Join them as a dependent" },
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
          { label: "Parent", value: "PARENT" },
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
        { label: "Minister of Religion", value: "RELIGIOUS", sub: "Religious work or preaching" },
        { label: "ICT / Expansion Worker", value: "ICT", sub: "Intra-company transfer or UK expansion roles" },
        { label: "Global Talent", value: "GLOBAL_TALENT", sub: "Exceptional leaders in tech, science, arts or academia" },
        { label: "Scale-up Worker", value: "SCALE_UP", sub: "Fast-track for high-growth businesses" },
        { label: "High Potential Individual (HPI)", value: "HPI", sub: "Graduates of top 50 global universities" },
        { label: "Graduate Visa", value: "GRADUATE", sub: "If you finished a UK degree — no job needed" },
        { label: "Creative & Sporting", value: "CREATIVE", sub: "Artists, athletes, or entertainers (temporary)" },
        { label: "Charity Worker", value: "CHARITY", sub: "Voluntary work for a licensed sponsor" },
        { label: "Seasonal Worker", value: "SEASONAL", sub: "Agriculture or poultry — up to 6 months" },
      ],
      canProceed: !!a.workType,
    });
  }
  if (a.purpose === "STUDY") {
    steps.push({
      id: "studyType", type: "options", field: "studyType",
      title: "What is your level of study?",
      options: [
        { label: "Academic course (≥ 6 months)", value: "LONG", sub: "Degree, A-levels, etc. (Student Visa)" },
        { label: "Child Student (4-17 years)", value: "CHILD" },
        { label: "Short-term Study (< 6 months)", value: "SHORT", sub: "English language courses" },
      ],
      canProceed: !!a.studyType,
    });
  }
  if (a.purpose === "VISIT") {
    steps.push({
      id: "visitType", type: "options", field: "visitType",
      title: "Tell us about your visit",
      options: [
        { label: "Tourism, Family, or short-term study", value: "TOURISM", sub: "Standard Visitor Visa" },
        { label: "Marriage / Civil Partnership", value: "MARRIAGE" },
        { label: "Permitted Paid Engagement", value: "PAID", sub: "Experts, lecturers, etc. for short-term work" },
      ],
      canProceed: !!a.visitType,
    });
  }
  if (a.purpose === "SETTLEMENT") {
    steps.push({
      id: "settleRoute", type: "options", field: "settleRoute",
      title: "Based on what route are you applying for ILR?",
      options: [
        { label: "Long Residence (10+ years)", value: "LONG" },
        { label: "Work Route (e.g. 5 years as Skilled Worker)", value: "WORK" },
        { label: "Family Route (e.g. Spouse)", value: "FAMILY" },
        { label: "Protection Route (Refugee/Humanitarian)", value: "REFUGEE" },
      ],
      canProceed: !!a.settleRoute,
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
    { label: "Family / Join a partner", value: "FAMILY", sub: "Join your spouse or family member in the UK" },
    { label: "Work in the UK", value: "WORK", sub: "Skilled Worker, Health & Care, Graduate, or Global Talent" },
    { label: "Study", value: "STUDY", sub: "Short-term or long-term academic courses" },
    { label: "Visit / Tourism", value: "VISIT", sub: "Vacation, marriage, or short medical treatment" },
    { label: "Transit", value: "TRANSIT", sub: "Passing through the UK en route to another country" },
    { label: "Business & Innovation", value: "BUSINESS_INVEST", sub: "Innovator, Expansion Worker, or Start-up" },
    { label: "Permanent Settlement (ILR)", value: "SETTLEMENT", sub: "Indefinite Leave to Remain for those already in the UK" },
    { label: "Special Categories", value: "SPECIAL", sub: "UK Ancestry or Frontier Worker visas" },
  ],
  getCandidateCodes,
  buildFollowUpSteps,
  getCountryNotes: (a) => {
    const notes = [];
    if (a.origin?.toLowerCase() === "pakistan") {
      notes.push("⚠️ Mandatory: Tuberculosis (TB) test certificate from a UKVI-approved clinic (IOM Pakistan) is required for stays longer than 6 months.");
      notes.push("⚠️ Official 2026 Policy: UK visit visas for Pakistanis are now fully digital (e-visas). No physical sticker will be placed in your passport.");
    }
    return notes;
  },
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
    "UK-MINISTER-RELIGION": {
      code: "Minister of Religion", label: "Minister of Religion Visa (T2)", badge: "Work", color: T.success,
      description: "For people who have been offered a job within a faith community (e.g., as a minister, missionary, or member of a religious order).",
      criteria: [
        "Certificate of Sponsorship (CoS) from a licensed religious organization.",
        "English proficiency at B1 level.",
        "Must be a genuine role within a religious order.",
      ],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-ICT": {
      code: "Global Business Mobility", label: "Intra-company Transfer / ICT", badge: "Work", color: T.success,
      description: "Temporary route for employees being transferred to a UK branch of their international employer.",
      criteria: [
        "Must currently work for an organization that is linked to the UK sponsor.",
        "Minimum salary requirement (varies by role).",
        "Must have worked for the employer for a specific period abroad (usually 12 months).",
      ],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-SCALE-UP": {
      code: "Scale-up Worker", label: "Scale-up Worker Visa", badge: "Work", color: T.success,
      description: "For talented individuals with a job offer from a high-growth UK business.",
      criteria: [
        "Sponsorship from a licensed UK 'Scale-up' business.",
        "Job offer at a high skill level (RQF 6).",
        "Minimum salary of £36,300/year.",
        "English B1 level.",
      ],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-TEMP-CREATIVE": {
      code: "Creative Worker", label: "Temporary Worker — Creative", badge: "Non-Settlement", color: "#F59E0B",
      description: "For people who have been offered work in the UK as a creative worker (e.g., artist, dancer, musician, or film crew).",
      criteria: ["Job offer from a licensed sponsor.", "Unique contribution to the UK creative sector.", "Minimum salary (if applicable)."],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-TEMP-CHARITY": {
      code: "Charity Worker", label: "Temporary Worker — Charity", badge: "Non-Settlement", color: "#F59E0B",
      description: "For people who want to do unpaid voluntary work for a charity in the UK.",
      criteria: ["Sponsorship certificate from a licensed charity.", "Role must be directly related to the charity's purpose.", "Unpaid/Voluntary basis only."],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-TEMP-GAE": {
      code: "GAE Worker", label: "Government Authorised Exchange", badge: "Non-Settlement", color: "#F59E0B",
      description: "For work experience, training, or language programs through approved schemes.",
      criteria: ["Sponsorship from an approved scheme operator.", "Role must be supernumerary (not a permanent job)."],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from sponsor"],
    },
    "UK-TEMP-RELIGIOUS": {
      code: "Religious Worker", label: "Temporary Worker — Religious", badge: "Non-Settlement", color: "#F59E0B",
      description: "For short-term religious work or joining a religious order.",
      criteria: ["Sponsorship from a licensed religious organization.", "Max stay 2 years."],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-EXPANSION-WORKER": {
      code: "UK Expansion Worker", label: "Expansion Worker Visa", badge: "Business", color: T.success,
      description: "For senior managers or specialist employees who are coming to the UK to expand a foreign business that does not yet trade in the UK.",
      criteria: ["Already working for the business outside the UK.", "The business must not have a UK footprint yet.", "Sponsor license required."],
      processing: "3 weeks.",
      forms: ["Online Application", "CoS from employer"],
    },
    "UK-START-UP": {
      code: "Start-up Visa", label: "Start-up Visa", badge: "Business", color: T.success,
      description: "For new entrepreneurs starting their first business in the UK. Note: Most new applicants now use Innovator Founder.",
      criteria: ["Endorsement from an approved body.", "New, innovative, and scalable business idea."],
      processing: "3 weeks.",
      forms: ["Endorsement letter", "Online Application"],
    },
    "UK-VISITOR-STANDARD": {
      code: "Standard Visitor", label: "Standard Visitor Visa", badge: "Visit", color: "#6366F1",
      description: "For tourism, visiting family, or short business trips (up to 6 months).",
      criteria: ["Genuine visitor intent.", "Sufficient funds.", "Plan to leave UK."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
    "UK-VISITOR-MARRIAGE": {
      code: "Marriage Visitor", label: "Marriage Visitor Visa", badge: "Visit", color: "#6366F1",
      description: "For people who want to get married or register a civil partnership in the UK but do not intend to stay long-term.",
      criteria: ["Must leave UK within 6 months.", "Proof of wedding/civil ceremony arrangement."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
    "UK-VISITOR-PAID": {
      code: "Paid Engagement", label: "Permitted Paid Engagement Visitor", badge: "Visit", color: "#6366F1",
      description: "For experts who are invited to the UK by a UK-based organization for a specific paid task.",
      criteria: ["Invitation from UK organization.", "Engagement must be completed within 1 month.", "Specific expert roles (e.g., lecturers, examiners)."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
    "UK-TRANSIT-DIRECT": {
      code: "DATV", label: "Direct Airside Transit Visa", badge: "Transit", color: "#475569",
      description: "For transiting through a UK airport without passing through immigration (staying airside).",
      criteria: ["Changing flights at a UK airport.", "Not passing through border control."],
      processing: "Varies.",
      forms: ["Online Application"],
    },
    "UK-TRANSIT-VISITOR": {
      code: "Visitor in Transit", label: "Visitor in Transit Visa", badge: "Transit", color: "#475569",
      description: "For people who will pass through UK border control but leave the UK within 48 hours.",
      criteria: ["Passing through UK border control.", "Entering the UK for max 48 hours to continue journey."],
      processing: "Varies.",
      forms: ["Online Application"],
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
        "TB (tuberculosis) test certificate — mandatory for Pakistani applicants.",
      ],
      processing: "3 weeks (outside UK).",
      forms: ["Apply Online — GOV.UK", "CAS from institution"],
    },
    "UK-CHILD-STUDENT": {
      code: "Child Student", label: "Child Student Visa", badge: "Study", color: "#6366F1",
      description: "For children aged 4 to 17 who want to study at an independent school in the UK.",
      criteria: ["CAS from independent school.", "Consent from parents.", "Proof of financial support."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
    "UK-SHORT-STUDY": {
      code: "Short-term Study", label: "Short-term Study Visa", badge: "Study", color: "#6366F1",
      description: "For English language courses lasting between 6 and 11 months.",
      criteria: ["Accepted onto an English language course.", "Must leave UK at end of course.", "No right to work."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
    "UK-FAMILY-PARENT": {
      code: "Family (Parent)", label: "Family Visa — Parent", badge: "Settlement", color: T.primary,
      description: "For parents of children who are British citizens or settled in the UK.",
      criteria: ["Child is under 18 (or was under 18 when you first applied).", "Child is British or settled.", "Shared responsibility for the child."],
      processing: "24 weeks.",
      forms: ["Online Application"],
    },
    "UK-FAMILY-CHILD": {
      code: "Family (Child)", label: "Family Visa — Child", badge: "Settlement", color: T.primary,
      description: "For children of British citizens or settled persons in the UK.",
      criteria: ["Parent is British or settled.", "Under 18 (usually).", "Relationship evidence."],
      processing: "24 weeks.",
      forms: ["Online Application"],
    },
    "UK-DEPENDENT": {
      code: "Dependent", label: "Dependent Visa (Partner/Child)", badge: "Non-Settlement", color: "#94a3b8",
      description: "For family members of people on a work or student visa in the UK.",
      criteria: ["Principal applicant has a valid UK visa.", "Spouse, partner, or unmarried child under 18."],
      processing: "Varies.",
      forms: ["Online Application"],
    },
    "UK-ILR-WORK": {
      code: "ILR (Work)", label: "Settlement — Skilled Worker", badge: "Permanent", color: T.success,
      description: "Indefinite Leave to Remain for people who have worked in the UK for 5 years.",
      criteria: ["Lived in UK for 5 continuous years on a qualifying work visa.", "Minimum salary requirement for ILR.", "Passed Life in the UK test.", "English B1 level."],
      processing: "6 months.",
      forms: ["SET(O) Form"],
    },
    "UK-ILR-FAMILY": {
      code: "ILR (Family)", label: "Settlement — Family Route", badge: "Permanent", color: T.primary,
      description: "Indefinite Leave to Remain for partners or parents of people in the UK.",
      criteria: ["Lived in UK for 2 or 5 years on a family visa (depending on the route).", "Genuine relationship evidence.", "Life in the UK test."],
      processing: "6 months.",
      forms: ["SET(M) Form"],
    },
    "UK-ILR-LONG": {
      code: "ILR (Long Residence)", label: "Settlement — 10 Year Route", badge: "Permanent", color: "#475569",
      description: "For people who have lived legally in the UK for at least 10 continuous years.",
      criteria: ["10 years continuous legal residence.", "Passed Life in the UK test.", "English B1 level."],
      processing: "6 months.",
      forms: ["SET(LR) Form"],
    },
    "UK-ILR-PROTECTION": {
      code: "Settlement (Protection)", label: "Settlement — Refugee / Humanitarian", badge: "Permanent", color: "#DC2626",
      description: "For people who have been in the UK for 5 years with refugee status or humanitarian protection.",
      criteria: ["Held refugee status or humanitarian protection for 5 years.", "Safe return to home country is not possible."],
      processing: "6 months.",
      forms: ["SET(P) Form"],
    },
    "UK-ANCESTRY": {
      code: "Ancestry", label: "UK Ancestry Visa", badge: "Commonwealth", color: "#6366F1",
      description: "For Commonwealth citizens with a grandparent born in the UK.",
      criteria: ["Commonwealth citizen.", "Grandparent born in UK.", "Intention to work in UK."],
      processing: "3 weeks.",
      forms: ["Online Application"],
    },
    "UK-FRONTIER": {
      code: "Frontier Worker", label: "Frontier Worker Permit", badge: "EU/EEA", color: "#475569",
      description: "For EU, EEA or Swiss citizens who work in the UK but live elsewhere.",
      criteria: ["EU/EEA/Swiss citizen.", "Worked in UK before 31 December 2020.", "Continue to work in UK at least once every 12 months."],
      processing: "Varies.",
      forms: ["Online Application"],
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
    "UK-MINISTER-RELIGION": [
      { 
        id: "cos", 
        question: "Do you have a Certificate of Sponsorship from a licensed UK religious organization?", 
        source: "GOV.UK — Minister of Religion visa",
        sourceUrl: "https://www.gov.uk/minister-of-religion-visa",
        passWith: ["YES"], 
        failMsg: "A CoS is mandatory.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-ICT": [
      { 
        id: "current_emp", 
        question: "Are you currently working for the international employer outside the UK?", 
        source: "GOV.UK — Global Business Mobility",
        sourceUrl: "https://www.gov.uk/intra-company-transfer-visa",
        passWith: ["YES"], 
        failMsg: "ICT is for existing employees only.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-SCALE-UP": [
      { 
        id: "cos", 
        question: "Do you have a CoS from a licensed Scale-up business?", 
        source: "GOV.UK — Scale-up Worker",
        sourceUrl: "https://www.gov.uk/scale-up-worker-visa",
        passWith: ["YES"], 
        failMsg: "Sponsorship from a Scale-up business is required.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-VISITOR-MARRIAGE": [
      { 
        id: "intent", 
        question: "Do you intend to marry or enter a civil partnership during your visit?", 
        source: "GOV.UK — Marriage Visitor visa",
        sourceUrl: "https://www.gov.uk/marriage-visitor-visa",
        passWith: ["YES"], 
        failMsg: "This visa is specifically for wedding/partnership arrangements.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-TRANSIT-DIRECT": [
      { 
        id: "transit", 
        question: "Are you changing flights at a UK airport and staying 'airside'?", 
        source: "GOV.UK — Transit Visas",
        sourceUrl: "https://www.gov.uk/transit-visa",
        passWith: ["YES"], 
        failMsg: "DATV is for airside transit only.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-ILR-WORK": [
      { 
        id: "resid", 
        question: "Have you lived in the UK legally for at least 5 continuous years on a work visa?", 
        source: "GOV.UK — Indefinite Leave to Remain",
        sourceUrl: "https://www.gov.uk/settle-in-the-uk",
        passWith: ["YES"], 
        failMsg: "5 years continuous residence is required for most work routes.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-ILR-LONG": [
      { 
        id: "ten_yrs", 
        question: "Have you lived legally in the UK for at least 10 continuous years?", 
        source: "GOV.UK — Long Residence Settlement",
        sourceUrl: "https://www.gov.uk/long-residence",
        passWith: ["YES"], 
        failMsg: "10 years legal residence is mandatory.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
    "UK-ANCESTRY": [
      { 
        id: "grandparent", 
        question: "Was one of your grandparents born in the UK, Channel Islands, or Isle of Man?", 
        source: "GOV.UK — UK Ancestry visa",
        sourceUrl: "https://www.gov.uk/ancestry-visa",
        passWith: ["YES"], 
        failMsg: "Ancestry visa requires a UK-born grandparent.", 
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }] 
      },
    ],
  },
};