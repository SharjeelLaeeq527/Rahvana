/**
 * Application route constants.
 * Centralized definition of all routes used in the application.
 */
export const ROUTES = {
  HOME: "/",
  JOURNEY: "/visa-category/ir-category/ir1-journey",
  TOOLS: "/tools",
  RESOURCES: "/resources",
} as const;

export const journeyHref = ROUTES.JOURNEY;
export const ir1journeyHref = ROUTES.JOURNEY;
export const ir1ir1journeyHref = ROUTES.JOURNEY;
export const toolsHref = ROUTES.TOOLS;
export const resourcesHref = ROUTES.RESOURCES;
