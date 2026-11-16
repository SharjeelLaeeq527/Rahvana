/**
 * Shared spacing for the journey content views (chapter step list, step view,
 * quest screens) in BOTH dashboards (journey-engine and journey-spouse).
 *
 * The breadcrumb bar already sits directly above these views, so content
 * starts close under it. Tune the gap here, never per view, so every chapter
 * and step page keeps the same distance from the breadcrumb.
 */
export const JOURNEY_VIEW_TOP = "pt-4 sm:pt-6";

/**
 * Content column for a step page (header + body) inside the step scroll
 * container. No top padding: the container already applies JOURNEY_VIEW_TOP,
 * so the step title lines up with the top of the Case Strength side panel.
 */
export const JOURNEY_STEP_SHELL = "flex w-full max-w-[680px] flex-col px-4 pb-10 sm:px-6 md:px-8";
