/**
 * Journey Category Mapping Configuration
 * 
 * Maps journey types to interview prep category slugs.
 * This allows journey service to auto-create the correct interview session category.
 * 
 */

export const JOURNEY_CATEGORY_MAP: Record<string, string> = {
  'IR1': 'ir-1-spouse',
  'IR5': 'ir-5-parent',
};

/**
 * Get interview prep category slug for a journey type.
 *
 * @param journeyType - The journey type (e.g. "IR1", "IR5")
 * @returns The mapped interview prep category slug.
 * @throws Error if no mapping exists for the provided journey type.
 */
export function getCategoryForJourney(journeyType: string): string {
  const category = JOURNEY_CATEGORY_MAP[journeyType];

  if (!category) {
    throw new Error(
      `Unsupported journey type "${journeyType}". No interview prep category mapping found.`
    );
  }

  return category;
}

/**
 * Get all supported journey types
 * 
 * @returns Array of journey type keys
 */
export function getSupportedJourneyTypes(): string[] {
  return Object.keys(JOURNEY_CATEGORY_MAP);
}

export function isJourneyTypeSupported(journeyType: string): boolean {
  return journeyType in JOURNEY_CATEGORY_MAP || resolveCategorySlug(journeyType) !== null;
}

export function resolveCategorySlug(input?: string | null): string | null {
  if (!input) return null;
  const clean = input.trim();
  if (clean === "ir-1-spouse" || clean === "ir-5-parent") return clean;
  
  // If it's a UUID, it's a database journey_id, not a category name
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clean)) {
    return null;
  }

  const upper = clean.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (upper.includes("IR5") || upper.includes("PARENT") || upper === "5" || upper.includes("IR5JOURNEY")) {
    return "ir-5-parent";
  }
  if (upper.includes("IR1") || upper.includes("SPOUSE") || upper === "1" || upper.includes("CR1") || upper.includes("IR1JOURNEY")) {
    return "ir-1-spouse";
  }
  
  return JOURNEY_CATEGORY_MAP[upper] || null;
}

