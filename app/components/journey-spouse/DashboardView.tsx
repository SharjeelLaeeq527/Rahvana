"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { RoadmapData } from "@/app/(tools)/(visa)/visa-category/[visa-journey]/components/types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getJourneyLockStatus } from "@/lib/journey-lock";
import { getNextBestAction, getStageProgress, isStageUnlocked } from "./journeyHelpers";
import { useCandidate } from "@/app/context/CandidateContext";
import { JourneyGuidePage } from "@/app/components/shared/GuidePageOverlay";
import { Phase2Modal } from "./components/Phase2Modal";
import { EvidenceQuestionnaireModal } from "./components/EvidenceQuestionnaireModal";
import { CSADrawer } from "./components/CSADrawer";
import { JourneyDashboard } from "@/app/components/journey-dashboard/JourneyDashboard";
import { useJourneyDashboardProps } from "@/app/components/journey-dashboard/useJourneyDashboardProps";
import { PHASE2_QUESTIONS } from "@/lib/case-strength";
import { EVIDENCE_QUESTIONNAIRE } from "@/lib/journey/evidence-gap";
import { EvidenceGapEngine } from "@/lib/journey/evidence-gap";
import type { EvidenceGapAnalysis } from "@/lib/journey/evidence-gap";
import { DOCUMENTS_BY_ID } from "@/lib/document-vault/document-definitions";
import {
  generateCaseNarrative,
  getCaseHealthStatus,
  computeOverallCaseScore,
  computeConsistencyScore,
  computeWeightedCaseScore,
  classifyBandTransition,
  SCORE_BAND_LABEL,
  runFullConsistencyAnalysis,
  type Phase2Responses,
  type ScoreBand,
} from "@/lib/case-strength";
import {
  aggregateChapter1Issues,
  aggregateChapter2Issues,
  aggregateChapter3Issues,
  type AggregatedIssue,
} from "@/lib/case-strength/aggregate-issues";
import {
  gateAlertIssues,
  buildAlertGateContext,
  isCaseHealthScorable,
  hasUserEvidenceSignal,
} from "@/lib/case-strength/alert-gating";
import { resolveCaseStrengthProfile } from "@/lib/case-strength/categories";
import type { ConsistencyFinding } from "@/lib/case-strength/consistency-intelligence";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { useJourneyPlan } from "@/app/context/useJourneyPlan";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import APTrackingTool from "./APTrackingTool";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { getActiveStepsForStage } from "./journeyHelpers";
import { getStepLockStatus, getModalFeatureForTier } from "@/lib/entitlements/hardLockRules";
import { fetchReceiptForJourney, ReceiptRecord } from "@/app/components/home-page/Visatickerprops";
import { RECEIPT_SAVED_EVENT } from "@/lib/journey/dashboard/caseFacts";

interface DashboardViewProps {
  data: RoadmapData;
  state: WizardState;
  onSelectChapter: (idx: number) => void;
  onSelectStep?: (cIdx: number, sIdx: number) => void;
  onLaunchTool?: (componentKey: string) => void;
  actions: {
    setCurrentStep: (idx: number) => void;
    setStage: (idx: number) => void;
    updateMetadata: (metadata: Record<string, any>) => void;
  };
}

// Stable helper set for the redesigned dashboard (step filtering always goes
// through getActiveStepsForStage, never inline).
const STEP_HELPERS = { getActiveStepsForStage, getStageProgress, isStageUnlocked };

