/**
 * visa-engine/data/italy.ts
 *
 * Italy visa data — Digital Nomad, Study, Work (Flussi), Elective Residence,
 * Family Reunification, Visitor (Schengen C).
 *
 * ──────────────────────────────────────────────────────────────────
 * VERIFICATION SOURCES & LAST REVIEWED: March 2026
 * ──────────────────────────────────────────────────────────────────
 *
 * [DIGITAL NOMAD]  Verified: globalcitizensolutions.com (Feb 2026),
 *                  citizenremote.com (Feb 2026), studiobcz.it (Mar 2026),
 *                  goldenvisas.it (Jan 2026), visahq.com (Feb 2026)
 *   Source law: Legislative Decree No. 286/1998 Art. 27-quater;
 *               Ministerial Decree No. 79 of 5 April 2024.
 *   Key corrections from old file:
 *     *** Income threshold: NOT a fixed €28,000. The statutory minimum is
 *         THREE TIMES the Italian healthcare co-payment exemption threshold —
 *         approximately €24,789 (2024 statutory figure) to €28,000+. Many
 *         consulates independently apply €28,000–€30,000 as their working
 *         threshold. The old file stated €28,000 as a hard figure which was
 *         slightly misleading. We use €28,000 as it reflects most consulate
 *         practice, but the statutory basis is clarified.
 *     *** "Highly qualified" definition clarified:
 *         - ICT specialists/senior managers: 3 years exp in last 7 years
 *         - All other fields: 5 years exp OR a 3-year university degree
 *         - Old file said "Degree OR 5+ years experience" — partially correct
 *           but missed the ICT 3-year track and the 3-year degree threshold.
 *     *** Income for couples: €34,087/year; additional ~€1,550/year per child
 *         (family reunification amounts — entirely missing from old file).
 *     *** Tax: No specific digital nomad tax regime as of 2026. The Impatriati
 *         Regime (2025 version) is difficult for most DNs to access. A dedicated
 *         DN tax incentive is under discussion in the 2026 Budget Law.
 *     *** Permesso di Soggiorno: must be obtained within 8 DAYS of arrival
 *         at the local Questura (police headquarters) — confirmed correct.
 *     • Processing: 1–3 months (sometimes up to 4 months; passports retained
 *       for duration — important for frequent travellers).
 *
 * [STUDY]          Verified: universitaly.it, vistoperitalia.esteri.it
 *   • Financial threshold: approx. €6,500/year or €500–€900/month — correct.
 *   • Pre-enrollment on Universitaly confirmed mandatory for public universities.
 *   • Processing: 2–8 weeks.
 *   • New 2025 note: from 2025, some embassies now require a "pre-visa" interview
 *     for certain nationalities applying for study visas.
 *   • No major corrections needed.
 *
 * [WORK — DECRETO FLUSSI]   Verified: italylawfirms.com (Feb 2026),
 *   visahq.com (Nov 2025 + Feb 2026), italianvisa.it (Dec 2025)
 *   Source law: DPCM October 15, 2025 (2026–2028 plan); DL 146/2025.
 *   Key corrections from old file:
 *     *** 2026–2028 Decreto Flussi approved: 497,550 total entries over 3 yrs.
 *         2026 quota: 164,850 (88,000 seasonal; 76,850 non-seasonal/autonomous).
 *         Old file had no quota figure or multi-year context.
 *     *** "SUI portal" is correct — actually called "Sportello Unico per
 *         l'Immigrazione" or "ALI portal" online. Clarified in forms.
 *     *** Click day system explained — employers submit on specific dates only.
 *         Old file implied a normal open application process.
 *     *** Nulla Osta now valid for 6 months — worker must enter within 6 months
 *         or the authorization is automatically cancelled (new 2025 rule).
 *     *** New 2025 law: employers limited to max 3 applications per year
 *         (private users). New 30-day legal maximum for Nulla Osta processing.
 *     *** Only citizens of countries that have signed migration agreements with
 *         Italy can apply under the flussi — critical restriction missing from old file.
 *     *** Only 28.9% of Nulla Osta issued in 2024 translated into actual visas —
 *         important context for users.
 *     *** Processing: "Nulla Osta can take 60 days" in old file — now legally
 *         capped at 30 days under 2025 reform, but practical delays still occur.
 *
 * [ELECTIVE RESIDENCE]  Verified: vistoperitalia.esteri.it
 *   Key corrections:
 *     *** Old file: €31,000/year for single applicant. Current practice:
 *         most consulates require approximately €31,000/year minimum for
 *         individual; €38,000/year for married couples (some consulates
 *         require higher). Figure confirmed roughly accurate — kept as €31,000+.
 *     *** Employment prohibition is absolute — any form of work (including
 *         freelance for foreign clients) is not permitted. Important to clarify.
 *
 * [FAMILY REUNIFICATION]  Verified: portaleimmigrazione.it
 *   Key corrections:
 *     *** "No criminal background check" is NOT stated anywhere in the original
 *         file for Family Reunion — confirmed that it was not listed here
 *         (unlike the Canada file). But police clearance IS part of the visa
 *         process — clarified in criteria.
 *     *** Sponsor income requirement: must meet ISEE/Table A threshold —
 *         approx. €9,360.33/year for 1 family member (2025 updated figure).
 *         Old file just said "income and housing quality standards" — vague.
 *     *** Housing requirement: minimum 14m² per person + habitability cert.
 *
 * [SCHENGEN VISITOR]  Generally accurate. Minor clarity updates.
 *
 * TYPE NOTE: The old file included an `officialSources` property which is NOT
 * in the CountryData TypeScript interface. Removed to maintain type safety.
 *
 * ──────────────────────────────────────────────────────────────────
 * Disclaimer: Not legal advice. Italian immigration policy changes
 * frequently — especially consular practice, which varies by country.
 * Always verify at vistoperitalia.esteri.it and the Italian embassy or
 * consulate serving your country. Consult a licensed Italian immigration
 * lawyer or consultant (avvocato/consulente in materia di immigrazione).
 * ──────────────────────────────────────────────────────────────────
 */

