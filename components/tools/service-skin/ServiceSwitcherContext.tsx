"use client";

/**
 * Service switcher wiring for the service skin.
 *
 * - Inside a journey, EmbeddedToolContainer provides this context. Switching goes
 *   back through the dashboard's own `launchTool`, so the journey's plan gate
 *   (LockedToolGate / useJourneyPlan) decides what opens. `isLocked` only marks
 *   locked services in the switcher; it never unlocks anything.
 * - On standalone pages there is no provider: the switcher navigates between the
 *   service pages, and each page keeps its own sign-in and credit checkout.
 * - Anywhere else (e.g. the spouse StepView overlay) there is no provider and the
 *   layout is not "page", so the switcher is hidden rather than leaving the journey.
 */

import { createContext, useContext } from "react";
import type { ServiceSkinKey } from "./ServiceSkinShell";

export interface ServiceSwitcherValue {
  select: (service: ServiceSkinKey) => void;
  isLocked?: (service: ServiceSkinKey) => boolean;
}

export const ServiceSwitcherContext = createContext<ServiceSwitcherValue | null>(null);

export const useServiceSwitcher = () => useContext(ServiceSwitcherContext);

export const SERVICE_ORDER: ServiceSkinKey[] = ["consult", "medical", "police", "translate"];

export const SERVICE_SWITCH_LABELS: Record<ServiceSkinKey, string> = {
  consult: "Expert",
  medical: "Medical",
  police: "Police",
  translate: "Document",
};

/** Journey toolbox component keys (see lib/constants/journey-app-groups.ts). */
export const SERVICE_TOOL_KEYS: Record<ServiceSkinKey, string> = {
  consult: "expert_consultation",
  medical: "medical_appointment",
  police: "police_verification",
  translate: "doc_translation",
};

/** Standalone pages. */
export const SERVICE_ROUTES: Record<ServiceSkinKey, string> = {
  consult: "/book-consultation",
  medical: "/book-appointment",
  police: "/police-verification/apply",
  translate: "/document-translation",
};
