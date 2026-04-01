/**
 * visa-engine/data/australia.ts
 *
 * Australia visa data — Student, Skilled, Partner, Visitor.
 *
 * ──────────────────────────────────────────────────────────────────
 * VERIFICATION SOURCES & LAST REVIEWED: March 2026
 * ──────────────────────────────────────────────────────────────────
 *
 * [S500]  Student Visa (Subclass 500)
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500
 *         https://www.studyaustralia.gov.au/en/plan-your-move/your-guide-to-visas/student-visa-subclass-500
 *         Key changes 2024–2025:
 *           • GTE replaced by Genuine Student (GS) requirement (2024)
 *           • Visa fee raised to AUD $2,000 from 1 July 2025
 *           • Financial threshold: AUD $29,710 living costs for first year (2024 update)
 *           • Work rights: 48 hrs/fortnight during semester (from July 2023)
 *           • National Planning Level cap: 295,000 student places for 2026
 *
 * [189]   Skilled Independent Visa (Subclass 189)
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-table
 *         Key facts:
 *           • Minimum 65 points, but actual competitive score is typically 85–95+
 *           • Must be under 45 at time of invitation (not EOI lodgment)
 *           • Competent English mandatory
 *           • Processing: 2–8 months (updated; old "12–24 months" was outdated)
 *           • Fee as of July 2025: AUD $4,910 (primary applicant)
 *
 * [190]   Skilled Nominated Visa (Subclass 190)
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190
 *         Key facts:
 *           • Minimum 65 points + 5 bonus points for state nomination = effectively 70+
 *           • State nomination adds 5 points to score
 *           • Must be under 45 at time of invitation
 *
 * [482]   Skills in Demand Visa (Subclass 482) — formerly TSS Visa
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482
 *         *** CRITICAL CHANGE: TSS 482 replaced by Skills in Demand (SID) visa on 7 Dec 2024 ***
 *         Key changes Dec 2024 onwards:
 *           • Three streams: Specialist Skills (≥AUD $141,210), Core Skills (≥AUD $76,515), Essential Skills
 *           • Work experience reduced from 2 years → 1 year (from 23 Nov 2024)
 *           • Specialist Skills stream: ~7 business days processing
 *           • Core Skills stream: ~21 business days processing
 *           • Salary threshold (Core Skills): AUD $76,515 from 1 July 2025
 *           • PR pathway: 2 years sponsored employment → ENS 186 (reduced from 3 years)
 *           • 180 days to find new employer if job is lost (up from 60 days)
 *
 * [309]   Partner (Provisional) Visa (Subclass 309 → 100)
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/partner-offshore
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/partner-offshore/provisional-309
 *         Key facts:
 *           • Processing 309: 9–26 months (50% in 9 months, 90% in 22 months — per DoHA Oct 2025)
 *           • Permanent stage (Subclass 100): assessed ~2 years after initial lodgment
 *           • Fee: AUD $9,365+ (combined 309/100 application)
 *           • De facto relationship: generally 12 months, but exceptions apply
 *           • Long-term couples (3+ yrs or 2 yrs with a child) may receive both 309 & 100 simultaneously
 *
 * [600]   Visitor Visa (Subclass 600)
 *         https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600
 *         Generally accurate, no major recent changes.
 *
 * ──────────────────────────────────────────────────────────────────
 * General disclaimer: This data is for guidance only. Immigration law
 * changes frequently. Users should verify on immi.homeaffairs.gov.au
 * and consult a Registered Migration Agent (MARA) for legal advice.
 * ──────────────────────────────────────────────────────────────────
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "STUDY") {
    c.push("AU-STUDENT-500");
  }

  if (a.purpose === "WORK") {
    if (a.workType === "SKILLED") {
      c.push("AU-SKILLED-189", "AU-SKILLED-190", "AU-SKILLED-491");
    }
    if (a.workType === "GLOBAL") {
      c.push("AU-GLOBAL-858");
    }
    if (a.workType === "EMPLOYER") {
      c.push("AU-EMPLOYER-482");
    }
  }

  if (a.purpose === "FAMILY") {
    if (a.relationship === "SPOUSE") {
      c.push("AU-PARTNER-309");
    }
    if (a.relationship === "FIANCE") {
      c.push("AU-PARTNER-300");
    }
  }

  if (a.purpose === "VISIT") {
    c.push("AU-VISITOR-600");
  }

  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  if (a.purpose === "WORK") {
    steps.push({
      id: "workType",
      type: "options",
      field: "workType",
      title: "What is your work situation?",
      options: [
        {
          label: "I am a skilled professional (Points-based)",
          value: "SKILLED",
          sub: "Engineers, IT, Healthcare, Trades — Subclass 189, 190, or 491",
        },
        {
          label: "I am an exceptional leader (Global Talent)",
          value: "GLOBAL",
          sub: "Highly skilled individuals in priority sectors — Subclass 858",
        },
        {
          label: "I have a job offer / employer sponsor",
          value: "EMPLOYER",
          sub: "An Australian company wants to hire me — Skills in Demand Visa (Subclass 482)",
        },
      ],
      canProceed: !!a.workType,
    });
  }

  if (a.purpose === "FAMILY") {
    steps.push({
      id: "relationship",
      type: "options",
      field: "relationship",
      title: "Your relationship to the Australian sponsor?",
      options: [
        { label: "Spouse or de facto partner", value: "SPOUSE" },
        { label: "Fiancé(e) (Prospective Marriage)", value: "FIANCE" },
        { label: "Child", value: "CHILD" },
        { label: "Parent", value: "PARENT" },
      ],
      canProceed: !!a.relationship,
    });
  }

  return steps;
}

export const AUSTRALIA_DATA: CountryData = {
  country: "Australia",
  code: "AU",
  flag: "🇦🇺",
  purposes: [
    {
      label: "Study in Australia",
      value: "STUDY",
      sub: "Student Visa (Subclass 500) — school, vocational, or university",
    },
    {
      label: "Work or Migrate",
      value: "WORK",
      sub: "Points-based skilled migration or employer-sponsored work visa",
    },
    {
      label: "Join Family / Partner",
      value: "FAMILY",
      sub: "Join your spouse, partner, or family members in Australia",
    },
    {
      label: "Visit / Tourism",
      value: "VISIT",
      sub: "Holiday, seeing family, or short-term business trips",
    },
  ],

  getCandidateCodes,
  buildFollowUpSteps,
  officialSources: [
    { label: "HomeAffairs.gov.au", url: "https://immi.homeaffairs.gov.au" },
  ],

  visas: {
    // ──────────────────────────────────────────────────────────────
    // STUDENT VISA — Subclass 500
    // Source: immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500
    // Updated: GS requirement (2024), AUD $2,000 fee from Jul 2025,
    //          AUD $29,710 financial threshold, 48 hrs/fortnight work rights
    // ──────────────────────────────────────────────────────────────
    "AU-STUDENT-500": {
      code: "Subclass 500",
      label: "Student Visa (Subclass 500)",
      badge: "Study",
      color: "#6366F1",
      description:
        "Allows you to live in Australia for the duration of your course of study at a CRICOS-registered educational institution. Includes limited work rights (up to 48 hours per fortnight during semester; unlimited during scheduled breaks).",
      criteria: [
        "Confirmation of Enrolment (CoE) from a CRICOS-registered institution — must be obtained before applying.",
        "Overseas Student Health Cover (OSHC) for the full duration of your stay.",
        "Meet the Genuine Student (GS) requirement — replaced the old GTE test in 2024. You must demonstrate your genuine intention to study.",
        "English language proficiency (e.g., IELTS 6.0+ overall, PTE Academic 50+, TOEFL iBT, or Cambridge English).",
        "Sufficient funds: at least AUD $29,710 for first-year living costs (2024 update), plus tuition fees and return airfare.",
        "Meet health and character requirements; some applicants require a medical exam.",
      ],
      processing:
        "Typically 4–8 weeks for complete applications. Apply at least 12 weeks before your course start date.",
      forms: [
        "Apply online via ImmiAccount",
        "CoE from CRICOS-registered institution",
        "GS statement (within application form)",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // SKILLED INDEPENDENT — Subclass 189
    // Source: immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189
    // Updated: Processing 2–8 months, competitive score 85–95+, fee AUD $4,910 (Jul 2025)
    // ──────────────────────────────────────────────────────────────
    "AU-SKILLED-189": {
      code: "Subclass 189",
      label: "Skilled Independent Visa (Subclass 189)",
      badge: "Permanent Resident",
      color: T.success,
      description:
        "A points-tested permanent residency visa for skilled workers who are NOT sponsored by an employer, state/territory, or family member. No nomination required — you rely entirely on your own points score. This is one of Australia's most competitive skilled visas.",
      criteria: [
        "Be under 45 years old at the time of receiving your Invitation to Apply (ITA) — not at EOI submission.",
        "Occupation listed on the Medium and Long-Term Strategic Skills List (MLTSSL).",
        "Positive skills assessment from the relevant assessing authority (e.g., Engineers Australia, ACS for IT).",
        "Score at least 65 points on the points test. Note: competitive invitation scores are typically 85–95+ due to high demand. Maximising your score (e.g., higher English level, more work experience) is strongly advised.",
        "Competent English proficiency — minimum IELTS 6.0 in each band, or equivalent.",
        "Submit an Expression of Interest (EOI) via SkillSelect and receive an Invitation to Apply.",
        "Meet health and character requirements.",
      ],
      processing:
        "2–8 months after lodging the visa application (once invited). EOI wait times vary greatly by occupation and points score.",
      forms: [
        "EOI via SkillSelect (online, no fee)",
        "Online visa application via ImmiAccount (fee: AUD $4,910 primary applicant as of Jul 2025)",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // SKILLED NOMINATED — Subclass 190
    // Source: immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190
    // Updated: State nomination adds 5 bonus points; processing 10–18 months
    // ──────────────────────────────────────────────────────────────
    "AU-SKILLED-190": {
      code: "Subclass 190",
      label: "Skilled Nominated Visa (Subclass 190)",
      badge: "Permanent Resident",
      color: T.success,
      description:
        "A points-tested permanent residency visa for skilled workers who are nominated by an Australian state or territory government. State nomination automatically adds 5 bonus points to your score, making this more accessible than the 189 for many applicants.",
      criteria: [
        "Nominated by an Australian state or territory government agency — you must apply for and receive state nomination first.",
        "Be under 45 years old at the time of receiving your Invitation to Apply (ITA).",
        "Occupation on the relevant skilled occupation list for your nominating state/territory.",
        "Positive skills assessment from the relevant assessing authority.",
        "Score at least 65 points (state nomination gives you +5 points, so your base score needs to be 60+).",
        "Competent English proficiency — minimum IELTS 6.0 in each band, or equivalent.",
        "Submit an EOI via SkillSelect and receive an Invitation to Apply.",
        "Meet health and character requirements.",
        "Must live and work in the nominating state/territory (typically for at least 2 years).",
      ],
      processing:
        "10–18 months after lodging the visa application (following ITA). State nomination processing varies by state.",
      forms: [
        "State Nomination Application (via each state's portal)",
        "EOI via SkillSelect",
        "Online visa application via ImmiAccount",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // SKILLS IN DEMAND VISA — Subclass 482 (formerly TSS 482)
    // Source: immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482
    // *** MAJOR UPDATE: TSS replaced by Skills in Demand (SID) visa on 7 Dec 2024 ***
    // Work experience reduced to 1 year; 3 streams; faster processing; clearer PR pathway
    // ──────────────────────────────────────────────────────────────
    "AU-EMPLOYER-482": {
      code: "Subclass 482",
      label: "Skills in Demand Visa (Subclass 482)",
      badge: "Work",
      color: T.primary,
      description:
        "Replaced the Temporary Skill Shortage (TSS) visa on 7 December 2024. Allows Australian employers to sponsor overseas skilled workers where a suitably skilled Australian cannot be found. Offers three streams based on occupation and salary, with a clearer pathway to permanent residency after 2 years of sponsored employment.",
      criteria: [
        "Nominated by an approved Australian business sponsor who has conducted Labour Market Testing.",
        "Work in a nominated occupation — must be on the Core Skills Occupation List (Core Skills Stream) or earn AUD $141,210+ (Specialist Skills Stream).",
        "At least 1 year of relevant full-time work experience in your nominated occupation or a related field (reduced from 2 years in November 2024).",
        "Salary must meet the Temporary Skilled Migration Income Threshold (TSMIT): AUD $76,515 from 1 July 2025 (Core Skills); AUD $141,210+ for Specialist Skills Stream.",
        "English language proficiency: IELTS 5.0+ with no band below 4.5, or equivalent.",
        "Meet health and character requirements.",
        "Skills assessment required for some occupations (trade and regulated occupations).",
      ],
      processing:
        "Specialist Skills Stream: ~7 business days. Core Skills Stream: ~21 business days. Essential Skills Stream: varies.",
      forms: [
        "Employer Sponsorship Application",
        "Nomination Application",
        "Visa Application via ImmiAccount",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // PARTNER VISA — Subclass 309 / 100 (Offshore)
    // Source: immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/partner-offshore
    // Updated: Processing 9–26 months (per DoHA Oct 2025); fee AUD $9,365+
    // ──────────────────────────────────────────────────────────────
    "AU-PARTNER-309": {
      code: "Subclass 309 / 100",
      label: "Partner Visa — Provisional & Permanent (Offshore)",
      badge: "Settlement",
      color: T.primary,
      description:
        "A two-stage visa for the spouse or de facto partner of an Australian citizen, permanent resident, or eligible New Zealand citizen who is living outside Australia. Stage 1 (Subclass 309) is temporary; Stage 2 (Subclass 100) grants permanent residency, usually assessed about 2 years after the initial application.",
      criteria: [
        "In a genuine and continuing relationship with an eligible Australian sponsor (citizen, permanent resident, or eligible NZ citizen).",
        "Legally married OR in a de facto relationship (generally at least 12 months de facto; some exceptions apply e.g. a child of the relationship).",
        "Sponsor must be approved by the Department and meet character and age requirements.",
        "Long-term couples (3+ years together, or 2+ years with a child) may receive both 309 and 100 simultaneously.",
        "Both you and your sponsor must meet health and character requirements.",
        "Must be outside Australia at time of application and visa grant for Subclass 309.",
      ],
      processing:
        "Subclass 309 (temporary stage): 9–26 months (50% of applications finalised in ~9 months, 90% in ~22 months, per DoHA October 2025 data). Subclass 100 (permanent stage): assessed ~2 years after initial lodgment.",
      forms: [
        "Combined 309/100 application online via ImmiAccount (fee: AUD $9,365+ as of 2025)",
        "Sponsor application (Form 40SP)",
        "Form 888 (statutory declaration by sponsor's witnesses)",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // VISITOR VISA — Subclass 600
    // Source: immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600
    // No major recent changes — data is accurate.
    // ──────────────────────────────────────────────────────────────
    "AU-VISITOR-600": {
      code: "Subclass 600",
      label: "Visitor Visa (Subclass 600)",
      badge: "Visit",
      color: "#6366F1",
      description:
        "For people who want to visit Australia for tourism, to see family and friends, or for business visitor activities such as attending conferences. Does not permit you to work in Australia.",
      criteria: [
        "Genuine intention to visit Australia temporarily and depart before your visa expires.",
        "Sufficient funds to support yourself during your stay and to pay for your return journey.",
        "No intention to work or study (unless covered by a specific visitor stream).",
        "Meet health and character requirements.",
        "Some nationalities are eligible for eVisitor (Subclass 651) or Electronic Travel Authority (ETA) instead — check your passport country first.",
      ],
      processing:
        "Usually a few days to 4 weeks. Simple, complete applications are often decided within days.",
      forms: ["Online application via ImmiAccount (Subclass 600)"],
    },
    "AU-SKILLED-491": {
      code: "Subclass 491",
      label: "Skilled Work Regional (Provisional) Visa",
      badge: "Pathway to PR",
      color: "#F59E0B",
      description: "For skilled workers who want to live and work in regional Australia. Adds 15 points to your total score via state/territory or family sponsorship. Provides a direct pathway to Permanent Residency (Subclass 191) after 3 years.",
      criteria: [
        "Nominated by a state/territory government or sponsored by an eligible relative in a regional area.",
        "Under 45 years of age.",
        "Occupation on the regional skills list.",
        "Positive Skills Assessment.",
        "Minimum 65 points (15 points automatically from sponsorship).",
        "Live/work in regional Australia for at least 3 years before applying for PR.",
      ],
      processing: "8 to 14 months.",
      forms: ["EOI via SkillSelect", "State Nomination Application"],
    },
    "AU-PARTNER-300": {
      code: "Subclass 300",
      label: "Prospective Marriage Visa (Fiancé)",
      badge: "Settlement",
      color: T.primary,
      description: "For people who want to come to Australia to marry their Australian partner. Grants a 9-month stay to get married, then apply for a Partner Visa (820/801).",
      criteria: [
        "Intend to marry your sponsor (citizen/PR) within 9 months of arrival.",
        "Must be outside Australia at application and grant.",
        "Genuine intent to marry and live together as a couple.",
      ],
      processing: "9 to 24 months.",
      forms: ["Visa Application via ImmiAccount"],
    },
    "AU-GLOBAL-858": {
      code: "Subclass 858",
      label: "Global Talent Visa",
      badge: "Direct PR",
      color: T.success,
      description: "A fast-track permanent residency pathway for highly skilled individuals in priority sectors who can earn at least AUD $175,000/year and have a record of exceptional achievement.",
      criteria: [
        "Record of exceptional achievement in a priority sector (e.g., Tech, Energy, Health, Defence).",
        "Earning capacity of at least AUD $175,000 per year.",
        "Be nominated by a person or organization with a national reputation in the same sector.",
      ],
      processing: "4 to 12 months.",
      forms: ["Expression of Interest (EOI)", "Invitation to Apply (ITA)"],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // GATE QUESTIONS
  // These are eligibility check questions shown to the user
  // before the results screen. Source URLs link to official pages.
  // ──────────────────────────────────────────────────────────────
  gateQuestions: {
    "AU-STUDENT-500": [
      {
        id: "coe",
        question:
          "Do you have (or are you in the process of obtaining) a Confirmation of Enrolment (CoE) from a CRICOS-registered Australian institution?",
        source:
          "Dept. of Home Affairs — Student Visa (Subclass 500) Eligibility",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
        passWith: ["YES"],
        failMsg:
          "A valid CoE from a CRICOS-registered institution is mandatory before you can apply. Enrol in your chosen course first, pay the deposit, and the institution will issue your CoE.",
        options: [
          { label: "Yes, I have / am getting my CoE", value: "YES" },
          { label: "No, I haven't applied to any institution yet", value: "NO" },
        ],
      },
      {
        id: "oshc",
        question:
          "Have you arranged Overseas Student Health Cover (OSHC) for the full duration of your intended stay in Australia?",
        source: "Dept. of Home Affairs — OSHC requirement",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500#Eligibility",
        passWith: ["YES"],
        failMsg:
          "OSHC is mandatory for all international students on a Subclass 500 visa. It must cover your entire stay in Australia. Many institutions arrange it on your behalf — check with your provider.",
        options: [
          { label: "Yes, I have / will arrange OSHC", value: "YES" },
          { label: "No, I haven't sorted this yet", value: "NO" },
        ],
      },
      {
        id: "gs_requirement",
        question:
          "Can you demonstrate that you are a Genuine Student (GS) — that your primary purpose in going to Australia is to study, and that your study fits your future plans?",
        source:
          "Dept. of Home Affairs — Genuine Student (GS) requirement (replaced GTE in 2024)",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500#Eligibility",
        passWith: ["YES"],
        failMsg:
          "The GS requirement asks you to explain why you chose your course and institution, how it fits your career goals, and your ties to your home country. You must answer GS questions within the online application form (150-word limit per answer).",
        options: [
          {
            label: "Yes — my study plans are genuine and well-considered",
            value: "YES",
          },
          {
            label: "Unsure — I'm not sure how to demonstrate this",
            value: "NO",
          },
        ],
      },
    ],

    "AU-SKILLED-189": [
      {
        id: "occupation",
        question:
          "Is your occupation on the Medium and Long-Term Strategic Skills List (MLTSSL)?",
        source:
          "Dept. of Home Affairs — Subclass 189 Eligibility (MLTSSL requirement)",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189#Eligibility",
        passWith: ["YES"],
        failMsg:
          "Only occupations listed on the MLTSSL are eligible for the Subclass 189. You can check the full list on the Dept. of Home Affairs website. If your occupation is not on this list, consider the Subclass 190 (state nomination) or Subclass 491 instead.",
        options: [
          { label: "Yes, my occupation is on the MLTSSL", value: "YES" },
          { label: "No / I'm not sure", value: "NO" },
        ],
      },
      {
        id: "assessment",
        question:
          "Do you have a positive Skills Assessment from the relevant Australian assessing authority for your occupation?",
        source: "Dept. of Home Affairs — Skills Assessment requirement",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189#Eligibility",
        passWith: ["YES"],
        failMsg:
          "A valid skills assessment from the relevant body (e.g., Engineers Australia, ACS, VETASSESS) is mandatory and must be valid at the time you receive your Invitation to Apply (ITA). Assessment can take several months — start early.",
        options: [
          { label: "Yes, I have a positive skills assessment", value: "YES" },
          { label: "No / Not yet applied", value: "NO" },
        ],
      },
      {
        id: "points",
        question:
          "Do you have at least 65 points on the Australian points test (noting that competitive scores for Subclass 189 are typically 85–95+)?",
        source:
          "Dept. of Home Affairs — Points Table for Skilled Independent Visa (Subclass 189)",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-table",
        passWith: ["YES_COMPETITIVE", "YES_MINIMUM"],
        failMsg:
          "You need a minimum of 65 points to submit an EOI, but this is rarely enough to receive an invitation. Most current rounds require 85–95+ points. Consider improving your English score, adding work experience, or looking at the Subclass 190 (which adds 5 points via state nomination).",
        options: [
          {
            label: "Yes — 85 or more points (competitive range)",
            value: "YES_COMPETITIVE",
          },
          {
            label: "Yes — 65–84 points (minimum, but may not receive an ITA soon)",
            value: "YES_MINIMUM",
          },
          { label: "No — below 65 points", value: "NO" },
        ],
      },
    ],

    "AU-SKILLED-190": [
      {
        id: "nomination",
        question:
          "Have you received (or are you actively applying for) a state or territory nomination for the Subclass 190?",
        source:
          "Dept. of Home Affairs — Skilled Nominated Visa (Subclass 190) Eligibility",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190#Eligibility",
        passWith: ["YES"],
        failMsg:
          "State or territory nomination is mandatory for the Subclass 190. Each state/territory has its own occupation list, points thresholds, and conditions (including a commitment to live and work in that state). Apply directly through your target state's migration portal.",
        options: [
          {
            label: "Yes — I have or am applying for state nomination",
            value: "YES",
          },
          { label: "No — I haven't applied for nomination yet", value: "NO" },
        ],
      },
      {
        id: "assessment_190",
        question:
          "Do you have a positive Skills Assessment from the relevant Australian assessing authority?",
        source:
          "Dept. of Home Affairs — Subclass 190 Skills Assessment requirement",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190#Eligibility",
        passWith: ["YES"],
        failMsg:
          "A positive skills assessment is mandatory. Contact the relevant assessing body for your occupation (e.g., Engineers Australia, ACS, AHPRA, VETASSESS). Assessment can take 2–6 months, so apply early.",
        options: [
          { label: "Yes, I have a positive skills assessment", value: "YES" },
          { label: "No / Still in progress", value: "NO" },
        ],
      },
    ],

    "AU-EMPLOYER-482": [
      {
        id: "sponsor",
        question:
          "Does your Australian employer hold (or is actively applying for) a Standard Business Sponsor (SBS) approval from the Department of Home Affairs?",
        source:
          "Dept. of Home Affairs — Skills in Demand Visa (Subclass 482) — Step 1: Sponsorship",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482",
        passWith: ["YES"],
        failMsg:
          "Your employer must be an approved Standard Business Sponsor before they can nominate you. The employer needs to apply and be approved separately. If your employer is not yet a sponsor, they must apply first — this typically takes a few weeks.",
        options: [
          {
            label: "Yes — my employer is an approved or pending sponsor",
            value: "YES",
          },
          { label: "No — my employer is not yet a sponsor", value: "NO" },
        ],
      },
      {
        id: "experience",
        question:
          "Do you have at least 1 year of relevant full-time work experience in your nominated occupation or a closely related field?",
        source:
          "Dept. of Home Affairs — Skills in Demand Visa work experience requirement (reduced from 2 years, effective 7 Dec 2024)",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482",
        passWith: ["YES"],
        failMsg:
          "At least 1 year of relevant work experience is required (this was reduced from 2 years in December 2024). Part-time or casual work may be counted on a pro-rata basis. Very recent graduates without sufficient experience may not qualify yet.",
        options: [
          { label: "Yes — I have 1+ year of relevant experience", value: "YES" },
          { label: "No — I have less than 1 year of experience", value: "NO" },
        ],
      },
    ],

    "AU-PARTNER-309": [
      {
        id: "sponsor_eligible",
        question:
          "Is your Australian partner an Australian citizen, Australian permanent resident, or an eligible New Zealand citizen?",
        source:
          "Dept. of Home Affairs — Partner Visa (Subclass 309/100) Eligibility",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/partner-offshore/provisional-309",
        passWith: ["YES"],
        failMsg:
          "Your sponsor must be an Australian citizen, Australian permanent resident, or an eligible New Zealand citizen (holding a Special Category Visa). If your partner does not hold one of these statuses, you are not eligible to be sponsored for this visa.",
        options: [
          {
            label: "Yes — Australian citizen, PR, or eligible NZ citizen",
            value: "YES",
          },
          {
            label: "No — they hold a different visa or status",
            value: "NO",
          },
        ],
      },
      {
        id: "genuine_relationship",
        question:
          "Are you in a genuine, ongoing relationship — either legally married, or in a de facto partnership (generally at least 12 months)?",
        source:
          "Dept. of Home Affairs — Partner Visa relationship requirements",
        sourceUrl:
          "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/partner-offshore",
        passWith: ["MARRIED", "DEFACTO"],
        failMsg:
          "You must be legally married or in a genuine de facto relationship (generally for at least 12 months continuously). The Department will assess evidence of your relationship including shared finances, joint living arrangements, social recognition, and a commitment to each other. Exceptions to the 12-month rule exist if you have a child together.",
        options: [
          { label: "Yes — we are legally married", value: "MARRIED" },
          {
            label:
              "Yes — we are in a de facto relationship (12+ months, or with a child)",
            value: "DEFACTO",
          },
          {
            label: "No — we have been together less than 12 months (no child)",
            value: "NO",
          },
        ],
      },
    ],
    "AU-SKILLED-491": [
      {
        id: "regional_nom",
        question: "Do you have (or can you obtain) a nomination from a state/territory or sponsorship from an eligible relative living in regional Australia?",
        source: "Home Affairs — Subclass 491 Eligibility",
        sourceUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491",
        passWith: ["YES"],
        failMsg: "The 491 specifically requires that you live and work in 'Regional Australia'. You must be sponsored by a state government or a relative in a regional area.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "AU-PARTNER-300": [
      {
        id: "marriage_plan",
        question: "Do you have a genuine intention to marry your partner in Australia within 9 months of your arrival?",
        source: "Subclass 300 Prospective Marriage Visa",
        sourceUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/prospective-marriage-300",
        passWith: ["YES"],
        failMsg: "A Subclass 300 is for those intending to get married IN Australia. If you're already married, you should apply for a Subclass 309 instead.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
    "AU-GLOBAL-858": [
      {
        id: "exceptional_achievement",
        question: "Do you have a record of exceptional achievement in one of Australia's priority sectors (e.g. IT, Energy, Health)?",
        source: "Home Affairs — Global Talent (Subclass 858)",
        sourceUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/global-talent-858",
        passWith: ["YES"],
        failMsg: "The Global Talent visa is for the world's best and brightest. You must be able to prove that you are one of the best in your field globally.",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
      {
        id: "income_capacity",
        question: "Do you have the capacity to earn AUD $175,000 or more annually in Australia?",
        source: "Global Talent Income Requirement",
        sourceUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/global-talent-858",
        passWith: ["YES"],
        failMsg: "You must demonstrate the ability to reach a high-income threshold (typically AUD $175,000/year as of 2026).",
        options: [{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }],
      },
    ],
  },
};