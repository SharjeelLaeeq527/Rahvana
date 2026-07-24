/**
 * Application route constants.
 * Centralized definition of all routes used in the application.
 */
export const ROUTES = {
  HOME: "/",
  JOURNEY: "/visa-category/ir-category/ir1-journey",
  EXPLORE: "/visa-category/ir-category/",
  IR5_JOURNEY: "/visa-category/ir-category/ir5-journey",
  TOOLS: "/tools",
  RESOURCES: "/resources",
} as const;

export const journeyHref = ROUTES.JOURNEY;
export const ir1journeyHref = ROUTES.JOURNEY;
export const ir5journeyHref = ROUTES.IR5_JOURNEY;
export const explorejourneyHref = ROUTES.EXPLORE;
export function getJourneyHrefByType(journeyType?: string | null): string {
  const norm = String(journeyType ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (norm === "ir-5" || norm === "ir5") return ROUTES.IR5_JOURNEY;
  if (norm === "cr-1" || norm === "cr1" || norm === "ir-1" || norm === "ir1") return ROUTES.JOURNEY;
  return ROUTES.JOURNEY;
}
export const toolsHref = ROUTES.TOOLS;
export const resourcesHref = ROUTES.RESOURCES;
