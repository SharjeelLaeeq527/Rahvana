import {
  PlanTier,
  FeatureEntitlement,
  getEntitlement,
  TIER_NAMES,
  TIER_PRICES,
} from "@/lib/entitlements/config";

/**
 * True when the purchase ledger contains the add-on — either the bare id
 * ("interview-prep") or any category variant of it
 * ("interview-prep:ir-5-parent" counts as "interview-prep").
 */
export function hasPurchasedAddon(purchasedAddons: string[], addonId: string): boolean {
  return purchasedAddons.some((id) => id === addonId || id.startsWith(`${addonId}:`));
}

/**
 * Add-ons whose purchase grants FULL access to an entire tool, overriding the
 * mode-level demo caps that would otherwise apply to the user's plan tier
 * (e.g. Rapid Fire's limited(5) on Basic). Keyed by add-on id; ids must stay
 * in sync with the ADDON constants in lib/entitlements/config.ts.
 */
const ADDON_FULL_ACCESS_GRANTS: Record<string, string[]> = {
  "interview-prep": ["basic_interview_prep", "interview_rapid_fire", "mock_interview"],
};

/**
 * Resolves the effective entitlement for a feature, taking purchased add-ons
 * into account:
 *  - Credit-pool add-ons (`creditsPerAddon`, e.g. Photo Booth, Consultation):
 *    each entry in the purchase ledger grants `creditsPerAddon` credits on top
 *    of the tier's included credits, so the feature resolves to
 *    `limited(plan + purchased)`.
 *  - Tool grants (ADDON_FULL_ACCESS_GRANTS): buying the tool standalone unlocks
 *    every mode of it at `full`, whatever the plan tier says.
 *  - Everything else: if the tier would lock the feature as `locked_buy` but
 *    the user has already purchased that add-on, returns `{ state: 'full' }`.
 */
export function getEffectiveEntitlement(
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[] = []
): FeatureEntitlement {
  const e = getEntitlement(feature, tier);

  // A standalone tool purchase overrides every cap inside that tool — checked
  // before the `!e.addon` early-return because demo tiers (limited(5)) carry
  // no addon reference at all.
  for (const [addonId, features] of Object.entries(ADDON_FULL_ACCESS_GRANTS)) {
    if (features.includes(feature) && hasPurchasedAddon(purchasedAddons, addonId)) {
      return { state: "full" };
    }
  }

  if (!e.addon) return e;

  const pools = getCreditPools(feature, tier, purchasedAddons);
  if (pools && pools.purchasedCredits > 0 && (e.state === "locked_buy" || e.state === "limited")) {
    return { ...e, state: "limited", limit: pools.planCredits + pools.purchasedCredits };
  }

  if (e.state === "locked_buy" && hasPurchasedAddon(purchasedAddons, e.addon.id)) {
    return { state: "full" };
  }
  return e;
}

/**
 * feature_usage key for the *purchased-credits* counter of a pool feature.
 * The plan-included counter keeps the bare `feature` key (backwards compatible).
 */
export const addonPoolKey = (feature: string): string => `${feature}:addon`;

/**
 * Splits a credit-pool feature's grant into its two independent wallets:
 *  - planCredits:       included by the tier (e.g. Executive's 2 consultations)
 *  - purchasedCredits:  SERVICE/PHOTOBOOTH_CREDITS_PER_ADDON × ledger entries
 * Returns null for features that are not credit pools (no `creditsPerAddon`).
 */
export function getCreditPools(
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[] = []
): { planCredits: number; purchasedCredits: number } | null {
  const e = getEntitlement(feature, tier);
  if (!e.addon || !e.creditsPerAddon) return null;
  if (e.state !== "locked_buy" && e.state !== "limited") return null;

  // The add-on ledger stores duplicate ids for duplicate purchases —
  // count occurrences, don't dedupe (see lib/payments/addon-purchase-ledger.ts).
  const purchaseCount = purchasedAddons.filter((id) => id === e.addon!.id).length;
  return {
    planCredits: e.state === "limited" ? (e.limit ?? 0) : 0,
    purchasedCredits: e.creditsPerAddon * purchaseCount,
  };
}

