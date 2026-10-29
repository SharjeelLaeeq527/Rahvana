import { PlanTier } from "@/lib/entitlements/config";
import { GuideMetadata, isGuideRelevantToVisaCategory } from "./guideRegistry";
import { getBaseVisaCategory, UNKNOWN_VISA_CATEGORY } from "@/lib/candidate/candidateSyncService";

export interface JourneyEntitlementResult {
  /** True if the user has an eligible journey tier unlocking this guide */
  hasAccess: boolean;
  /** The visa category that granted the unlock (e.g. 'IR-1', 'IR-5') */
  unlockedViaCategory?: string;
  /** The tier of that journey (e.g. 'premium', 'executive') */
  journeyTier?: PlanTier;
}

/** Tiers that grant guide access based on minJourneyTier requirement */
const TIER_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  executive: 3,
};

/**
 * Evaluates whether a user's purchased journey plans entitle them to standalone
 * access for a given guide.
 *
 * Rules:
 * 1. Public/free guides (minJourneyTier === 'free' and no entitlementFeature) are always accessible.
 * 2. Basic journey plans are DIY-heavy and do NOT unlock step guides (must be Premium or Executive).
 * 3. If a user owns Premium or Executive for ANY category in `guide.visaCategories`, access is granted.
 * 4. Wildcard ('*' or 'ALL') guides unlock if the user owns an eligible tier in ANY active journey.
 *
 * @param guide The guide metadata from GuideRegistry
 * @param journeyTiers Record of user's active tiers per visa category from PlanContext
 */
export function hasJourneyEntitlementForGuide(
  guide: GuideMetadata,
  journeyTiers: Record<string, PlanTier> = {}
): JourneyEntitlementResult {
  // 1. Free/public guides
  if (!guide.entitlementFeature && guide.minJourneyTier === "free") {
    return { hasAccess: true, unlockedViaCategory: "Public" };
  }

  const requiredMinTier: PlanTier = guide.minJourneyTier || "premium";
  const requiredLevel = TIER_HIERARCHY[requiredMinTier] ?? 2; // Default to premium (level 2)

  // 2. Iterate through all visa categories the guide is mapped to
  for (const cat of guide.visaCategories) {
    if (cat === "*" || cat === "ALL") {
      // Universal guide: check if ANY purchased journey meets the required tier
      for (const [journeyKey, tier] of Object.entries(journeyTiers)) {
        if ((TIER_HIERARCHY[tier] ?? 0) >= requiredLevel) {
          const base = getBaseVisaCategory(journeyKey);
          return {
            hasAccess: true,
            unlockedViaCategory: base !== UNKNOWN_VISA_CATEGORY ? base : journeyKey,
            journeyTier: tier,
          };
        }
      }
      continue;
    }

    // Check direct category (e.g. "IR-1", "IR-5")
    const directTier = journeyTiers[cat];
    if (directTier && (TIER_HIERARCHY[directTier] ?? 0) >= requiredLevel) {
      return {
        hasAccess: true,
        unlockedViaCategory: cat,
        journeyTier: directTier,
      };
    }

    // Check normalized category key fallback (e.g. "ir1", "ir5", "ir1-journey")
    const cleanKey = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [key, tier] of Object.entries(journeyTiers)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        normalizedKey === cleanKey ||
        normalizedKey.startsWith(cleanKey) ||
        getBaseVisaCategory(key) === cat
      ) {
        if ((TIER_HIERARCHY[tier] ?? 0) >= requiredLevel) {
          return {
            hasAccess: true,
            unlockedViaCategory: cat,
            journeyTier: tier,
          };
        }
      }
    }
  }

  return { hasAccess: false };
}
