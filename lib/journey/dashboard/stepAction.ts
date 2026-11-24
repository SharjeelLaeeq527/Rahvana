/**
 * The "something from this step" button next to Continue on the dashboard hero:
 * the guide, tool or service the current step is built around, read from the
 * step's own JSON (data/visa-category/*.json). Returns null when the step offers
 * nothing, and the hero then shows no second button.
 */
import { getAppGroupItemLabel, OVERLAY_PAGE_ROUTES } from "@/lib/constants/journey-app-groups";

export type StepAction =
  /** A journey toolbox item, opened inside the journey (EmbeddedToolContainer). */
  | { kind: "tool"; label: string; componentKey: string }
  /** An external portal, opened in a new tab. */
  | { kind: "link"; label: string; href: string; external: boolean }
  /** Open the step: it has its own guide, or launches this item in journey mode. */
  | { kind: "step"; label: string };

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** `tool_data.type` values whose step is built around a toolbox item. */
const TOOL_TYPE_TO_COMPONENT: Record<string, string> = {
  polio_certificate: "polio_vaccination_guide",
  pcc_filing: "police_verification",
  medical_booking: "medical_appointment",
  sponsorship_calculator: "sponsorship_calculator",
  interview_prep: "interview_prep",
  interview_day: "interview_prep",
  dq_recording: "dq_status_check",
  input_221g: "action_221g",
  respond_221g: "action_221g",
};

/** Standalone page routes that have an in-journey toolbox equivalent. */
const PAGE_TO_COMPONENT: Record<string, string> = {
  "/affidavit-support-calculator": "sponsorship_calculator",
  "/book-appointment": "medical_appointment",
  "/passport": "passport_photo",
  "/signature-image-processing": "snap_and_sign",
  "/document-translation": "doc_translation",
  "/interview-prep": "interview_prep",
  "/221g-action-planner": "action_221g",
};

/** A page route the toolbox can open inside the journey. */
function componentForHref(href: string): string | null {
  const path = href.split(/[?#]/)[0].replace(/\/$/, "");
  if (PAGE_TO_COMPONENT[path]) return PAGE_TO_COMPONENT[path];
  for (const [key, route] of Object.entries(OVERLAY_PAGE_ROUTES)) {
    if (route === path) return key;
  }
  return null;
}

/** Plain ASCII label (user-facing copy rule) of reasonable length. */
function cleanLabel(s: string): string {
  const t = s
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > 34 ? t.slice(0, 33).trimEnd() + "." : t;
}

function fromHref(label: string, href: string): StepAction {
  const external = /^https?:\/\//i.test(href);
  const key = external ? null : componentForHref(href);
  if (key) return { kind: "tool", label: cleanLabel(label), componentKey: key };
  // Internal pages without a toolbox equivalent (e.g. one form in the form filler):
  // the step itself launches them in journey mode, so open the step.
  if (!external) return { kind: "step", label: cleanLabel(label) };
  return { kind: "link", label: cleanLabel(label), href, external: true };
}

export function resolveStepAction(step: unknown): StepAction | null {
  const s = rec(step);
  const toolData = rec(s.tool_data);

  // 1. The step is built around a toolbox item.
  const componentKey = TOOL_TYPE_TO_COMPONENT[str(toolData.type) || ""];
  if (componentKey) return { kind: "tool", label: cleanLabel(getAppGroupItemLabel(componentKey)), componentKey };

  // 2. The step's main launch button.
  const launch = rec(toolData.launch_module);
  const launchHref = str(launch.href);
  if (launchHref) return fromHref(str(launch.button_label) || "Open tool", launchHref);

  // 3. Related tools / guides listed on the step.
  const related = (Array.isArray(s.relevantTools) ? s.relevantTools : Array.isArray(s.relevant_tools) ? s.relevant_tools : []) as unknown[];
  for (const r of related) {
    const o = rec(r);
    const href = str(o.href);
    const label = str(o.label);
    if (href && label) return fromHref(label, href);
  }

  // 4. A guide card inside the step itself.
  if (Object.keys(rec(toolData.guide_card)).length || Object.keys(rec(rec(s.action_data).guide_card)).length) {
    return { kind: "step", label: "Open step guide" };
  }
  return null;
}
