/**
 * Application route constants.
 * Centralized definition of all routes used in the application.
 */
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";

export const ROUTES = {
  HOME: "/",
  JOURNEY: "/visa-category/ir1-journey",
  EXPLORE: "/visa-category/",
  IR5_JOURNEY: "/visa-category/ir5-journey",
  IR2_JOURNEY: "/visa-category/ir2-journey",
  TOOLS: "/tools",
  RESOURCES: "/resources",
} as const;

export const journeyHref = ROUTES.JOURNEY;
export const ir1journeyHref = ROUTES.JOURNEY;
export const ir5journeyHref = ROUTES.IR5_JOURNEY;
export const ir2journeyHref = ROUTES.IR2_JOURNEY;
export const explorejourneyHref = ROUTES.EXPLORE;
export function getJourneyHrefByType(journeyType?: string | null): string {
  const raw = String(journeyType ?? "").trim();
  // No journey context (null/empty): fall back to the default app journey (IR-1) for the
  // generic reminder / notification callers that expect a non-empty default href.
  if (raw === "") return ROUTES.JOURNEY;
  // Resolve the BASE category so candidate-suffixed keys route correctly:
  // "ir5_candidate-2" -> IR-5 journey (previously they wrongly fell through to the IR-1 route).
  const base = getBaseVisaCategory(raw);
  if (base === "IR-5") return ROUTES.IR5_JOURNEY;
  // CR-2 shares the IR-2 journey (docs/ir2-implementation-plan.md, decision D1).
  if (base === "IR-2" || base === "CR-2") return ROUTES.IR2_JOURNEY;
  if (base === "IR-1" || base === "CR-1") return ROUTES.JOURNEY;
  // A recognized-but-unrouted or genuinely UNKNOWN category (e.g. a student visa): do NOT
  // silently claim the IR-1 route (that would mislabel other categories - decision 5, explicit
  // unknown). Return "" so navigators, which guard on a falsy href, do not push a wrong route.
  return "";
}
export const toolsHref = ROUTES.TOOLS;
export const resourcesHref = ROUTES.RESOURCES;
