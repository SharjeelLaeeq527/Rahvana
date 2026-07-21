"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronDown, ExternalLink, Clock, Shield } from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getJourneyLockStatus } from "@/lib/journey-lock";
import { getNextBestAction, getStageProgress, isStageUnlocked } from "./journeyHelpers";
import APTrackingTool from "./APTrackingTool";
import WaitingStateCard from "./WaitingStateCard";
import { JourneyRiskCard } from "./components/JourneyRiskCard";
import { DocCaseStrengthMeter } from "./components/DocCaseStrengthMeter";
import { Phase2Modal } from "./components/Phase2Modal";
import { EvidenceQuestionnaireModal } from "./components/EvidenceQuestionnaireModal";
import { CaseStatusHero } from "./components/CaseStatusHero";
import { CaseHealthOverview } from "./components/CaseHealthOverview";
import { CSADrawer } from "./components/CSADrawer";
import { AlertCenter } from "./components/AlertCenter";
import { EvidenceGapEngine } from "@/lib/journey/evidence-gap";
import type { EvidenceGapAnalysis } from "@/lib/journey/evidence-gap";
import { DOCUMENTS_BY_ID } from "@/lib/document-vault/document-definitions";
import {
  generateCaseNarrative,
  getCaseHealthStatus,
  computeOverallCaseScore,
  computeConsistencyScore,
  runFullConsistencyAnalysis,
  type Phase2Responses,
} from "@/lib/case-strength";
import {
  aggregateChapter1Issues,
  aggregateChapter2Issues,
  aggregateChapter3Issues,
  type AggregatedIssue,
} from "@/lib/case-strength/aggregate-issues";
import {
  gateAlertIssues,
  buildGateContext,
  isMeaningfullyStarted,
  isCaseHealthScorable,
} from "@/lib/case-strength/alert-gating";
import { resolveCaseStrengthProfile } from "@/lib/case-strength/categories";
import type { ConsistencyFinding } from "@/lib/case-strength/consistency-intelligence";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { LockedFeature } from "@/app/components/entitlements/LockedFeature";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { getActiveStepsForStage } from "./journeyHelpers";
import { getStepLockStatus, getModalFeatureForTier } from "@/lib/entitlements/hardLockRules";
import { E, msg } from "@/lib/errors";
import IR1Ticker from "./IR1Ticker";
import {
  buildIR1TickerProps,
  fetchReceiptForJourney,
  ReceiptRecord,
} from "@/app/components/home-page/Ir1tickerprops";

interface DashboardViewProps {
  data: RoadmapData;
  state: WizardState;
  onSelectChapter: (idx: number) => void;
  onSelectStep?: (cIdx: number, sIdx: number) => void;
  actions: {
    setCurrentStep: (idx: number) => void;
    setStage: (idx: number) => void;
    updateMetadata: (metadata: Record<string, any>) => void;
  };
}

// Dashboard background image
const dashboardBg = "/assets/images/dashboard.png";

