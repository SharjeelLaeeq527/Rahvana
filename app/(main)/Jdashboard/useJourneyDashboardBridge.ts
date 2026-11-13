'use client';

import { useMemo } from 'react';
import {
  getNextBestAction,
  getStageProgress,
  getActiveStepsForStage,
} from '@/app/components/journey-engine/journeyHelpers';
import {
  runFullConsistencyAnalysis,
  computeOverallCaseScore,
  computeConsistencyScore,
  computeWeightedCaseScore,
  computeRiskPenalty,
  detectRiskFlags,
  type RiskFlag,
  type ConsistencyFinding,
  type Phase2Responses,
} from '@/lib/case-strength';
import { resolveCaseStrengthProfile } from '@/lib/case-strength/categories';
import {
  aggregateChapter1Issues,
  aggregateChapter2Issues,
  aggregateChapter3Issues,
  type AggregatedIssue,
} from '@/lib/case-strength/aggregate-issues';
import { gateAlertIssues, buildAlertGateContext } from '@/lib/case-strength/alert-gating';
import { useDocumentVaultStore } from '@/lib/document-vault/store';
import type { DashboardOptions, DashboardAlert, DashboardChapter, DashboardKeyDate, DashboardSubScores } from './types';

interface BridgeProps {
  data?: any;
  state?: any;
  actions?: {
    setCurrentStep?: (idx: number) => void;
    setStage?: (idx: number) => void;
    updateMetadata?: (metadata: Record<string, any>) => void;
  };
  receiptRecord?: any;
  tier?: string;
  onSelectChapter?: (idx: number) => void;
  onSelectStep?: (chapterIdx: number, stepIdx: number) => void;
  onLaunchTool?: (toolKey: string) => void;
  onOpenCaseStrength?: () => void;
}

const CHAPTER_COLOR_PALETTES = [
  {
    col: '#0d9488',
    a: '#b4dbd5',
    m: '#74b9b0',
    b: '#4d9490',
    la: '#4aa596',
    lm: '#38917f',
    lb: '#2a7769',
  },
  {
    col: '#3b62a0',
    a: '#c4d4ec',
    m: '#92abd3',
    b: '#6684b2',
    la: '#7096d4',
    lm: '#5a80c0',
    lb: '#4268a8',
  },
  {
    col: '#6b4f93',
    a: '#d6cce8',
    m: '#ab99c9',
    b: '#8b77a6',
    la: '#a58fd6',
    lm: '#8c76c2',
    lb: '#715ba8',
  },
  {
    col: '#b4405a',
    a: '#f7c3cf',
    m: '#e08f9f',
    b: '#b4405a',
    la: '#d85973',
    lm: '#ba435c',
    lb: '#9c3147',
  },
];