/** True when the user can take the primary action on a feature. */
export function canUse(feature: string, tier: PlanTier, purchasedAddons: string[] = []): boolean {
  const { state } = getEffectiveEntitlement(feature, tier, purchasedAddons);
  return state === "full" || state === "limited" || state === "save_only" || state === "list_only";
}

/** True when the feature is in preview mode (free tier teaser). */
export function isPreview(feature: string, tier: PlanTier): boolean {
  return getEntitlement(feature, tier).state === "preview";
}

/** True when the feature is locked (upgrade or buy required). */
export function isLocked(feature: string, tier: PlanTier, purchasedAddons: string[] = []): boolean {
  const { state } = getEffectiveEntitlement(feature, tier, purchasedAddons);
  return state === "locked_upgrade" || state === "locked_buy" || state === "executive_only";
}

/** True when the feature is completely hidden (never used in this config). */
export function isHidden(_feature: string, _tier: PlanTier): boolean {
  return false; // Nothing is hidden — locked features always show a preview
}

/**
 * Returns a short human-readable hint for why a feature is locked.
 * Suitable for tooltip text, badge labels, or banner subtitles.
 */
export function lockHint(feature: string, tier: PlanTier, purchasedAddons: string[] = []): string {
  const e = getEffectiveEntitlement(feature, tier, purchasedAddons);
  if (e.hint) return e.hint;

  switch (e.state) {
    case "locked_buy":
      if (e.addon) {
        const upgradeName = e.upgradeTarget ? TIER_NAMES[e.upgradeTarget] : null;
        // Upgrade-first framing: the plan is the recommended path; using the
        // resource on its own (paid with wallet credits) is the fallback.
        return upgradeName && e.upgradeTarget !== tier
          ? `Included in the ${upgradeName} plan, or use ${e.addon.name} on its own with credits`
          : `Use ${e.addon.name} on its own with credits`;
      }
      return "Available as an add-on";

    case "locked_upgrade":
      return e.upgradeTarget
        ? `Included in the ${TIER_NAMES[e.upgradeTarget]} plan`
        : "Upgrade to unlock";

    case "executive_only":
      return "Included in the Executive plan";

    case "preview":
      return "Sign up to access your full roadmap";

    case "list_only":
      return "Upgrade to Premium for guides, upload, and vault";

    case "save_only":
      return "Tracking and reminders require Premium or higher";

    default:
      return "";
  }
}

/**
 * Upgrade CTA label for locked features.
 * Returns null when the feature is not locked.
 */
export function upgradeCTA(
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[] = []
): string | null {
  const e = getEffectiveEntitlement(feature, tier, purchasedAddons);
  switch (e.state) {
    case "locked_buy": {
      // Upgrade-first CTA: "Add X" only when no upgrade path exists.
      const target = e.upgradeTarget;
      if (target && target !== tier) return `Upgrade to ${TIER_NAMES[target]}`;
      return e.addon ? `Add ${e.addon.name}` : "Unlock";
    }
    case "locked_upgrade": {
      const target = e.upgradeTarget ?? "premium";
      return `Upgrade to ${TIER_NAMES[target]}`;
    }
    case "executive_only":
      return "Upgrade to Executive";
    case "preview":
      return "View Plans";
    default:
      return null;
  }
}

/**
 * Returns the monthly / annual price for a tier (or null for free).
 */
export function tierPrice(tier: PlanTier): { annual: number; monthly: number } | null {
  return TIER_PRICES[tier];
}

/**
 * Returns display price string, e.g. "$29/mo" or "$349/yr".
 */
export function tierPriceLabel(tier: PlanTier, billing: "monthly" | "annual" = "annual"): string {
  const price = TIER_PRICES[tier];
  if (!price) return "Free";
  return billing === "annual" ? `$${price.annual}/yr` : `$${price.monthly}/mo`;
}