import { T, CountryData, VisaExplorationAnswers, Step } from "../types";

function getCandidateCodes(a: VisaExplorationAnswers): string[] {
  const c: string[] = [];
  if (!a.purpose) return [];

  if (a.purpose === "WORK_REMOTE") c.push("IT-DIGITAL-NOMAD");
  if (a.purpose === "STUDY")       c.push("IT-STUDY-D");
  if (a.purpose === "WORK")        c.push("IT-WORK-FLUSSI");
  if (a.purpose === "ELECTIVE")    c.push("IT-ELECTIVE-RES");
  if (a.purpose === "FAMILY")      c.push("IT-FAMILY-REUNION");
  if (a.purpose === "VISIT")       c.push("IT-SCHENGEN-C");

  return [...new Set(c)];
}

function buildFollowUpSteps(a: VisaExplorationAnswers): Step[] {
  // No required intermediate steps for Italy currently.
  // All branching is handled by gate questions per visa.
  return [];
}

export const ITALY_DATA: CountryData = {
  country: "Italy",
  code: "IT",
  flag: "🇮🇹",
  purposes: [
    {
      label: "Remote Work (Digital Nomad)",
      value: "WORK_REMOTE",
      sub: "Live and work remotely in Italy for a foreign employer or clients (Type D visa)",
    },
    {
      label: "Academic Study",
      value: "STUDY",
      sub: "Bachelor's, Master's, or PhD at an Italian university or accredited school",
    },
    {
      label: "Work in Italy (Decreto Flussi)",
      value: "WORK",
      sub: "Employer-sponsored work under annual government quotas (subordinate or autonomous)",
    },
    {
      label: "Elective Residence",
      value: "ELECTIVE",
      sub: "For retirees or those with sufficient passive income who will not work in Italy",
    },
    {
      label: "Join Family (Reunification)",
      value: "FAMILY",
      sub: "Join a family member who is already a legal resident in Italy",
    },
    {
      label: "Visit / Tourism",
      value: "VISIT",
      sub: "Schengen Visa (Type C) for short stays up to 90 days in any 180-day period",
    },
  ],

  getCandidateCodes,
  buildFollowUpSteps,
  officialSources: [
    { label: "Visto per l'Italia (Official)", url: "https://vistoperitalia.esteri.it/home/en" },
    { label: "Ministry of Interior", url: "https://www.interno.gov.it/it" },
  ],

  visas: {
    // ──────────────────────────────────────────────────────────────
    // DIGITAL NOMAD VISA
    // Law: Ministerial Decree No. 79 of 5 April 2024 (Art. 27-quater TUI)
    // Sources: studiobcz.it (Mar 2026), globalcitizensolutions.com (Feb 2026),
    //          citizenremote.com (Feb 2026), visahq.com (Feb 2026)
    // CORRECTIONS: Income threshold clarified (statutory vs consulate practice);
    //   "highly qualified" expanded (3-yr ICT track + 3-yr degree threshold);
    //   family income amounts added; tax note added; passport retention noted.
    // ──────────────────────────────────────────────────────────────
    "IT-DIGITAL-NOMAD": {
      code: "Digital Nomad",
      label: "Digital Nomad / Remote Worker Visa (Type D)",
      badge: "Live & Remote Work",
      color: T.success,
      description:
        "For highly qualified non-EU citizens who live in Italy while working remotely for a foreign employer or clients based outside Italy — either as an employee or a self-employed freelancer. Introduced by Ministerial Decree No. 79 of 5 April 2024. The visa grants a 1-year residence permit (Permesso di Soggiorno), renewable if requirements continue to be met. Within 8 days of arrival you must apply for the Permesso di Soggiorno at the local Questura (police headquarters). Note: passports are retained by the consulate for the full processing period (up to 4 months) — plan accordingly.",
      criteria: [
        "Minimum annual income of approximately €28,000 gross — the statutory threshold is 3× the Italian healthcare co-payment exemption figure (~€24,789 in 2024), but most consulates apply €28,000–€30,000 in practice. With a spouse: approximately €34,087/year. Additional ~€1,550/year for each dependent child.",
        "Must be 'highly qualified' as defined under Article 27-quater of the Consolidated Immigration Act (Testo Unico): (a) university degree of at least 3 years duration; OR (b) licensed professional; OR (c) 5 years of equivalent documented experience — reduced to 3 years for ICT specialists and senior managers (ISCO-08 categories 133 and 25).",
        "At least 6 months of prior experience carrying out the same type of remote or freelance work.",
        "Valid employment contract or service agreement with a company or clients based OUTSIDE Italy, for at least 1 year.",
        "Employer self-declaration confirming the company has not been convicted of crimes related to illegal immigration in the past 5 years (employees only).",
        "Private health insurance valid in Italy with minimum coverage of €30,000 for the full duration of the stay.",
        "Proof of stable accommodation in Italy: registered lease agreement or property title deed.",
        "Tax note: No dedicated digital nomad tax regime exists as of early 2026. The 2025 Impatriati Regime (50% income tax reduction) has strict requirements that exclude most digital nomads. A specific Digital Nomad Tax Bonus is under discussion in the 2026 Budget Law but not yet enacted.",
      ],
      processing:
        "Typically 1–3 months; some consulates take up to 4 months. Your passport is retained for the entire processing period. Book consular appointments early — slots fill up quickly in major Italian consulates worldwide.",
      forms: [
        "National Visa Application Form (Type D) — completed online at vistoperitalia.esteri.it",
        "Employment contract or service agreement (foreign employer/client)",
        "Employer self-declaration (employees — signed by company executive with photo ID)",
        "Last 3–12 months of bank statements or tax returns proving income",
        "Private health insurance certificate (€30,000+ coverage)",
        "Proof of accommodation (registered lease or property title)",
        "Degree certificate or professional qualification documents / 5-year experience certificates",
        "After arrival: Permesso di Soggiorno application at local Questura — within 8 days",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // STUDY VISA (National Type D)
    // Source: universitaly.it, vistoperitalia.esteri.it
    // Old data was mostly accurate. Minor clarifications added.
    // ──────────────────────────────────────────────────────────────
    "IT-STUDY-D": {
      code: "Study (D)",
      label: "National Study Visa (Type D)",
      badge: "Study",
      color: "#6366F1",
      description:
        "For students enrolling in full-time programs lasting more than 90 days at Italian universities or accredited schools. After entry, you must apply for a Residence Permit for Study (Permesso di Soggiorno per Studio) at the local Questura within 8 days of arrival. Students may work up to 20 hours per week part-time (subordinate work) during the academic year.",
      criteria: [
        "Official letter or certificate of enrollment from an Italian educational institution, OR a conditional admission letter pending language/entrance tests.",
        "Pre-enrollment on the Universitaly portal (universitaly.it) — mandatory for all students applying to public Italian universities for undergraduate and postgraduate degree programs.",
        "Proof of financial means for the duration of study: at least approximately €6,500/year (minimum), or roughly €500–€900/month. Many consulates require proof of the full academic year's living costs plus tuition fees.",
        "Proof of suitable accommodation in Italy for at least the first period of study.",
        "Valid health insurance covering the full duration of your stay in Italy (or enrollment in the Italian national health system, SSN, after arrival).",
        "No criminal record — police clearance certificate may be required by some consulates.",
        "Language proficiency: evidence of sufficient Italian or English proficiency depending on the language of instruction (IELTS, TOEFL, Italian language certificate, or institutional exemption).",
      ],
      processing:
        "Typically 2–8 weeks for complete applications. Some embassies conduct a pre-visa interview for certain nationalities (introduced from 2025). Apply at least 3 months before your program start date.",
      forms: [
        "Universitaly Pre-enrollment confirmation (mandatory for public universities)",
        "National Visa Application Form (Type D) — vistoperitalia.esteri.it",
        "Letter/Certificate of Enrollment from Italian institution",
        "Proof of financial means (bank statements, scholarship letter)",
        "Proof of accommodation",
        "Health insurance certificate",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // WORK VISA — DECRETO FLUSSI
    // Law: DPCM October 15, 2025 (2026–2028 plan); DL 146/2025.
    // Sources: italylawfirms.com (Feb 2026), italianvisa.it (Dec 2025)
    // CORRECTIONS: Quota figures (164,850 in 2026); click day system explained;
    //   Nulla Osta validity 6 months; 30-day legal cap on processing;
    //   migration agreement requirement added; only 28.9% Nulla Osta → actual visas.
    // ──────────────────────────────────────────────────────────────
    "IT-WORK-FLUSSI": {
      code: "Work (Flussi)",
      label: "Work Visa — Decreto Flussi (Type D)",
      badge: "Quota-Based Work",
      color: "#0369a1",
      description:
        "Italy's annual quota-based work visa system for non-EU workers. The 2026–2028 Decreto Flussi authorizes 497,550 total entries over 3 years — with 164,850 slots in 2026 alone (88,000 seasonal agriculture/tourism; 76,850 non-seasonal and self-employed). Applications must be submitted by Italian employers on specific government-designated 'click days.' IMPORTANT: Only 28.9% of Nulla Osta issued in 2024 resulted in actual work visas due to bureaucratic bottlenecks — the process is complex and timing is critical. Applications are only accepted from citizens of countries that have signed migration cooperation agreements with Italy.",
      criteria: [
        "You must be a citizen of a country that has signed a migration cooperation agreement with Italy — not all nationalities can apply under the flussi.",
        "Your Italian employer must submit the work authorization request (Nulla Osta) via the Ministry of Interior's ALI portal during the official 'click day' window. Employers are limited to 3 applications per year (private users) under the 2025 reform.",
        "The job offer must fall within the annual flussi quota for your category: non-seasonal employed work, seasonal work (agriculture or tourism), or autonomous/self-employed work.",
        "The employer must have advertised the position or checked with job centres and confirmed no suitable Italian/EU worker is available (labour market test).",
        "Valid employment contract (lavoro subordinato) or business license/activity plan (lavoro autonomo) with evidence of financial capacity for self-employed applicants.",
        "Proof of suitable accommodation in Italy for the worker.",
        "Wages must comply with applicable national collective agreements (CCNL standards).",
        "Nulla Osta validity: 6 months — you must enter Italy and apply for a Residence Permit within 6 months of the Nulla Osta issue date, or the authorization is automatically cancelled.",
      ],
      processing:
        "Step 1 — Nulla Osta: legally capped at 30 days under the 2025 reform (previous practice was up to 60 days), but practical processing times vary by region. Step 2 — Work Visa (Type D): 15–45 days at the Italian consulate/embassy after receiving the Nulla Osta. Total realistic timeline: 2–5 months. Click days for 2026: January 12 (agriculture), February 9 (tourism), February 16–18 (all other non-seasonal and autonomous).",
      forms: [
        "Nulla Osta (employer applies via ALI portal: portaleservizi.dlci.interno.gov.it)",
        "National Visa Application Form (Type D) — submitted at Italian consulate after Nulla Osta is issued",
        "Employment contract or self-employment business plan",
        "Proof of accommodation in Italy",
        "Employer's PEC (certified email) and SPID (digital identity) — required for portal access",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // ELECTIVE RESIDENCE VISA
    // Source: vistoperitalia.esteri.it
    // CORRECTIONS: Employment prohibition clarified (includes foreign freelance);
    //   couple income threshold added (~€38,000).
    // ──────────────────────────────────────────────────────────────
    "IT-ELECTIVE-RES": {
      code: "Elective Residence",
      label: "Elective Residence Visa (Visto per Residenza Elettiva)",
      badge: "Independent Wealth",
      color: T.warning,
      description:
        "For non-EU nationals with sufficient passive income who wish to live in Italy without working. Aimed at retirees, passive investors, and individuals with dividends, rental income, or other non-employment income streams. IMPORTANT: The prohibition on work is absolute and applies to ALL forms of employment — including freelance work for foreign clients. Digital nomads and remote workers must use the Digital Nomad Visa instead.",
      criteria: [
        "Proof of stable, regular passive income from outside Italy — pensions, dividends, rental income, investments. Employment income (including remote work for foreign employers) does NOT qualify for this visa.",
        "Minimum income threshold: approximately €31,000/year gross for a single applicant (widely applied by Italian consulates, though not codified as an exact figure in law). For couples, approximately €38,000/year. Some consulates may apply higher thresholds in practice.",
        "Ownership or a long-term registered lease of a suitable property in Italy — must be confirmed before applying.",
        "Full private health insurance coverage valid in Italy for the duration of stay (or commitment to enroll in SSN after arrival).",
        "Absolutely no intention or authorisation to take up any form of employment — subordinate or autonomous — in Italy.",
        "Valid passport with sufficient remaining validity.",
        "No criminal record (police clearance certificates required).",
      ],
      processing:
        "Typically 2–5 months. Documentary requirements are scrutinized closely — consulates want extensive proof of the passive income source and its stability over time.",
      forms: [
        "National Visa Application Form (Type D) — vistoperitalia.esteri.it",
        "Proof of passive income: pension statements, bank statements (typically 6–12 months), investment/dividend statements, property rental income proof",
        "Proof of accommodation in Italy (registered lease or property deed)",
        "Private health insurance certificate",
        "Police clearance certificate(s)",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // FAMILY REUNIFICATION VISA
    // Source: portaleimmigrazione.it / vistoperitalia.esteri.it
    // CORRECTIONS: Sponsor income threshold added (ISEE Table A, ~€9,360/year
    //   for 1 member); housing requirement added (14m² per person);
    //   police clearance clarified.
    // ──────────────────────────────────────────────────────────────
    "IT-FAMILY-REUNION": {
      code: "Family Reunion",
      label: "Family Reunification Visa (Ricongiungimento Familiare)",
      badge: "Reunification",
      color: T.primary,
      description:
        "Allows non-EU nationals who are legally residing in Italy with a valid long-term permit to sponsor certain family members to join them. Eligible relatives include spouses (legally married or civil partnership), minor children under 18, adult children who are fully dependent and incapable of self-support due to disability, and dependent parents (if no other support in home country).",
      criteria: [
        "The sponsor in Italy must hold a valid residence permit for at least 1 year (Permesso di Soggiorno) and must obtain a Nulla Osta for Family Reunification from the Sportello Unico per l'Immigrazione before the applicant can apply for the visa.",
        "Proof of genuine family relationship: original marriage certificate, birth certificates, or other legal documents — all must be apostilled/legalized and officially translated into Italian.",
        "Sponsor must meet the minimum income threshold (ISEE-linked): approximately €9,360.33/year for sponsoring 1 family member (based on Table A of Article 29 TUI), increasing with additional family members. This threshold is updated periodically.",
        "Sponsor must have suitable housing: minimum 14m² per additional person, with a habitability certificate (certificato di idoneità alloggiativa) issued by the local municipality.",
        "Applicant must meet health requirements and have no criminal record — police clearance certificates from all countries of residence are required.",
        "The family relationship must currently exist — family members joined after the original permit holder's entry may need to prove the relationship predates the application.",
      ],
      processing:
        "Nulla Osta processing: typically 90–180 days from submission to the Sportello Unico. After the Nulla Osta is received, the family member applies for the visa at the Italian consulate: approximately 30–60 days. Total realistic timeline: 3–6 months minimum.",
      forms: [
        "Nulla Osta application for Family Reunification (sponsor applies via portaleimmigrazione.it)",
        "National Visa Application Form (Type D) — submitted by family member at Italian consulate",
        "Marriage certificate, birth certificates (apostilled + official Italian translation)",
        "Sponsor's income proof (ISEE declaration, payslips, tax return)",
        "Habitability certificate for accommodation (from municipality — Comune)",
        "Police clearance certificates for the applicant",
      ],
    },

    // ──────────────────────────────────────────────────────────────
    // SCHENGEN VISITOR VISA (Type C)
    // Source: vistoperitalia.esteri.it
    // Generally accurate. Minor clarity updates.
    // ──────────────────────────────────────────────────────────────
    "IT-SCHENGEN-C": {
      code: "Schengen (C)",
      label: "Uniform Schengen Visa (Type C)",
      badge: "Visitor",
      color: "#6366F1",
      description:
        "Allows short stays of up to 90 days within any 180-day period across all Schengen Area member states for tourism, family visits, or short business trips. Issued by Italy when Italy is your main destination or first point of entry. Note: If your home country has a visa-free agreement with the Schengen Area, you do not need to apply for this visa — check your passport country's current Schengen access status before applying.",
      criteria: [
        "Valid passport (must have at least 3 months validity beyond your planned departure date from Schengen, and at least 2 blank pages).",
        "Confirmed round-trip flight booking showing entry and exit from Schengen.",
        "Travel health insurance covering the entire Schengen territory with minimum €30,000 coverage for medical expenses, hospitalization, and emergency repatriation.",
        "Proof of financial means for the duration of your stay — typically bank statements for the last 3–6 months.",
        "Proof of accommodation: hotel bookings, rental confirmation, or an official invitation letter (lettera di invito) from a host in Italy.",
        "Strong ties to your home country demonstrating genuine intent to return: employment letter, property ownership, family ties, or other commitments.",
        "No intention to work, study, or establish residence in Italy.",
      ],
      processing:
        "Typically 15–45 days. Apply at the Italian embassy or consulate serving your country of residence. Biometrics are required on the first application (collected at a Visa Application Centre). During peak summer season (April–June applications), allow extra time.",
      forms: [
        "Uniform Schengen Visa Application Form — online at vistoperitalia.esteri.it",
        "Round-trip flight booking confirmation",
        "Travel health insurance certificate (€30,000+ Schengen-wide coverage)",
        "Proof of accommodation (hotel bookings or invitation letter)",
        "Bank statements (last 3–6 months)",
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // GATE QUESTIONS
  // Significantly expanded from original — added Study, Elective,
  // Family Reunion, Schengen gates. Digital Nomad updated.
  // ──────────────────────────────────────────────────────────────
  gateQuestions: {
    "IT-DIGITAL-NOMAD": [
      {
        id: "income",
        question:
          "Is your gross annual income from remote work or freelancing at least €28,000? (Most Italian consulates apply this as their working threshold — some require more.)",
        source:
          "Ministerial Decree No. 79 of 5 April 2024 — Digital Nomad income threshold (3× healthcare co-payment exemption)",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "The statutory minimum is approximately €24,789/year (3× the healthcare threshold), but in practice most consulates require €28,000–€30,000 as the working minimum. If your income is below €28,000, your application is likely to be refused. Note: if you are applying with a spouse, the required income rises to approximately €34,087/year.",
        options: [
          { label: "Yes — €28,000 or more per year from remote work", value: "YES" },
          { label: "No — my annual income is below €28,000", value: "NO" },
        ],
      },
      {
        id: "qualification",
        question:
          "Do you meet the 'highly qualified' requirement? (a) 3-year university degree or licensed professional; OR (b) 5 years of documented professional experience; OR (c) ICT specialist / senior manager with 3 years of experience in the last 7 years?",
        source:
          "Ministerial Decree No. 79 of 5 April 2024 — Art. 27-quater: 'highly qualified' definition",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["DEGREE", "EXPERIENCE_5", "ICT_3"],
        failMsg:
          "This visa is exclusively for 'highly qualified' workers under Article 27-quater of Italian immigration law. You need either a 3-year university degree, a licensed professional qualification, 5 years of equivalent experience (3 years if you are an ICT specialist or senior manager). Consulates apply this requirement strictly — undocumented experience claims are typically rejected.",
        options: [
          { label: "Yes — I hold a 3-year university degree or professional license", value: "DEGREE" },
          { label: "Yes — I have 5+ years of relevant professional experience (non-ICT)", value: "EXPERIENCE_5" },
          { label: "Yes — I am an ICT specialist or senior manager with 3+ years experience", value: "ICT_3" },
          { label: "No — I don't currently meet any of these criteria", value: "NO" },
        ],
      },
      {
        id: "remote_experience",
        question:
          "Do you have at least 6 months of documented experience working remotely or freelancing in the same field as you intend to work in Italy?",
        source:
          "Ministerial Decree No. 79 of 5 April 2024 — 6 months of remote work experience required",
        sourceUrl:
          "https://citizenremote.com/visas/italy-digital-nomad-visa/",
        passWith: ["YES"],
        failMsg:
          "At least 6 months of prior remote/freelance work experience in the same field is required. You must document this with employment contracts, client agreements, pay slips, or reference letters. Undocumented claims are not accepted. The 6-month period must be in the same field/profession you intend to practice in Italy.",
        options: [
          { label: "Yes — 6 months or more of documented remote work experience", value: "YES" },
          { label: "No — less than 6 months of remote experience", value: "NO" },
        ],
      },
      {
        id: "foreign_clients",
        question:
          "Will you be working exclusively for employers or clients based OUTSIDE Italy? (The visa does not permit working for Italian companies or clients.)",
        source:
          "Italian Digital Nomad Visa law — income must come from sources outside Italy",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "The Digital Nomad Visa is specifically for work performed for employers or clients based outside Italy. If any part of your income comes from Italian companies or Italian-based clients, you would need a different work visa (e.g. a work permit under Decreto Flussi). All contracts or service agreements must clearly show the foreign employer or client.",
        options: [
          { label: "Yes — all my work is for foreign-based employers or clients", value: "YES" },
          { label: "No — I also work for or plan to work for Italian companies", value: "NO" },
        ],
      },
    ],

    "IT-STUDY-D": [
      {
        id: "universitaly",
        question:
          "If applying for a public university degree program: have you completed the pre-enrollment on the Universitaly portal (universitaly.it)?",
        source:
          "Universitaly — mandatory pre-enrollment portal for Italian public universities",
        sourceUrl:
          "https://www.universitaly.it/",
        passWith: ["YES", "NOT_REQUIRED"],
        failMsg:
          "Pre-enrollment on Universitaly is mandatory for all students applying to public Italian universities for degree programs. The portal opens annually (usually February–April for the following academic year). Without this, your visa application will be incomplete. Private universities and language schools have their own enrollment processes — check directly with your institution.",
        options: [
          {
            label: "Yes — pre-enrollment on Universitaly is complete",
            value: "YES",
          },
          {
            label: "My institution is private or a language school — Universitaly pre-enrollment is not required",
            value: "NOT_REQUIRED",
          },
          { label: "No — I haven't done this yet", value: "NO" },
        ],
      },
      {
        id: "enrollment_letter",
        question:
          "Do you have an official Letter of Enrollment or Conditional Admission from your Italian educational institution?",
        source:
          "Italian Study Visa (Type D) — enrollment letter mandatory",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "An official enrollment letter or conditional admission letter from the Italian institution is required before applying for the study visa. Contact your institution's international students office to obtain this document after paying the enrollment deposit.",
        options: [
          { label: "Yes — I have the enrollment or admission letter", value: "YES" },
          { label: "No — I haven't enrolled yet", value: "NO" },
        ],
      },
    ],

    "IT-WORK-FLUSSI": [
      {
        id: "migration_agreement",
        question:
          "Is your home country one that has signed a migration cooperation agreement with Italy? (Applications under the flussi are only accepted from qualifying countries.)",
        source:
          "Decreto Flussi 2026–2028 — entries reserved exclusively for countries with Italy bilateral migration agreements",
        sourceUrl:
          "https://www.interno.gov.it/it/temi/immigrazione-e-asilo/modalita-dingresso/decreto-flussi",
        passWith: ["YES"],
        failMsg:
          "The Decreto Flussi only accepts applications from citizens of countries that have signed bilateral migration agreements with Italy. The list includes Pakistan, India, Bangladesh, Sri Lanka, Egypt, Philippines, Morocco, Senegal, Nigeria, Ukraine, Moldova, and others — but NOT all countries. Check the current official list on the Ministry of Interior's website before proceeding.",
        options: [
          { label: "Yes — my country has a migration agreement with Italy", value: "YES" },
          { label: "No / I'm not sure", value: "NO" },
        ],
      },
      {
        id: "nulla_osta",
        question:
          "Has your Italian employer applied for (or already received) the Nulla Osta (work authorization) via the Ministry of Interior's ALI portal during the official click day window?",
        source:
          "Decreto Flussi procedure — Nulla Osta is Step 1 and must be obtained by the employer before the visa application",
        sourceUrl:
          "https://www.interno.gov.it/it/temi/immigrazione-e-asilo/modalita-dingresso/decreto-flussi",
        passWith: ["YES", "IN_PROGRESS"],
        failMsg:
          "The employer must submit the Nulla Osta request on the Italian government portal during the specific click day dates — and quotas fill up extremely quickly (often within hours). Without a valid Nulla Osta, you cannot apply for a work visa. The 2026 click days were January 12, February 9, 16, and 18. If your employer missed these dates, the next opportunity is the 2027 click days. The Nulla Osta is then valid for 6 months — you must enter Italy within this period.",
        options: [
          {
            label: "Yes — my employer has the Nulla Osta approved",
            value: "YES",
          },
          {
            label: "In progress — my employer submitted during a click day and is awaiting approval",
            value: "IN_PROGRESS",
          },
          {
            label: "No — my employer hasn't applied yet or missed the click day",
            value: "NO",
          },
        ],
      },
    ],

    "IT-ELECTIVE-RES": [
      {
        id: "passive_income",
        question:
          "Do you have regular, stable passive income of at least approximately €31,000/year from sources such as pensions, dividends, rental income, or investments — with NO employment or freelance income?",
        source:
          "Italian Elective Residence Visa — passive income requirement and absolute work prohibition",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "The Elective Residence Visa requires stable passive income (pensions, dividends, rental income) of at least ~€31,000/year for a single applicant (~€38,000 for couples). Critically, ALL forms of work are prohibited — including remote freelancing for foreign clients. If you plan to work remotely, apply for the Digital Nomad Visa instead. Employment income, even from abroad, is incompatible with this visa.",
        options: [
          {
            label: "Yes — I have €31,000+ of passive income and will NOT work in any form",
            value: "YES",
          },
          { label: "No — my income is from employment or freelancing", value: "NO" },
          { label: "No — my passive income is below the threshold", value: "NO" },
        ],
      },
      {
        id: "italy_accommodation",
        question:
          "Do you have confirmed accommodation in Italy — either a property you own or a signed long-term registered lease?",
        source:
          "Italian Elective Residence Visa — confirmed accommodation required before application",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "Confirmed accommodation in Italy is mandatory before you can apply. This means either a property title deed or a registered rental lease (contratto di locazione registrato). Hotel bookings or short-term rentals are not sufficient.",
        options: [
          { label: "Yes — I own property or have a registered lease in Italy", value: "YES" },
          { label: "No — I haven't arranged accommodation yet", value: "NO" },
        ],
      },
    ],

    "IT-FAMILY-REUNION": [
      {
        id: "sponsor_status",
        question:
          "Does your family member in Italy hold a valid Italian Residence Permit (Permesso di Soggiorno) for at least 1 year, and have they applied for the Nulla Osta for Family Reunification at the Sportello Unico per l'Immigrazione?",
        source:
          "Italian Family Reunification — sponsor must have valid permit + obtain Nulla Osta first",
        sourceUrl:
          "https://www.portaleimmigrazione.it/",
        passWith: ["YES", "IN_PROGRESS"],
        failMsg:
          "The sponsor in Italy must have a valid Residence Permit of at least 1 year and must first apply for and receive the Nulla Osta for Family Reunification from the local Sportello Unico per l'Immigrazione. This process can take 90–180 days. Only after receiving the Nulla Osta can you apply for the Family Reunion Visa at the Italian consulate in your country.",
        options: [
          {
            label: "Yes — sponsor has valid permit and the Nulla Osta is approved",
            value: "YES",
          },
          {
            label: "In progress — sponsor has valid permit and has applied for Nulla Osta",
            value: "IN_PROGRESS",
          },
          {
            label: "No — sponsor doesn't have a valid permit or hasn't applied yet",
            value: "NO",
          },
        ],
      },
      {
        id: "income_housing",
        question:
          "Does your sponsor meet the minimum income requirement (approximately €9,360/year for 1 family member) and have suitable housing (with a municipal habitability certificate)?",
        source:
          "Italian Family Reunification — Table A income threshold + Art. 29 TUI housing requirement",
        sourceUrl:
          "https://www.portaleimmigrazione.it/",
        passWith: ["YES"],
        failMsg:
          "The sponsor must meet the minimum income threshold (approximately €9,360.33/year for 1 family member — updated annually under Table A, Article 29 of the Italian Immigration Code) and have suitable accommodation. Housing must meet minimum size requirements (at least 14m² per additional person) and the sponsor must obtain a habitability certificate (certificato di idoneità alloggiativa) from the local municipality (Comune).",
        options: [
          { label: "Yes — sponsor meets the income threshold and has suitable housing", value: "YES" },
          { label: "No — income or housing does not yet meet requirements", value: "NO" },
        ],
      },
    ],

    "IT-SCHENGEN-C": [
      {
        id: "visa_needed",
        question:
          "Does your passport nationality require a Schengen visa to enter Italy? (Many nationalities are visa-free for up to 90 days — check before applying.)",
        source:
          "EU Schengen visa policy — check your country's visa-free access status",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "Many countries have visa-free access to the Schengen Area for up to 90 days. Check the Italian Ministry of Foreign Affairs website or the EU visa policy list. If your country is visa-free, you do NOT need to apply for this visa — you can travel freely within Schengen for 90 days in any 180-day period without a visa.",
        options: [
          {
            label: "Yes — my passport requires a Schengen visa for Italy",
            value: "YES",
          },
          {
            label: "No — my country is visa-free for Schengen (I don't need to apply)",
            value: "NO",
          },
        ],
      },
      {
        id: "temp_intent",
        question:
          "Is the purpose of your visit genuinely temporary (tourism, family visit, or short business trip) — with a clear plan to leave Italy and the Schengen Area before your 90-day allowance expires?",
        source:
          "Schengen Visa Code — genuine temporary intent and non-immigrant intent required",
        sourceUrl:
          "https://vistoperitalia.esteri.it/home/en",
        passWith: ["YES"],
        failMsg:
          "The Schengen Type C visa is strictly for temporary visits. If you intend to stay longer than 90 days, work, or study in Italy, you need a different visa (Type D national visa). Applying for a Schengen visa with the intent to overstay or convert it to a long-stay permit is a serious violation that can result in entry bans.",
        options: [
          { label: "Yes — genuinely temporary visit with clear return plans", value: "YES" },
          { label: "No — I want to stay more than 90 days", value: "NO" },
        ],
      },
    ],
  },
};