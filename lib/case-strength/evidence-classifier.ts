/**
 * Bona-fide marriage evidence tier classifier.
 *
 * Given a list of uploaded document keys and a tier map, returns how many
 * documents fall into each tier and which strong-tier items are still missing.
 *
 * Tier classification reflects practitioner-observed USCIS adjudication
 * emphasis on financial co-mingling — it is NOT an official USCIS rubric.
 */

import type {
  EvidenceClassificationResult,
  EvidenceTier,
  EvidenceTierMap,
} from "./types";

const ALL_TIERS: EvidenceTier[] = [
  "tier_1_strong",
  "tier_2_moderate",
  "tier_3_supporting",
];

/**
 * Recommended minimum Tier 1 items for a bona-fide marriage filing.
 * This is the tool's design choice, not an official USCIS minimum.
 */
export const RECOMMENDED_TIER_1_FLOOR = 2;

/**
 * Classifies a set of uploaded document keys against the tier map.
 * Documents whose keys are not found in any tier are returned as `unclassified`.
 */
export function classifyEvidence(
  uploadedDocumentKeys: string[],
  tierMap: EvidenceTierMap
): EvidenceClassificationResult {
  const seen = new Set(uploadedDocumentKeys);
  const byTier: Record<EvidenceTier, string[]> = {
    tier_1_strong: [],
    tier_2_moderate: [],
    tier_3_supporting: [],
  };

  for (const tier of ALL_TIERS) {
    const tierKeys = tierMap.tiers[tier].document_keys;
    for (const key of tierKeys) {
      if (seen.has(key)) byTier[tier].push(key);
    }
  }

  const classified = new Set<string>([
    ...byTier.tier_1_strong,
    ...byTier.tier_2_moderate,
    ...byTier.tier_3_supporting,
  ]);
  const unclassified = uploadedDocumentKeys.filter(
    (k) => !classified.has(k)
  );

  return {
    tier_1_count: byTier.tier_1_strong.length,
    tier_2_count: byTier.tier_2_moderate.length,
    tier_3_count: byTier.tier_3_supporting.length,
    by_tier: byTier,
    unclassified,
    meets_recommended_tier_1_floor:
      byTier.tier_1_strong.length >= RECOMMENDED_TIER_1_FLOOR,
  };
}

/**
 * Returns Tier 1 document keys that are NOT yet uploaded — useful for
 * surfacing "add this to strengthen your case" suggestions.
 */
export function missingTier1Documents(
  uploadedDocumentKeys: string[],
  tierMap: EvidenceTierMap
): string[] {
  const seen = new Set(uploadedDocumentKeys);
  return tierMap.tiers.tier_1_strong.document_keys.filter((k) => !seen.has(k));
}
