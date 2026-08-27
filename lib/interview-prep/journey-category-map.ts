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

/**
 * Check if a journey type is supported
 * 
 * @param journeyType - The journey type to check
 * @returns True if journey type has a category mapping
 */
export function isJourneyTypeSupported(journeyType: string): boolean {
  return journeyType in JOURNEY_CATEGORY_MAP;
}