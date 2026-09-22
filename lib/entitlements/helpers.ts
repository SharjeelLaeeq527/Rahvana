import {
  PlanTier,
  FeatureEntitlement,
  getEntitlement,
  TIER_NAMES,
  TIER_PRICES,
} from "@/lib/entitlements/config";

/**
 * Resolves the effective entitlement for a feature, taking purchased add-ons
 * into account:
 *  - Credit-pool add-ons (`creditsPerAddon`, e.g. Photo Booth, Consultation):
 *    each entry in the purchase ledger grants `creditsPerAddon` credits on top
 *    of the tier's included credits, so the feature resolves to
 *    `limited(plan + purchased)`.
 *  - Everything else: if the tier would lock the feature as `locked_buy` but
 *    the user has already purchased that add-on, returns `{ state: 'full' }`.
 */
export function getEffectiveEntitlement(
  feature: string,
  tier: PlanTier,
  purchasedAddons: string[] = []
): FeatureEntitlement {
  const e = getEntitlement(feature, tier);
  if (!e.addon) return e;

  const pools = getCreditPools(feature, tier, purchasedAddons);
  if (pools && pools.purchasedCredits > 0 && (e.state === "locked_buy" || e.state === "limited")) {
    return { ...e, state: "limited", limit: pools.planCredits + pools.purchasedCredits };
  }

  if (e.state === "locked_buy" && purchasedAddons.includes(e.addon.id)) {
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
        const addonLabel = `Add ${e.addon.name} for $${e.addon.price}`;
        return upgradeName && e.upgradeTarget !== tier
          ? `${addonLabel} or upgrade to ${upgradeName}`
          : addonLabel;
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
    case "locked_buy":
      return e.addon ? `Add ${e.addon.name}` : "Unlock";
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
