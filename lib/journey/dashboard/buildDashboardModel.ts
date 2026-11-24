/**
 * Pure builders for the redesigned journey dashboard. See ./types.ts.
 *
 * Step visibility always goes through the `getActiveStepsForStage` helper the
 * caller passes in (journey-engine or journey-spouse copy), never inline.
 * Tracking stages read the SAME metadata / tracking_status / receipt / NVC
 * inputs and phase flags the classic dashboards use; nothing is invented.
 */
import { SCORE_BANDS, getScoreBand } from "@/lib/case-strength/case-narrative";
import type { AggregatedIssue } from "@/lib/case-strength/aggregate-issues";
import { resolveStepAction } from "./stepAction";
import { readCaseFacts } from "./caseFacts";
import type { ReceiptRecord } from "@/app/components/home-page/Visatickerprops";
import {
  formatTime24,
  parseDay,
  type DashboardEvent,
} from "./personal";
import type {
  DashboardAlert,
  DashboardCaseHealth,
  DashboardChapter,
  DashboardFact,
  DashboardHero,
  DashboardKeyDate,
  DashboardPathStep,
  DashboardTracking,
  DashboardTrackingStage,
} from "./types";

type Meta = Record<string, unknown>;

/** Structural shapes of the journey JSON this module reads (both V2 and V3 data fit). */
export interface StepLike {
  step_key?: string;
  id?: string;
  step_name?: string;
  name?: string;
  step_number?: number;
  display_number_override?: number;
}
export interface ChapterLike {
  chapter_name?: string;
  name?: string;
  steps?: StepLike[];
  scenarioSpecific?: string;
}
export interface JourneyDataLike {
  chapters?: ChapterLike[];
  stages?: ChapterLike[];
}
export interface JourneyStateLike {
  completedSteps: Set<string>;
  metadata: Meta;
  filingType?: string | null;
  scenarioType?: string | null;
}
export interface NextActionLike {
  step: StepLike;
  chapterIdx: number;
  stepIdxInChapter: number;
}

/** The caller's journeyHelpers (engine or spouse copy). Method syntax on purpose. */
export interface StepHelpers {
  getActiveStepsForStage(data: JourneyDataLike, index: number, metadata: Meta, filingFallback?: string | null): StepLike[];
  getStageProgress(data: JourneyDataLike, index: number, state: JourneyStateLike): { done: number; total: number; pct: number };
  isStageUnlocked(data: JourneyDataLike, index: number, state: JourneyStateLike): boolean;
}

const rec = (v: unknown): Meta => (v && typeof v === "object" && !Array.isArray(v) ? (v as Meta) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

const DAY_MS = 864e5;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CEAC_STATUS_URL = "https://ceac.state.gov/CEACStatTracker/Status.aspx";
export const IV_WAIT_TIMES_URL =
  "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html";

const stepId = (s: StepLike | undefined): string => s?.step_key || s?.id || "";
const chaptersOf = (data: JourneyDataLike): ChapterLike[] => data?.chapters || data?.stages || [];
const cleanChapterTitle = (c: ChapterLike | undefined, i: number) =>
  String(c?.chapter_name || c?.name || `Chapter ${i + 1}`)
    .replace(/^Stage\s[IVX]+:\s*/, "")
    .replace(/^Chapter\s+\d+\s*:\s*/i, "");
const stepNumberOf = (s: StepLike | undefined, fallback: number): number =>
  s?.display_number_override ?? s?.step_number ?? fallback;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}
