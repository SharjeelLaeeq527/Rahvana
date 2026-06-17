// ─────────────────────────────────────────────────────────────────────────────
// IR-1 Engine · Case Type Configuration
// PAKISTAN FOCUS — v6, June 2026
//
// CHANGES FROM v5:
//   1. communityValidationDataset added (Tier 3).
//      8 Visa Journey Pakistan cases with per-case filed/NOA2/interview dates.
//      Used for USCIS-phase validation only — NOT for embassy or NVC estimates.
//      n=8 is insufficient for primary forecasting (need n≥25). Labeled clearly.
//
//   2. USCIS numbers re-validated against community dataset:
//        Observed filed→NOA2: 11, 11, 12, 12, 13, 15, 15, 16 months
//        Median 12.5, mean 13.1, range 11–16.
//        typicalMin=12, typicalMax=16 CONFIRMED. optimisticMonths=11 CONFIRMED.
//      NVC+embassy numbers NOT updated from VJ data — those cases reflect
//      2022–2024 queue conditions (Islamabad backlog was 8–15 months then).
//      Current IV Tool (Apr 2026) shows ~2 months — use that, not VJ history.
//
//   3. PAKISTAN_IV_PAUSE policy flag added (policyFlags.ts).
//      Effective Jan 21 2026. Affects all post-interview stages.
//      visaIssuanceMonths is now treated as indefinite via effectiveVisaIssuanceMonths().
//
//   4. source tiers documented per feedback:
//        Tier 1 — Official government (USCIS processing-times, DoS IV Tool)
//        Tier 2 — Attorney/industry (Kulen Law, Modern Law Group)
//        Tier 3 — Community (Visa Journey n=8, Track My Visa)
//      Tier 3 validates; does not lead.
//
//   5. IV Tool historical snapshots in ConsulateQueueConfig (velocity tracking).
//
// SOURCE HIERARCHY (in descending authority):
//   Tier 1: egov.uscis.gov/processing-times/ · travel.state.gov IV Tool
//   Tier 2: Kulen Law Apr 2026 · Modern Law Group Apr 2026
//   Tier 3: Visa Journey Pakistan IR-1 2022–2026 (n=8)
//
// UPDATE CADENCE:
//   Monthly: egov.uscis.gov/processing-times/ → uscisOfficialMonths
//   Monthly: DoS IV Tool → ivToolHistory[] + postDQTypical
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low" | "very_low";

// ─────────────────────────────────────────────────────────────────────────────
// Community Validation Dataset
//
// Raw case records from Tier 3 sources. These VALIDATE Tier 1/2 estimates
// for the USCIS phase only. Do not use them to set NVC or embassy durations —
// those reflect historical queue conditions that differ from the current IV Tool.
//
// Fields:
//   filedDate        ISO date petition submitted
//   noa2Date         ISO date USCIS approval (NOA2)
//   interviewDate    ISO date Islamabad interview (null if not yet occurred)
//   serviceCenter    USCIS service center at time of processing
//   outcome          What happened at/after interview
//   source           Tier 3 source identifier
//   note             Any relevant case specifics
//
// Derived (computed from above):
//   uscisMonths = months from filedDate to noa2Date
//   nvcEmbassyMonths = months from noa2Date to interviewDate (reflects OLD queues)
// ─────────────────────────────────────────────────────────────────────────────

export interface CommunityCase {
  caseRef: string;
  filedDate: string;
  noa2Date: string;
  interviewDate: string | null;
  serviceCenter: string;
  outcome: "visa_issued" | "admin_processing" | "iv_pause_ap" | "pending" | "unknown";
  source: "visa_journey" | "track_my_visa" | "reddit" | "facebook";
  note: string;
  // Derived — filled in programmatically
  uscisMonths: number;
  nvcEmbassyMonths: number | null;
}

