/**
 * visa-engine/data/china.ts
 *
 * China visa data — Student (X1/X2), Tourist (L), Business (M), Work (Z).
 *
 * ──────────────────────────────────────────────────────────────────
 * VERIFICATION SOURCES & LAST REVIEWED: March 2026
 * ──────────────────────────────────────────────────────────────────
 *
 * [X1/X2]  Student Visa (X1 & X2)
 *           https://www.visaforchina.cn/
 *           https://english.beijing.gov.cn/studyinginbeijing/youmayneed/visaapplication/
 *           Key facts verified:
 *             • X1 = stays > 180 days; X2 = stays ≤ 180 days
 *             • JW201 = government scholarship students; JW202 = self-funded students
 *             • DQ form = for short-term programs 30–180 days (some institutions use this instead of JW202)
 *             • X1 must be converted to Residence Permit within 30 days of arrival
 *             • X2 cannot be converted to Residence Permit; single-entry only
 *             • Physical Examination Record (Foreigner Physical Examination Form) required for X1 (stays > 180 days)
 *             • Health insurance: not mandatory at visa stage but required by most universities
 *             • New COVA online application system launched at Chinese embassies Sep 30, 2025
 *             • AVAS appointment system for submitting applications in person
 *             • Processing: 4 working days (regular); expedited options vary by country
 *
 * [L]       Tourist Visa (L)
 *           https://us.china-embassy.gov.cn/eng/lsfw/zj/
 *           https://en.wikipedia.org/wiki/Visa_policy_of_mainland_China
 *           Key facts verified:
 *             • No invitation letter required for tourist visits (simplified Jan 2024 for US-based applicants)
 *             • Duration of stay: normally 30–60 days per entry
 *             • Validity: up to 10 years for US passport holders (multiple-entry)
 *             • Processing: 4 working days regular; 2–3 days expedited
 *             • 240-hour (10-day) transit visa-free policy available for eligible transit nationalities
 *             • Some countries have unilateral visa-free access — always check current exemptions
 *             • OLD DATA: File said "Invitation Letter for Tourist visit" — this is NOT required for most applicants
 *
 * [M]       Business Visa (M)
 *           https://us.china-embassy.gov.cn/eng/lsfw/zj/
 *           https://www.onlinevisaguide.com/article/details/3557/china-business-visa-m-visa-requirements
 *           Key facts verified:
 *             • Invitation Letter from a Chinese company/entity IS required for M visa (unlike L)
 *             • Duration of stay: normally 30–60 days per entry
 *             • Validity: up to 10 years for US passport holders (multiple-entry)
 *             • Processing: 4–7 working days
 *             • F visa: previously business visa — now for non-commercial exchanges (lectures, research)
 *             • APEC Business Travel Card can substitute for M visa
 *             • OLD DATA: Missing stay duration, validity, processing time update
 *
 * [Z]       Work Visa (Z)
 *           https://asanify.com/blog/employer-of-record-china/work-permit-visa-china-2025-requirements/
 *           https://fdichina.com/blog/guide-to-china-work-permits/
 *           https://employsome.com/blog/work-visa-china/ (March 2026 update)
 *           Key facts verified (MAJOR CORRECTIONS):
 *             *** CRITICAL: Z visa requires THREE separate documents to work legally:
 *                 1. Notification Letter of Foreigner's Work Permit (obtained by employer FIRST)
 *                 2. Z Visa (obtained abroad using the notification letter)
 *                 3. Residence Permit for Work (obtained within 30 days of arriving in China)
 *             • Three-tier classification system (A/B/C based on points):
 *                 - Class A: High-end talent — 85+ points (executives, top researchers, very high salary)
 *                 - Class B: Professional talent — 60–84 points (bachelor's degree + 2 years experience)
 *                 - Class C: General/temporary workers — below 60 points (quotas apply)
 *             • Class B minimum: bachelor's degree + 2 years relevant work experience
 *             • Employer must be a legally registered Chinese entity authorized to hire foreigners
 *             • Criminal record check (notarized and authenticated) required
 *             • Medical examination required (Foreigner Physical Examination Form)
 *             • Degree certificates must be authenticated/notarized
 *             • Since June 6, 2022: special invitation letter for work visas no longer required
 *             • Processing: ~2–4 weeks for Work Permit Notification Letter; then 4–7 days for Z visa
 *             • Feb 2026: Beijing and Shanghai resumed strict enforcement of salary thresholds
 *               (Class A: 6× local average wage; Class B: 4× local average wage for salary pathway)
 *             • Age limit: generally 18–60; exceptions for senior professionals
 *             • OLD DATA: File said "4 to 10 business days" and omitted the 3-step process entirely.
 *               The criteria only listed "Notification Letter" without employer requirements or degree auth.
 *
 * ──────────────────────────────────────────────────────────────────
 * General disclaimer: This data is for guidance only. Chinese immigration
 * policy changes frequently. Always verify on the official Chinese embassy/
 * consulate website for your country or the COVA system at consular.mfa.gov.cn.
 * Consult a registered immigration consultant for legal advice.
 * ──────────────────────────────────────────────────────────────────
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "STUDY") {
    if (a.studyDuration === "LONG")  c.push("CN-STUDENT-X1");
    if (a.studyDuration === "SHORT") c.push("CN-STUDENT-X2");
    if (!a.studyDuration)            c.push("CN-STUDENT-X1", "CN-STUDENT-X2");
  }

  if (a.purpose === "VISIT") {
    c.push("CN-TOURIST-L");
  }

  if (a.purpose === "WORK") {
    c.push("CN-WORK-Z");
  }

  if (a.purpose === "BUSINESS") {
    c.push("CN-BUSINESS-M");
  }

  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  const steps: Step[] = [];

  if (a.purpose === "STUDY") {
    steps.push({
      id: "studyDuration",
      type: "options",
      field: "studyDuration",
      title: "How long is your course?",
      subtitle: "This determines whether you need an X1 (long-term, converts to Residence Permit) or X2 (short-term, single entry).",
      options: [
        {
          label: "Long term — more than 180 days",
          value: "LONG",
          sub: "Degree programs, full academic year, multi-semester exchange (X1 visa)",
        },
        {
          label: "Short term — 180 days or less",
          value: "SHORT",
          sub: "Language courses, short workshops, one-semester exchange (X2 visa)",
        },
      ],
      canProceed: !!a.studyDuration,
    });
  }

  return steps;
}

export const CHINA_DATA: CountryData = {
  country: "China",
  code: "CN",
  flag: "🇨🇳",
  purposes: [
    {
      label: "Study in China",
      value: "STUDY",
      sub: "Enroll in a Chinese university or training school (X1 or X2 visa)",
    },
    {
      label: "Tourist / Family Visit",
      value: "VISIT",
      sub: "Short trip for leisure, sightseeing, or visiting family (L visa)",
    },
    {
      label: "Work in China",
      value: "WORK",
      sub: "Accept a full-time job offer at a Chinese-registered employer (Z visa)",
    },
    {
      label: "Business Activities",
      value: "BUSINESS",
      sub: "Attend trade fairs, sign contracts, or conduct commercial negotiations (M visa)",
    },
  ],

  getCandidateCodes,
  buildFollowUpSteps,
  officialSources: [
    { label: "COVA / MFA.gov.cn", url: "https://consular.mfa.gov.cn/LANGUAGE/" },
    { label: "VisaForChina.cn", url: "https://www.visaforchina.cn/" },
  ],

  visas: {
    // ──────────────────────────────────────────────────────────────
    // STUDENT VISA — X1 (Long-term, > 180 days)
    // Source: visaforchina.cn / Beijing Gov study visa guide (Sep 2024)
    // Key 2025 update: New COVA system (Sep 30 2025), DQ form for some X2 programs
    // ──────────────────────────────────────────────────────────────
    "CN-STUDENT-X1": {
      code: "X1",
      label: "Student Visa (Long-term, X1)",
      badge: "Study",
      color: "#6366F1",
      description:
        "For international students studying in China for more than 180 days — degree programs, full academic years, and multi-semester exchanges. After entering China on an X1 visa, you MUST apply for a Residence Permit at the local Exit-Entry Administration Bureau within 30 days of arrival.",
      criteria: [
        "Original Admission Notice from the Chinese school or university (must have official stamp).",
        "JW201 or JW202 form issued by the Chinese Ministry of Education (JW201 for scholarship students; JW202 for self-funded students). Some institutions use a DQ form for programs 30–180 days.",
        "Valid passport with at least 6 months remaining validity and at least 2 blank visa pages.",
        "Foreigner Physical Examination Record from an authorized hospital — required for all X1 applicants (stays over 180 days).",
        "Completed online COVA visa application form (consular.mfa.gov.cn) with passport photo.",
        "Proof of financial support (bank statements or scholarship certificate — typically USD 5,000–10,000 or equivalent for the first year).",
        "After arrival: must apply for a Residence Permit within 30 days and register with the local police station within 24 hours of arrival.",
      ],
      processing:
        "4 working days (regular). Expedited options may be available depending on the embassy or consulate in your country.",
      forms: [
        "COVA Online Application Form (consular.mfa.gov.cn)",
        "JW201 or JW202 form (from institution)",
        "Original Admission Notice (from institution)",
        "Foreigner Physical Examination Record",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // STUDENT VISA — X2 (Short-term, ≤ 180 days)
    // Source: visaforchina.cn / Fudan University ISO / XJTLU guidelines
    // Key fact: X2 is single-entry and cannot be converted to Residence Permit
    // ──────────────────────────────────────────────────────────────
    "CN-STUDENT-X2": {
      code: "X2",
      label: "Student Visa (Short-term, X2)",
      badge: "Study",
      color: "#6366F1",
      description:
        "For students studying in China for 180 days or less — language courses, short exchanges, and one-semester programs. X2 is typically single-entry and cannot be extended or converted into a Residence Permit. You must depart before your permitted stay expires.",
      criteria: [
        "Original Admission Notice from a recognized Chinese educational institution.",
        "Completed COVA online visa application form with passport photo.",
        "Valid passport with at least 6 months remaining validity.",
        "JW202 or DQ form from the institution (DQ form is used for programs of 30–180 days at some universities; check with your institution).",
        "Proof of financial support (if requested by embassy).",
        "Physical Examination Record is generally NOT required for short-term X2 applicants, but some embassies may request it.",
      ],
      processing:
        "4 working days (regular). Always apply several weeks before your program start date.",
      forms: [
        "COVA Online Application Form (consular.mfa.gov.cn)",
        "DQ form or JW202 (from institution — confirm which applies to your program)",
        "Original Admission Notice",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // TOURIST VISA — L
    // Source: us.china-embassy.gov.cn (updated Sep 2025 requirements)
    // Key 2024 update: Invitation letter NOT required for tourist visits (US applicants Jan 2024)
    // 240-hour transit visa-free available for eligible nationalities
    // ──────────────────────────────────────────────────────────────
    "CN-TOURIST-L": {
      code: "L",
      label: "Tourist / Visit Visa (L)",
      badge: "Visit",
      color: "#6366F1",
      description:
        "For individuals visiting China for tourism, sightseeing, or visiting family and friends. Duration of stay is typically 30–60 days per entry. US passport holders can receive validity of up to 10 years (multiple-entry). Note: Some nationalities have unilateral visa-free access or qualify for the 240-hour (10-day) transit visa-free policy — check your country's current exemptions before applying.",
      criteria: [
        "Valid passport with at least 6 months remaining validity and at least 2 blank visa pages.",
        "Completed COVA online visa application form with recent passport photo.",
        "Proof of travel plans: round-trip flight confirmation and hotel reservation (requirement varies by country and consulate).",
        "Invitation Letter from a Chinese host is optional for most tourist applicants — NOT required for US-based applicants since January 2024 simplification. Check your local embassy's current requirements.",
        "Proof of sufficient funds to cover your stay.",
        "No intention to work, study, or engage in commercial activities during the visit.",
      ],
      processing:
        "4 working days (regular); 2–3 working days (expedited) — fees vary by nationality and consulate.",
      forms: [
        "COVA Online Application Form (consular.mfa.gov.cn)",
        "Round-trip flight confirmation + hotel reservation (if required)",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // BUSINESS VISA — M
    // Source: us.china-embassy.gov.cn / onlinevisaguide.com (2025)
    // Key fact: Invitation letter IS required for M visa (unlike L visa)
    // Stay: 30–60 days per entry; processing 4–7 working days
    // ──────────────────────────────────────────────────────────────
    "CN-BUSINESS-M": {
      code: "M",
      label: "Business / Commercial Visa (M)",
      badge: "Business",
      color: T.primary,
      description:
        "For foreign nationals entering China for commercial and trade activities — attending trade fairs, factory inspections, contract negotiations, or business meetings. Does NOT permit actual employment in China. Duration of stay is typically 30–60 days per entry; US passport holders may receive up to 10 years multiple-entry validity.",
      criteria: [
        "Invitation Letter from the Chinese company or commercial entity — must state the visitor's name, purpose of visit, itinerary, dates, and who is bearing costs. Vague or incomplete letters are a common cause of rejection.",
        "Valid passport with at least 6 months remaining validity and at least 2 blank visa pages.",
        "Completed COVA online visa application form with recent passport photo.",
        "Proof of your own company or employment (business card, company letter, or registration documents).",
        "Genuine commercial purpose — not for carrying out employment duties. If you will work or be stationed long-term in China, a Z visa is required instead.",
      ],
      processing:
        "4–7 working days (regular). During peak trade fair seasons, allow extra time. Expedited options may be available.",
      forms: [
        "COVA Online Application Form (consular.mfa.gov.cn)",
        "Invitation Letter from Chinese company/entity",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // WORK VISA — Z
    // Source: asanify.com (Oct 2025), fdichina.com (Jan 2025), employsome.com (Mar 2026)
    // MAJOR CORRECTIONS from original data:
    //   • 3-step process: Work Permit Notification → Z Visa → Residence Permit
    //   • Three-tier classification (A/B/C points system)
    //   • Min Class B: bachelor's + 2 years experience
    //   • Criminal check + degree authentication required
    //   • Must apply for Residence Permit within 30 days of arrival
    //   • Age limit: 18–60 (exceptions for senior professionals)
    //   • Feb 2026: strict salary threshold enforcement (Beijing/Shanghai)
    // ──────────────────────────────────────────────────────────────
    "CN-WORK-Z": {
      code: "Z",
      label: "Work Visa (Z)",
      badge: "Work",
      color: T.primary,
      description:
        "The Z Visa allows foreign nationals to enter China for the purpose of long-term employment. Legally working in China requires THREE separate documents: (1) a Notification Letter of Foreigner's Work Permit (obtained by your employer before you apply), (2) the Z Visa itself (obtained at a Chinese embassy/consulate abroad), and (3) a Residence Permit for Work (obtained within 30 days of arrival in China).",
      criteria: [
        "Confirmed job offer from a Chinese-registered employer who is legally authorized to hire foreign nationals.",
        "Your employer must first obtain the Notification Letter of Foreigner's Work Permit from the local labor authority (SAFEA). This is the critical first step — the Z visa cannot be applied for without this letter.",
        "Meet the Work Permit classification tier: Class B minimum requires a bachelor's degree or higher AND at least 2 years of relevant full-time work experience. Class A is for top-tier talent (senior executives, globally recognized experts, very high earners).",
        "Foreigner Physical Examination Record from an authorized hospital (required for most applicants).",
        "Police Clearance Certificate (criminal background check — must be notarized and authenticated).",
        "Educational degree certificates (must be notarized and authenticated by the relevant authorities).",
        "Age: generally 18–60 years old. Exceptions apply for senior professionals.",
        "After arrival: must apply for a Residence Permit for Work at the local Exit-Entry Administration Bureau within 30 days of entering China.",
      ],
      processing:
        "Step 1 — Work Permit Notification Letter: approximately 2–4 weeks (employer-side process). Step 2 — Z Visa: 4–7 working days after submitting to Chinese embassy/consulate. Step 3 — Residence Permit: obtained within 30 days of arrival.",
      forms: [
        "Work Permit Notification Letter (employer applies on your behalf)",
        "COVA Online Application Form (consular.mfa.gov.cn)",
        "Foreigner Physical Examination Record",
        "Police Clearance Certificate (notarized and authenticated)",
        "Authenticated degree certificates",
        "Employment contract",
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // GATE QUESTIONS
  // Expanded from original — added X2, L, M, Z gate questions.
  // Source URLs link to official Chinese embassy or consulate pages.
  // ──────────────────────────────────────────────────────────────
  gateQuestions: {
    "CN-STUDENT-X1": [
      {
        id: "admission",
        question:
          "Do you have the original Admission Notice (with official university stamp) from a recognized Chinese institution?",
        source:
          "Chinese Visa Application Service Center — X1 Student Visa requirements",
        sourceUrl: "https://www.visaforchina.cn/",
        passWith: ["YES"],
        failMsg:
          "The original Admission Notice is mandatory. Your institution will send it after enrollment and deposit payment. Copies alone are generally not accepted.",
        options: [
          { label: "Yes — I have the original Admission Notice", value: "YES" },
          {
            label: "No — I haven't received it yet",
            value: "NO",
          },
        ],
      },
      {
        id: "jw_form",
        question:
          "Have you received a JW201 or JW202 form from the Chinese Ministry of Education through your institution?",
        source:
          "Chinese Visa Application Service Center — JW201/JW202 requirement for long-term study",
        sourceUrl: "https://www.visaforchina.cn/",
        passWith: ["YES"],
        failMsg:
          "The JW201 or JW202 form is mandatory for X1 visa applications. JW201 is for scholarship-funded students; JW202 is for self-funded students. Your institution applies for this on your behalf after enrollment confirmation — it can take several weeks.",
        options: [
          {
            label: "Yes — I have my JW201 or JW202 form",
            value: "YES",
          },
          {
            label: "No — my institution hasn't issued it yet",
            value: "NO",
          },
        ],
      },
      {
        id: "medical_exam",
        question:
          "Have you completed the Foreigner Physical Examination at an authorized hospital (required for all X1 stays over 180 days)?",
        source:
          "Chinese Visa Application Service Center — Physical Examination requirement for X1",
        sourceUrl: "https://www.visaforchina.cn/",
        passWith: ["YES", "ARRANGED"],
        failMsg:
          "A physical examination at an authorized hospital is required for X1 visas (stays over 180 days). The examination must be done on the official Foreigner Physical Examination Form. Contact your institution for the list of authorized hospitals in China — or check with the Chinese embassy in your country about completing this before departure.",
        options: [
          {
            label: "Yes — I have the completed Foreigner Physical Examination Record",
            value: "YES",
          },
          {
            label: "I will complete it in China shortly after arrival (some embassies allow this)",
            value: "ARRANGED",
          },
          { label: "No — I haven't done this yet", value: "NO" },
        ],
      },
    ],

    "CN-STUDENT-X2": [
      {
        id: "admission_x2",
        question:
          "Do you have the original Admission Notice from your Chinese institution confirming a program of 180 days or less?",
        source:
          "Chinese Visa Application Service Center — X2 Student Visa requirements",
        sourceUrl: "https://www.visaforchina.cn/",
        passWith: ["YES"],
        failMsg:
          "An original Admission Notice is required. Confirm the exact program duration — if your course is longer than 180 days, you will need an X1 visa (and a JW201/JW202 form) instead.",
        options: [
          { label: "Yes — I have the Admission Notice", value: "YES" },
          { label: "No — not received yet", value: "NO" },
        ],
      },
      {
        id: "dq_or_jw",
        question:
          "Has your institution issued you a DQ form or JW202 form for your short-term program?",
        source:
          "Chinese university guidelines — DQ/JW202 required for most X2 programs",
        sourceUrl: "https://www.visaforchina.cn/",
        passWith: ["YES", "NOT_REQUIRED"],
        failMsg:
          "Most Chinese institutions require a DQ form (for programs 30–180 days) or JW202 form for X2 visa applications. Check directly with your institution's international students office whether this applies to your program.",
        options: [
          {
            label: "Yes — I have a DQ or JW202 form from my institution",
            value: "YES",
          },
          {
            label: "My institution confirmed this form is not required for my program",
            value: "NOT_REQUIRED",
          },
          { label: "No — I haven't received one", value: "NO" },
        ],
      },
    ],

    "CN-TOURIST-L": [
      {
        id: "temp_visit",
        question:
          "Is the purpose of your visit to China purely tourism, sightseeing, or visiting family/friends — with no intention to work, study, or conduct commercial activities?",
        source:
          "Chinese Embassy — L Visa: Tourist/Visit purposes only",
        sourceUrl:
          "https://us.china-embassy.gov.cn/eng/lsfw/zj/",
        passWith: ["YES"],
        failMsg:
          "The L Tourist Visa is for temporary visits only. Working in China requires a Z visa; studying requires an X visa; business activities require an M visa. Entering on an L visa and engaging in unauthorized activities can result in fines, detention, or deportation.",
        options: [
          {
            label: "Yes — purely tourism, sightseeing, or visiting family/friends",
            value: "YES",
          },
          {
            label:
              "No — I also plan to work, study, or conduct business",
            value: "NO",
          },
        ],
      },
      {
        id: "travel_docs",
        question:
          "Do you have a confirmed itinerary — round-trip flight confirmation and hotel reservation?",
        source:
          "Chinese Embassy — L visa supporting documents",
        sourceUrl:
          "https://us.china-embassy.gov.au/eng/lsfw/zj/",
        passWith: ["YES", "PARTIAL"],
        failMsg:
          "Most consulates require proof of your round-trip travel and accommodation plans. Without these, your application may be delayed or refused. Some consulates (like those serving US-based applicants since Jan 2024) have simplified requirements — check your local embassy's current checklist.",
        options: [
          {
            label:
              "Yes — I have both flight and hotel confirmed",
            value: "YES",
          },
          {
            label:
              "I have one but not both — or my local embassy has simplified requirements",
            value: "PARTIAL",
          },
          { label: "No — I have neither yet", value: "NO" },
        ],
      },
    ],

    "CN-BUSINESS-M": [
      {
        id: "invitation_letter",
        question:
          "Do you have a formal Invitation Letter from a Chinese company or commercial entity for your business visit?",
        source:
          "Chinese Embassy — M Visa: Invitation Letter required for business visits",
        sourceUrl:
          "https://us.china-embassy.gov.cn/eng/lsfw/zj/",
        passWith: ["YES"],
        failMsg:
          "A detailed Invitation Letter from a recognized Chinese company or entity is mandatory for the M visa. The letter must clearly state your name, passport number, purpose and dates of visit, and who is responsible for covering your expenses. Vague or informal letters are a frequent cause of refusal.",
        options: [
          {
            label:
              "Yes — I have an official Invitation Letter from the Chinese entity",
            value: "YES",
          },
          {
            label: "No — I don't have a formal invitation yet",
            value: "NO",
          },
        ],
      },
      {
        id: "commercial_purpose",
        question:
          "Will your activities in China be limited to commercial/trade activities (meetings, trade fairs, factory visits, contract signing) — and NOT actual employment in China?",
        source:
          "Chinese Embassy — M visa is for commercial activity only; employment requires Z visa",
        sourceUrl:
          "https://us.china-embassy.gov.cn/eng/lsfw/zj/",
        passWith: ["YES"],
        failMsg:
          "The M visa only covers commercial and trade-related visits. If you will be employed by a Chinese company, set up an office, or carry out regular work duties in China, you need a Z Work Visa with a valid Foreigner's Work Permit.",
        options: [
          {
            label:
              "Yes — meetings, trade fairs, negotiations, or inspections only",
            value: "YES",
          },
          {
            label: "No — I will also carry out employment duties",
            value: "NO",
          },
        ],
      },
    ],

    "CN-WORK-Z": [
      {
        id: "employer_registered",
        question:
          "Is your Chinese employer a legally registered company in China that is authorized to hire foreign nationals?",
        source:
          "China Z Visa — employer must hold valid business license and authorization to hire foreigners",
        sourceUrl:
          "https://asanify.com/blog/employer-of-record-china/work-permit-visa-china-2025-requirements/",
        passWith: ["YES"],
        failMsg:
          "Your employer must be a legally registered Chinese entity (with valid business license) that has authorization to hire foreign workers. Without this, they cannot apply for the Work Permit Notification Letter on your behalf. If you're not sure, ask your HR department to confirm.",
        options: [
          {
            label:
              "Yes — my employer is a registered Chinese entity authorized to hire foreigners",
            value: "YES",
          },
          {
            label:
              "No / I'm not sure about my employer's legal status",
            value: "NO",
          },
        ],
      },
      {
        id: "work_permit_notification",
        question:
          "Has your employer applied for (or already received) the Notification Letter of Foreigner's Work Permit from Chinese authorities?",
        source:
          "China Z Visa — Step 1: Employer must obtain Work Permit Notification before Z visa application",
        sourceUrl:
          "https://fdichina.com/blog/guide-to-china-work-permits/",
        passWith: ["YES", "IN_PROGRESS"],
        failMsg:
          "The Notification Letter of Foreigner's Work Permit must be obtained by your employer before you can apply for the Z visa at a Chinese embassy. This is Step 1 of the process and takes approximately 2–4 weeks. Without it, you cannot apply for the Z visa.",
        options: [
          {
            label:
              "Yes — employer has the notification letter ready",
            value: "YES",
          },
          {
            label: "In progress — my employer has applied and is awaiting approval",
            value: "IN_PROGRESS",
          },
          {
            label: "No — my employer hasn't started this process yet",
            value: "NO",
          },
        ],
      },
      {
        id: "qualifications",
        question:
          "Do you meet at least Class B work permit criteria: a bachelor's degree or higher AND at least 2 years of relevant full-time work experience?",
        source:
          "China Foreign Work Permit — Three-tier classification (A/B/C); Class B minimum requirements",
        sourceUrl:
          "https://fdichina.com/blog/guide-to-china-work-permits/",
        passWith: ["CLASS_A", "CLASS_B"],
        failMsg:
          "The minimum for a standard work permit (Class B) is a bachelor's degree plus 2 years of relevant experience. Without these qualifications, obtaining a work permit is very difficult unless you qualify under Class C (short-term/quota positions) or are a foreign language teacher with appropriate credentials. Recent graduates without 2 years of experience will likely not qualify.",
        options: [
          {
            label:
              "Class A — I am top-tier talent (senior executive, globally recognized expert, or very high earner)",
            value: "CLASS_A",
          },
          {
            label:
              "Class B — I have a bachelor's degree or higher + 2 years of relevant work experience",
            value: "CLASS_B",
          },
          {
            label:
              "No — I don't yet have a bachelor's degree or 2 years of experience",
            value: "NO",
          },
        ],
      },
    ],
  },
};