export function DashboardView({
  data,
  state,
  onSelectChapter,
  onSelectStep,
  onLaunchTool,
  actions,
}: DashboardViewProps) {
  const plan = useJourneyPlan(state);
  const effectiveTier = plan.tier;
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const [guideOverlayUrl, setGuideOverlayUrl] = useState<string | null>(null);

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

  // ── CSA Drawer State ─────────────────────────────────────────────────────
  const [isCSADrawerOpen, setIsCSADrawerOpen] = useState(false);
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);
  const [showEvidenceQuestionnaireModal, setShowEvidenceQuestionnaireModal] = useState(false);

  // Band-cross persistence for score-drop alerts (opt-in weighted model only)
  const prevBandRef = useRef<ScoreBand | null>(null);
  const [scoreDropBand, setScoreDropBand] = useState<{ from: ScoreBand; to: ScoreBand } | null>(
    null
  );

  // Detect weighted score (IR-1 just got it via profile flag)
  const useWeightedScore = useMemo(() => {
    const p = resolveCaseStrengthProfile((data as any).journey_type);
    return p.caseScore?.model === "weighted";
  }, [data]);

  // User-provided evidence view for the weighted model (autofill excluded),
  // shared by the case narrative AND the Case Analysis drawer. Legacy model → raw analysis.
  const weightedEvidenceView = useMemo<EvidenceGapAnalysis | null>(() => {
    const p = resolveCaseStrengthProfile((data as any).journey_type);
    if (p.caseScore?.model !== "weighted" || !evidenceAnalysis?.userProvided) {
      return evidenceAnalysis;
    }
    const up = evidenceAnalysis.userProvided;
    return {
      ...evidenceAnalysis,
      overallScore: up.score,
      requiredDocuments: up.requiredDocuments,
      categories: up.categories,
      stats: up.stats,
      recommendations: up.recommendations,
    };
  }, [evidenceAnalysis, data]);

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

    const p = resolveCaseStrengthProfile((data as any).journey_type);
    // Weighted model: use the same honest evidence view + weighted score so the
    // drawer's summary matches the gauge and stays calm at the start.
    if (p.caseScore?.model === "weighted" && evidenceAnalysis?.userProvided) {
      const up = evidenceAnalysis.userProvided;
      const metadata = state.metadata as Record<string, unknown> | undefined;
      const questAnswers = metadata?.["questAnswers_eligibility-suite"] as
        Record<string, Record<string, string | string[]>> | undefined;
      const eligibilityRisks = p.detectEligibilityRisks(questAnswers, p.stepRefs);
      const weightedScore = computeWeightedCaseScore({
        evidenceStrength: up.score,
        consistencyScore: computeConsistencyScore(consistencyFindings),
        completeness: up.completionPercentage,
        riskFlags: eligibilityRisks,
      }).score;
      return generateCaseNarrative({
        evidenceAnalysis: weightedEvidenceView,
        consistencyFindings,
        overallScoreOverride: weightedScore,
      });
    }

    return generateCaseNarrative({ evidenceAnalysis, consistencyFindings });
  }, [evidenceAnalysis, weightedEvidenceView, state, phase2Responses, uploadedDocuments, data]);

  // Health status badge for the CaseSummaryCard header
  // Weighted model: uses user-provided evidence + weighted score for label/color.
  const caseHealthStatus = useMemo(() => {
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);

    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );

    const p = resolveCaseStrengthProfile((data as any).journey_type);
    if (p.caseScore?.model === "weighted" && weightedEvidenceView) {
      return getCaseHealthStatus({
        evidenceAnalysis: weightedEvidenceView,
        consistencyFindings,
      });
    }

    return getCaseHealthStatus({
      evidenceAnalysis,
      consistencyFindings,
    });
  }, [evidenceAnalysis, weightedEvidenceView, state, phase2Responses, uploadedDocuments, data]);

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
    // buildAlertGateContext (shared with V3) derives the frontier/active-order
    // AND wires the category profile's look-ahead + document-escalation config +
    // target filing date, so IR-1 gets the same calm 3-stage doc lifecycle as IR-5
    // instead of instant-red criticals.
    const alertProfile = resolveCaseStrengthProfile((data as any).journey_type);
    const gated = gateAlertIssues(
      all,
      buildAlertGateContext({
        chapters,
        state,
        getActiveStepsForStage,
        getNextBestAction,
        stepTimestamps: state.stepTimestamps,
        profile: alertProfile,
      })
    );

    const order = { critical: 0, warning: 1, info: 2 };
    return gated.sort((a, b) => {
      if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
      if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
      return a.chapterIdx - b.chapterIdx;
    });
  }, [data, state, uploadedDocuments, phase2Responses]);

  // Score-drop synthetic alert (band-cross detection): when weighted score crosses
  // a band downward, emit a warning that points the user to the CSA breakdown.
  const scoreDropIssue = useMemo<AggregatedIssue | null>(() => {
    if (!scoreDropBand) return null;
    return {
      level: "warning",
      title: `Case strength dropped to ${SCORE_BAND_LABEL[scoreDropBand.to]}`,
      hint: `Your Case Strength moved from ${SCORE_BAND_LABEL[scoreDropBand.from]} to ${SCORE_BAND_LABEL[scoreDropBand.to]}. Open the breakdown to see which factor fell, evidence, consistency, completeness, or a new risk flag.`,
      stepKey: "__score__",
      stepName: "Case Strength",
      stepNumber: 0,
      chapterIdx: 0,
      stepIdx: 0,
      kind: "score-drop",
    };
  }, [scoreDropBand]);

  // The Alert Center list, with the score-drop meta-alert first when present.
  const displayedAlertIssues = useMemo<AggregatedIssue[]>(
    () => (scoreDropIssue ? [scoreDropIssue, ...alertCenterIssues] : alertCenterIssues),
    [scoreDropIssue, alertCenterIssues]
  );

  // Overall combined case score (evidence + consistency)
  // Weighted model (IR-1/IR-5): 4-ingredient (Evidence 40 / Consistency 30 / Completeness 20 / Risk 10)
  // with user-provided-only evidence. Legacy model: 50/50 blend.
  // Returns { score, breakdown } so the CaseHealthOverview explainer can display
  // the SAME four ingredient numbers that produced the score — the worked example
  // must reconcile exactly. Mirrors DashboardView's weighted path (no
  // userProvided gate; `?? 0` fallbacks) so V2/V3 stay in lockstep.
  const caseScoreResult = useMemo(() => {
    const eligibilityAnswers =
      (state.answers?.["eligibility-suite"] as any) ??
      (state.metadata?.["questAnswers_eligibility-suite"] as any);
    const consistencyFindings = runFullConsistencyAnalysis(
      { state, eligibilityAnswers },
      (phase2Responses as Phase2Responses) ?? null,
      uploadedDocuments
    );

    const p = resolveCaseStrengthProfile((data as any).journey_type);
    if (p.caseScore?.model === "weighted") {
      const metadata = state.metadata as Record<string, unknown> | undefined;
      const questAnswers = metadata?.["questAnswers_eligibility-suite"] as
        Record<string, Record<string, string | string[]>> | undefined;
      const eligibilityRisks = p.detectEligibilityRisks(questAnswers, p.stepRefs);
      return computeWeightedCaseScore({
        evidenceStrength: evidenceAnalysis?.userProvided?.score ?? 0,
        consistencyScore: computeConsistencyScore(consistencyFindings),
        completeness: evidenceAnalysis?.userProvided?.completionPercentage ?? 0,
        riskFlags: eligibilityRisks,
      });
    }

    return {
      score: computeOverallCaseScore({ evidenceAnalysis, consistencyFindings }),
      breakdown: null as ReturnType<typeof computeWeightedCaseScore>["breakdown"] | null,
    };
  }, [evidenceAnalysis, state, phase2Responses, uploadedDocuments, data]);
  const overallCaseScore = caseScoreResult.score;

  // Sub-scores for the CaseHealthOverview popover breakdown
  // Weighted model uses user-provided-only view; legacy uses autofill-inclusive.
  const evidenceSubScore = useMemo(() => {
    const p = resolveCaseStrengthProfile((data as any).journey_type);
    if (p.caseScore?.model === "weighted" && weightedEvidenceView?.overallScore !== undefined) {
      return weightedEvidenceView.overallScore;
    }
    return evidenceAnalysis?.overallScore ?? 50;
  }, [evidenceAnalysis, weightedEvidenceView, data]);
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

  // Phase 2 answered count
  const phase2AnsweredCount = Object.values(phase2Responses).filter(Boolean).length;

  // Evidence questionnaire answered count
  const evidenceAnsweredCount = Object.values(questionnaireResponses).filter(Boolean).length;

  // Case-health SCORE gate: the ring/percentage is evidence-derived, so it must
  // stay in the neutral "gathering info" state until the user has produced real
  // evidence — not merely completed a checklist step. Without this, an empty
  // evidence set defaults to ~50% and reads as a real (bad) score the instant
  // step 1 is done. Uses userProvided only (not autofill) to avoid fake signals
  // from journey_documents. `notStarted` (alert stream) stays keyed off completion.
  // The vault seeds a "MISSING" placeholder row per required document, so the raw
  // array length is > 0 on a fresh journey — count only rows with a real file.
  const hasEvidenceSignal = hasUserEvidenceSignal({
    uploadedFileCount: uploadedDocuments.filter((d) => d.status !== "MISSING").length,
    evidenceAnsweredCount,
    userProvidedEvidenceCount: evidenceAnalysis?.userProvided?.evidenceCount ?? 0,
  });
  const healthNotStarted = !isCaseHealthScorable({
    completedCount: state.completedSteps.size,
    hasEvidenceSignal,
  });

  // Band-cross detection: fire alert only on downward cross, recover on rise.
  // Declared AFTER overallCaseScore + healthNotStarted so its deps aren't read
  // in the temporal dead zone (mirrors the ordering in DashboardView).
  useEffect(() => {
    if (!useWeightedScore || healthNotStarted) {
      prevBandRef.current = null;
      return;
    }
    const t = classifyBandTransition(prevBandRef.current, overallCaseScore);
    if (t.direction === "drop" && prevBandRef.current) {
      setScoreDropBand({ from: prevBandRef.current, to: t.band });
    } else if (t.direction === "rise") {
      setScoreDropBand(null); // recovered → clear the alert
    }
    prevBandRef.current = t.band;
  }, [overallCaseScore, useWeightedScore, healthNotStarted]);

  const trackingStatus = useMemo(
    () => (state.metadata?.tracking_status as any) || {},
    [state.metadata?.tracking_status]
  );

  // New outcome metadata
  const interviewOutcome = state.metadata?.interviewOutcome as string | undefined;
  const journeyCompletedAt = state.metadata?.journeyCompletedAt as string | undefined;

  // Interview attended = user completed Step 3.8, admin AP state, or any recorded outcome.
  const interviewAttended =
    state.completedSteps?.has("step_3_8") ||
    state.completedSteps?.has("c3s8") ||
    !!trackingStatus.ap_status ||
    !!interviewOutcome;

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
      effectiveTier,
      nextActionData.chapterIdx,
      nextActionData.stepIdxInChapter
    );
  }, [nextActionData, effectiveTier]);

  const lockStatus = useMemo(() => getJourneyLockStatus(state.metadata || {}), [state.metadata]);

  let candidateCtx;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    candidateCtx = useCandidate();
  } catch {
    candidateCtx = undefined;
  }
  const activeCandidateId = candidateCtx?.activeCandidateId || null;

  const [nvcCaseNum, setNvcCaseNum] = useState<string | undefined>(undefined);
  const [nvcInvoice, setNvcInvoice] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchNvcFields() {
      const portalType = state.metadata.portalType || "NVC";
      try {
        const res = await fetch("/api/portal-wallet/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalType,
            type: "all_details",
            journeyId: state.backendId || (state as any).journeyId || "",
            candidateId: activeCandidateId,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.details) {
          setNvcCaseNum(data.details.nvcCaseNum);
          setNvcInvoice(data.details.nvcInvoice);
        } else if (!cancelled) {
          // No NVC details saved for this candidate: show nothing rather than stale values.
          setNvcCaseNum(undefined);
          setNvcInvoice(undefined);
        }
      } catch {
        if (!cancelled) {
          setNvcCaseNum(undefined);
          setNvcInvoice(undefined);
        }
      }
    }
    fetchNvcFields();
    return () => {
      cancelled = true;
    };
  }, [state.metadata.portalType, activeCandidateId]);

  const [receiptRecord, setReceiptRecord] = useState<ReceiptRecord | null | undefined>(undefined);
  // Bumped when a receipt is registered, so the tracking ticket picks it up at once.
  const [receiptVersion, setReceiptVersion] = useState(0);
  useEffect(() => {
    const bump = () => setReceiptVersion((n) => n + 1);
    window.addEventListener(RECEIPT_SAVED_EVENT, bump);
    return () => window.removeEventListener(RECEIPT_SAVED_EVENT, bump);
  }, []);
  useEffect(() => {
    console.log("DEBUG [receipt effect] FIRED, state.backendId:", state.backendId);
    let cancelled = false;
    const jId = state.backendId;

    if (!jId) {
      console.log("DEBUG [receipt effect] No backendId yet, skipping fetch");
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
      console.log("DEBUG [receipt effect] Cleanup, marking cancelled");
      cancelled = true;
    };
  }, [state.backendId, receiptVersion]);

  // Hero "Continue": same lock / upgrade / navigate rules as CaseStatusHero.
  const handleContinue = () => {
    if (plan.isLocked("roadmap_access")) {
      setUpgradeModalFeature("roadmap_access");
      return;
    }
    if (!nextActionData) return;
    if (nextStepLock.isLocked) {
      setUpgradeModalFeature(getModalFeatureForTier(nextStepLock.requiredPlan!));
      return;
    }
    if (onSelectStep) onSelectStep(nextActionData.chapterIdx, nextActionData.stepIdxInChapter);
    else {
      actions.setStage(nextActionData.chapterIdx);
      actions.setCurrentStep(nextActionData.stepIdxInChapter);
    }
  };

  // Redesigned dashboard: reuses the values computed above, nothing re-derived.
  const journeyDashboardProps = useJourneyDashboardProps({
    data,
    state,
    updateMetadata: actions.updateMetadata,
    helpers: STEP_HELPERS,
    nextAction: nextActionData,
    upgradeRequired: plan.isLocked("roadmap_access") || nextStepLock.isLocked,
    readOnly: lockStatus.isLocked,
    locks: {
      caseStrength: plan.isLocked("case_strength"),
      uscisCheck: plan.isLocked("tracker_reminders"),
      vault: plan.isLocked("document_vault"),
      wallet: plan.isLocked("portal_wallet"),
    },
    onUpgrade: setUpgradeModalFeature,
    renderApTracker: () => <APTrackingTool state={state} defaultExpanded />,
    isStepLocked: (stepKey: string) => {
      const feat = STEP_PRIMARY_FEATURE[stepKey];
      return !!feat && plan.isLocked(feat);
    },
    caseHealth: {
      notStarted: healthNotStarted,
      loading: evidenceLoading,
      score: overallCaseScore,
      label: caseHealthStatus?.label ?? "Analyzing",
      status: caseHealthStatus?.status ?? "needs-attention",
      evidence: caseScoreResult.breakdown?.evidenceStrength ?? evidenceSubScore,
      consistency: caseScoreResult.breakdown?.consistencyScore ?? consistencySubScore,
      completeness: caseScoreResult.breakdown?.completeness,
      riskPenalty: caseScoreResult.breakdown?.riskPenalty,
      evidenceAnswered: evidenceAnsweredCount,
      evidenceTotal: EVIDENCE_QUESTIONNAIRE.length,
      consistencyAnswered: phase2AnsweredCount,
      consistencyTotal: PHASE2_QUESTIONS.length,
    },
    issues: displayedAlertIssues,
    receiptRecord,
    nvcCaseNum,
    nvcInvoice,
    interviewAttended: !!interviewAttended,
    isApPhase: !!isApPhase,
    isApprovedPhase: !!isApprovedPhase,
    isJourneyComplete,
    actions: {
      onContinue: handleContinue,
      onOpenChapter: onSelectChapter,
      onOpenStep: (c, st) => {
        if (onSelectStep) onSelectStep(c, st);
        else {
          actions.setStage(c);
          actions.setCurrentStep(st);
        }
      },
      onOpenCaseAnalysis: () => setIsCSADrawerOpen(true),
      onOpenEvidenceQuestions: () => setShowEvidenceQuestionnaireModal(true),
      onOpenConsistencyQuestions: () => setShowPhase2Modal(true),
    },
    onLaunchTool,
  });

  return (
    <div className="rv-dash-bg relative flex-1 px-2 py-3 sm:px-4">
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      <JourneyDashboard {...journeyDashboardProps} />

      {/* ── CSA Drawer ── */}
      <CSADrawer
        isOpen={isCSADrawerOpen}
        onClose={() => setIsCSADrawerOpen(false)}
        narrative={caseNarrative}
        evidenceAnalysis={weightedEvidenceView}
        evidenceLoading={evidenceLoading}
        healthNotStarted={healthNotStarted}
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
      <JourneyGuidePage
        guideUrl={guideOverlayUrl}
        onClose={() => setGuideOverlayUrl(null)}
        plan={plan}
      />
    </div>
  );
}
