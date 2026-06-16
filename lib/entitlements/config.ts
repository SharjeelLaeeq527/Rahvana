/**
 * Rahvana Entitlement Configuration
 * Single source of truth for all feature access by plan tier.
 *
 * Source: Pricing Tier Matrix (feature table) + Roadmap Step Behavior document
 *
 * Philosophy:
 *   Basic     — Bare-bones roadmap. See all steps/order. No guides, no vault,
 *               no tracking. DIY-heavy. Entry-level paid.
 *   Premium   — Adds embedded step-by-step guides, document vault, tracking &
 *               reminders, and most productivity tools. Target for most users.
 *   Executive — Adds "things went sideways" support: 221(g) planner, mock
 *               interview, expert reviews, PCC filing, translation.
 *
 * Nothing is ever hidden — locked features always render as a locked preview
 * so users are motivated to upgrade.
 */

export type PlanTier = "free" | "basic" | "premium" | "executive";

/**
 * Normalized feature states.
 *
 * full           → Fully included, no restrictions
 * list_only      → Can see item list; guides, upload, and vault locked
 * save_only      → Can save manual data; tracking, vault, and upload locked
 * locked_upgrade → Not included; must upgrade to a specific higher plan
 * locked_buy     → Not included; can upgrade plan OR purchase as an add-on
 * limited        → Included with a usage cap (e.g. Photo Booth 2 credits)
 * executive_only → Requires Executive tier specifically
 * preview        → Free-tier teaser: partial read-only, no saves/actions
 */
export type FeatureState =
  | "full"
  | "list_only"
  | "save_only"
  | "locked_upgrade"
  | "locked_buy"
  | "limited"
  | "executive_only"
  | "preview";

export interface AddonInfo {
  id: string;
  name: string;
  price: number;
  unit?: string;
  note?: string;
}

export interface FeatureEntitlement {
  state: FeatureState;
  limit?: number;
  addon?: AddonInfo;
  upgradeTarget?: PlanTier;
  hint?: string;
}

type TierMap = Record<PlanTier, FeatureEntitlement>;

// ─── Shorthand constructors ───────────────────────────────────────────────────

const full = (): FeatureEntitlement => ({ state: "full" });
const preview = (): FeatureEntitlement => ({ state: "preview" });
const saveOnly = (hint?: string): FeatureEntitlement => ({
  state: "save_only",
  hint,
});
const listOnly = (hint?: string): FeatureEntitlement => ({
  state: "list_only",
  hint,
});
const limited = (count: number, addon?: AddonInfo): FeatureEntitlement => ({
  state: "limited",
  limit: count,
  addon,
});

/** Must upgrade — no add-on option. */
const lockedUpgrade = (target: PlanTier = "premium"): FeatureEntitlement => ({
  state: target === "executive" ? "executive_only" : "locked_upgrade",
  upgradeTarget: target,
});

/** Locked, but can purchase as standalone add-on instead of upgrading. */
const lockedBuy = (addon: AddonInfo, target: PlanTier = "premium"): FeatureEntitlement => ({
  state: "locked_buy",
  addon,
  upgradeTarget: target,
});

// ─── Add-on catalog (keyed to Stripe add-on IDs) ─────────────────────────────

