/**
 * Journey Category Mapping Configuration
 * 
 * Maps journey types to interview prep category slugs.
 * This allows journey service to auto-create the correct interview session category.
 */

export const JOURNEY_CATEGORY_MAP: Record<string, string> = {
  'IR1': 'ir-1-spouse',
  'IR-1': 'ir-1-spouse',
  'CR1': 'ir-1-spouse',
  'CR-1': 'ir-1-spouse',
  'IR5': 'ir-5-parent',
  'IR-5': 'ir-5-parent',
  'IR2': 'ir-2-child',
  'IR-2': 'ir-2-child',
  'CR2': 'ir-2-child',
  'CR-2': 'ir-2-child',
  'F1': 'f1-student',
  'F-1': 'f1-student',
};

/**
 * Get interview prep category slug for a journey type.
 * Supports candidate-scoped journey keys like "ir5_candidate-2" or "ir2_candidate2".
 *
 * @param journeyType - The journey type (e.g. "IR1", "IR5", "ir5_candidate-2", "IR2")
 * @returns The mapped interview prep category slug.
 * @throws Error if no mapping exists for the provided journey type.
 */
export function getCategoryForJourney(journeyType: string): string {
  if (!journeyType) {
    throw new Error(
      'Unsupported journey type. No interview prep category mapping found.'
    );
  }

  // 1. Exact match in map
  if (JOURNEY_CATEGORY_MAP[journeyType]) {
    return JOURNEY_CATEGORY_MAP[journeyType];
  }

  // 2. Resolve via resolveCategorySlug (handles candidate suffixes, lowercase, formatting)
  const resolved = resolveCategorySlug(journeyType);
  if (resolved) {
    return resolved;
  }

  throw new Error(
    `Unsupported journey type "${journeyType}". No interview prep category mapping found.`
  );
}

/**
 * Get all supported journey types
 * 
 * @returns Array of journey type keys
 */
export function getSupportedJourneyTypes(): string[] {
  return ['IR1', 'IR5', 'IR2', 'CR1', 'CR2', 'F1'];
}

export function isJourneyTypeSupported(journeyType: string): boolean {
  if (!journeyType) return false;
  return journeyType in JOURNEY_CATEGORY_MAP || resolveCategorySlug(journeyType) !== null;
}

/**
 * Resolves a category slug from user input, URL slugs, or journey keys.
 * Supports multi-candidate journey keys like "ir5_candidate2" and "ir2_candidate2".
 */
export function resolveCategorySlug(input?: string | null): string | null {
  if (!input) return null;
  const clean = input.trim();
  if (
    clean === "ir-1-spouse" ||
    clean === "ir-5-parent" ||
    clean === "ir-2-child" ||
    clean === "f1-student" ||
    clean === "au-student" ||
    clean === "ca-student" ||
    clean === "uk-student" ||
    clean === "it-student"
  ) {
    return clean;
  }
  
  // If it's a UUID, it's a database journey_id, not a category name
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clean)) {
    return null;
  }

  const upper = clean.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (upper.includes("IR5") || upper.includes("PARENT") || upper === "5" || upper.includes("IR5JOURNEY")) {
    return "ir-5-parent";
  }
  if (upper.includes("IR2") || upper.includes("CHILD") || upper.includes("CR2") || upper === "2" || upper.includes("IR2JOURNEY")) {
    return "ir-2-child";
  }
  if (upper.includes("IR1") || upper.includes("SPOUSE") || upper === "1" || upper.includes("CR1") || upper.includes("IR1JOURNEY")) {
    return "ir-1-spouse";
  }
  if (upper.includes("F1") || upper.includes("F1STUDENT")) {
    return "f1-student";
  }
  
  return JOURNEY_CATEGORY_MAP[upper] || null;
}

/**
 * Checks whether an interview prep category or journey type supports multiple beneficiaries/candidates.
 * (e.g. IR-5 Parents or IR-2 Children).
 */
export function isMultiCandidateCategorySlug(categorySlugOrJourney?: string | null): boolean {
  if (!categorySlugOrJourney) return false;
  const slug = resolveCategorySlug(categorySlugOrJourney) || categorySlugOrJourney;
  return slug === "ir-5-parent" || slug === "ir-2-child";
}

