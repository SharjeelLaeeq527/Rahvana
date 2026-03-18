/**
 * Visa Criteria Data — Pakistan → United States
 *
 * All eligibility rules verified against official US government sources.
 * Each entry includes a sourceUrl linking to the official USCIS or State Dept page.
 */

export type VisaCriteria = {
  title: string;
  description: string;
  criteria: string[];
  sourceUrl?: string;
};

export const visaCriteria: Record<string, VisaCriteria> = {

  // ─── IMMEDIATE RELATIVES (no annual visa cap) ──────────────────────────────
  // Source: https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration.html

  "IR-1": {
    title: "Immediate Relative – Spouse (IR-1)",
    description:
      "For Pakistani spouses of US citizens married 2 years or more. No annual visa cap — part of the Immediate Relative category.",
    sourceUrl: "https://www.uscis.gov/family/family-of-us-citizens/green-card-for-immediate-relatives-of-us-citizen",
    criteria: [
      "Petitioner must be a US citizen (naturalized or by birth).",
      "Must be legally married — NADRA-registered Nikah Nama required and translated to English.",
      "Marriage must be bona fide (genuine), not entered into solely for immigration purposes.",
      "Must have been married for at least 2 years at the time of visa issuance.",
      "Both parties must be legally free to marry (all prior marriages must be legally terminated).",
      "Petitioner must meet minimum income requirement: 125% of the Federal Poverty Guidelines.",
      "Pakistan-specific: Urdu Nikah Nama + English translation + Union Council Certificate from NADRA required.",
      "Medical exam at an approved panel physician in Pakistan required.",
    ],
  },

  "CR-1": {
    title: "Conditional Resident – Spouse (CR-1)",
    description:
      "For Pakistani spouses of US citizens married less than 2 years. Green Card is conditional for 2 years; file Form I-751 before expiry to remove conditions.",
    sourceUrl: "https://www.uscis.gov/family/family-of-us-citizens/green-card-for-immediate-relatives-of-us-citizen",
    criteria: [
      "Petitioner must be a US citizen.",
      "Must be legally married — NADRA-registered Nikah Nama + English translation required.",
      "Marriage must be bona fide (genuine), not entered into solely for immigration.",
      "Married for less than 2 years at the time of visa issuance.",
      "Green Card valid for 2 years only — must file I-751 (Petition to Remove Conditions) within 90 days before expiry.",
      "Both spouses typically must jointly file I-751 (waiver available in cases of abuse, divorce, or death).",
      "Pakistan-specific: Urdu Nikah Nama, English translation, and NADRA Family Registration Certificate (FRC) required.",
    ],
  },

  "K-1": {
    title: "Fiancé(e) Visa (K-1)",
    description:
      "For Pakistani fiancés of US Citizens intending to marry in the US. Must marry within 90 days of US entry. Only US Citizens can file — not Green Card holders.",
    sourceUrl: "https://www.uscis.gov/family/family-of-us-citizens/visas-for-fiancees-of-us-citizens",
    criteria: [
      "Petitioner MUST be a US citizen — Green Card holders (LPRs) are NOT eligible to file K-1 petitions.",
      "Both parties must intend to marry within 90 days of the beneficiary's US entry as a K-1 nonimmigrant.",
      "Both parties must be legally free to marry (all prior marriages legally terminated).",
      "Must have met in person at least once within the 2 years before filing (religious/cultural hardship exemptions may apply).",
      "Income requirement (K-1 stage): Petitioner must show income at 100% of the Federal Poverty Guidelines via Form I-134 (Declaration of Financial Support) — NOT 125%. The 125% threshold applies later, when filing Form I-864 for Adjustment of Status after marriage. Source: travel.state.gov K-1 visa page.",
      "After marriage: File Form I-864 (Affidavit of Support) with Adjustment of Status — at this stage 125% of Federal Poverty Guidelines is required.",
      "Must have a bona fide (genuine) relationship — photos, communication records, and meeting evidence required.",
      "Pakistan-specific: NADRA CNIC, proof of in-person meeting, and police clearance certificate from home district required.",
      "After marriage within 90 days, spouse may apply for Green Card via Form I-485.",
    ],
  },

  "IR-2": {
    title: "Child of US Citizen (IR-2)",
    description:
      "For unmarried Pakistani children under 21 of US citizens. Immediate Relative — no annual cap.",
    sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen",
    criteria: [
      "Child must be unmarried and under 21 years of age at the time of visa issuance.",
      "Must be the biological, step, or adopted child of a US citizen.",
      "Stepchildren qualify if the marriage creating the step-relationship occurred before the child turned 18.",
      "Adopted children qualify if adopted before age 16 (or age 18 if adopted together with a sibling adopted before 16).",
      "Must have been in the legal custody and lived with the adoptive parent for at least 2 years.",
      "Pakistan-specific: NADRA-issued computerized birth certificate confirming parentage required.",
      "Petitioner must be a US citizen and file Form I-130.",
    ],
  },

  "IR-5": {
    title: "Parent of US Citizen (IR-5)",
    description:
      "For Pakistani parents of US citizens aged 21 or older. Immediate Relative — no annual cap.",
    sourceUrl: "https://www.uscis.gov/family/family-of-us-citizens/bringing-parents-to-live-in-the-united-states-as-permanent-residents",
    criteria: [
      "Petitioner (the child) MUST be a US citizen AND at least 21 years old — this is a firm USCIS requirement.",
      "Green Card holders (LPRs) CANNOT petition for their parents — only US Citizens.",
      "Must prove the biological or legal parent-child relationship.",
      "For stepparents: the marriage creating the step-relationship must have occurred before the child turned 18.",
      "For adoptive parents: adoption must have occurred before the child turned 16 (with some exceptions).",
      "No annual visa cap — immediate relative category.",
      "Pakistan-specific: NADRA birth certificate of the US citizen child showing parentage, and CNIC of the parent required.",
      "Parent must undergo medical examination at an approved panel physician in Pakistan.",
    ],
  },

  // ─── FAMILY PREFERENCE (subject to annual visa caps) ──────────────────────
  // Source: https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants

  "F1": {
    title: "Unmarried Adult Child of US Citizen (F-1 Preference)",
    description:
      "For unmarried Pakistani sons and daughters aged 21+ of US citizens. Subject to annual visa limits.",
    sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
    criteria: [
      "Must be 21 years of age or older.",
      "Must be unmarried at the time of visa issuance.",
      "Petitioner must be a US citizen.",
      "Subject to annual visa numerical cap — wait times of several years expected.",
      "Pakistan-specific: NADRA birth certificate proving parentage, and proof of unmarried status required.",
    ],
  },

  "F3": {
    title: "Married Child of US Citizen (F-3 Preference)",
    description:
      "For married Pakistani sons and daughters (any age) of US citizens. Subject to annual visa limits.",
    sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
    criteria: [
      "Petitioner must be a US citizen.",
      "Beneficiary must be a married son or daughter (any age) of the petitioner.",
      "Note: Married children of Green Card holders (LPRs) have NO visa category — only US Citizens can petition for married children.",
      "Subject to annual visa numerical cap — significant waiting periods expected.",
      "Spouse and unmarried children under 21 of the beneficiary may immigrate as derivatives.",
    ],
  },

  "F2A": {
    title: "Spouse / Child of Green Card Holder (F2A)",
    description:
      "For Pakistani spouses and unmarried children under 21 of Lawful Permanent Residents. Subject to annual visa limits.",
    sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
    criteria: [
      "Petitioner must be a Lawful Permanent Resident (LPR / Green Card holder), not a US Citizen.",
      "Petitioner must be at least 21 years old to file any immigrant visa petition.",
      "For spouses: must be legally married — NADRA Nikah Nama + English translation required.",
      "For children: must be unmarried and under 21 at the time of visa issuance.",
      "NOTE: There is NO visa category for married children of LPRs — only US Citizens can petition for married children.",
      "Subject to annual visa numerical limits — typical wait times of 2–5 years.",
      "Pakistan-specific: Copy of petitioner's Green Card (front and back), Nikah Nama or NADRA birth certificate required.",
    ],
  },

  "F2B": {
    title: "Unmarried Adult Child of Green Card Holder (F2B)",
    description:
      "For unmarried Pakistani sons and daughters aged 21+ of Lawful Permanent Residents. Subject to annual visa limits.",
    sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
    criteria: [
      "Petitioner must be a Lawful Permanent Resident (LPR / Green Card holder).",
      "Petitioner must be at least 21 years old.",
      "Beneficiary must be the unmarried son or daughter aged 21 or older.",
      "Subject to annual visa cap — Pakistani nationals face moderate waiting periods.",
      "Pakistan-specific: NADRA birth certificate proving parentage, proof of unmarried status required.",
    ],
  },

  "F4": {
    title: "Sibling of US Citizen (F-4 Preference)",
    description:
      "For Pakistani brothers and sisters of US citizens. Petitioner must be a US Citizen aged 21+. Expect 15–20+ year waiting periods.",
    sourceUrl: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants",
    criteria: [
      "Petitioner MUST be a US citizen — Green Card holders (LPRs) CANNOT sponsor siblings.",
      "Petitioner must be at least 21 years old — verified by USCIS: 'brothers and sisters of U.S. citizens (if the U.S. citizen is 21 years of age and older)'.",
      "Must prove at least one shared biological parent.",
      "Half-siblings qualify (one shared biological parent).",
      "Step-siblings may qualify if the relationship was established before age 18.",
      "Subject to very strict annual numerical limits — expect 15–20+ year waiting periods for Pakistani nationals.",
      "Pakistan-specific: Birth certificates of both the petitioner and beneficiary showing shared parentage required.",
      "Spouse and unmarried children under 21 of the sibling may immigrate as derivative beneficiaries.",
    ],
  },

  // ─── EMPLOYMENT-BASED ──────────────────────────────────────────────────────
  // Source: https://www.uscis.gov/working-in-the-united-states/permanent-workers

  "EB-1": {
    title: "Employment-Based 1st Preference (EB-1)",
    description:
      "For extraordinary ability, outstanding researchers, or multinational executives. Generally no labor certification required.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1",
    criteria: [
      "EB-1A (Extraordinary Ability): Evidence of sustained national or international acclaim. Nobel Prize or equivalent, OR at least 3 of 10 specific criteria (publications, prizes, critical roles, high salary, memberships, etc.). No job offer or labor certification needed.",
      "EB-1B (Outstanding Professors/Researchers): International recognition, minimum 3 years of experience, and a permanent US job offer in a tenure-track or research position.",
      "EB-1C (Multinational Executives/Managers): Employed abroad (e.g., in Pakistan) for at least 1 year within the last 3 years in a qualifying executive or managerial role, transferring to a US parent, subsidiary, or affiliate.",
      "EB-1 is generally NOT subject to per-country backlog — typically faster for Pakistani nationals than EB-2/EB-3.",
    ],
  },

  "EB-2": {
    title: "Employment-Based 2nd Preference (EB-2)",
    description:
      "For advanced degree professionals or exceptional ability. National Interest Waiver (NIW) allows self-petition without a job offer.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2",
    criteria: [
      "Must hold an advanced degree (master's or higher), OR a bachelor's degree plus at least 5 years of progressive post-baccalaureate experience in the field.",
      "OR demonstrate exceptional ability in sciences, arts, or business (ability surpassing the ordinary level of expertise).",
      "Standard route requires a permanent US job offer AND an approved PERM Labor Certification from the Department of Labor.",
      "National Interest Waiver (NIW): allows self-petition if work benefits the US national interest — no job offer or PERM required.",
      "Subject to per-country annual limits — Pakistani nationals may face moderate wait times.",
      "Pakistan-specific: Foreign degree equivalency evaluation by a NACES-member organization required if degree is from a Pakistani university.",
    ],
  },

  "EB-3": {
    title: "Employment-Based 3rd Preference (EB-3)",
    description:
      "For skilled workers, professionals, and unskilled workers with a permanent US job offer.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3",
    criteria: [
      "Requires a permanent, full-time US job offer.",
      "PERM Labor Certification required (employer must prove no qualified US workers available for the position).",
      "Skilled Workers: at least 2 years of job experience or training for the specific position.",
      "Professionals: US baccalaureate degree or foreign equivalent specifically required by the job.",
      "Unskilled (Other) Workers: capable of performing labor requiring less than 2 years of training.",
      "Subject to per-country annual limits — wait times of 2–6+ years for Pakistani nationals.",
    ],
  },

  "EB-5": {
    title: "Immigrant Investor Visa (EB-5)",
    description:
      "For Pakistani investors creating US jobs. Minimum investment required. No job offer needed — self-petition.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5",
    criteria: [
      "Minimum investment of $1,050,000 in a new commercial enterprise (or $800,000 in a Targeted Employment Area — rural or high unemployment area).",
      "Investment must create or preserve at least 10 full-time jobs for qualified US workers.",
      "Investment must be 'at risk' — no guaranteed return of capital.",
      "Investor must be involved in management (director, officer, or limited partner role acceptable).",
      "Must provide comprehensive documentation of lawful source of funds — critically scrutinized for Pakistani applicants.",
      "No job offer required — investor self-petitions via Form I-526.",
    ],
  },

  // ─── HUMANITARIAN ──────────────────────────────────────────────────────────
  // Source: https://www.uscis.gov/humanitarian

  "Humanitarian": {
    title: "Humanitarian Immigration",
    description:
      "Asylum, refugee status, VAWA protections, and other special immigrant categories available to Pakistani nationals.",
    sourceUrl: "https://www.uscis.gov/humanitarian",
    criteria: [
      "Asylum: Must be present in the US and unable or unwilling to return to Pakistan due to persecution or well-founded fear of persecution based on race, religion, nationality, political opinion, or membership in a particular social group.",
      "Refugee: Similar to asylum but processing occurs outside the US — typically requires UNHCR referral or direct access via US Embassy.",
      "VAWA (Violence Against Women Act): Abused spouse, child, or parent of a US citizen or LPR — self-petition without the petitioner's knowledge or consent.",
      "Pakistan-specific: Religious and sectarian persecution grounds may be applicable. Strong documentation and legal representation strongly advised.",
      "Criteria vary significantly by specific humanitarian category — consult an immigration attorney.",
    ],
  },

  // ─── NON-IMMIGRANT VISAS ──────────────────────────────────────────────────
  // Source: https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html

  "B1/B2": {
    title: "Visitor Visa (B-1/B-2)",
    description:
      "For Pakistani nationals seeking a temporary visit to the US for tourism, family visits, or business.",
    sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html",
    criteria: [
      "Trip must be for a temporary, clearly defined purpose (tourism, family visit, business meetings, or medical treatment).",
      "Must intend to stay for a specific, limited period.",
      "Must demonstrate sufficient funds to cover all expenses in the US.",
      "Must demonstrate strong ties to Pakistan — property, employment, family, or other binding ties proving intent to return.",
      "No petitioner age requirement — applicant applies directly.",
      "Pakistan-specific: B-1/B-2 denial rates from Pakistan are historically high. Strong ties documentation is essential. A valid Pakistani passport (valid 6+ months beyond intended stay) required.",
      "Prior US visa overstay will significantly impact eligibility.",
    ],
  },

  "F-1": {
    title: "Academic Student Visa (F-1)",
    description:
      "For Pakistani students accepted at a SEVP-certified US academic institution.",
    sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
    criteria: [
      "Must have a confirmed acceptance letter (Form I-20) from a SEVP-certified US school.",
      "Must be enrolled as a full-time student.",
      "English proficiency typically required — TOEFL, IELTS, or equivalent scores.",
      "Must demonstrate sufficient financial support for tuition and living expenses for the full duration of study.",
      "Must maintain a residence in Pakistan and demonstrate intent to return after completing studies.",
      "No petitioner age requirement — applicant applies directly.",
      "Pakistan-specific: Form I-20 from the US school, valid NADRA CNIC/passport, bank statements, and financial sponsor letter required at US Consulate interview (Islamabad or Karachi).",
    ],
  },

  "H-1B": {
    title: "Specialty Occupation Work Visa (H-1B)",
    description:
      "For Pakistani professionals in specialty occupations with a US employer sponsor.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations",
    criteria: [
      "Job must qualify as a 'specialty occupation' — requires at least a US bachelor's degree or equivalent in a specific field.",
      "Must hold a US bachelor's degree or higher (or foreign equivalent) in the relevant specialty.",
      "US employer must file a Labor Condition Application (LCA) with the Department of Labor before filing the H-1B petition.",
      "Annual cap: 65,000 regular H-1B visas + 20,000 reserved for US advanced degree holders (85,000 total).",
      "Initial period of 3 years, extendable to 6 years total.",
      "⚠️ NEW LOTTERY SYSTEM (effective February 27, 2026 — FY2027 cap season onwards): Random lottery replaced with Weighted Selection Process. Each registration receives multiple entries based on the DOL OEWS wage level offered: Level IV (highest) = 4 entries, Level III = 3 entries, Level II = 2 entries, Level I (entry-level) = 1 entry. Higher-paid positions have significantly better selection odds. Employers must provide accurate SOC code, wage level, and area of employment during registration — inconsistencies with the filed petition can result in denial or revocation. Source: USCIS (uscis.gov/newsroom/news-releases/dhs-changes-process-for-awarding-h-1b-work-visas), Federal Register (Dec 29, 2025).",
      "⚠️ $100,000 FEE — ACTIVE BUT LEGALLY CONTESTED (as of March 2026): A $100,000 fee applies to H-1B petitions filed for beneficiaries outside the US without a valid H-1B visa (effective September 21, 2025). Does NOT apply to extensions or change-of-status inside the US. Payment via Pay.gov required before filing. Court status: (1) DC District Court upheld fee on December 24, 2025 — Chamber of Commerce v. DHS; (2) DC Circuit Court of Appeals fast-tracked the appeal — oral arguments held February 2026, ruling pending; (3) Northern District of California case (Global Nurse Force v. Trump) — oral arguments held February 26, 2026, injunction ruling expected April–May 2026; (4) Massachusetts case filed by 20 state AGs — early litigation stage. Fee is FULLY IN EFFECT until a court issues an injunction — monitor USCIS.gov for updates. Source: USCIS H-1B FAQ (uscis.gov/newsroom/alerts/h-1b-faq).",
      "Pakistan-specific: Pakistani applicants applying from Pakistan are subject to the $100,000 fee for new H-1B petitions. Foreign degree equivalency evaluation by a NACES-member organization required for Pakistani university degrees.",
    ],
  },

  "L-1": {
    title: "Intra-Company Transfer Visa (L-1)",
    description:
      "For employees of Pakistani companies transferring to a US branch, subsidiary, or affiliate.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager",
    criteria: [
      "A qualifying corporate relationship must exist between the Pakistani company and the US company (parent, subsidiary, or affiliate).",
      "Employee must have worked for the Pakistani entity continuously for at least 1 year within the last 3 years.",
      "L-1A: Transferring in a managerial or executive capacity — valid up to 7 years total.",
      "L-1B: Transferring with specialized knowledge of the company's products or procedures — valid up to 5 years total.",
      "No annual cap — generally faster processing than H-1B.",
      "Pakistan-specific: Detailed employment records, organizational charts, and proof of the qualifying corporate relationship required.",
    ],
  },

  "O-1": {
    title: "Extraordinary Ability Visa (O-1)",
    description:
      "For Pakistani individuals with extraordinary ability in science, arts, education, business, or athletics.",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement",
    criteria: [
      "Must demonstrate extraordinary ability through evidence of sustained national or international acclaim.",
      "Evidence: a major international award (Nobel, Olympic medal, Academy Award, etc.) OR at least 3 of the specific criteria (critical roles, high salary, awards, publications, memberships in prestigious associations, etc.).",
      "Must be coming to the US to work in the area of extraordinary ability.",
      "Requires a US employer or agent to file the petition and a written advisory opinion from a peer group or expert.",
      "No annual cap — generally processed faster than H-1B.",
    ],
  },

  "J-1": {
    title: "Exchange Visitor Visa (J-1)",
    description:
      "For Pakistani participants in US Department of State-designated exchange visitor programs.",
    sourceUrl: "https://travel.state.gov/content/travel/en/us-visas/study/exchange.html",
    criteria: [
      "Must be accepted into a Department of State-designated exchange visitor program.",
      "Sufficient English proficiency required.",
      "Must have adequate funding for the duration of the stay.",
      "Health insurance coverage is mandatory.",
      "Many J-1 holders are subject to a 2-year home country physical presence requirement before applying for certain US immigration benefits.",
      "Pakistan-specific: DS-2019 form from the program sponsor required; interview at US Consulate in Islamabad.",
    ],
  },
};