export function DashboardView({
  data,
  state,
  onSelectChapter,
  onSelectStep,
  actions,
}: DashboardViewProps) {
  const plan = usePlan();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  // Pull uploaded docs from vault for DocCaseStrengthMeter
  const { uploadedDocuments } = useDocumentVaultStore();

  // ── Evidence Gap Analysis ──────────────────────────────────────────────────
  const [evidenceAnalysis, setEvidenceAnalysis] = useState<EvidenceGapAnalysis | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Load questionnaire responses from metadata (persisted)
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, boolean>>(
    () => {
      const saved = state.metadata?.evidence_questionnaire;
      if (saved && typeof saved === "object") {
        return saved as Record<string, boolean>;
      }
      return {};
    }
  );

  // Save questionnaire responses to journey metadata
  const handleQuestionnaireSave = (responses: Record<string, boolean>) => {
    setQuestionnaireResponses(responses);
    // Persist to journey metadata
    if (actions?.updateMetadata) {
      actions.updateMetadata({
        ...state.metadata,
        evidence_questionnaire: responses,
      });
    }
  };

  // ── Consistency Analysis Phase 2 Questionnaire ──
  const [phase2Responses, setPhase2Responses] = useState<Record<string, boolean>>(() => {
    const saved = state.metadata?.consistency_questionnaire;
    if (saved && typeof saved === "object") return saved as Record<string, boolean>;
    return {};
  });

  const handlePhase2Save = (responses: Record<string, boolean>) => {
    setPhase2Responses(responses);
    if (actions?.updateMetadata) {
      actions.updateMetadata({
        ...state.metadata,
        consistency_questionnaire: responses,
      });
    }
  };

  // Run evidence gap analysis when documents change
  useEffect(() => {
    const runAnalysis = async () => {
      const journeyId = state.backendId;
      if (!journeyId) return;

      setEvidenceLoading(true);
      try {
        const engine = new EvidenceGapEngine();

        // Build journey documents from chapters/steps document_items
        const chapters = (data as any).chapters || (data as any).stages || [];
        const journeyDocs: Array<{
          document_type: string;
          document_label?: string;
          status: string;
          is_required: boolean;
          vault_file_id?: string;
          uploaded_date?: string;
        }> = [];

        chapters.forEach((chapter: any) => {
          (chapter.steps || []).forEach((step: any) => {
            (step.document_items || []).forEach((item: any) => {
              journeyDocs.push({
                document_type: item.key || item.id || step.step_key,
                document_label: item.label || item.name,
                status: item.status || (item.uploaded ? "uploaded" : "pending"),
                is_required: item.required ?? false,
                vault_file_id: item.vault_file_id,
                uploaded_date: item.uploaded_date,
              });
            });
          });
        });

        // Build vault documents with category mapping
        // documentDefId stores the document definition's id (e.g., "wedding-photos")
        // We need to get the key (e.g., "WEDDING_PHOTOS") for evidence mapping
        const vaultDocs = uploadedDocuments.map((doc) => {
          const docDef = DOCUMENTS_BY_ID[doc.documentDefId];
          return {
            id: doc.id,
            documentDefId: docDef?.key || doc.documentDefId, // Pass the key, not the id
            category: docDef?.category,
            uploadedAt: doc.uploadedAt,
            status: doc.status,
          };
        });

        // Build case data from state.metadata
        const caseDataEntries = Object.entries(state.metadata || {}).reduce(
          (acc, [key, value]) => {
            if (value !== null && value !== undefined && key !== "tracking_status") {
              acc[key] = {
                data_value: value,
                is_verified: false,
                source: "user_input",
              };
            }
            return acc;
          },
          {} as Record<string, { data_value: unknown; is_verified: boolean; source: string }>
        );

        const analysis = await engine.analyze({
          journeyId,
          journeyDocuments: journeyDocs,
          vaultDocuments: vaultDocs,
          caseData: caseDataEntries,
          questionnaireResponses,
        });

        setEvidenceAnalysis(analysis);
      } catch (err) {
        console.error("[EvidenceGap] Analysis failed:", err);
      } finally {
        setEvidenceLoading(false);
      }
    };

    runAnalysis();
  }, [state.backendId, uploadedDocuments, data, state.metadata, questionnaireResponses]);

  // Refresh evidence analysis
  const refreshEvidenceAnalysis = () => {
    setEvidenceAnalysis(null);
    // Re-trigger effect by forcing re-evaluation
    const journeyId = state.backendId;
    if (!journeyId) return;
    setEvidenceLoading(true);
    setTimeout(() => {
      // Trigger re-run by updating a dependency
      const engine = new EvidenceGapEngine();
      const chapters = (data as any).chapters || (data as any).stages || [];
      const journeyDocs: Array<{
        document_type: string;
        document_label?: string;
        status: string;
        is_required: boolean;
      }> = [];
      chapters.forEach((chapter: any) => {
        (chapter.steps || []).forEach((step: any) => {
          (step.document_items || []).forEach((item: any) => {
            journeyDocs.push({
              document_type: item.key || item.id || step.step_key,
              document_label: item.label || item.name,
              status: item.status || (item.uploaded ? "uploaded" : "pending"),
              is_required: item.required ?? false,
            });
          });
        });
      });
      const vaultDocs = uploadedDocuments.map((doc) => {
        const docDef = DOCUMENTS_BY_ID[doc.documentDefId];
        return {
          id: doc.id,
          documentDefId: docDef?.key || doc.documentDefId, // Pass the key, not the id
          category: docDef?.category,
          uploadedAt: doc.uploadedAt,
          status: doc.status,
        };
      });
      const caseDataEntries = Object.entries(state.metadata || {}).reduce(
        (acc, [key, value]) => {
          if (value !== null && value !== undefined && key !== "tracking_status") {
            acc[key] = { data_value: value, is_verified: false, source: "user_input" };
          }
          return acc;
        },
        {} as Record<string, { data_value: unknown; is_verified: boolean; source: string }>
      );
      try {
        const result = engine.analyze({
          journeyId,
          journeyDocuments: journeyDocs,
          vaultDocuments: vaultDocs,
          caseData: caseDataEntries,
          questionnaireResponses,
        });
        setEvidenceAnalysis(result);
      } catch (err) {
        console.error("[EvidenceGap] Analysis failed:", err);
      } finally {
        setEvidenceLoading(false);
      }
    }, 100);
  };

  // ── Case Narrative Generation ─────────────────────────────────────────────
  // Consumes existing CSA outputs (Evidence Gap + Consistency Intelligence)
  // to generate a human-readable case summary. No new analysis performed.
  const caseNarrative = useMemo(() => {
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);

    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );

    return generateCaseNarrative({
      evidenceAnalysis,
      consistencyFindings,
    });
  }, [evidenceAnalysis, state, phase2Responses, uploadedDocuments]);

  // Health status badge for the CaseSummaryCard header
  const caseHealthStatus = useMemo(() => {
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);

    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );

    return getCaseHealthStatus({
      evidenceAnalysis,
      consistencyFindings,
    });
  }, [evidenceAnalysis, state, phase2Responses, uploadedDocuments]);

  // ── CSA Drawer State ─────────────────────────────────────────────────────
  const [isCSADrawerOpen, setIsCSADrawerOpen] = useState(false);
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);
  const [showEvidenceQuestionnaireModal, setShowEvidenceQuestionnaireModal] = useState(false);

  // ── Alert Center Issues ─────────────────────────────────────────────────────
  // Compute issues for the AlertCenter (critical + warning only)
  const alertCenterIssues = useMemo(() => {
    const chapters = (data as any).chapters || (data as any).stages || [];
    const ch1 = aggregateChapter1Issues({ chapters, state, uploadedDocuments });
    const ch2 = aggregateChapter2Issues({ chapters, state, uploadedDocuments });
    const ch3 = aggregateChapter3Issues({
      chapters,
      state,
      uploadedDocuments,
      getActiveStepsForStage,
    });

    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);

    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );

    const existingKeys = new Set([...ch1, ...ch2, ...ch3].map((i) => `${i.stepKey}:${i.title}`));

    const levelMap: Record<string, AggregatedIssue["level"]> = {
      critical: "critical",
      warning: "warning",
      informational: "info",
    };

    const consistencyIssues: AggregatedIssue[] = consistencyFindings
      .map((finding: ConsistencyFinding) => {
        let chapterIdx = 0;
        let stepIdx = 0;
        let stepName = finding.category.replace(/_/g, " ");
        let stepNumber = 0;
        if (finding.actionableStepKey) {
          const match = finding.actionableStepKey.match(/step_(\d+)_(\d+)/);
          if (match) {
            const chapNum = parseInt(match[1], 10) - 1;
            const stepNum = parseInt(match[2], 10);
            if (chapters[chapNum]?.steps) {
              chapterIdx = chapNum;
              const foundIdx = chapters[chapNum].steps.findIndex(
                (s: any) => s.step_key === finding.actionableStepKey
              );
              stepIdx = foundIdx >= 0 ? foundIdx : stepNum - 1;
              stepName = chapters[chapNum].steps[stepIdx]?.step_name ?? stepName;
              stepNumber = chapters[chapNum].steps[stepIdx]?.step_number ?? stepNum;
            }
          }
        }
        return {
          level: levelMap[finding.severity] ?? ("info" as AggregatedIssue["level"]),
          title: finding.title,
          hint: `${finding.description}\n\nHow to resolve: ${finding.resolution}`,
          stepKey: finding.actionableStepKey ?? "unknown",
          stepName,
          stepNumber,
          chapterIdx,
          stepIdx,
          resolved: finding.resolved ?? false,
        };
      })
      .filter((issue) => !existingKeys.has(`${issue.stepKey}:${issue.title}`));

    const all = [...ch1, ...ch2, ...ch3, ...consistencyIssues];

    // Progressive reveal: hide alerts for steps the user hasn't reached yet, and
    // (Phase 2) time-gate current/passed-step warnings. Keeps the dashboard from
    // dumping every chapter's issues at once. See CASE_STRENGTH_ALERT_PLAN.md.
    // buildGateContext derives the frontier/active-order (shared with V3); the
    // look-ahead rules come from the resolved category profile.
    const gated = gateAlertIssues(
      all,
      buildGateContext({
        chapters,
        state,
        getActiveStepsForStage,
        getNextBestAction,
        lookAheadRules: resolveCaseStrengthProfile((data as any).journey_type).lookAhead,
        stepTimestamps: state.stepTimestamps,
      })
    );

    const order = { critical: 0, warning: 1, info: 2 };
    return gated.sort((a, b) => {
      if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
      if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
      return a.chapterIdx - b.chapterIdx;
    });
  }, [data, state, uploadedDocuments, phase2Responses]);

  // Counts for the CaseHealthOverview
  const critIssueCount = alertCenterIssues.filter(
    (i) => i.level === "critical" && !i.resolved
  ).length;
  const warnIssueCount = alertCenterIssues.filter(
    (i) => i.level === "warning" && !i.resolved
  ).length;

  // Empty-state gate: case-health appears only once the user has actually
  // progressed (completed ≥1 step). Before that we must not show a fabricated
  // score — the wizard pre-fills metadata from profile autofill, so softer
  // signals would false-trigger. (NN/g empty states — no false precision.)
  const notStarted = !isMeaningfullyStarted({ completedCount: state.completedSteps.size });

  // Overall combined case score (evidence + consistency)
  const overallCaseScore = useMemo(() => {
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);
    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );
    return computeOverallCaseScore({ evidenceAnalysis, consistencyFindings });
  }, [evidenceAnalysis, state, phase2Responses, uploadedDocuments]);

  // Sub-scores for the CaseHealthOverview popover breakdown
  const evidenceSubScore = evidenceAnalysis?.overallScore ?? 50;
  const consistencySubScore = useMemo(() => {
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);
    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );
    return computeConsistencyScore(consistencyFindings);
  }, [state, phase2Responses, uploadedDocuments]);

  // Compact summary text for CaseHealthOverview (truncated executive summary)
  const compactSummary = caseNarrative?.executiveSummary
    ? caseNarrative.executiveSummary.length > 280
      ? caseNarrative.executiveSummary.slice(0, 280).trim() + "\u2026"
      : caseNarrative.executiveSummary
    : undefined;

  // Phase 2 answered count
  const phase2AnsweredCount = Object.values(phase2Responses).filter(Boolean).length;

  // Evidence questionnaire answered count
  const evidenceAnsweredCount = Object.values(questionnaireResponses).filter(Boolean).length;

  // Case-health SCORE gate: the ring/percentage is evidence-derived, so it must
  // stay in the neutral "gathering info" state until the user has produced real
  // evidence — not merely completed a checklist step. Without this, an empty
  // evidence set defaults to ~50% and reads as a real (bad) score the instant
  // step 1 is done. `notStarted` (alert stream) stays keyed off completion.
  const hasEvidenceSignal =
    uploadedDocuments.length > 0 ||
    evidenceAnsweredCount > 0 ||
    (evidenceAnalysis?.stats?.totalEvidenceItems ?? 0) > 0 ||
    (evidenceAnalysis?.requiredDocuments?.found ?? 0) > 0;
  const healthNotStarted = !isCaseHealthScorable({
    completedCount: state.completedSteps.size,
    hasEvidenceSignal,
  });

  // Extract step_1_2 document_items from roadmap data
  const step1_2DocItems = useMemo(() => {
    const chapters = (data as any).chapters || (data as any).stages || [];
    const chapter1 = chapters[0];
    if (!chapter1) return null;
    const step = (chapter1.steps || []).find((s: any) => s.step_key === "step_1_2");
    return step?.document_items ?? null;
  }, [data]);

  const hasPriorMarriage = useMemo(() => {
    const q3s1 =
      state.answers?.["eligibility-suite"]?.["q3"]?.["q3s1"] ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any)?.["q3"]?.["q3s1"];
    return !!q3s1 && q3s1 !== "none";
  }, [state.answers, state.metadata]);

  const trackingStatus = useMemo(
    () => (state.metadata?.tracking_status as any) || {},
    [state.metadata?.tracking_status]
  );
  const hasTrackingData = useMemo(() => Object.keys(trackingStatus).length > 0, [trackingStatus]);
  const isCaseRegistered = !!state.metadata?.nvcCaseNum;

  // ── Phase helpers — drive which cards are visible ──────────
  // Interview date: admin-set (tracking_status) OR user-set (Step 2.12 metadata)
  const interviewDate =
    trackingStatus.interview_date || (state.metadata?.interviewDate as string | undefined);

  const interviewDateValid = useMemo(() => {
    if (!interviewDate) return false;
    const date = new Date(interviewDate);
    return !Number.isNaN(date.getTime()) && date.getUTCFullYear() >= 2000;
  }, [interviewDate]);

  // New outcome metadata
  const interviewOutcome = state.metadata?.interviewOutcome as string | undefined;
  const journeyCompletedAt = state.metadata?.journeyCompletedAt as string | undefined;

  // Interview attended = user completed Step 3.8, admin AP state, or any recorded outcome.
  const interviewAttended =
    state.completedSteps?.has("step_3_8") ||
    state.completedSteps?.has("c3s8") ||
    !!trackingStatus.ap_status ||
    !!interviewOutcome;

  // DQ is active (case qualified, waiting for interview scheduling)
  const isDqPhase =
    (!!state.metadata?.dqDate ||
      trackingStatus.dq_status === "qualified" ||
      state.metadata?.dqStatus === "qualified") &&
    !interviewDate;
  const isJourneyComplete = !!journeyCompletedAt;

  // AP phase: legacy (apSaved/admin) OR new 221g path
  const isApPhase =
    interviewAttended &&
    (trackingStatus.ap_status === "pending" ||
      state.metadata?.apSaved === "true" ||
      interviewOutcome === "221g");

  // Approved phase: interview attended AND outcome confirmed as approved
  const isApprovedPhase = interviewAttended && interviewOutcome === "approved";

  const nextActionData = useMemo(() => getNextBestAction(data, state), [data, state]);

  const nextStepLock = useMemo(() => {
    if (!nextActionData) return { isLocked: false, requiredPlan: null };
    const stepId = nextActionData.step.step_key;
    return getStepLockStatus(
      stepId,
      plan.tier,
      nextActionData.chapterIdx,
      nextActionData.stepIdxInChapter
    );
  }, [nextActionData, plan.tier]);

  const lockStatus = useMemo(() => getJourneyLockStatus(state.metadata || {}), [state.metadata]);

  const alerts = useMemo(() => {
    const list: {
      type: "gold" | "sky" | "amber" | "green";
      iconColor: string;
      title: string;
      text: string;
      action?: { label: string; url?: string; onAction?: () => void };
    }[] = [];
    const meta = state.metadata || {};
    const done = state.answers || {};
    const trackingStatus = (state.metadata?.tracking_status as any) || {};
    const isCaseRegistered = !!state.metadata?.nvcCaseNum;
    const hasTrackingData = Object.keys(trackingStatus).length > 0;

    // Admin tracking-based alerts
    // NOTE: AP alert removed here — APTrackingTool (sidebar) handles this
    // when user has recorded AP details, WaitingStateCard handles it before that.

    if (trackingStatus.interview_date) {
      list.push({
        type: "gold",
        iconColor: "d-gold",
        title: "Interview scheduled",
        text: `${trackingStatus.interview_date} ${trackingStatus.interview_time ? `at ${trackingStatus.interview_time}` : ""} ${trackingStatus.interview_embassy ? `· ${trackingStatus.interview_embassy}` : ""}`,
        action: {
          label: "Interview Prep Guide",
          onAction: () => {
            if (onSelectStep) onSelectStep(2, 6);
            else {
              actions.setStage(2);
              actions.setCurrentStep(6);
            }
          },
        },
      });
    }

    // "In scheduling queue" alert removed — the Dynamic Scheduling Tracker
    // (sidebar dark card with DQ date + embassy month + estimate) shows
    // this same info in full detail. No duplicate text alert needed.

    if (trackingStatus.nvc_review_complete && trackingStatus.dq_status !== "qualified") {
      list.push({
        type: "green",
        iconColor: "d-green",
        title: "NVC Document Review Complete",
        text: `NVC has reviewed your documents. Your case is being processed for Documentarily Qualified status. ${trackingStatus.nvc_review_date ? `(Date: ${trackingStatus.nvc_review_date})` : ""}`,
      });
    }

    if (!hasTrackingData && isCaseRegistered && !interviewDateValid) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "Case Registered & Under Review",
        text: "Your NVC identifiers have been recorded. Our admin team will verify your case status at the embassy/NVC shortly.",
      });
    }

    // Legacy metadata-based alerts
    if (
      meta.interviewDate &&
      !trackingStatus.interview_date &&
      interviewDateValid &&
      !list.some((a) => a.title === "Interview scheduled")
    ) {
      list.push({
        type: "gold",
        iconColor: "d-gold",
        title: "Interview scheduled (Manual)",
        text: `${meta.interviewDate} ${meta.interviewEmbassy ? `· ${meta.interviewEmbassy}` : ""}`,
      });
    }

    // "In scheduling queue (Manual)" removed — the Dynamic Scheduling Tracker
    // card (sidebar) already shows DQ date + embassy month + estimated window
    // in a much better UI. No need for this duplicate text alert.

    if (done && done["c3s3"] && !done["c3s4"]) {
      list.push({
        type: "amber",
        iconColor: "d-amber",
        title: "PCC pending",
        text: "Police Clearance Certificate must be received before interview day.",
      });
    }

    if (meta.medicalDate && !done["c3s5"]) {
      list.push({
        type: "green",
        iconColor: "d-green",
        title: "Medical exam scheduled",
        text: `${meta.medicalDate} ${meta.medClinic ? `· ${meta.medClinic}` : ""}`,
      });
    }

    if (
      isCaseRegistered &&
      !trackingStatus.nvc_review_complete &&
      trackingStatus.dq_status !== "qualified" &&
      !state.metadata?.dqDate
    ) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "Check NVC Email & Portal",
        text: "Your documents are in review. To avoid delays, please check your CEAC portal daily for any messages or status updates.",
        action: {
          label: "Open CEAC Portal",
          url: "https://ceac.state.gov/IV/Login.aspx",
        },
      });
    }

    if (
      !!state.metadata?.uscis_tracking_enabled &&
      !trackingStatus.nvc_review_complete &&
      trackingStatus.dq_status !== "qualified"
    ) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "USCIS Case Tracking Active",
        text: trackingStatus.uscis_status
          ? `Current Status: ${trackingStatus.uscis_status.replace(/_/g, " ")} ${trackingStatus.uscis_status_updated ? `(Updated: ${new Date(trackingStatus.uscis_status_updated).toLocaleDateString()})` : ""}`
          : "Your Receipt Notice is registered. Rahvana is monitoring your case for updates.",
        action: {
          label: "View Receipt Details",
          onAction: () => {
            actions.setStage(0);
            actions.setCurrentStep(14);
          },
        },
      });
    }

    return list;
  }, [state, actions]);

  // Determine if sidebar should be visible
  const showSidebar = useMemo(() => {
    const hasWaitingStateCards =
      (trackingStatus.interview_queue &&
        !interviewDateValid &&
        !state.metadata?.dqDate &&
        trackingStatus.dq_status !== "qualified" &&
        !state.metadata?.dqStatus) ||
      (interviewDateValid && !interviewAttended) ||
      (isApPhase && state.metadata?.apSaved !== "true");
    return (
      alerts.length > 0 ||
      isDqPhase ||
      (isApPhase && state.metadata?.apSaved === "true") ||
      hasWaitingStateCards
    );
  }, [
    alerts.length,
    isDqPhase,
    isApPhase,
    state.metadata?.apSaved,
    trackingStatus.interview_queue,
    trackingStatus.dq_status,
    interviewDate,
    state.metadata?.dqDate,
    state.metadata?.dqStatus,
    interviewAttended,
  ]);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "case-details": true,
    milestones: false,
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const milestones = [
    { label: "Eligibility confirmed", sid: "step_1_1" },
    { label: "Documents gathered", sid: "step_1_2" },
    { label: "Filing method selected", key: "filingMethod" },
    { label: "I-130 submitted to USCIS", key: "receiptNum", sid: "step_1_3" },
    { label: "NVC fees paid", sid: "step_2_2" },
    { label: "DS-260 submitted", sid: "step_2_3" },
    { label: "Documents submitted to NVC", sid: "step_2_5" },
    { label: "Documentarily Qualified", key: "dqDate" },
    { label: "Medical exam scheduled", key: "medicalDate", sid: "step_3_1" },
    { label: "Interview scheduled", key: "interviewDate" },
    { label: "Medical exam attended", sid: "step_3_5" },
    { label: "Visa interview attended", sid: "step_3_8" },
    { label: "Interview outcome confirmed", sid: "step_3_9" },
    { label: "Visa issued", sid: "step_3_10" },
  ];

  const milestonesReached = milestones.filter((m) => {
    if (m.key && m.sid) {
      return (
        (state.metadata && state.metadata[m.key]) ||
        (state.completedSteps && state.completedSteps.has && state.completedSteps.has(m.sid))
      );
    }
    if (m.key) return !!(state.metadata && state.metadata[m.key]);
    if (m.sid) {
      return (
        (state.completedSteps && state.completedSteps.has && state.completedSteps.has(m.sid)) ||
        (state.answers && state.answers[m.sid]) ||
        (state.metadata && state.metadata[m.sid])
      );
    }
    return false;
  }).length;

  const [nvcCaseNum, setNvcCaseNum] = useState<string | undefined>(undefined);
  const [nvcInvoice, setNvcInvoice] = useState<string | undefined>(undefined);
  const [nvcLoading, setNvcLoading] = useState(true);
  const [nvcError, setNvcError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNvcLoading(true);
    setNvcError(null);
    async function fetchNvcFields() {
      const portalType = state.metadata.portalType || "NVC";
      try {
        const res = await fetch("/api/portal-wallet/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portalType, type: "all_details" }),
        });
        const data = await res.json();
        if (!cancelled && data.details) {
          setNvcCaseNum(data.details.nvcCaseNum);
          setNvcInvoice(data.details.nvcInvoice);
        } else if (!cancelled) {
          setNvcError(msg(E.DASH_NVC_DETAILS_MISSING));
        }
      } catch {
        if (!cancelled) setNvcError(msg(E.PORTAL_WALLET_FETCH_FAILED));
      } finally {
        if (!cancelled) setNvcLoading(false);
      }
    }
    fetchNvcFields();
    return () => {
      cancelled = true;
    };
  }, [state.metadata.portalType]);

  const [receiptRecord, setReceiptRecord] = useState<ReceiptRecord | null | undefined>(undefined);
  useEffect(() => {
    console.log("DEBUG [receipt effect] FIRED — state.backendId:", state.backendId);
    let cancelled = false;
    const jId = state.backendId;

    if (!jId) {
      console.log("DEBUG [receipt effect] No backendId yet — skipping fetch");
      return;
    }

    console.log("DEBUG [receipt effect] Calling fetchReceiptForJourney with:", jId);

    fetchReceiptForJourney(jId)
      .then(({ record, error }) => {
        console.log("DEBUG [receipt effect] fetchReceiptForJourney resolved:", {
          record: record ? JSON.stringify(record) : null,
          error,
          cancelled,
        });
        if (!cancelled) {
          setReceiptRecord(record ?? null);
          console.log("DEBUG [receipt effect] setReceiptRecord called with:", record ?? null);
        } else {
          console.log("DEBUG [receipt effect] Cancelled before setReceiptRecord");
        }
      })
      .catch((err) => {
        console.error("DEBUG [receipt effect] fetchReceiptForJourney threw:", err);
        if (!cancelled) setReceiptRecord(null);
      });

    return () => {
      console.log("DEBUG [receipt effect] Cleanup — marking cancelled");
      cancelled = true;
    };
  }, [state.backendId]);
  const caseFields = [
    { label: "Filing method", value: state.metadata.filingMethod },
    { label: "Receipt number", value: state.metadata.receiptNum },
    {
      label: "NVC case number",
      value: nvcLoading ? "Loading..." : nvcError ? "Unavailable" : nvcCaseNum,
    },
    {
      label: "NVC invoice ID",
      value: nvcLoading ? "Loading..." : nvcError ? "Unavailable" : nvcInvoice,
    },
    { label: "DQ date", value: state.metadata.dqDate },
    { label: "Interview date", value: state.metadata.interviewDate },
    { label: "Embassy", value: state.metadata.interviewEmbassy },
    { label: "Medical date", value: state.metadata.medicalDate },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto py-9 px-6 pb-20 scrollbar-hide relative"
      style={{ minHeight: "100vh" }}
    >
      {/* Fullscreen background for Dashboard */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dashboardBg})`, opacity: 0.35 }}
      />
      <div className="w-full max-w-[1200px] xl:max-w-[1500px] mx-auto animate-in fade-in duration-700 relative z-10">
        <div className={`w-full mb-6`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1 text-center lg:text-left">
            IR-1 Spouse Visa · Pakistan
          </div>
        </div>
        {upgradeModalFeature && (
          <UpgradeModal
            feature={upgradeModalFeature}
            onClose={() => setUpgradeModalFeature(null)}
          />
        )}
        {/* IR-1 Live ticker — journey dashboard (placed above hero) */}
        {receiptRecord !== undefined && (
          <div className="mb-6">
            <IR1Ticker
              {...buildIR1TickerProps(
                state,
                trackingStatus,
                nvcCaseNum,
                nvcInvoice,
                uploadedDocuments as any[],
                receiptRecord
              )}
            />
          </div>
        )}
        {/* ── Section 1 + 2: Hero & Health Overview in column grid ──────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 mb-6 items-stretch">
          {/* Left: Case Status Hero */}
          <CaseStatusHero
            data={data}
            state={state}
            nextActionData={nextActionData}
            isLocked={lockStatus.isLocked}
            onContinue={() => {
              if (plan.isLocked("roadmap_access")) {
                setUpgradeModalFeature("roadmap_access");
                return;
              }
              if (nextActionData) {
                if (nextStepLock.isLocked) {
                  setUpgradeModalFeature(getModalFeatureForTier(nextStepLock.requiredPlan!));
                  return;
                }
                if (onSelectStep) {
                  onSelectStep(nextActionData.chapterIdx, nextActionData.stepIdxInChapter);
                } else {
                  actions.setStage(nextActionData.chapterIdx);
                  actions.setCurrentStep(nextActionData.stepIdxInChapter);
                }
              }
            }}
          />

          {/* Right: Case Health + Summary (combined) */}
          <CaseHealthOverview
            evidenceAnalysis={evidenceAnalysis}
            criticalCount={critIssueCount}
            warningCount={warnIssueCount}
            overallScore={overallCaseScore}
            evidenceScore={evidenceSubScore}
            consistencyScore={consistencySubScore}
            healthLabel={caseHealthStatus?.label ?? "Analyzing"}
            healthStatus={caseHealthStatus?.status ?? "needs-attention"}
            loading={evidenceLoading}
            notStarted={healthNotStarted}
            onViewFullAnalysis={() => setIsCSADrawerOpen(true)}
            summaryText={compactSummary}
          />
        </div>

        {/* ── Status cards (commented out — now handled by CaseStatusHero) ── */}
        {/* {isJourneyComplete && (
          <WaitingStateCard
            icon="check"
            title="IR-1 Journey Complete!"
            description="Congratulations — you have completed every step of the roadmap."
            status="complete"
          />
        )}
        {lockStatus.isLocked && (
          <div className="bg-[#1a1a2e] border border-[#3a3a5c] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center shrink-0">
              <Lock size={14} className="text-white/60" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Journey Locked</div>
              <div className="text-[13px] font-bold text-white/90">This journey is in read-only mode</div>
            </div>
          </div>
        )}
        {isApprovedPhase && !isJourneyComplete && (
          <WaitingStateCard
            icon="check"
            title="Visa Approved!"
            description="Your visa was approved at interview."
            status="complete"
            actionLabel="Track Visa Issuance"
            onAction={() => onSelectStep ? onSelectStep(2, 9) : (actions.setStage(2), actions.setCurrentStep(9))}
          />
        )}
        {interviewOutcome === "221g" && state.metadata?.apSaved !== "true" && (
          <WaitingStateCard
            icon="alert"
            title="221(g) Refusal — Action Required"
            description="Complete the follow-up steps in Chapter 3 to respond."
            status="action-needed"
            actionLabel="Continue Chapter 3"
            onAction={() => onSelectChapter ? onSelectChapter(2) : undefined}
          />
        )} */}

        {/* 3-column layout — LEFT: Alert Center | CENTER: chapters | RIGHT: Live tracking */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_280px] gap-5 items-start">
          {/* ── LEFT COLUMN — Alert Center (critical + warnings only) ─── */}
          <div className="hidden xl:flex flex-col gap-3">
            <AlertCenter
              issues={alertCenterIssues}
              notStarted={notStarted}
              onOpenStep={(cIdx, sIdx) => {
                if (onSelectStep) onSelectStep(cIdx, sIdx);
                else {
                  actions.setStage(cIdx);
                  actions.setCurrentStep(sIdx);
                }
              }}
            />
          </div>

          {/* ── CENTER — Chapters + Accordions ─── */}
          <div className="flex flex-col xl:flex-col lg:flex-row gap-8 xl:gap-6 items-start">
            {/* Main Content Column */}
            <div
              className={`flex flex-col gap-6 order-1 w-full xl:max-w-none ${showSidebar ? "flex-1" : "lg:max-w-4xl"}`}
            >
              {/* Mobile/tablet only — Alert Center + analysis cards inline */}
              <div className="xl:hidden flex flex-col gap-4">
                <AlertCenter
                  issues={alertCenterIssues}
                  notStarted={notStarted}
                  onOpenStep={(cIdx, sIdx) => {
                    if (onSelectStep) onSelectStep(cIdx, sIdx);
                    else {
                      actions.setStage(cIdx);
                      actions.setCurrentStep(sIdx);
                    }
                  }}
                />
                {/* <JourneyRiskCard
                  metadata={state.metadata}
                  onOpenEligibility={() => {
                    actions.setStage(0);
                    actions.setCurrentStep(0);
                  }}
                /> */}
                {step1_2DocItems && (
                  <DocCaseStrengthMeter
                    documentItems={step1_2DocItems}
                    uploadedDocuments={uploadedDocuments}
                    documentChecklist={state.documentChecklist}
                    docReviewStatus={
                      state.metadata?.docReviewStatus as Record<string, string> | undefined
                    }
                    docUploads={state.docUploads}
                    notes={state.notes}
                    eligibilityAnswers={
                      (state.answers?.["eligibility-suite"] as any) ??
                      (state.metadata?.["questAnswers_eligibility-suite"] as any)
                    }
                    contextLabel="Chapter 1 · Step 2"
                    stepName="Petition Readiness"
                    defaultCollapsed={true}
                  />
                )}
              </div>
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
                  showSidebar ? "xl:grid-cols-3" : "lg:grid-cols-3"
                }`}
              >
                {(data.chapters || (data as any).stages || [])
                  .map((stage: any, originalIdx: number) => ({
                    stage,
                    originalIdx,
                  }))
                  .filter(
                    ({ stage }) =>
                      !state.scenarioType ||
                      !stage.scenarioSpecific ||
                      stage.scenarioSpecific === state.scenarioType
                  )
                  .map(({ stage, originalIdx }) => {
                    const prog = getStageProgress(data, originalIdx, state);
                    const isLocked = !isStageUnlocked(data, originalIdx, state);
                    const isDone = prog.pct === 100;
                    const isActive = !isLocked && prog.pct > 0 && !isDone;

                    // Chapter color palette — reduced saturation, balanced weight
                    const chColors = [
                      { primary: "#8284bf", light: "#eeeff8", border: "#c6c8ea" },
                      { primary: "#7a4577", light: "#f3e8f2", border: "#d5c0d3" },
                      { primary: "#3a506b", light: "#e9edf2", border: "#b7c2d4" },
                      { primary: "#0d7377", light: "#e6f5f5", border: "#a8d4d5" },
                    ][originalIdx] ?? { primary: "#0d7377", light: "#e6f5f5", border: "#a8d4d5" };

                    return (
                      <div
                        key={stage.chapter_key || stage.id}
                        onClick={() => !isLocked && onSelectChapter(originalIdx)}
                        className={`relative rounded-2xl p-5 transition-all flex flex-col gap-3 min-h-[110px] shadow-[0_4px_16px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.03)] ${
                          isLocked
                            ? "bg-white/60 opacity-50 cursor-default border border-slate-200"
                            : isDone
                              ? "cursor-pointer hover:brightness-110 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] border"
                              : isActive
                                ? "cursor-pointer hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border-2"
                                : "bg-white cursor-pointer hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border"
                        }`}
                        style={
                          isLocked
                            ? { borderColor: chColors.border }
                            : isDone
                              ? { background: chColors.primary, borderColor: chColors.border }
                              : isActive
                                ? { background: chColors.light, borderColor: chColors.primary }
                                : { borderColor: chColors.border }
                        }
                      >
                        {/* Header */}
                        <div>
                          <div
                            className={`text-[9px] font-bold tracking-[0.1em] uppercase mb-1 ${
                              isDone ? "text-white/70" : "text-[#89a4a0]"
                            }`}
                          >
                            Chapter {originalIdx + 1}
                          </div>

                          <h3
                            className={`text-[13px] font-bold leading-[1.3] ${
                              isDone ? "text-white" : "text-[#0f172a]"
                            }`}
                          >
                            {(stage.chapter_name || stage.name).replace(/^Stage\s[IVX]+:\s/, "")}
                          </h3>
                        </div>

                        {/* Lock indicator */}
                        {!isLocked &&
                          (() => {
                            const steps = stage.steps || [];
                            const lockedCount = steps.filter((s: any) => {
                              const feat = STEP_PRIMARY_FEATURE[s.step_key || s.id];
                              return feat && plan.isLocked(feat);
                            }).length;

                            if (lockedCount === 0) return null;

                            return (
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold w-fit ${
                                  isDone
                                    ? "bg-white/15 text-white/80 border border-white/20"
                                    : "bg-[#f5eef5] text-[#7a4577] border border-[#d5c0d3]"
                                }`}
                              >
                                Limited Access
                              </div>
                            );
                          })()}

                        {/* Progress */}
                        <div className="flex items-center gap-2 mt-auto">
                          <div
                            className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                              isDone ? "bg-white/20" : "bg-slate-100"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isDone ? "bg-white/80" : ""
                              }`}
                              style={{
                                width: `${prog.pct}%`,
                                background: isDone ? undefined : chColors.primary,
                              }}
                            />
                          </div>

                          <div
                            className={`text-[10px] font-bold ${
                              isDone ? "text-white/70" : "text-[#89a4a0]"
                            }`}
                          >
                            {prog.done}/{prog.total}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {/* Accordions */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                {/* Case Details */}
                <div className="border-t first:border-t-0 border-slate-100">
                  <div
                    onClick={() => toggleAccordion("case-details")}
                    className={`flex items-center p-[16px_20px] cursor-pointer hover:bg-slate-50/80 transition-colors ${openAccordions["case-details"] ? "bg-slate-50/50" : ""}`}
                  >
                    <span className="text-[13px] font-bold text-slate-900">Case details</span>
                    <span className="text-[11px] text-[#89a4a0] ml-auto mr-2">
                      {caseFields.some((f) => f.value) ? "Recorded" : "Not recorded"}
                    </span>
                    <div
                      className={`transition-transform duration-200 ${openAccordions["case-details"] ? "rotate-180" : ""}`}
                    >
                      <ChevronDown size={14} strokeWidth={2.5} className="text-[#89a4a0]" />
                    </div>
                  </div>
                  {openAccordions["case-details"] && (
                    <div className="px-[20px] pb-5 pt-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex flex-col">
                        {caseFields.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-[12.5px] text-slate-500">{item.label}</span>
                            <span
                              className={`text-[12.5px] font-medium ${!item.value ? "text-[#89a4a0] italic" : "text-slate-900"}`}
                            >
                              {item.value || "Not recorded"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Milestones */}
                <div className="border-t border-slate-100">
                  <div
                    onClick={() => toggleAccordion("milestones")}
                    className={`flex items-center p-[16px_20px] cursor-pointer hover:bg-slate-50/80 transition-colors ${openAccordions["milestones"] ? "bg-slate-50/50" : ""}`}
                  >
                    <span className="text-[13px] font-bold text-slate-900">Milestone history</span>
                    <span className="text-[11px] text-[#89a4a0] ml-auto mr-2">
                      {milestonesReached} of {milestones.length} reached
                    </span>
                    <div
                      className={`transition-transform duration-200 ${openAccordions["milestones"] ? "rotate-180" : ""}`}
                    >
                      <ChevronDown size={14} strokeWidth={2.5} className="text-[#89a4a0]" />
                    </div>
                  </div>
                  {openAccordions["milestones"] && (
                    <div className="px-[20px] pb-5 pt-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex flex-col gap-1 py-1">
                        {milestones.map((m, i) => {
                          const isDone =
                            m.key && m.sid
                              ? (state.metadata && state.metadata[m.key]) ||
                                (state.completedSteps &&
                                  state.completedSteps.has &&
                                  state.completedSteps.has(m.sid!))
                              : m.key
                                ? !!(state.metadata && state.metadata[m.key])
                                : (state.completedSteps &&
                                    state.completedSteps.has &&
                                    state.completedSteps.has(m.sid!)) ||
                                  (state.answers && state.answers[m.sid!]) ||
                                  (state.metadata && state.metadata[m.sid!]);
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl ${isDone ? "bg-[#e6f5f5]/60" : ""}`}
                            >
                              <div
                                className={`w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${isDone ? "bg-[#0d7377] text-white border-[#0d7377]" : "bg-slate-50 text-[#89a4a0] border-slate-200"}`}
                              >
                                {isDone ? "✓" : "•"}
                              </div>
                              <span className="text-[12.5px] text-slate-500 font-medium">
                                {m.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Column (Case Tracking) — hidden at xl (moves to right column) */}
            {showSidebar && (
              <div className="w-full lg:w-[360px] xl:hidden shrink-0 order-2 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-900">
                    Case Tracking Center
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d7377] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#89a4a0]">Linked to Embassy</span>
                  </div>
                </div>

                {/* Status Tracking Cards — Moved from main column */}
                {trackingStatus.interview_queue &&
                  !interviewDate &&
                  !state.metadata?.dqDate &&
                  trackingStatus.dq_status !== "qualified" &&
                  !state.metadata?.dqStatus && (
                    <WaitingStateCard
                      icon="clock"
                      title="In Interview Queue"
                      description="Your case is in the scheduling queue at the embassy. Interview dates will be assigned based on visa bulletin and wait times."
                      status="waiting"
                      showIVToolLink
                      ivEmbassy={trackingStatus.interview_embassy}
                    />
                  )}

                {interviewDate && !interviewAttended && (
                  <WaitingStateCard
                    icon="calendar"
                    title="Interview Scheduled"
                    description="Your visa interview is scheduled. Prepare all required documents and attend on time."
                    date={`${trackingStatus.interview_date || state.metadata?.interviewDate}${trackingStatus.interview_time ? ` at ${trackingStatus.interview_time}` : ""}${trackingStatus.interview_embassy ? ` · ${trackingStatus.interview_embassy}` : ""}`}
                    status="complete"
                    actionLabel="Interview Prep Guide"
                    onAction={() => {
                      if (onSelectStep) onSelectStep(2, 6);
                      else {
                        actions.setStage(2);
                        actions.setCurrentStep(6);
                      }
                    }}
                  />
                )}

                {isApPhase && state.metadata?.apSaved !== "true" && (
                  <WaitingStateCard
                    icon="alert"
                    title="Case in Administrative Processing"
                    description="Your case is under review. Go to Chapter 3 → Step 9 to record your AP details and activate full tracking."
                    date={trackingStatus.ap_date}
                    status="waiting"
                    actionLabel="Go to Step 9"
                    onAction={() => {
                      if (onSelectStep) onSelectStep(2, 8);
                      else {
                        actions.setStage(2);
                        actions.setCurrentStep(8);
                      }
                    }}
                  />
                )}

                {/* Unified Alerts */}
                {alerts.length > 0 && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                    {alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`flex gap-2.5 items-start p-3 rounded-xl border ${alert.type === "gold" ? "bg-white border-[#cdadcc] text-slate-700" : alert.type === "sky" ? "bg-white border-[#a8d4d5] text-slate-700" : alert.type === "amber" ? "bg-white border-[#cdadcc] text-slate-700" : "bg-white border-[#afdbdb] text-slate-700"}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === "gold" ? "bg-[#cdadcc]" : alert.type === "sky" ? "bg-[#0d7377]" : alert.type === "amber" ? "bg-[#cdadcc]" : "bg-[#afdbdb]"}`}
                        />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="text-[12px] leading-relaxed">
                            <span className="font-bold">{alert.title}: </span>
                            <span className="opacity-80">{alert.text}</span>
                          </div>
                          {alert.action && (
                            <div className="flex gap-2">
                              {alert.action.url ? (
                                <a
                                  href={alert.action.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 underline"
                                >
                                  {alert.action.label}
                                </a>
                              ) : (
                                <button
                                  onClick={alert.action.onAction}
                                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 underline text-left"
                                >
                                  {alert.action.label}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dynamic Scheduling Tracker — DQ phase only.
                    Hides as soon as interview date is set (admin OR user). */}
                {isDqPhase &&
                  (() => {
                    const dqDateStr = trackingStatus.dq_date || state.metadata?.dqDate;
                    const currentSchedulingMonthYear = state.metadata
                      ?.currentSchedulingMonthYear as string | undefined;
                    const postLabel = (state.metadata?.post ||
                      state.metadata?.dqPost ||
                      "Embassy") as string;

                    if (!dqDateStr) {
                      return (
                        <div className="bg-gradient-to-br from-[#0d7377] to-[#063e40] rounded-2xl border border-white/10 p-6 text-white mb-4">
                          <div className="flex items-center gap-4 text-white/60">
                            <Clock size={20} />
                            <p className="text-[13px]">
                              Please record your DQ date in <b>Chapter 2, Step 10</b> to see
                              scheduling estimates.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const dqDateObj = new Date(dqDateStr + "T00:00:00");
                    const diffTime = new Date().getTime() - dqDateObj.getTime();
                    const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const daysSinceDq = Math.max(0, rawDays);
                    // DQ dates must be in the past — if >60 days in future it's a data entry error
                    const isDqDateInvalid = rawDays < -60;
                    const dqLabel = isDqDateInvalid
                      ? "Check date"
                      : rawDays < -1
                        ? `in ${Math.abs(rawDays)} days`
                        : rawDays === -1
                          ? "tomorrow"
                          : rawDays === 0
                            ? "today"
                            : rawDays === 1
                              ? "1 day ago"
                              : `${rawDays} days ago`;

                    if (!currentSchedulingMonthYear) {
                      return (
                        <div className="bg-gradient-to-br from-[#0d7377] to-[#063e40] rounded-2xl border border-white/15 p-6 text-white mb-4 relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/8 rounded-full blur-[80px] pointer-events-none" />
                          <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.15em] text-[#0d7377] mb-4">
                              Interview Queue ({postLabel})
                            </div>
                            <h3 className="text-[18px] font-black mb-2">
                              In Queue — Awaiting Estimate
                            </h3>
                            <p className="text-[12.5px] text-white/60 leading-relaxed mb-4 max-w-md">
                              Your DQ date is recorded. To see your estimated interview window, go
                              to <b>Chapter 2 → Step 11</b> and sync the official embassy scheduling
                              month.
                            </p>
                            <div className="bg-white rounded-xl p-3 border border-white/20 flex items-center justify-between">
                              <span className="text-[12px] font-bold">
                                DQ Date:{""}
                                {dqDateObj.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase ${isDqDateInvalid ? "text-[#cdadcc]" : "text-[#afdbdb]"}`}
                              >
                                {isDqDateInvalid ? "⚠ Date seems incorrect" : dqLabel.toUpperCase()}
                              </span>
                            </div>
                            {isDqDateInvalid && (
                              <p className="text-[11px] text-[#cdadcc] mt-2">
                                DQ dates are in the past. Please go to <b>Chapter 2 → Step 10</b>{" "}
                                and correct your DQ date.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Estimation Logic
                    const [ivY, ivM] = currentSchedulingMonthYear.split("-").map(Number);
                    const ivDate = new Date(ivY, ivM - 1, 1);
                    const waitMonths = Math.max(
                      0,
                      (dqDateObj.getFullYear() - ivDate.getFullYear()) * 12 +
                        (dqDateObj.getMonth() - ivDate.getMonth())
                    );
                    const lowDate = new Date();
                    lowDate.setMonth(lowDate.getMonth() + waitMonths);
                    const highDate = new Date(lowDate);
                    highDate.setMonth(highDate.getMonth() + 2);
                    const fmt = { month: "short", year: "numeric" } as const;
                    const windowStr =
                      waitMonths === 0
                        ? "Approaching Soon"
                        : `${lowDate.toLocaleDateString("en-US", fmt)} – ${highDate.toLocaleDateString("en-US", fmt)}`;
                    const embassyMonthStr = ivDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <div className="bg-gradient-to-br from-[#0d7377] to-[#063e40] rounded-2xl border border-white/15 shadow-xl p-6 text-white mb-6 relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/8 rounded-full blur-[80px] pointer-events-none" />
                        <div className="flex flex-col gap-4 mb-6 border-b border-white/15 pb-4">
                          <div>
                            <h3 className="text-[20px] font-black leading-tight">
                              In Interview Queue ({postLabel})
                            </h3>
                            <p className="text-white/60 text-[12px] mt-1">
                              Estimated timeline based on your DQ date and the official IV Status
                              Tool.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 mb-6">
                          <div className="bg-white rounded-xl p-4 border border-white/20">
                            <div className="text-[10px] uppercase tracking-widest text-[#89a4a0] mb-2 font-black">
                              Your DQ Date
                            </div>
                            <div className="text-[18px] font-bold">
                              {dqDateObj.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-[#0d7377] mt-1 font-bold uppercase">
                              {dqLabel}
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-white/20 flex flex-col justify-between">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-[#89a4a0] mb-1 font-black leading-tight">
                                Embassy is currently scheduling cases DQ'd in
                              </div>
                              <div className="text-[18px] font-bold text-[#0d7377] mt-1">
                                {embassyMonthStr}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                window.open(
                                  "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html",
                                  "_blank"
                                )
                              }
                              className="mt-3 text-[10px] font-bold text-[#0d7377]/70 hover:text-[#0d7377] flex items-center gap-1 transition-colors group"
                            >
                              Check Latest Official Tool{""}
                              <ExternalLink
                                size={10}
                                className="group-hover:translate-x-0.5 transition-transform"
                              />
                            </button>
                          </div>
                          <div className="bg-[#cdadcc]/15 rounded-xl p-4 border border-[#cdadcc]/25">
                            <div className="text-[10px] uppercase tracking-widest text-[#cdadcc] mb-2 font-black">
                              Estimated Interview Window
                            </div>
                            <div className="text-[20px] font-black text-[#cdadcc]">{windowStr}</div>
                            <div className="text-[10px] text-[#cdadcc]/70 mt-1 font-medium">
                              Subject to visa availability
                            </div>
                          </div>
                        </div>
                        <div className="bg-white border border-white/20 rounded-xl p-4 relative">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-xl bg-[#0d7377]/15 flex items-center justify-center shrink-0 border border-[#0d7377]/20">
                              <Shield className="text-[#0d7377]" size={16} />
                            </div>
                            <div>
                              <h4 className="text-[13px] font-black mb-1">Status Intelligence</h4>
                              <p className="text-[12.5px] text-white/60 leading-relaxed">
                                The embassy is currently scheduling cases that became DQ'd in{""}
                                <b>{embassyMonthStr}</b>. Your case became DQ'd in{""}
                                <b>
                                  {dqDateObj.toLocaleDateString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </b>
                                , which means you are <b>approximately {waitMonths} months</b>
                                {""}
                                behind the current processing group.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* AP Tracking Tool — full detailed view.
                    Shows ONLY after interview is attended AND user recorded
                    AP details in Step 3.9. */}
                {isApPhase && state.metadata?.apSaved === "true" && (
                  <APTrackingTool state={state} />
                )}
              </div>
            )}
          </div>
          {/* end center column */}

          {/* ── RIGHT COLUMN — Sidebar tracking only (case strength moved to left) ─── */}
          <div className={`hidden xl:flex flex-col gap-3 ${!showSidebar ? "xl:hidden" : ""}`}>
            {/* Sidebar tracking cards */}
            {showSidebar && (
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-900">
                    Case Tracking Center
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d7377] animate-pulse" />
                    <span className="text-[9px] font-bold text-[#89a4a0]">Live</span>
                  </div>
                </div>
                {trackingStatus.interview_queue &&
                  !interviewDate &&
                  !state.metadata?.dqDate &&
                  trackingStatus.dq_status !== "qualified" &&
                  !state.metadata?.dqStatus && (
                    <WaitingStateCard
                      icon="clock"
                      title="In Interview Queue"
                      description="Your case is in the scheduling queue at the embassy."
                      status="waiting"
                      showIVToolLink
                      ivEmbassy={trackingStatus.interview_embassy}
                    />
                  )}
                {interviewDate && !interviewAttended && (
                  <WaitingStateCard
                    icon="calendar"
                    title="Interview Scheduled"
                    description="Your visa interview is scheduled."
                    date={`${trackingStatus.interview_date || state.metadata?.interviewDate}${trackingStatus.interview_time ? ` at ${trackingStatus.interview_time}` : ""}`}
                    status="complete"
                    actionLabel="Interview Prep"
                    onAction={() => {
                      if (onSelectStep) onSelectStep(2, 6);
                      else {
                        actions.setStage(2);
                        actions.setCurrentStep(6);
                      }
                    }}
                  />
                )}
                {isApPhase && state.metadata?.apSaved !== "true" && (
                  <WaitingStateCard
                    icon="alert"
                    title="Administrative Processing"
                    description="Go to Chapter 3 → Step 9 to record AP details."
                    date={trackingStatus.ap_date}
                    status="waiting"
                    actionLabel="Go to Step 9"
                    onAction={() => {
                      if (onSelectStep) onSelectStep(2, 8);
                      else {
                        actions.setStage(2);
                        actions.setCurrentStep(8);
                      }
                    }}
                  />
                )}
                {alerts.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`flex gap-2 items-start p-3 rounded-xl border ${alert.type === "gold" ? "bg-white border-[#cdadcc] text-slate-700" : alert.type === "sky" ? "bg-white border-[#a8d4d5] text-slate-700" : alert.type === "amber" ? "bg-white border-[#cdadcc] text-slate-700" : "bg-white border-[#afdbdb] text-slate-700"}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === "gold" ? "bg-[#cdadcc]" : alert.type === "sky" ? "bg-[#0d7377]" : alert.type === "amber" ? "bg-[#cdadcc]" : "bg-[#afdbdb]"}`}
                        />
                        <div className="text-[11px] leading-relaxed flex-1">
                          <span className="font-bold">{alert.title}: </span>
                          <span className="opacity-80">{alert.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isApPhase && state.metadata?.apSaved === "true" && (
                  <APTrackingTool state={state} />
                )}
              </div>
            )}
          </div>
        </div>
        {/* end 3-col grid */}
      </div>

      {/* ── CSA Drawer ── */}
      <CSADrawer
        isOpen={isCSADrawerOpen}
        onClose={() => setIsCSADrawerOpen(false)}
        narrative={caseNarrative}
        evidenceAnalysis={evidenceAnalysis}
        evidenceLoading={evidenceLoading}
        healthStatus={caseHealthStatus}
        onOpenEvidenceQuestionnaire={() => {
          setIsCSADrawerOpen(false);
          setShowEvidenceQuestionnaireModal(true);
        }}
        evidenceAnswered={evidenceAnsweredCount}
        onOpenPhase2={() => {
          setIsCSADrawerOpen(false);
          setShowPhase2Modal(true);
        }}
        phase2Answered={phase2AnsweredCount}
      />

      {/* ── Phase 2 Questionnaire Modal ── */}
      <Phase2Modal
        isOpen={showPhase2Modal}
        onClose={() => setShowPhase2Modal(false)}
        responses={phase2Responses}
        onSave={handlePhase2Save}
      />

      {/* ── Evidence Questionnaire Modal ── */}
      <EvidenceQuestionnaireModal
        isOpen={showEvidenceQuestionnaireModal}
        onClose={() => setShowEvidenceQuestionnaireModal(false)}
        responses={questionnaireResponses}
        onSave={handleQuestionnaireSave}
      />
    </div>
  );
}