export function formatDay(d: Date, withYear = true): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? " " + d.getFullYear() : ""}`;
}
/** "in 3 days" / "today" / "12 days ago" */
export function relativeDays(d: Date, today: Date): string {
  const n = daysBetween(today, d);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** Visible chapters (scenario filter, same rule as the classic chapter grid). */
function visibleChapterIndexes(data: JourneyDataLike, state: JourneyStateLike): number[] {
  return chaptersOf(data)
    .map((c, i) => ({ c, i }))
    .filter(
      ({ c }) => !state.scenarioType || !c?.scenarioSpecific || c.scenarioSpecific === state.scenarioType
    )
    .map(({ i }) => i);
}

export function buildChapters(
  data: JourneyDataLike,
  state: JourneyStateLike,
  helpers: StepHelpers,
  isStepLocked: (stepKey: string) => boolean,
  currentChapterIndex: number | null
): DashboardChapter[] {
  const raw = chaptersOf(data);
  return visibleChapterIndexes(data, state).map((i, pos) => {
    const prog = helpers.getStageProgress(data, i, state);
    const unlocked = helpers.isStageUnlocked(data, i, state);
    const done = prog.total > 0 && prog.done === prog.total;
    const status: DashboardChapter["status"] = !unlocked
      ? "locked"
      : done
        ? "done"
        : i === currentChapterIndex || prog.done > 0
          ? "current"
          : "upcoming";
    return {
      index: i,
      number: pos + 1,
      title: cleanChapterTitle(raw[i], i),
      done: prog.done,
      total: prog.total,
      status,
      limitedAccess: (raw[i]?.steps || []).some((s) => isStepLocked(stepId(s))),
    };
  });
}

export function buildPath(
  data: JourneyDataLike,
  state: JourneyStateLike,
  helpers: StepHelpers,
  next: NextActionLike | null,
  /** Plan lock for a step, by its index among the chapter's VISIBLE steps (getStepLockStatus). */
  stepLock?: (stepKey: string, chapterIdx: number, localIdx: number) => { isLocked: boolean; requiredPlan: string | null }
): DashboardPathStep[] {
  const raw = chaptersOf(data);
  const nextKey = next ? stepId(next.step) : null;
  const out: DashboardPathStep[] = [];
  visibleChapterIndexes(data, state).forEach((ci) => {
    const active = helpers.getActiveStepsForStage(data, ci, state.metadata, state.filingType);
    const rawSteps: StepLike[] = raw[ci]?.steps || [];
    active.forEach((s, k) => {
      const id = stepId(s);
      const rawIdx = rawSteps.findIndex((r) => stepId(r) === id);
      out.push({
        chapterIndex: ci,
        stepIndex: rawIdx >= 0 ? rawIdx : k,
        number: stepNumberOf(s, k + 1),
        name: String(s?.step_name || s?.name || `Step ${k + 1}`),
        state: state.completedSteps.has(id) ? "done" : id === nextKey ? "current" : "next",
        lock: (() => {
          const l = stepLock?.(id, ci, k);
          return l?.isLocked ? { requiredPlan: l.requiredPlan || "basic" } : null;
        })(),
      });
    });
  });
  return out;
}

export interface InterviewInfo {
  date: Date | null;
  time?: string;
  place?: string;
}

/** Interview date: admin-set tracking_status first, else what the user saved (see ./caseFacts). */
export function readInterview(metadata: Meta): InterviewInfo {
  const f = readCaseFacts(metadata || {});
  return { date: f.interviewDate, time: f.interviewTime, place: f.interviewPlace };
}

export function buildHero(args: {
  path: DashboardPathStep[];
  data: JourneyDataLike;
  next: NextActionLike | null;
  upgradeRequired: boolean;
  readOnly: boolean;
  metadata: Meta;
  today: Date;
}): DashboardHero {
  const { path, data, next, today } = args;
  const completed = path.filter((p) => p.state === "done").length;
  const curIdx = path.findIndex((p) => p.state === "current");
  const iv = readInterview(args.metadata);
  const daysLeft = iv.date ? daysBetween(today, iv.date) : -1;
  return {
    next: next
      ? {
          stepName: String(next.step?.step_name || next.step?.name || "Next step"),
          stepNumber: stepNumberOf(next.step, next.stepIdxInChapter + 1),
          chapterIndex: next.chapterIdx,
          chapterTitle: cleanChapterTitle(chaptersOf(data)[next.chapterIdx], next.chapterIdx),
          stepIndex: next.stepIdxInChapter,
          action: resolveStepAction(next.step),
        }
      : null,
    position: curIdx >= 0 ? curIdx + 1 : completed,
    totalSteps: path.length,
    completedSteps: completed,
    upgradeRequired: args.upgradeRequired,
    readOnly: args.readOnly,
    interview:
      iv.date && daysLeft >= 0
        ? { date: iv.date, time: iv.time, place: iv.place, daysLeft }
        : null,
  };
}

export function buildCaseHealth(input: {
  notStarted: boolean;
  loading: boolean;
  score: number;
  label: string;
  status: DashboardCaseHealth["status"];
  evidence: number;
  consistency: number;
  completeness?: number;
  riskPenalty?: number;
  evidenceQuestions: { answered: number; total: number };
  consistencyQuestions: { answered: number; total: number };
}): DashboardCaseHealth {
  const score = Math.max(0, Math.min(100, Math.round(input.score || 0)));
  const band = getScoreBand(score);
  const pointsToNextBand =
    band === "weak" ? SCORE_BANDS.weakMax - score : band === "moderate" ? SCORE_BANDS.strongMin - score : null;
  const factors: DashboardCaseHealth["factors"] = [
    { key: "evidence", label: "Evidence", value: Math.round(input.evidence) },
    { key: "consistency", label: "Consistency", value: Math.round(input.consistency) },
  ];
  if (typeof input.completeness === "number") {
    factors.push({ key: "completeness", label: "Completeness", value: Math.round(input.completeness) });
  }
  if (typeof input.riskPenalty === "number") {
    factors.push({ key: "risk", label: "Risk", value: Math.round(input.riskPenalty) });
  }
  return {
    notStarted: input.notStarted,
    loading: input.loading,
    score,
    label: input.label,
    status: input.status,
    band,
    pointsToNextBand,
    nextBandLabel: band === "weak" ? "Moderate" : band === "moderate" ? "Strong" : null,
    factors,
    evidenceQuestions: input.evidenceQuestions,
    consistencyQuestions: input.consistencyQuestions,
    locked: false,
  };
}

/**
 * What a plan without case strength sees: a fixed sample score (shown blurred
 * behind the upgrade prompt), so the real score never reaches the page. The
 * questionnaire counts stay real because the questionnaires stay usable.
 */
export function lockedCaseHealthPreview(real: DashboardCaseHealth): DashboardCaseHealth {
  const sample = buildCaseHealth({
    notStarted: false,
    loading: false,
    score: 72,
    label: "Strong",
    status: "good",
    evidence: 68,
    consistency: 80,
    completeness: real.factors.some((f) => f.key === "completeness") ? 70 : undefined,
    riskPenalty: real.factors.some((f) => f.key === "risk") ? 15 : undefined,
    evidenceQuestions: real.evidenceQuestions,
    consistencyQuestions: real.consistencyQuestions,
  });
  return { ...sample, locked: true };
}

export function alertId(issue: Pick<AggregatedIssue, "stepKey" | "title">): string {
  return `${issue.stepKey}|${issue.title}`;
}

/**
 * Alerts for the banner / drawer / blocking tile. Takes the classic dashboard's
 * already-gated `displayedAlertIssues`, keeps unresolved critical + warning
 * items (the Alert Center's rule) and drops the ones the user dismissed.
 */
export function buildAlerts(issues: AggregatedIssue[], dismissed: string[]): DashboardAlert[] {
  const hidden = new Set(dismissed);
  return issues
    .filter((i) => !i.resolved && (i.level === "critical" || i.level === "warning"))
    .filter((i) => !hidden.has(alertId(i)))
    .map((i) => {
      const [detailPart, fixPart] = String(i.hint || "").split(/\n\nHow to resolve:\s*/);
      return {
        id: alertId(i),
        level: i.level === "critical" ? "blocking" : "check",
        title: i.title,
        where:
          i.kind === "score-drop"
            ? "Case strength"
            : i.stepNumber > 0
              ? `Chapter ${i.chapterIdx + 1}, Step ${i.stepNumber}`
              : i.stepName,
        detail: (detailPart || "").trim(),
        fix: fixPart?.trim() || undefined,
        chapterIndex: i.chapterIdx,
        stepIndex: i.stepIdx,
        kind: i.kind === "score-drop" ? "score-drop" : undefined,
      } satisfies DashboardAlert;
    });
}

/**
 * Estimated interview window from the DQ date and the month the embassy is
 * currently scheduling (`currentSchedulingMonthYear`, "YYYY-MM"). Same maths as
 * the classic "Dynamic Scheduling Tracker".
 */
export function estimateInterviewWindow(
  dqDate: Date,
  schedulingMonthYear: string | undefined,
  today: Date
): { monthsBehind: number; from: Date; to: Date; schedulingMonth: Date } | null {
  if (!schedulingMonthYear || !/^\d{4}-\d{1,2}$/.test(schedulingMonthYear)) return null;
  const [y, m] = schedulingMonthYear.split("-").map(Number);
  const schedulingMonth = new Date(y, m - 1, 1);
  const monthsBehind = Math.max(
    0,
    (dqDate.getFullYear() - schedulingMonth.getFullYear()) * 12 +
      (dqDate.getMonth() - schedulingMonth.getMonth())
  );
  const from = new Date(today.getFullYear(), today.getMonth() + monthsBehind, 1);
  const to = new Date(from.getFullYear(), from.getMonth() + 2, 1);
  return { monthsBehind, from, to, schedulingMonth };
}

export interface TrackingInput {
  metadata: Meta;
  receiptRecord: ReceiptRecord | null | undefined;
  nvcCaseNum?: string;
  nvcInvoice?: string;
  /** Phase flags computed by the classic DashboardView (kept identical). */
  interviewAttended: boolean;
  isApPhase: boolean;
  isApprovedPhase: boolean;
  isJourneyComplete: boolean;
  today: Date;
}

const fact = (label: string, value: unknown, copy = false): DashboardFact | null =>
  value === undefined || value === null || String(value).trim() === ""
    ? null
    : { label, value: String(value), copy };
const facts = (...f: (DashboardFact | null)[]) => f.filter((x): x is DashboardFact => !!x);
const humanStatus = (s?: string | null) =>
  s ? s.replace(/_/g, " ").replace(/\s+/g, " ").trim() : undefined;

export function buildTracking(input: TrackingInput): DashboardTracking {
  const { metadata: md, receiptRecord: rr, today } = input;
  const f = readCaseFacts(md || {}, rr, { caseNum: input.nvcCaseNum, invoice: input.nvcInvoice });
  const day = (d: Date | null) => (d ? formatDay(d) : undefined);

  // Petition (USCIS)
  const receiptNumber = f.receiptNumber || "";
  const uscisStatus = humanStatus(f.uscisStatus);
  const approved = !!f.approvalDate;
  const petitionHas = !!(receiptNumber || f.noticeDate || f.filedDate || approved || uscisStatus);

  // NVC + DQ + queue
  const nvcHas = !!(
    f.nvcCaseNum ||
    f.nvcInvoice ||
    f.nvcReceivedDate ||
    f.feesPaid ||
    f.ds260Date ||
    f.docsSubmittedDate ||
    f.nvcReviewComplete ||
    f.isDq ||
    rec(md?.tracking_status).interview_queue
  );
  const window = f.dqDate ? estimateInterviewWindow(f.dqDate, str(md?.currentSchedulingMonthYear), today) : null;

  // Medical / interview
  const medicalHas = !!(f.medicalDate || f.medicalAttendedDate);
  const interviewHas = !!f.interviewDate;
  const medicalUpcoming = !!f.medicalDate && !f.medicalAttendedDate && f.medicalDate >= startOfDay(today);

  // Result
  const outcome = f.interviewOutcome;
  const visaIssued = !!f.visaIssuedDate;
  const resultHas =
    input.interviewAttended ||
    input.isApPhase ||
    input.isApprovedPhase ||
    input.isJourneyComplete ||
    visaIssued ||
    !!f.apDate;

  const has = [petitionHas, nvcHas, medicalHas, interviewHas, resultHas];
  let reached = -1;
  has.forEach((h, i) => {
    if (h) reached = i;
  });
  const statusAt = (i: number): DashboardTrackingStage["status"] =>
    !has[i] ? "next" : i < reached ? "done" : "current";

  const resultOk = input.isApprovedPhase || input.isJourneyComplete || visaIssued;
  const resultAlert = !resultOk && (input.isApPhase || !!f.apDate);
  const resultTitle = input.isJourneyComplete
    ? "Journey complete"
    : visaIssued
      ? "Visa issued"
      : input.isApprovedPhase
        ? "Visa approved"
        : resultAlert
          ? outcome === "221g"
            ? "Refused under 221(g)"
            : "Administrative processing"
          : "Awaiting result";

  const nvcTitle = f.isDq
    ? "Documentarily qualified"
    : f.nvcReviewComplete
      ? "NVC review complete"
      : f.docsSubmittedDate
        ? "Documents with NVC"
        : f.feesPaid
          ? "NVC fees paid"
          : "NVC processing";

  const stages: DashboardTrackingStage[] = [
    {
      key: "petition",
      label: "Petition",
      title: approved ? "Petition approved" : uscisStatus ? `USCIS: ${uscisStatus}` : "Petition with USCIS",
      status: statusAt(0),
      statusText: approved ? "Approved" : undefined,
      tone: approved ? "ok" : undefined,
      // The stage date has its own row and the receipt number its own footer, so neither is repeated in the facts.
      date: f.approvalDate || f.noticeDate || f.filedDate || undefined,
      facts: facts(
        fact("USCIS status", approved ? uscisStatus : undefined),
        fact("Receipt notice", approved ? day(f.noticeDate) : undefined),
        fact("Filed", (approved || f.noticeDate) ? day(f.filedDate) : undefined),
        fact("Priority date", day(f.priorityDate))
      ),
      note: f.uscisStatusDescription,
      links: [],
    },
    {
      key: "nvc",
      label: "NVC",
      title: nvcTitle,
      status: statusAt(1),
      statusText: f.isDq ? "DQ" : undefined,
      tone: f.isDq ? "ok" : undefined,
      date: f.dqDate || f.nvcReviewDate || f.docsSubmittedDate || f.nvcReceivedDate || undefined,
      facts: facts(
        fact("NVC case number", f.nvcCaseNum, true),
        fact("Invoice ID", f.nvcInvoice, true),
        fact("Fees", f.feesPaid ? (f.feesPaidDate ? `Paid ${day(f.feesPaidDate)}` : "Paid") : undefined),
        fact("DS-260", f.ds260Date ? `Submitted ${day(f.ds260Date)}` : undefined),
        fact("Embassy", f.post),
        fact(
          "Embassy is scheduling",
          window && `${MONTHS[window.schedulingMonth.getMonth()]} ${window.schedulingMonth.getFullYear()} DQs`
        ),
        fact(
          "Estimated interview",
          window &&
            (window.monthsBehind === 0
              ? "Approaching soon"
              : `${MONTHS[window.from.getMonth()]} ${window.from.getFullYear()} to ${MONTHS[window.to.getMonth()]} ${window.to.getFullYear()}`)
        )
      ),
      note: window
        ? `About ${window.monthsBehind} month${window.monthsBehind === 1 ? "" : "s"} behind the group the ${f.post || "embassy"} is scheduling now.`
        : undefined,
      links: f.isDq ? [{ label: "IV wait times", href: IV_WAIT_TIMES_URL }] : [],
    },
    {
      key: "medical",
      label: "Medical",
      title: f.medicalAttendedDate ? "Medical exam done" : "Medical exam",
      status: statusAt(2),
      statusText: medicalUpcoming ? "Booked" : undefined,
      tone: medicalUpcoming ? "wait" : undefined,
      date: f.medicalAttendedDate || f.medicalDate || undefined,
      facts: facts(fact("Time", f.medicalTime), fact("Clinic", f.medicalClinic)),
      links: [],
    },
    {
      key: "interview",
      label: "Interview",
      title: "Visa interview",
      status: statusAt(3),
      statusText: interviewHas && !input.interviewAttended ? "Scheduled" : undefined,
      tone: interviewHas && !input.interviewAttended ? "wait" : undefined,
      date: f.interviewDate || undefined,
      facts: facts(
        fact("Time", f.interviewTime),
        fact("Embassy", f.interviewPlace),
        fact("Letter received", day(f.interviewLetterDate))
      ),
      links: [],
    },
    {
      key: "result",
      label: "Result",
      title: resultTitle,
      status: resultOk ? (has[4] ? "done" : "next") : statusAt(4),
      statusText: resultAlert
        ? outcome === "221g"
          ? "221(g)"
          : "AP"
        : visaIssued
          ? "Issued"
          : input.isApprovedPhase
            ? "Approved"
            : undefined,
      tone: resultAlert ? "alert" : resultOk ? "ok" : undefined,
      date: f.visaIssuedDate || f.apDate || undefined,
      // The AP start date is the stage date (shown large), so it is not repeated as a fact.
      facts: [],
      note:
        resultAlert && !(md?.apSaved === true || md?.apSaved === "true")
          ? "Record your AP details to start tracking it."
          : undefined,
      links: resultHas ? [{ label: "Open CEAC", href: CEAC_STATUS_URL }] : [],
    },
  ];

  return {
    stages,
    currentIndex: Math.max(0, reached),
    receipt: receiptNumber
      ? {
          number: receiptNumber,
          status: uscisStatus,
          statusDescription: f.uscisStatusDescription,
          trackingEnabled: f.trackingEnabled,
          lastCheckedAt: f.uscisCheckedAt || undefined,
        }
      : null,
    ap: resultAlert
      ? { saved: md?.apSaved === true || md?.apSaved === "true", since: f.apDate || undefined, step: null }
      : null,
  };
}

/** The tool type of the step that records administrative processing details. */
export const AP_STEP_TOOL_TYPE = "adm_processing";

/**
 * Finds the first VISIBLE step whose `tool_data.type` matches, through the
 * caller's getActiveStepsForStage. Returns the raw index in its chapter, which
 * is what onOpenStep expects. Used instead of hardcoded step positions.
 */
export function findStepByToolType(
  data: JourneyDataLike,
  state: JourneyStateLike,
  helpers: StepHelpers,
  toolType: string
): { chapterIndex: number; stepIndex: number } | null {
  const raw = chaptersOf(data);
  for (const ci of visibleChapterIndexes(data, state)) {
    const active = helpers.getActiveStepsForStage(data, ci, state.metadata, state.filingType);
    const hit = active.find((s) => rec(rec(s).tool_data).type === toolType);
    if (!hit) continue;
    const idx = (raw[ci]?.steps || []).findIndex((r) => stepId(r) === stepId(hit));
    if (idx >= 0) return { chapterIndex: ci, stepIndex: idx };
  }
  return null;
}

const KEY_DATE_COLORS = {
  interview: "#b4405a",
  medical: "#0d9488",
  dq: "#6b4f93",
  notice: "#3b62a0",
  ap: "#d89a45",
};

export function buildKeyDates(metadata: Meta, receiptRecord: ReceiptRecord | null | undefined, events: DashboardEvent[]): DashboardKeyDate[] {
  const f = readCaseFacts(metadata || {}, receiptRecord);
  const out: DashboardKeyDate[] = [];
  if (f.interviewDate)
    out.push({
      id: "k-interview",
      date: f.interviewDate,
      title: "Visa interview",
      detail: [f.interviewTime, f.interviewPlace].filter(Boolean).join(", ") || undefined,
      color: KEY_DATE_COLORS.interview,
    });
  if (f.medicalDate)
    out.push({
      id: "k-medical",
      date: f.medicalDate,
      title: "Medical exam",
      detail: [f.medicalTime, f.medicalClinic].filter(Boolean).join(", ") || undefined,
      color: KEY_DATE_COLORS.medical,
    });
  if (f.dqDate) out.push({ id: "k-dq", date: f.dqDate, title: "Documentarily qualified", color: KEY_DATE_COLORS.dq });
  if (f.approvalDate)
    out.push({ id: "k-approval", date: f.approvalDate, title: "Petition approved", color: KEY_DATE_COLORS.notice });
  if (f.noticeDate)
    out.push({ id: "k-notice", date: f.noticeDate, title: "Petition receipt notice", color: KEY_DATE_COLORS.notice });
  if (f.apDate) out.push({ id: "k-ap", date: f.apDate, title: "Administrative processing", color: KEY_DATE_COLORS.ap });
  if (f.visaIssuedDate)
    out.push({ id: "k-visa", date: f.visaIssuedDate, title: "Visa issued", color: KEY_DATE_COLORS.medical });
  events.forEach((e) => {
    const d = parseDay(e.day);
    if (!d) return;
    out.push({
      id: e.id,
      date: d,
      title: e.title,
      detail: [formatTime24(e.time), e.note].filter(Boolean).join(", ") || undefined,
      color: e.color,
      custom: true,
    });
  });
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
