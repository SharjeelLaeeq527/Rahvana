/**
 * View model for the redesigned journey dashboard (desktop + mobile skins).
 *
 * Built by `buildDashboardModel()` from values the two DashboardViews
 * (journey-spouse = IR-1/CR-1, journey-engine = IR-5 and other chapter
 * journeys) already compute. The skins only read this model, so both screen
 * sizes always show the same numbers as the rest of the app.
 *
 * Nothing in here is mock data: a field the journey has no data for is left
 * undefined / empty and the skins render nothing for it.
 */

import type { StepAction } from "./stepAction";

export type StepState = "done" | "current" | "next";

export interface DashboardChapter {
  /** Index into the raw `data.chapters` array (used for navigation). */
  index: number;
  number: number;
  title: string;
  done: number;
  total: number;
  status: "done" | "current" | "upcoming" | "locked";
  /** Some steps in this chapter need a higher plan. */
  limitedAccess: boolean;
}

export interface DashboardPathStep {
  chapterIndex: number;
  /** Index into the raw `chapter.steps` array (used for navigation). */
  stepIndex: number;
  /** Display number from the JSON (step_number / display_number_override). */
  number: number;
  name: string;
  state: StepState;
}

export interface DashboardHero {
  /** Next uncompleted active step, or null when every step is done. */
  next: {
    stepName: string;
    stepNumber: number;
    chapterIndex: number;
    chapterTitle: string;
    stepIndex: number;
    /** Guide / tool / portal this step offers, for the hero's second button. */
    action: StepAction | null;
  } | null;
  /** Position across all active steps, for "Step 28 of 34". */
  position: number;
  totalSteps: number;
  completedSteps: number;
  /** The Continue button opens an upgrade prompt instead of the step. */
  upgradeRequired: boolean;
  /** Journey is read-only (14 days after visa issuance). */
  readOnly: boolean;
  /** Upcoming interview, only when a valid date is recorded. */
  interview: {
    date: Date;
    time?: string;
    place?: string;
    daysLeft: number;
  } | null;
}

export interface DashboardFactor {
  key: "evidence" | "consistency" | "completeness" | "risk";
  label: string;
  /** 0-100. For risk this is the penalty (higher = worse). */
  value: number;
}

export interface DashboardCaseHealth {
  /** No real evidence yet: show no score at all. */
  notStarted: boolean;
  loading: boolean;
  score: number;
  /** Label from the case-strength engine ("Strong", "Building Your Case", ...). */
  label: string;
  status: "excellent" | "good" | "needs-attention" | "critical";
  band: "weak" | "moderate" | "strong";
  /** Points needed to reach the next band, null when already Strong. */
  pointsToNextBand: number | null;
  nextBandLabel: string | null;
  factors: DashboardFactor[];
  evidenceQuestions: { answered: number; total: number };
  consistencyQuestions: { answered: number; total: number };
  /**
   * The journey's plan does not include case strength. The score, label and
   * factors are then a fixed sample (never the user's real numbers), shown blurred.
   */
  locked: boolean;
}

export interface DashboardAlert {
  /** Stable id (step key + title), used to remember dismissals. */
  id: string;
  level: "blocking" | "check";
  title: string;
  /** "Chapter 3, Step 6" or the step name when there is no number. */
  where: string;
  detail: string;
  fix?: string;
  chapterIndex: number;
  stepIndex: number;
  /** Score-drop meta alert: its action opens the case analysis, not a step. */
  kind?: "score-drop";
}

export interface DashboardFact {
  label: string;
  value: string;
  /** Show a copy button next to the value. */
  copy?: boolean;
}

export type TrackingStageKey = "petition" | "nvc" | "medical" | "interview" | "result";

export interface DashboardTrackingStage {
  key: TrackingStageKey;
  /** Short name for the milestone strip. */
  label: string;
  /** Headline when this stage is selected. */
  title: string;
  status: "done" | "current" | "next";
  /** Optional status word for the pill ("Scheduled", "221(g)"). */
  statusText?: string;
  tone?: "ok" | "wait" | "alert";
  date?: Date;
  facts: DashboardFact[];
  note?: string;
  links: { label: string; href: string }[];
}

export interface DashboardTracking {
  stages: DashboardTrackingStage[];
  /** Index of the furthest stage with data (selected by default). */
  currentIndex: number;
  receipt: {
    number: string;
    status?: string;
    /** USCIS's own explanation of the status, from the last live check. */
    statusDescription?: string;
    trackingEnabled: boolean;
    lastCheckedAt?: Date;
  } | null;
  /** Set while the case is in administrative processing (incl. 221(g)). */
  ap: DashboardApInfo | null;
}

export interface DashboardApInfo {
  /** The user recorded their AP details (the tracker has data to show). */
  saved: boolean;
  since?: Date;
  /** The journey step that records AP details (found by its tool type, never by position). */
  step: { chapterIndex: number; stepIndex: number } | null;
}

export interface DashboardKeyDate {
  id: string;
  date: Date;
  title: string;
  detail?: string;
  color: string;
  /** User-added event (can be deleted). */
  custom?: boolean;
}