// VJ data as parsed from the 8-case dataset (interviews 2022–2026).
// uscisMonths = months(filedDate → noa2Date), rounded to nearest month.
// nvcEmbassyMonths = months(noa2Date → interviewDate) — reflects OLD Islamabad queue.
//   DO NOT use nvcEmbassyMonths for current embassy estimates.
export const COMMUNITY_VALIDATION_DATASET: CommunityCase[] = [
  {
    caseRef: "VJ-K176532",
    filedDate: "2024-03-01",
    noa2Date: "2025-06-01",
    interviewDate: "2026-03-01",
    serviceCenter: "Vermont",
    outcome: "iv_pause_ap",
    source: "visa_journey",
    note: "CO confirmed approval but mandatory AP triggered — Jan 2026 IV pause. No visa issued.",
    uscisMonths: 15,
    nvcEmbassyMonths: 9,
  },
  {
    caseRef: "VJ-Nicolebelle89",
    filedDate: "2023-12-01",
    noa2Date: "2025-03-01",
    interviewDate: "2026-02-01",
    serviceCenter: "Vermont",
    outcome: "iv_pause_ap",
    source: "visa_journey",
    note: "Post-Jan 2026 interview — visa issuance paused.",
    uscisMonths: 15,
    nvcEmbassyMonths: 11,
  },
  {
    caseRef: "VJ-FarkhanKanval",
    filedDate: "2023-07-01",
    noa2Date: "2024-11-01",
    interviewDate: "2025-12-01",
    serviceCenter: "Texas",
    outcome: "unknown",
    source: "visa_journey",
    note: "Interview Dec 2025 — before IV pause. Outcome not confirmed in dataset.",
    uscisMonths: 16,
    nvcEmbassyMonths: 13,
  },
  {
    caseRef: "VJ-JuicyFruits",
    filedDate: "2022-12-01",
    noa2Date: "2023-12-01",
    interviewDate: "2025-04-01",
    serviceCenter: "Texas",
    outcome: "unknown",
    source: "visa_journey",
    note: "Long NVC+embassy phase reflects 2023–2024 Islamabad queue conditions.",
    uscisMonths: 12,
    nvcEmbassyMonths: 16,
  },
  {
    caseRef: "VJ-AandU",
    filedDate: "2022-12-01",
    noa2Date: "2024-01-01",
    interviewDate: "2025-04-01",
    serviceCenter: "Nebraska→Texas",
    outcome: "unknown",
    source: "visa_journey",
    note: "SC transfer from Nebraska to Texas during processing.",
    uscisMonths: 13,
    nvcEmbassyMonths: 15,
  },
  {
    caseRef: "VJ-Hamza4253",
    filedDate: "2022-06-01",
    noa2Date: "2023-06-01",
    interviewDate: "2025-02-01",
    serviceCenter: "Potomac→Texas",
    outcome: "unknown",
    source: "visa_journey",
    note: "SC transfer from Potomac to Texas. 20-month NVC+embassy reflects heavy 2023–2024 Islamabad backlog.",
    uscisMonths: 12,
    nvcEmbassyMonths: 20,
  },
  {
    caseRef: "VJ-AAKandASK",
    filedDate: "2022-11-01",
    noa2Date: "2023-10-01",
    interviewDate: "2025-02-01",
    serviceCenter: "Potomac→Texas",
    outcome: "unknown",
    source: "visa_journey",
    note: "SC transfer from Potomac to Texas.",
    uscisMonths: 11,
    nvcEmbassyMonths: 16,
  },
  {
    caseRef: "VJ-KimberlyF",
    filedDate: "2022-08-01",
    noa2Date: "2023-07-01",
    interviewDate: "2025-01-01",
    serviceCenter: "Texas→Vermont",
    outcome: "unknown",
    source: "visa_journey",
    note: "SC transfer from Texas to Vermont. Interview outcome not confirmed.",
    uscisMonths: 11,
    nvcEmbassyMonths: 18,
  },
];

