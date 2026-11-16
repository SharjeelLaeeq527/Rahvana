"use client";

import { useMemo, type ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { getJourneyAppGroups } from "@/lib/constants/journey-app-groups";
import type { AggregatedIssue } from "@/lib/case-strength/aggregate-issues";
import type { ReceiptRecord } from "@/app/components/home-page/Visatickerprops";
import {
  buildAlerts,
  buildCaseHealth,
  buildChapters,
  buildHero,
  AP_STEP_TOOL_TYPE,
  buildKeyDates,
  findStepByToolType,
  lockedCaseHealthPreview,
  buildPath,
  buildTracking,
  type JourneyDataLike,
  type JourneyStateLike,
  type NextActionLike,
  type StepHelpers,
} from "@/lib/journey/dashboard/buildDashboardModel";
import { useUscisLiveCheck } from "./useUscisLiveCheck";
import { useDashboardPersonal } from "./useDashboardPersonal";
import type { DashboardActions, JourneyDashboardProps } from "./JourneyDashboard";

/**
 * Everything the classic DashboardView already computed, handed over as-is.
 * No score, alert or tracking logic is re-derived here: this only reshapes it
 * for the new skin, so the classic layout and the new one can never disagree.
 */
export interface JourneyDashboardInputs {
  data: JourneyDataLike;
  state: JourneyStateLike & { backendId?: string | null };
  updateMetadata: (patch: Record<string, unknown>) => unknown;
  helpers: StepHelpers;
  nextAction: NextActionLike | null;
  /** Continue button needs an upgrade (roadmap access or the next step is plan-locked). */
  upgradeRequired: boolean;
  /** Journey lock (read-only after visa issuance). */
  readOnly: boolean;
  isStepLocked: (stepKey: string) => boolean;
  caseHealth: {
    notStarted: boolean;
    loading: boolean;
    score: number;
    label: string;
    status: "excellent" | "good" | "needs-attention" | "critical";
    evidence: number;
    consistency: number;
    completeness?: number;
    riskPenalty?: number;
    evidenceAnswered: number;
    evidenceTotal: number;
    consistencyAnswered: number;
    consistencyTotal: number;
  };
  issues: AggregatedIssue[];
  receiptRecord: ReceiptRecord | null | undefined;
  nvcCaseNum?: string;
  nvcInvoice?: string;
  interviewAttended: boolean;
  isApPhase: boolean;
  isApprovedPhase: boolean;
  isJourneyComplete: boolean;
  actions: DashboardActions;
  onLaunchTool?: (componentKey: string) => void;
  /** Features this journey's plan does not include (from useJourneyPlan). */
  locks: { caseStrength: boolean; uscisCheck: boolean; vault: boolean; wallet: boolean };
  /** Open the upgrade prompt for an entitlement feature key. */
  onUpgrade: (feature: string) => void;
  /** The DashboardView's own AP tracking tool (engine or spouse copy). */
  renderApTracker: () => ReactNode;
}

export function useJourneyDashboardProps(i: JourneyDashboardInputs): JourneyDashboardProps {
  const { profile } = useAuth();
  const { activeCandidate } = useCandidate();
  const { journeyCategory } = useJourneyEnvironment();
  const personal = useDashboardPersonal(i.state.backendId, i.state.metadata, i.updateMetadata);
  const today = useMemo(() => new Date(), []);

  const category =
    journeyCategory || (activeCandidate?.visaCategory ? getBaseVisaCategory(activeCandidate.visaCategory) : null);
  const groups = useMemo(() => getJourneyAppGroups(category), [category]);

  const { data, state, helpers, nextAction } = i;
  const path = useMemo(() => buildPath(data, state, helpers, nextAction), [data, state, helpers, nextAction]);
  const chapters = useMemo(
    () => buildChapters(data, state, helpers, i.isStepLocked, nextAction?.chapterIdx ?? null),
    [data, state, helpers, nextAction, i.isStepLocked]
  );
  const hero = useMemo(
    () =>
      buildHero({
        path,
        data,
        next: nextAction,
        upgradeRequired: i.upgradeRequired,
        readOnly: i.readOnly,
        metadata: state.metadata || {},
        today,
      }),
    [path, data, nextAction, i.upgradeRequired, i.readOnly, state.metadata, today]
  );
  const ch = i.caseHealth;
  const realCaseHealth = useMemo(
    () =>
      buildCaseHealth({
        ...ch,
        evidenceQuestions: { answered: ch.evidenceAnswered, total: ch.evidenceTotal },
        consistencyQuestions: { answered: ch.consistencyAnswered, total: ch.consistencyTotal },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ch.notStarted, ch.loading, ch.score, ch.label, ch.status, ch.evidence, ch.consistency, ch.completeness, ch.riskPenalty, ch.evidenceAnswered, ch.evidenceTotal, ch.consistencyAnswered, ch.consistencyTotal]
  );
  const caseHealth = useMemo(
    () => (i.locks.caseStrength ? lockedCaseHealthPreview(realCaseHealth) : realCaseHealth),
    [i.locks.caseStrength, realCaseHealth]
  );
  const { onUpgrade } = i;
  const actions = useMemo<DashboardActions>(
    () =>
      i.locks.caseStrength ? { ...i.actions, onOpenCaseAnalysis: () => onUpgrade("case_strength") } : i.actions,
    [i.actions, i.locks.caseStrength, onUpgrade]
  );
  const alerts = useMemo(() => buildAlerts(i.issues, personal.dismissed), [i.issues, personal.dismissed]);
  const apStep = useMemo(
    () => findStepByToolType(data, state, helpers, AP_STEP_TOOL_TYPE),
    [data, state, helpers]
  );
  const trackingBase = useMemo(
    () =>
      buildTracking({
        metadata: state.metadata || {},
        receiptRecord: i.receiptRecord,
        nvcCaseNum: i.nvcCaseNum,
        nvcInvoice: i.nvcInvoice,
        interviewAttended: i.interviewAttended,
        isApPhase: i.isApPhase,
        isApprovedPhase: i.isApprovedPhase,
        isJourneyComplete: i.isJourneyComplete,
        today,
      }),
    [state.metadata, i.receiptRecord, i.nvcCaseNum, i.nvcInvoice, i.interviewAttended, i.isApPhase, i.isApprovedPhase, i.isJourneyComplete, today]
  );
  const tracking = useMemo(
    () => (trackingBase.ap ? { ...trackingBase, ap: { ...trackingBase.ap, step: apStep } } : trackingBase),
    [trackingBase, apStep]
  );
  const liveCheck = useUscisLiveCheck(tracking.receipt?.number, state.backendId || undefined, i.updateMetadata);
  // USCIS status tracking is the same plan feature as on the roadmap step (tracker_reminders).
  const uscis = useMemo(
    () =>
      i.locks.uscisCheck
        ? { checking: false, error: null, locked: true, check: () => onUpgrade("tracker_reminders") }
        : liveCheck,
    [i.locks.uscisCheck, liveCheck, onUpgrade]
  );
  const keyDates = useMemo(
    () => buildKeyDates(state.metadata || {}, i.receiptRecord, personal.events),
    [state.metadata, i.receiptRecord, personal.events]
  );

  const greetingName = profile?.full_name?.trim().split(/\s+/)[0] || undefined;

  return {
    journeyId: state.backendId || undefined,
    greetingName,
    hero,
    chapters,
    path,
    caseHealth,
    alerts,
    tracking,
    uscis,
    keyDates,
    groups,
    personal,
    actions,
    pageLocks: { vault: i.locks.vault, wallet: i.locks.wallet },
    renderApTracker: i.renderApTracker,
    onUpgrade,
    state,
    onLaunchTool: i.onLaunchTool,
  };
}