export const ADDON: Record<string, AddonInfo> = {
  smart: {
    id: "smart",
    name: "Smart Form Filler",
    price: 39,
    unit: "per form",
  },
  photo: {
    id: "photo",
    name: "Photo Booth Credits",
    price: 15,
    unit: "per photo",
  },
  sponsor: {
    id: "sponsor",
    name: "Sponsorship Calculator",
    price: 15,
    unit: "one-time",
  },
  caseStrength: {
    id: "case-strength",
    name: "Case Strength Analyzer",
    price: 49,
    unit: "one-time",
  },
  interviewPrep: { id: "interview-prep", name: "Interview Prep", price: 200, unit: "one-time" },
  action221g: {
    id: "221g",
    name: "221(g) Action Planner",
    price: 199,
    unit: "one-time",
  },
  docReview: {
    id: "doc-review",
    name: "Expert Case Review",
    price: 59,
    unit: "per request",
  },
  consultation: {
    id: "consultation",
    name: "Expert Consultation",
    price: 99,
    unit: "per 30 min",
  },
  medical: {
    id: "medical",
    name: "Book Medical Appointment",
    price: 5,
    unit: "per request",
  },
  pcc: {
    id: "pcc",
    name: "PCC Filing (Sindh Only)",
    price: 25,
    unit: "per request",
  },
  translate: {
    id: "translate",
    name: "Document Translation",
    price: 25,
    unit: "per document",
  },
  civilGuides: {
    id: "civil-guid",
    name: "Civil Document Guides",
    price: 5,
    unit: "per guide",
  },
  guidePassport: {
    id: "guide-passport",
    name: "Passport Guide",
    price: 5,
    unit: "one-time",
  },
  guidePolice: {
    id: "guide-police",
    name: "Police Character Certificate Guide",
    price: 5,
    unit: "one-time",
  },
  guideCnic: {
    id: "guide-cnic",
    name: "CNIC Guide",
    price: 5,
    unit: "one-time",
  },
  guideBirthCert: {
    id: "guide-birth-cert",
    name: "Birth Certificate Guide",
    price: 5,
    unit: "one-time",
  },
  guideFrc: {
    id: "guide-frc",
    name: "FRC Guide",
    price: 5,
    unit: "one-time",
  },
  guideNikahNama: {
    id: "guide-nikah-nama",
    name: "Marriage Registration Guide",
    price: 5,
    unit: "one-time",
  },
  snapSign: {
    id: "snap-sign",
    name: "Snap & Sign",
    price: 5,
    unit: "per signature",
  },
  pdfToolKit: {
    id: "pdf-tool-kit",
    name: "PDF Tool Kit",
    price: 69,
    unit: "one-time",
  },
  // caseManager: {
  //   id: "case-manager",
  //   name: "Dedicated Case Manager",
  //   price: 300,
  //   unit: "per year",
  // },
};

// ─── Master entitlement table ─────────────────────────────────────────────────
//
// Reading guide:
//   free      → Not a real product tier; shows locked preview to encourage sign-up
//   basic     → Roadmap structure only; no guides, no vault, no tracking
//   premium   → Guided journey; unlocks guides, vault, tracking, most tools
//   executive → Full suite; adds 221g, mock interview, expert support, services
//
// ─────────────────────────────────────────────────────────────────────────────