// Derived statistics for UI display (computed from the 8 cases above)
export const COMMUNITY_DATASET_STATS = {
  n: 8,
  source: "Visa Journey Pakistan IR-1/CR-1 timelines, interviews 2022–2026",
  minimumForPrimaryForecasting: 25,
  usableFor: "USCIS phase validation only",
  uscis: {
    // filed→NOA2 months across all 8 cases
    observed: [11, 11, 12, 12, 13, 15, 15, 16],
    min: 11,
    max: 16,
    median: 12.5,
    mean: 13.1,
    validatesTypicalRange: "12–16 months ✓",
  },
  nvcEmbassy: {
    // NOA2→interview months — reflects 2022–2024 Islamabad queue, NOT current
    observed: [9, 11, 13, 15, 15, 16, 18, 20],
    warning:
      "These reflect 2022–2024 Islamabad queue conditions. Do NOT use for current embassy estimates. Use DoS IV Tool instead.",
  },
  endToEnd: {
    // filed→interview months across all 8 cases
    observed: [24, 26, 27, 28, 28, 29, 29, 32],
    min: 24,
    max: 32,
    median: 28,
    mean: 28.4,
    note: "filed→interview, not filed→visa. Visa issuance adds 0.5–2 months normally; indefinite under Jan 2026 pause.",
  },
  pauseImpact: {
    casesAffected: 2,
    description:
      "2 of 8 cases (K176532, Nicolebelle89) had post-Jan-2026 interviews and are in AP limbo due to IV pause.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USCIS Outcome Tiers
// ─────────────────────────────────────────────────────────────────────────────

export interface UscisOutcomeTiers {
  bestCase: { min: number; max: number };
  optimistic: { min: number; max: number };
  typical: { min: number; max: number };
  slowButCommon: { min: number; max: number };
  significantDelay: { min: number; max: number };
  uscis80thPct: number | null;
}

export interface EstimateRange {
  optimisticMonths: number;
  typicalMin: number;
  typicalMax: number;
  delayRiskMonths: number | null; // = slowButCommon.max — NOT 80th pct stat
  confidenceLevel: ConfidenceLevel;
  uscisOfficialMonths: number | null;
  uscisNote: string;
  outcomeTiers: UscisOutcomeTiers;
}

export interface CaseTypeConfig {
  id: string;
  label: string;
  petitionerType: "us_citizen" | "permanent_resident";
  serviceCenter: "NBC" | "SCOPS" | "field_office" | "all_field_offices";
  estimate: EstimateRange;
  isPrimaryConsularPath: boolean;
  warningNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE TYPE CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

export const CASE_TYPE_CONFIGS: CaseTypeConfig[] = [
  // ── US Citizen Spouse · NBC ───────────────────────────────────────────────
  // Tier 1: USCIS 80th pct = 51 months (administrative stat, not forecast)
  // Tier 2: Kulen Law Apr 2026 → 10–15 mo. Modern Law Apr 2026 → 12–14 mo.
  // Tier 3: VJ n=8 → filed→NOA2 range 11–16 mo, median 12.5 (VALIDATES Tier 2)
  // Primary estimate: typicalMin=12, typicalMax=16 (Tier 1+2, validated by Tier 3)
  {
    id: "I130_USC_NBC",
    label: "I-130 · U.S. Citizen Spouse · NBC",
    petitionerType: "us_citizen",
    serviceCenter: "NBC",
    isPrimaryConsularPath: true,
    estimate: {
      optimisticMonths: 11,
      typicalMin: 12,
      typicalMax: 16,
      delayRiskMonths: 20, // slowButCommon.max — not USCIS 80th pct
      confidenceLevel: "medium",
      uscisOfficialMonths: 51,
      uscisNote:
        "USCIS officially shows 51 months (80th-percentile completion window across all US cases). " +
        "This captures every delayed, transferred, or RFE'd case nationwide — not a forecast for a standard Pakistan NBC case. " +
        "Attorney analysis (Kulen Law Apr 2026: 10–15 mo; Modern Law Apr 2026: 12–14 mo) and community " +
        "data (Visa Journey, n=8, median 12.5 mo) both point to a Pakistan-specific typical range of 12–16 months. " +
        "Community dataset is n=8 — used for validation only, not primary forecasting.",
      outcomeTiers: {
        bestCase: { min: 9, max: 11 },
        optimistic: { min: 11, max: 12 },
        typical: { min: 12, max: 16 },
        slowButCommon: { min: 16, max: 20 },
        significantDelay: { min: 20, max: 30 },
        uscis80thPct: 51,
      },
    },
  },

  // ── US Citizen Spouse · SCOPS ─────────────────────────────────────────────
  // No longer separately published. Historical ~19 mo. Same Pakistan range applies.
  {
    id: "I130_USC_SCOPS",
    label: "I-130 · U.S. Citizen Spouse · SCOPS",
    petitionerType: "us_citizen",
    serviceCenter: "SCOPS",
    isPrimaryConsularPath: true,
    estimate: {
      optimisticMonths: 11,
      typicalMin: 12,
      typicalMax: 16,
      delayRiskMonths: 20,
      confidenceLevel: "medium",
      uscisOfficialMonths: null,
      uscisNote:
        "USCIS no longer publishes a separate SCOPS figure — all service centers are grouped. " +
        "Historical SCOPS data showed ~19 months. Pakistan community data (n=8) shows no meaningful " +
        "difference from NBC routing; same 12–16 month typical range applies.",
      outcomeTiers: {
        bestCase: { min: 9, max: 11 },
        optimistic: { min: 11, max: 12 },
        typical: { min: 12, max: 16 },
        slowButCommon: { min: 16, max: 20 },
        significantDelay: { min: 20, max: 30 },
        uscis80thPct: null,
      },
    },
  },

  // ── US Citizen Spouse · All Field Offices ─────────────────────────────────
  {
    id: "I130_USC_FIELD",
    label: "I-130 · U.S. Citizen Spouse · Field Offices",
    petitionerType: "us_citizen",
    serviceCenter: "all_field_offices",
    isPrimaryConsularPath: false,
    estimate: {
      optimisticMonths: 24,
      typicalMin: 36,
      typicalMax: 54,
      delayRiskMonths: 67,
      confidenceLevel: "low",
      uscisOfficialMonths: 67,
      uscisNote:
        "USCIS shows 67 months for field offices (80th percentile). Field office processing is a different " +
        "workflow — not representative of standard Pakistan consular IR-1 cases.",
      outcomeTiers: {
        bestCase: { min: 18, max: 24 },
        optimistic: { min: 24, max: 30 },
        typical: { min: 36, max: 54 },
        slowButCommon: { min: 54, max: 67 },
        significantDelay: { min: 67, max: 84 },
        uscis80thPct: 67,
      },
    },
    warningNote:
      "Field office processing is unrelated to the standard consular IR-1 path. Shown for reference only.",
  },

  // ── Permanent Resident Spouse · NBC ──────────────────────────────────────
  {
    id: "I130_PR_NBC",
    label: "I-130 · Permanent Resident Spouse · NBC",
    petitionerType: "permanent_resident",
    serviceCenter: "NBC",
    isPrimaryConsularPath: true,
    estimate: {
      optimisticMonths: 36,
      typicalMin: 50,
      typicalMax: 60,
      delayRiskMonths: 72,
      confidenceLevel: "low",
      uscisOfficialMonths: 52,
      uscisNote:
        "USCIS shows 52 months (80th percentile). F2A cases require visa numbers to be current — USCIS approval " +
        "is only step 1. The Islamabad F2A consulate queue adds ~31 months (DoS IV Tool, Apr 2026), " +
        "making total typical journey approximately 84 months.",
      outcomeTiers: {
        bestCase: { min: 24, max: 36 },
        optimistic: { min: 36, max: 48 },
        typical: { min: 50, max: 60 },
        slowButCommon: { min: 60, max: 72 },
        significantDelay: { min: 72, max: 96 },
        uscis80thPct: 52,
      },
    },
    warningNote:
      "F2A cases require a visa number to be current in the monthly Visa Bulletin. " +
      "Retrogression can add unpredictable delay on top of all estimates.",
  },

  // ── Permanent Resident Spouse · SCOPS ────────────────────────────────────
  {
    id: "I130_PR_SCOPS",
    label: "I-130 · Permanent Resident Spouse · SCOPS",
    petitionerType: "permanent_resident",
    serviceCenter: "SCOPS",
    isPrimaryConsularPath: true,
    estimate: {
      optimisticMonths: 36,
      typicalMin: 50,
      typicalMax: 60,
      delayRiskMonths: null,
      confidenceLevel: "very_low",
      uscisOfficialMonths: null,
      uscisNote:
        "USCIS does not publish a separate estimate for this combination. Figures use NBC as fallback.",
      outcomeTiers: {
        bestCase: { min: 24, max: 36 },
        optimistic: { min: 36, max: 48 },
        typical: { min: 50, max: 60 },
        slowButCommon: { min: 60, max: 72 },
        significantDelay: { min: 72, max: 96 },
        uscis80thPct: null,
      },
    },
    warningNote:
      "No official USCIS estimate. NBC figures used as fallback. Treat as rough guidance only.",
  },

  // ── Permanent Resident Spouse · All Field Offices ─────────────────────────
  {
    id: "I130_PR_FIELD",
    label: "I-130 · Permanent Resident Spouse · Field Offices",
    petitionerType: "permanent_resident",
    serviceCenter: "all_field_offices",
    isPrimaryConsularPath: false,
    estimate: {
      optimisticMonths: 48,
      typicalMin: 60,
      typicalMax: 96,
      delayRiskMonths: 139,
      confidenceLevel: "very_low",
      uscisOfficialMonths: 139,
      uscisNote:
        "USCIS shows 139 months — extreme field-office backlog indicator. Not representative of consular processing.",
      outcomeTiers: {
        bestCase: { min: 36, max: 48 },
        optimistic: { min: 48, max: 60 },
        typical: { min: 60, max: 96 },
        slowButCommon: { min: 96, max: 120 },
        significantDelay: { min: 120, max: 139 },
        uscis80thPct: 139,
      },
    },
    warningNote: "Extreme field office backlog. Not used as a primary estimate for consular cases.",
  },
];

export function getCaseTypeConfig(id: string): CaseTypeConfig | undefined {
  return CASE_TYPE_CONFIGS.find((c) => c.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSULATE QUEUE CONFIG — Pakistan
//
// SOURCE: DoS IV Scheduling Status Tool (Tier 1)
//   travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html
//
// HOW TO UPDATE (1st of each month):
//   1. Visit IV Tool URL above.
//   2. Find Islamabad row for each visa category → note DQ month shown.
//   3. backlogMonths = current month − shown DQ month.
//   4. Append to ivToolHistory[]; update ivToolDQMonth + ivToolPulledDate + postDQTypical.
//   5. Once 3+ history entries: compute velocity = (newest_DQ − oldest_DQ) / months_elapsed.
//      velocity > 1.0 = queue clearing. velocity < 1.0 = backlog growing.
// ─────────────────────────────────────────────────────────────────────────────

export interface IvToolSnapshot {
  pulledDate: string;
  dqMonthScheduling: string;
  backlogMonths: number;
}

export interface ConsulateQueueConfig {
  postCode: string;
  label: string;
  country: string;
  visaCategory: "immediate_relative" | "family_preference";
  postDQMin: number;
  postDQTypical: number; // UPDATE MONTHLY from IV Tool
  postDQMax: number;
  confidenceLevel: ConfidenceLevel;
  ivToolDQMonth: string;
  ivToolPulledDate: string;
  ivToolHistory: IvToolSnapshot[];
  note: string;
}

export const CONSULATE_QUEUE_CONFIGS: ConsulateQueueConfig[] = [
  // ── Islamabad · IR-1/CR-1 ────────────────────────────────────────────────
  {
    postCode: "ISL_IR",
    label: "U.S. Embassy Islamabad — IR-1/CR-1",
    country: "Pakistan",
    visaCategory: "immediate_relative",
    postDQMin: 1,
    postDQTypical: 2, // Apr 2026: scheduling March 2026 → ~2 months
    postDQMax: 8, // historical worst; can spike if AF cases surge
    confidenceLevel: "low",
    ivToolDQMonth: "March 2026",
    ivToolPulledDate: "2026-04-02",
    ivToolHistory: [
      { pulledDate: "2026-04-02", dqMonthScheduling: "March 2026", backlogMonths: 2 },
      // Add monthly entries here — velocity derivable once 3+ entries exist
    ],
    note:
      "Currently fast (~2 months post-DQ). Afghanistan cases are now also routed to Islamabad which can spike the queue. " +
      "Does not include 221(g) administrative processing after interview. " +
      "NOTE: IV pause (Jan 21 2026) means interviews proceed but no visas are being issued — see policyFlags.ts.",
  },

  // ── Islamabad · F2A ──────────────────────────────────────────────────────
  {
    postCode: "ISL_F2A",
    label: "U.S. Embassy Islamabad — F2A",
    country: "Pakistan",
    visaCategory: "family_preference",
    postDQMin: 20,
    postDQTypical: 31, // Apr 2026: scheduling Sep 2023 → ~31 months
    postDQMax: 40,
    confidenceLevel: "very_low",
    ivToolDQMonth: "September 2023",
    ivToolPulledDate: "2026-04-02",
    ivToolHistory: [
      { pulledDate: "2026-04-02", dqMonthScheduling: "September 2023", backlogMonths: 31 },
    ],
    note:
      "Severe backlog (~31 months as of Apr 2026). F2A requires Visa Bulletin priority date to be current. " +
      "Retrogression adds unpredictable additional delay.",
  },
];

export function getConsulateQueueConfig(postCode: string): ConsulateQueueConfig | undefined {
  return CONSULATE_QUEUE_CONFIGS.find((c) => c.postCode === postCode);
}

export function getConsulateForCaseType(caseTypeId: string): ConsulateQueueConfig {
  const isPR = caseTypeId.includes("_PR_");
  const code = isPR ? "ISL_F2A" : "ISL_IR";
  return CONSULATE_QUEUE_CONFIGS.find((c) => c.postCode === code)!;
}