export function buildDashboardOptions({
  data,
  state,
  actions,
  receiptRecord,
  tier,
  onSelectChapter,
  onSelectStep,
  onLaunchTool,
  onOpenCaseStrength,
}: BridgeProps): DashboardOptions {
  if (!data || !state) {
    return {
      tier,
      receiptRecord,
      onSelectChapter,
      onSelectStep,
      onLaunchTool,
      onOpenCaseStrength,
    };
  }

  const rawChapters = data.chapters || data.stages || [];
  const activeStageIdx = state.currentStage ?? 0;
  const metadata = state.metadata || {};
  const trackingStatus = metadata.tracking_status || {};

  // 1. Next Best Action
  let nextAction: DashboardOptions['nextAction'] | undefined;
  try {
    const nba = getNextBestAction(data, state);
    if (nba?.step) {
      const stepObj = nba.step as any;
      const chObj = rawChapters[nba.chapterIdx] as any;
      nextAction = {
        stepName: stepObj.step_name || stepObj.name || 'Next Step',
        chapterName: chObj?.chapter_name || chObj?.name || `Chapter ${nba.chapterIdx + 1}`,
        chapterIdx: nba.chapterIdx,
        stepIdx: nba.stepIdxInChapter,
        shortInstruction: stepObj.short_instruction || stepObj.instruction,
      };
    }
  } catch (err) {
    console.warn('[DashboardBridge] getNextBestAction failed:', err);
  }

  // 2. Chapters data with progress and steps
  const chapters: DashboardChapter[] = rawChapters.map((stage: any, idx: number) => {
    const prog = getStageProgress(data, idx, state);
    const pal = CHAPTER_COLOR_PALETTES[idx % CHAPTER_COLOR_PALETTES.length];
    const isDone = prog.pct === 100;
    const isCurrent = idx === activeStageIdx;

    const rawSteps = stage.steps || [];
    const steps = rawSteps.map((s: any, sIdx: number) => {
      const stepKey = s.step_key || s.id || `step_${idx + 1}_${sIdx + 1}`;
      const isStepDone = Boolean(state.completedSteps?.has?.(stepKey));
      const isStepCurrent = isCurrent && (state.currentStep === sIdx);
      return {
        stepIdx: sIdx,
        stepNumber: s.step_number || sIdx + 1,
        name: s.step_name || s.name || `Step ${sIdx + 1}`,
        shortInstruction: s.short_instruction || s.instruction || s.description || 'Follow step guidance to prepare required documents.',
        isDone: isStepDone,
        isCurrent: isStepCurrent,
        isLocked: false,
        time: s.estimated_time || s.duration || '15 min',
      };
    });

    return {
      n: idx + 1,
      t: (stage.chapter_name || stage.name || `Chapter ${idx + 1}`).replace(/^Stage\s[IVX]+:\s*/, ''),
      d: prog.done,
      tot: prog.total || (stage.steps || []).length || 1,
      st: isDone ? 'Done' : isCurrent ? 'In progress' : 'Upcoming',
      col: pal.col,
      a: pal.a,
      m: pal.m,
      b: pal.b,
      la: pal.la,
      lm: pal.lm,
      lb: pal.lb,
      cur: isCurrent ? 1 : 0,
      steps,
    };
  });

  // 3. Step names for the SVG line
  const stepNames: string[][] = rawChapters.map((stage: any) =>
    (stage.steps || []).map((s: any) => s.step_name || s.name || 'Step')
  );

  // 4. Case Strength calculation
  let overallScore = 66;
  let band: 'Critical' | 'Needs attention' | 'Good' | 'Excellent' = 'Good';
  let subScores: DashboardSubScores = {
    evidenceCoverage: { val: '12', denom: ' of 15', pct: 0.8 },
    consistency: { val: '9', denom: ' of 12', pct: 0.75 },
    completeness: { val: '17', denom: ' of 25', pct: 0.68 },
    riskDeductions: { val: '−0', denom: ' pts', pct: 0 },
  };

  try {
    const eligibilityAnswers =
      state.answers?.['eligibility-suite'] ??
      metadata['questAnswers_eligibility-suite'];

    const uploadedDocs = useDocumentVaultStore.getState().uploadedDocuments || [];
    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      metadata.consistency_questionnaire ?? null,
      uploadedDocs
    );

    const profile = resolveCaseStrengthProfile(data.journey_type);
    const questAnswers = metadata['questAnswers_eligibility-suite'] as
      | Record<string, Record<string, string | string[]>>
      | undefined;
    const fromQuest = profile.detectEligibilityRisks(questAnswers, profile.stepRefs);
    const riskPenalty = computeRiskPenalty(fromQuest);

    const consScore = computeConsistencyScore(consistencyFindings);
    const completedCount = state.completedSteps?.size ?? 0;
    const totalStepsCount = chapters.reduce((sum, ch) => sum + ch.tot, 0) || 1;
    const compScore = Math.min(100, Math.round((completedCount / totalStepsCount) * 100));
    const evScore = Math.min(100, Math.round((uploadedDocs.length / 15) * 100) || 60);

    const weighted = computeWeightedCaseScore({
      evidenceStrength: evScore,
      consistencyScore: consScore,
      completeness: compScore,
      riskFlags: fromQuest,
    }).score;

    overallScore = weighted;
    if (overallScore >= 85) band = 'Excellent';
    else if (overallScore >= 70) band = 'Good';
    else if (overallScore >= 40) band = 'Needs attention';
    else band = 'Critical';

    subScores = {
      evidenceCoverage: {
        val: `${Math.round((evScore / 100) * 15)}`,
        denom: ' of 15',
        pct: Math.min(1, evScore / 100),
      },
      consistency: {
        val: `${Math.round((consScore / 100) * 12)}`,
        denom: ' of 12',
        pct: Math.min(1, consScore / 100),
      },
      completeness: {
        val: `${completedCount}`,
        denom: ` of ${totalStepsCount}`,
        pct: Math.min(1, completedCount / totalStepsCount),
      },
      riskDeductions: {
        val: riskPenalty > 0 ? `−${riskPenalty}` : '0',
        denom: ' pts',
        pct: Math.min(1, riskPenalty / 25),
      },
    };
  } catch (err) {
    console.warn('[DashboardBridge] Case strength calc fallback:', err);
  }

  // 5. Alerts (Critical blockers & Warnings to check)
  const alerts: DashboardAlert[] = [];
  try {
    const uploadedDocs = useDocumentVaultStore.getState().uploadedDocuments || [];
    const ch1 = aggregateChapter1Issues({ chapters: rawChapters, state, uploadedDocuments: uploadedDocs });
    const ch2 = aggregateChapter2Issues({ chapters: rawChapters, state, uploadedDocuments: uploadedDocs });
    const ch3 = aggregateChapter3Issues({
      chapters: rawChapters,
      state,
      uploadedDocuments: uploadedDocs,
      getActiveStepsForStage,
    });

    const alertProfile = resolveCaseStrengthProfile(data.journey_type);
    const all = [...ch1, ...ch2, ...ch3];
    const gated = gateAlertIssues(
      all,
      buildAlertGateContext({
        chapters: rawChapters,
        state,
        getActiveStepsForStage,
        getNextBestAction,
        stepTimestamps: state.stepTimestamps,
        profile: alertProfile,
      })
    );

    gated.forEach((issue, idx) => {
      const isBlk = issue.level === 'critical';
      alerts.push({
        id: issue.stepKey || `issue_${idx}`,
        tag: isBlk ? 'MISSING' : 'CHECK',
        t: issue.title,
        s: issue.stepName || `Step ${issue.stepNumber || idx + 1}`,
        n: issue.stepNumber || idx + 1,
        m: 'about 15 min',
        d: issue.hint?.split('\n\n')[0] || issue.title,
        f: issue.hint?.split('How to resolve: ')[1] || 'Review step instructions and upload documents.',
        blk: isBlk,
        chapterIdx: issue.chapterIdx,
        stepIdx: issue.stepIdx,
      });
    });
  } catch (err) {
    console.warn('[DashboardBridge] Alerts aggregation fallback:', err);
  }

  // 6. Dates & Calendar Key Dates
  const ivDateStr = trackingStatus.interview_date || metadata.interviewDate;
  const dqDateStr = trackingStatus.dq_date || metadata.dqDate;
  const medDateStr = metadata.medicalDate;
  const prioDateStr = metadata.priorityDate || metadata.receiptDate;

  const keyDates: DashboardKeyDate[] = [];
  const parseDate = (dStr: string | undefined): Date | null => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const ivDate = parseDate(ivDateStr);
  const dqDate = parseDate(dqDateStr);
  const medDate = parseDate(medDateStr);
  const prioDate = parseDate(prioDateStr);

  if (ivDate) {
    keyDates.push({
      y: ivDate.getFullYear(),
      m: ivDate.getMonth(),
      d: ivDate.getDate(),
      t: 'Visa Interview',
      c: '#b4405a',
      s: metadata.interviewTime ? `${metadata.interviewTime} · US Embassy` : '9:30 AM · US Embassy',
    });
  }
  if (medDate) {
    keyDates.push({
      y: medDate.getFullYear(),
      m: medDate.getMonth(),
      d: medDate.getDate(),
      t: 'Medical Exam',
      c: '#0d9488',
      s: metadata.medClinic || 'Panel Clinic',
    });
  }
  if (dqDate) {
    keyDates.push({
      y: dqDate.getFullYear(),
      m: dqDate.getMonth(),
      d: dqDate.getDate(),
      t: 'Documentarily Qualified',
      c: '#6b4f93',
      s: 'NVC Review Complete',
    });
  }
  if (prioDate) {
    keyDates.push({
      y: prioDate.getFullYear(),
      m: prioDate.getMonth(),
      d: prioDate.getDate(),
      t: 'Petition Received',
      c: '#3b62a0',
      s: 'USCIS Filing',
    });
  }

  // 7. Receipt Number & Auto-check
  const receiptNumber =
    receiptRecord?.receiptNumber ||
    metadata.receiptNum ||
    metadata.receiptNumber ||
    metadata.receipt_number ||
    trackingStatus.receipt_num ||
    trackingStatus.receipt_number ||
    'MSC2690123456';
  const autoCheckEnabled =
    receiptRecord?.trackingEnabled ?? (metadata.uscis_tracking_enabled !== false);

  // 8. Progressive Case Tracking Milestone Unlock
  // Milestones:
  // 0 = USCIS Petition (Filed / Pending)
  // 1 = NVC / CEAC (DS-260 & Civil Docs / DQ)
  // 2 = Medical Exam (Vaccinations, Polio, Panel Clinic)
  // 3 = Embassy Queue / Appointment Slot
  // 4 = Visa Interview Day (US Embassy Islamabad)
  let activeMilestoneIndex = 0;
  const hasInterview = Boolean(
    ivDate ||
    trackingStatus.interview_date ||
    metadata.interviewDate ||
    metadata.interviewScheduled ||
    (state.completedSteps && (state.completedSteps.has?.('step_3_8') || state.completedSteps.has?.('c3s8')))
  );
  const hasMedical = Boolean(
    medDate ||
    metadata.medicalDate ||
    metadata.medicalAttended ||
    (state.completedSteps && (state.completedSteps.has?.('step_3_5') || state.completedSteps.has?.('c3s5')))
  );
  const hasDQ = Boolean(
    dqDate ||
    metadata.dqDate ||
    trackingStatus.dq_date ||
    (state.completedSteps && (state.completedSteps.has?.('step_2_11') || state.completedSteps.has?.('c2s11')))
  );
  const isChapter3 = activeStageIdx >= 2;
  const isChapter2 = activeStageIdx >= 1;

  if (hasInterview) {
    activeMilestoneIndex = 4;
  } else if (hasMedical) {
    activeMilestoneIndex = 2;
  } else if (hasDQ || isChapter3) {
    activeMilestoneIndex = 3;
  } else if (isChapter2) {
    activeMilestoneIndex = 1;
  } else {
    activeMilestoneIndex = 0;
  }

  const effectiveTier = tier || state.subscriptionTier || 'free';

  return {
    data,
    state,
    journeyTitle: data.journey_name || data.title || 'Family Visa Journey',
    nextAction,
    caseStrength: {
      score: overallScore,
      band,
      subScores,
    },
    alerts: alerts, // Keep exact array (even if 0 items)
    chapters: chapters.length ? chapters : undefined,
    stepNames: stepNames.length ? stepNames : undefined,
    keyDates: keyDates.length ? keyDates : undefined,
    receiptNumber,
    receiptRecord,
    autoCheckEnabled,
    tier: effectiveTier,
    activeMilestoneIndex,
    interviewDate: ivDate,
    dqDate,
    medicalDate: medDate,
    priorityDate: prioDate,
    onSelectChapter,
    onSelectStep,
    onLaunchTool,
    onOpenCaseStrength,
    onToggleAutoCheck: (enabled: boolean) => {
      if (actions?.updateMetadata) {
        actions.updateMetadata({ uscis_tracking_enabled: enabled });
      }
    },
    onOpenVault: () => {
      if (onLaunchTool) onLaunchTool('document_vault');
    },
    onOpenRequests: () => {
      window.location.href = '/document-translation/my-requests';
    },
    onOpenFavorites: () => {
      if (onLaunchTool) onLaunchTool('favorites');
    },
    onOpenWallet: () => {
      window.location.href = '/portal-wallet';
    },
    onOpenGuides: () => {
      window.location.href = '/guides/my-guides';
    },
    onOpenTools: () => {
      window.location.href = '/tools';
    },
    onOpenServices: () => {
      window.location.href = '/services';
    },
  };
}