export const ENTITLEMENTS: Record<string, TierMap> = {
  // ══════════════════════════════════════════════════════════════════════════
  // CORE JOURNEY PLATFORM
  // ══════════════════════════════════════════════════════════════════════════

  /** Roadmap visibility (all steps/chapters visible for all paid tiers). */
  roadmap_access: {
    free: preview(),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /** Checklist engine for case-specific document lists. */
  checklist_engine: {
    free: lockedUpgrade("basic"),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /** Tracker & reminders (DQ, interview, mail, case status). */
  tracker_reminders: {
    free: lockedUpgrade("premium"),
    basic: lockedUpgrade("premium"),
    premium: full(),
    executive: full(),
  },

  /** Document vault — upload, store, auto-extract from uploaded docs. */
  document_vault: {
    free: lockedUpgrade("premium"),
    basic: lockedUpgrade("premium"),
    premium: full(),
    executive: full(),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOOLS — INCLUDED IN ALL PAID TIERS (Basic +)
  // ══════════════════════════════════════════════════════════════════════════

  /** Visa Bulletin Monitor. */
  visa_bulletin_monitor: {
    free: lockedUpgrade("basic"),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /** Portal Wallet — save and manage credentials (USCIS, CEAC, Courier…). */
  portal_wallet: {
    free: lockedUpgrade("basic"),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /** Snap & Sign — sign documents digitally. */
  snap_sign: {
    free: lockedBuy(ADDON.snapSign, "basic"),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /** PDF Tool Kit — merge, edit, compress PDF documents. */
  pdf_toolkit: {
    free: lockedBuy(ADDON.pdfToolKit, "basic"),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /** DQ Status Check tool. */
  dq_status_check: {
    free: full(), //lockedUpgrade('basic'),
    basic: full(),
    premium: full(),
    executive: full(),
  },

  /**
   * Interview Prep tool. Paid: free & basic must buy the $200 Interview Prep
   * add-on (or upgrade to Premium); Premium & Executive include it.
   */
  basic_interview_prep: {
    free: lockedBuy(ADDON.interviewPrep, "premium"),
    basic: lockedBuy(ADDON.interviewPrep, "premium"),
    premium: full(),
    executive: full(),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOOLS — PREMIUM+ (locked for Basic; purchasable as add-on OR upgrade)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Roadmap Embedded Step-by-Step Guides.
   * The single gate for ALL in-journey guide buttons across every step.
   * Basic can see the step/checklist but not the detailed guides.
   * Upgrade to Premium (or buy individual guides where available) to unlock.
   */
  step_guides: {
    free: lockedUpgrade("premium"),
    basic: lockedUpgrade("premium"),
    premium: full(),
    executive: full(),
  },

  /**
   * Case Strength Analyzer tool.
   * Executive-only — no longer sold as a standalone add-on and not included in
   * Premium. Free / Basic / Premium must upgrade to Executive to unlock.
   */
  case_strength: {
    free: lockedUpgrade("executive"),
    basic: lockedUpgrade("executive"),
    premium: lockedUpgrade("executive"),
    executive: full(),
  },

  /** Interview Prep — Rapid Fire Mode. */
  interview_rapid_fire: {
    free: full(),
    basic: limited(5),
    premium: full(),
    executive: full(),
  },

  /** Smart Form Filler (I-130, I-130A auto-fill tool). */
  smart_form_filler: {
    free: lockedBuy(ADDON.smart, "premium"),
    basic: lockedBuy(ADDON.smart, "premium"),
    premium: full(),
    executive: full(),
  },

  /** Sponsorship Calculator. */
  sponsorship_calc: {
    free: lockedBuy(ADDON.sponsor, "premium"),
    basic: lockedBuy(ADDON.sponsor, "premium"),
    premium: full(),
    executive: full(),
  },

  /**
   * Photo Booth passport photo tool.
   * Basic: buy credits. Premium: 2 credits included. Executive: unlimited.
   */
  photo_booth: {
    free: lockedBuy(ADDON.photo, "premium"),
    basic: lockedBuy(ADDON.photo, "premium"),
    premium: limited(2, ADDON.photo),
    executive: full(),
  },

  /** Book Medical Appointment through Rahvana. */
  medical_booking: {
    free: lockedBuy(ADDON.medical, "executive"),
    basic: lockedBuy(ADDON.medical, "executive"),
    premium: lockedBuy(ADDON.medical, "executive"),
    executive: full(),
  },

  /**
   * Polio Certificate guidance (Pakistan-specific).
   * Locked for Basic AND Premium — executive-only service.
   * Basic & Premium can purchase as a standalone add-on.
   */
  polio_certificate: {
    free: lockedUpgrade("premium"),
    basic: lockedUpgrade("premium"),
    premium: full(),
    executive: full(),
  },

  /** Country-specific Civil Document Guides (add-on for Basic; included Premium+). */
  civil_doc_guides: {
    free: lockedBuy(ADDON.civilGuides, "premium"),
    basic: lockedBuy(ADDON.civilGuides, "premium"),
    premium: full(),
    executive: full(),
  },

  /** Per-guide individual purchases — Basic can buy each separately; Premium+ included. */
  guide_passport: {
    free: lockedBuy(ADDON.guidePassport, "premium"),
    basic: lockedBuy(ADDON.guidePassport, "premium"),
    premium: full(),
    executive: full(),
  },
  guide_police: {
    free: lockedBuy(ADDON.guidePolice, "premium"),
    basic: lockedBuy(ADDON.guidePolice, "premium"),
    premium: full(),
    executive: full(),
  },
  guide_cnic: {
    free: lockedBuy(ADDON.guideCnic, "premium"),
    basic: lockedBuy(ADDON.guideCnic, "premium"),
    premium: full(),
    executive: full(),
  },
  guide_birth_cert: {
    free: lockedBuy(ADDON.guideBirthCert, "premium"),
    basic: lockedBuy(ADDON.guideBirthCert, "premium"),
    premium: full(),
    executive: full(),
  },
  guide_frc: {
    free: lockedBuy(ADDON.guideFrc, "premium"),
    basic: lockedBuy(ADDON.guideFrc, "premium"),
    premium: full(),
    executive: full(),
  },
  guide_nikah_nama: {
    free: lockedBuy(ADDON.guideNikahNama, "premium"),
    basic: lockedBuy(ADDON.guideNikahNama, "premium"),
    premium: full(),
    executive: full(),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOOLS — EXECUTIVE ONLY (locked for Basic & Premium; can buy as add-on)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * 221(g) Action Planner.
   * Executive included; Basic & Premium can purchase as standalone add-on.
   */
  action_221g: {
    free: lockedBuy(ADDON.action221g, "executive"),
    basic: lockedBuy(ADDON.action221g, "executive"),
    premium: lockedBuy(ADDON.action221g, "executive"),
    executive: full(),
  },

  /**
   * Interview Prep — Mock Interview.
   * Executive: full access. Premium & Basic: 5-question demo. Free: 5-question demo.
   */
  mock_interview: {
    free: full(),
    basic: limited(5),
    premium: limited(5),
    executive: full(),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // REVIEWS & SUPPORT
  // ══════════════════════════════════════════════════════════════════════════

  /** Expert Document Review (offline). Executive: 2 included; others add-on. */
  expert_doc_review: {
    free: lockedBuy(ADDON.docReview, "executive"),
    basic: lockedBuy(ADDON.docReview, "executive"),
    premium: lockedBuy(ADDON.docReview, "executive"),
    executive: limited(2, ADDON.docReview),
  },

  /** Expert Consultation. Executive: 2 included; others add-on. */
  expert_consultation: {
    free: lockedBuy(ADDON.consultation, "executive"),
    basic: lockedBuy(ADDON.consultation, "executive"),
    premium: lockedBuy(ADDON.consultation, "executive"),
    executive: limited(2, ADDON.consultation),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SERVICES
  // ══════════════════════════════════════════════════════════════════════════

  /** PCC Filing (Sindh Only). Executive included; Basic & Premium upgrade-only. */
  pcc_filing: {
    free: lockedBuy(ADDON.pcc, "executive"),
    basic: lockedBuy(ADDON.pcc, "executive"),
    premium: lockedBuy(ADDON.pcc, "executive"),
    executive: full(),
  },

  /** Document Translation. Executive: 2 included; others add-on. */
  document_translation: {
    free: lockedBuy(ADDON.translate, "executive"),
    basic: lockedBuy(ADDON.translate, "executive"),
    premium: lockedBuy(ADDON.translate, "executive"),
    executive: limited(2, ADDON.translate),
  },

  /**
   * Dedicated Case Manager.
   * Add-on at ALL tiers including Executive (never auto-included).
   */
  // case_manager: {
  //   free: lockedBuy(ADDON.caseManager),
  //   basic: lockedBuy(ADDON.caseManager),
  //   premium: lockedBuy(ADDON.caseManager),
  //   executive: lockedBuy(ADDON.caseManager),
  // },
};

// ─── Convenience lookup ───────────────────────────────────────────────────────

/**
 * Look up what a given tier can do with a specific feature.
 * Returns `locked_upgrade` pointing to Basic for any unknown feature (fail-safe).
 */
export function getEntitlement(feature: string, tier: PlanTier): FeatureEntitlement {
  return (
    ENTITLEMENTS[feature]?.[tier] ?? {
      state: "locked_upgrade",
      upgradeTarget: "basic",
    }
  );
}

/** True if the tier has any meaningful access to the feature (not locked or preview-only). */
export function isAccessible(feature: string, tier: PlanTier): boolean {
  const { state } = getEntitlement(feature, tier);
  return state === "full" || state === "limited" || state === "list_only" || state === "save_only";
}

/** Minimum tier required to get `full` access to a feature. */
export function minimumFullTier(feature: string): PlanTier | null {
  const order: PlanTier[] = ["free", "basic", "premium", "executive"];
  for (const tier of order) {
    if (ENTITLEMENTS[feature]?.[tier]?.state === "full") return tier;
  }
  return null;
}

export const TIER_ORDER: PlanTier[] = ["free", "basic", "premium", "executive"];

export const TIER_NAMES: Record<PlanTier, string> = {
  free: "Free",
  basic: "Basic",
  premium: "Premium",
  executive: "Executive",
};

export const TIER_PRICES: Record<PlanTier, { annual: number; monthly: number } | null> = {
  free: null,
  basic: { annual: 349, monthly: 29 },
  premium: { annual: 699, monthly: 58 },
  executive: { annual: 1099, monthly: 92 },
};
