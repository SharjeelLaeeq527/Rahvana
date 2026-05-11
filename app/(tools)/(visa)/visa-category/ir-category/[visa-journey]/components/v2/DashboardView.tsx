"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Clock,
  Shield,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getJourneyLockStatus } from "@/lib/journey-lock";
import {
  getNextBestAction,
  getStageProgress,
  isStageUnlocked,
} from "./journeyHelpers";
import APTrackingTool from "./APTrackingTool";
import WaitingStateCard from "./WaitingStateCard";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { LockedFeature } from "@/app/components/entitlements/LockedFeature";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { getActiveStepsForStage } from "./journeyHelpers";
import { getStepLockStatus, getModalFeatureForTier } from "@/lib/entitlements/hardLockRules";

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
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(
    null,
  );

  const trackingStatus = useMemo(
    () => (state.metadata?.tracking_status as any) || {},
    [state.metadata?.tracking_status],
  );
  const hasTrackingData = useMemo(
    () => Object.keys(trackingStatus).length > 0,
    [trackingStatus],
  );
  const isCaseRegistered = !!state.metadata?.nvcCaseNum;

  // ── Phase helpers — drive which cards are visible ──────────
  // Interview date: admin-set (tracking_status) OR user-set (Step 2.12 metadata)
  const interviewDate =
    trackingStatus.interview_date ||
    (state.metadata?.interviewDate as string | undefined);

  // Interview attended = user completed Step 3.8 (attend visa interview)
  const interviewAttended =
    state.completedSteps?.has("step_3_8") ||
    state.completedSteps?.has("c3s8") ||
    !!trackingStatus.ap_status; // if admin set AP, interview happened

  // DQ is active (case qualified, waiting for interview scheduling)
  const isDqPhase =
    (!!state.metadata?.dqDate ||
      trackingStatus.dq_status === "qualified" ||
      state.metadata?.dqStatus === "qualified") &&
    !interviewDate;

  // New outcome metadata
  const interviewOutcome = state.metadata?.interviewOutcome as
    | string
    | undefined;
  const journeyCompletedAt = state.metadata?.journeyCompletedAt as
    | string
    | undefined;
  const isJourneyComplete = !!journeyCompletedAt;

  // AP phase: legacy (apSaved/admin) OR new 221g path
  const isApPhase =
    interviewAttended &&
    (trackingStatus.ap_status === "pending" ||
      state.metadata?.apSaved === "true" ||
      interviewOutcome === "221g");

  // Approved phase: interview attended AND outcome confirmed as approved
  const isApprovedPhase = interviewAttended && interviewOutcome === "approved";

  const nextActionData = useMemo(
    () => getNextBestAction(data, state),
    [data, state],
  );

  const nextStepLock = useMemo(() => {
    if (!nextActionData) return { isLocked: false, requiredPlan: null };
    const stepId = nextActionData.step.step_key;
    return getStepLockStatus(
      stepId,
      plan.tier,
      nextActionData.chapterIdx,
      nextActionData.stepIdxInChapter,
    );
  }, [nextActionData, plan.tier]);

  const lockStatus = useMemo(
    () => getJourneyLockStatus(state.metadata || {}),
    [state.metadata],
  );

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
            actions.setStage(2);
            actions.setCurrentStep(3);
          },
        },
      });
    }

    // "In scheduling queue" alert removed — the Dynamic Scheduling Tracker
    // (sidebar dark card with DQ date + embassy month + estimate) shows
    // this same info in full detail. No duplicate text alert needed.

    if (
      trackingStatus.nvc_review_complete &&
      trackingStatus.dq_status !== "qualified"
    ) {
      list.push({
        type: "green",
        iconColor: "d-green",
        title: "NVC Document Review Complete",
        text: `NVC has reviewed your documents. Your case is being processed for Documentarily Qualified status. ${trackingStatus.nvc_review_date ? `(Date: ${trackingStatus.nvc_review_date})` : ""}`,
      });
    }

    if (!hasTrackingData && isCaseRegistered) {
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
        !interviewDate &&
        !state.metadata?.dqDate &&
        trackingStatus.dq_status !== "qualified" &&
        !state.metadata?.dqStatus) ||
      (!!interviewDate && !interviewAttended) ||
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

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {
      "case-details": true,
      milestones: false,
    },
  );

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
        (state.completedSteps &&
          state.completedSteps.has &&
          state.completedSteps.has(m.sid))
      );
    }
    if (m.key) return !!(state.metadata && state.metadata[m.key]);
    if (m.sid) {
      return (
        (state.completedSteps &&
          state.completedSteps.has &&
          state.completedSteps.has(m.sid)) ||
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
          setNvcError("No details found");
        }
      } catch {
        if (!cancelled) setNvcError("Failed to fetch NVC fields");
      } finally {
        if (!cancelled) setNvcLoading(false);
      }
    }
    fetchNvcFields();
    return () => {
      cancelled = true;
    };
  }, [state.metadata.portalType]);

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
        style={{ backgroundImage: `url(${dashboardBg})`, opacity: 0.6 }}
      />
      <div className="w-full max-w-[1200px] mx-auto animate-in fade-in duration-700 relative z-10">
        <div className={`w-full ${showSidebar ? "" : "lg:max-w-4xl mx-auto"}`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2 text-center lg:text-left">
            IR-1 Spouse Visa · Pakistan
          </div>
          <h1 className="font-black text-[clamp(22px,3vw,28px)] text-[#0c1b33] mb-8 text-center lg:text-left">
            Case Dashboard
          </h1>
        </div>

        <div
          className={`flex flex-col lg:flex-row gap-8 items-start ${!showSidebar ? "justify-center" : ""}`}
        >
          {upgradeModalFeature && (
            <UpgradeModal
              feature={upgradeModalFeature}
              onClose={() => setUpgradeModalFeature(null)}
            />
          )}
          {/* Main Content Column */}
          <div
            className={`flex flex-col gap-6 order-1 w-full ${showSidebar ? "flex-1" : "lg:max-w-4xl"}`}
          >
            {/* Journey Complete — highest priority status card */}
            {isJourneyComplete && (
              <WaitingStateCard
                icon="check"
                title="IR-1 Journey Complete!"
                description="Congratulations — you have completed every step of the roadmap. Your journey is now in read-only mode for reference."
                status="complete"
              />
            )}

            {/* Journey Locked — 14-day window expired */}
            {lockStatus.isLocked && (
              <div className="bg-[#1a1a2e] border border-[#3a3a5c] rounded-2xl p-5 flex items-start gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={18} className="text-white/60" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">
                    Journey Locked
                  </div>
                  <div className="text-[15px] font-bold text-white/90 mb-1">
                    This journey is now in read-only mode
                  </div>
                  <div className="text-[13px] text-white/55 leading-relaxed">
                    The 14-day editing window following your CEAC status being marked as Issued has ended. Your roadmap is preserved for reference. Contact support if you need to make changes.
                  </div>
                </div>
              </div>
            )}

            {/* Lock Warning — approaching lock (≤ 3 days remaining) */}
            {lockStatus.isWarning && !lockStatus.isLocked && (
              <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-2xl p-5 flex items-start gap-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 bg-[#f0d98a]/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={18} className="text-[#8a6200]" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#8a6200]/60 mb-1">
                    Journey Locking Soon
                  </div>
                  <div className="text-[15px] font-bold text-[#0c1b33] mb-1">
                    {lockStatus.daysRemaining === 1
                      ? "Your journey locks tomorrow"
                      : `Your journey locks in ${lockStatus.daysRemaining} days`}
                  </div>
                  <div className="text-[13px] text-[#8a6200]/80 leading-relaxed">
                    After{" "}
                    {lockStatus.lockDate?.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    , this journey will become read-only. Complete any remaining steps before then.
                  </div>
                </div>
              </div>
            )}

            {/* Visa Approved — show when outcome confirmed but journey not yet closed */}
            {isApprovedPhase && !isJourneyComplete && (
              <WaitingStateCard
                icon="check"
                title="Visa Approved!"
                description="Your visa was approved at interview. Continue in Chapter 3 to track issuance and prepare for arrival."
                status="complete"
                actionLabel="Track Visa Issuance"
                onAction={() => actions.setStage(2)}
              />
            )}

            {/* 221(g) new path — outcome selected but AP details not yet recorded */}
            {interviewOutcome === "221g" &&
              state.metadata?.apSaved !== "true" && (
                <WaitingStateCard
                  icon="alert"
                  title="221(g) Refusal — Action Required"
                  description="Complete the follow-up steps in Chapter 3 to respond to the 221(g) and track your case status."
                  status="action-needed"
                  actionLabel="Continue Chapter 3"
                  onAction={() => actions.setStage(2)}
                />
              )}

            {/* Administrative Processing — legacy path (apSaved before new outcome flow) */}
            {isApPhase &&
              !interviewOutcome &&
              state.metadata?.apSaved !== "true" && (
                <WaitingStateCard
                  icon="alert"
                  title="Case in Administrative Processing"
                  description="Your case is under review. Go to Chapter 3 → Step 9 to record your AP details and activate full tracking."
                  date={trackingStatus.ap_date}
                  status="waiting"
                  actionLabel="Go to Step 9"
                  actionUrl="/visa-category/ir-category/ir1-journey"
                />
              )}

            {/* Hero Section */}
            <section className="bg-[#0c1b33] rounded-2xl p-[20px_24px] relative overflow-hidden animate-in zoom-in duration-500 shadow-[0_20px_64px_rgba(36,42,66,0.16),0_8px_32px_rgba(47,111,212,0.13)] border-2 border-gradient-to-br from-[#3a4a66] to-[#6aa8f0] outline outline-2 outline-[#22304a] after:content-[''] after:absolute after:-top-[50px] after:-right-[50px] after:w-[180px] after:h-[180px] after:rounded-full after:bg-[#2f6fd41f] after:pointer-events-none">
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-1.5">
                  Next roadmap step
                </div>
                <h2 className="text-white/95 text-xl font-black leading-tight mb-1">
                  {nextActionData?.step.step_name || "Journey Complete!"}
                </h2>
                <p className="text-white/45 text-[12.5px] leading-relaxed mb-4 max-w-md">
                  {nextActionData?.step.step_description ||
                    "You have reached the end of the roadmap. All major verification steps are fulfilled."}
                </p>
                <button
                  onClick={() => {
                    if (plan.isLocked("roadmap_access")) {
                      setUpgradeModalFeature("roadmap_access");
                      return;
                    }
                    if (nextActionData) {
                      // Check if the next action step is locked for the user's tier
                      if (nextStepLock.isLocked) {
                        setUpgradeModalFeature(getModalFeatureForTier(nextStepLock.requiredPlan!));
                        return;
                      }

                      if (onSelectStep) {
                        onSelectStep(
                          nextActionData.chapterIdx,
                          nextActionData.stepIdxInChapter,
                        );
                      } else {
                        actions.setStage(nextActionData.chapterIdx);
                        actions.setCurrentStep(nextActionData.stepIdxInChapter);
                      }
                    }
                  }}
                  disabled={!nextActionData && !plan.isLocked("roadmap_access")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-[12px] font-bold text-[14px] shadow-lg shadow-primary/40 transition-all active:scale-95 group"
                >
                  Continue Roadmap
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                    strokeWidth={3}
                  />
                </button>
              </div>
            </section>

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
                    stage.scenarioSpecific === state.scenarioType,
                )
                .map(({ stage, originalIdx }) => {
                  const prog = getStageProgress(data, originalIdx, state);
                  const isLocked = !isStageUnlocked(data, originalIdx, state);
                  const isDone = prog.pct === 100;
                  const isActive = !isLocked && prog.pct > 0 && !isDone;
                  const useChapterPalette = originalIdx < 2;

                  const isDarkCard = isDone;

                  return (
                    <div
                      key={stage.chapter_key || stage.id}
                      onClick={() => !isLocked && onSelectChapter(originalIdx)}
                      className={`relative rounded-[20px] p-5 transition-all flex flex-col gap-3 min-h-[110px]
          shadow-[0_20px_64px_rgba(15,23,42,0.12),0_8px_32px_rgba(15,23,42,0.08)]
          outline outline-1 outline-[#e2e8f0]
          ${
            isLocked
              ? originalIdx === 0
                ? "bg-white opacity-50 cursor-default border-2 border-[#c6c8ea]"
                : originalIdx === 1
                  ? "bg-white opacity-50 cursor-default border-2 border-[#d5abd2]"
                  : originalIdx === 2
                    ? "bg-white opacity-50 cursor-default border-2 border-[#b7c2d4]"
                    : "bg-white opacity-50 cursor-default border-2 border-[#d0e4f7]"
              : isDone
              ? originalIdx === 0
                ? "bg-[#8284bf] border border-[#c6c8ea] cursor-pointer hover:brightness-110 hover:shadow-[0_10px_25px_rgba(130,132,191,0.18)]"
                : originalIdx === 1
                  ? "bg-[#520a50] border border-[#d5abd2] cursor-pointer hover:brightness-110 hover:shadow-[0_10px_25px_rgba(82,10,80,0.18)]"
                  : originalIdx === 2
                    ? "bg-[#051738] border border-[#b7c2d4] cursor-pointer hover:brightness-110 hover:shadow-[0_10px_25px_rgba(5,23,56,0.18)]"
                    : "bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#0f766e] border border-[#334155] cursor-pointer hover:brightness-110 hover:shadow-[0_10px_25px_rgba(76,29,149,0.18),0_4px_12px_rgba(15,118,110,0.12)]"
                : isActive
                  ? originalIdx === 0
                    ? "bg-[#f0f1fb] border-2 border-[#8284bf] cursor-pointer hover:-translate-y-[2px]"
                    : originalIdx === 1
                      ? "bg-[#f4e6f3] border-2 border-[#520a50] cursor-pointer hover:-translate-y-[2px]"
                      : originalIdx === 2
                        ? "bg-[#e8ecf3] border-2 border-[#051738] cursor-pointer hover:-translate-y-[2px]"
                        : "bg-primary/10 border-2 border-primary cursor-pointer hover:-translate-y-[2px]"
                  : originalIdx === 0
                    ? "bg-white border-2 border-[#c6c8ea] cursor-pointer hover:border-[#8284bf] hover:-translate-y-[2px]"
                    : originalIdx === 1
                      ? "bg-white border-2 border-[#d5abd2] cursor-pointer hover:border-[#520a50] hover:-translate-y-[2px]"
                      : originalIdx === 2
                        ? "bg-white border-2 border-[#b7c2d4] cursor-pointer hover:border-[#051738] hover:-translate-y-[2px]"
                        : "bg-white border-2 border-[#d0e4f7] cursor-pointer hover:border-[#b8d4f0] hover:-translate-y-[2px]"
          }`}
                    >
                      {/* Header */}
                      <div>
                        <div
                          className={`text-[9px] font-bold tracking-[0.1em] uppercase mb-1 ${
                            isDarkCard ? "text-[#cbd5f5]" : "text-[#64748b]"
                          }`}
                        >
                          Chapter {originalIdx + 1}
                        </div>

                        <h3
                          className={`text-[13px] font-bold leading-[1.3] ${
                            isDarkCard ? "text-white" : "text-[#0f172a]"
                          }`}
                        >
                          {(stage.chapter_name || stage.name).replace(
                            /^Stage\s[IVX]+:\s/,
                            "",
                          )}
                        </h3>
                      </div>

                      {/* Lock indicator */}
                      {!isLocked &&
                        (() => {
                          const steps = stage.steps || [];
                          const lockedCount = steps.filter((s: any) => {
                            const feat =
                              STEP_PRIMARY_FEATURE[s.step_key || s.id];
                            return feat && plan.isLocked(feat);
                          }).length;

                          if (lockedCount === 0) return null;

                          return (
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold w-fit ${
                                isDarkCard
                                  ? "bg-white/10 text-[#e0e7ff] border border-white/20"
                                  : useChapterPalette
                                    ? "bg-[#f4e6f3] text-[#520a50] border border-[#d5abd2]"
                                    : "bg-[#ede9fe] text-[#5b21b6] border border-[#c4b5fd]"
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
                            isDarkCard
                              ? "bg-[#1e293b]"
                              : useChapterPalette || originalIdx === 2
                                ? originalIdx === 0
                                  ? "bg-[#f0f1fb]"
                                  : originalIdx === 1
                                    ? "bg-[#f4e6f3]"
                                    : "bg-[#e8ecf3]"
                                : "bg-[#e2e8f0]"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDarkCard
                                ? originalIdx === 0
                                  ? "bg-[#8284bf]"
                                  : originalIdx === 1
                                    ? "bg-[#520a50]"
                                    : originalIdx === 2
                                      ? "bg-[#051738]"
                                      : "bg-gradient-to-r from-[#6366f1] to-[#14b8a6]"
                                : originalIdx === 0
                                  ? "bg-[#8284bf]"
                                  : originalIdx === 1
                                    ? "bg-[#520a50]"
                                    : originalIdx === 2
                                      ? "bg-[#051738]"
                                      : "bg-gradient-to-r from-primary to-primary/70"
                            }`}
                            style={{ width: `${prog.pct}%` }}
                          />
                        </div>

                        <div
                          className={`text-[10px] font-bold ${
                            isDarkCard ? "text-[#cbd5f5]" : "text-[#64748b]"
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
            <div className="bg-white border-2 border-gradient-to-br from-[#3a4a66] to-[#6aa8f0] rounded-3xl overflow-hidden shadow-[0_20px_64px_rgba(36,42,66,0.16),0_8px_32px_rgba(47,111,212,0.13)] outline outline-1 outline-[#22304a]">
              {/* Case Details */}
              <div className="border-t first:border-t-0 border-[#d0e4f7]">
                <div
                  onClick={() => toggleAccordion("case-details")}
                  className={`flex items-center p-[14px_18px] cursor-pointer hover:bg-[#eef3fa] transition-colors ${openAccordions["case-details"] ? "bg-[#eef3fa]/50" : ""}`}
                >
                  <span className="text-[12.5px] font-bold text-[#0c1b33]">
                    Case details
                  </span>
                  <span className="text-[11px] text-[#6b8097] ml-auto mr-2">
                    {caseFields.some((f) => f.value)
                      ? "Recorded"
                      : "Not recorded"}
                  </span>
                  <div
                    className={`transition-transform duration-200 ${openAccordions["case-details"] ? "rotate-180" : ""}`}
                  >
                    <ChevronDown
                      size={14}
                      strokeWidth={2.5}
                      className="text-[#6b8097]"
                    />
                  </div>
                </div>
                {openAccordions["case-details"] && (
                  <div className="px-[18px] pb-4 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col">
                      {caseFields.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center py-2 border-b border-[#d0e4f7]/50 last:border-0"
                        >
                          <span className="text-[12.5px] text-[#6b8097]">
                            {item.label}
                          </span>
                          <span
                            className={`text-[12.5px] font-medium ${!item.value ? "text-[#6b8097] italic" : "text-[#0c1b33]"}`}
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
              <div className="border-t border-[#d0e4f7]">
                <div
                  onClick={() => toggleAccordion("milestones")}
                  className={`flex items-center p-[14px_18px] cursor-pointer hover:bg-[#eef3fa] transition-colors ${openAccordions["milestones"] ? "bg-[#eef3fa]/50" : ""}`}
                >
                  <span className="text-[12.5px] font-bold text-[#0c1b33]">
                    Milestone history
                  </span>
                  <span className="text-[11px] text-[#6b8097] ml-auto mr-2">
                    {milestonesReached} of {milestones.length} reached
                  </span>
                  <div
                    className={`transition-transform duration-200 ${openAccordions["milestones"] ? "rotate-180" : ""}`}
                  >
                    <ChevronDown
                      size={14}
                      strokeWidth={2.5}
                      className="text-[#6b8097]"
                    />
                  </div>
                </div>
                {openAccordions["milestones"] && (
                  <div className="px-[18px] pb-4 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col gap-1.5 py-1">
                      {milestones.map((m, i) => {
                        // For milestones with both key and sid, consider either as completion
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
                              className={`flex items-center gap-3 py-2 px-2 rounded-xl border-b border-[#d0e4f7]/50 last:border-0 bg-white ${isDone ? "bg-[#e8f5ef]" : ""}`}
                            >
                              <div
                                className={`w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${isDone ? "bg-[#15744f] text-white border-[#15744f]" : "bg-[#f4f7fb] text-[#6b8097] border-[#d0e4f7]"}`}
                              >
                                {isDone ? "✓" : "•"}
                              </div>
                              <span
                                className="text-[12.5px] text-[#6b8097] font-medium"
                              >
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

          {/* Sidebar Column (Case Tracking) */}
          {showSidebar && (
            <div className="w-full lg:w-[360px] shrink-0 order-2 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[12px] font-black uppercase tracking-[0.1em] text-[#0c1b33]">
                  Live Case Tracking
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-[#6b8097]">
                    Linked to Embassy
                  </span>
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
                    actions.setStage(2);
                    actions.setCurrentStep(3);
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
                  actionUrl="/visa-category/ir-category/ir1-journey"
                />
              )}

              {/* Unified Alerts */}
              {alerts.length > 0 && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                  {alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 items-start p-3 rounded-[16px] border-2 border-gradient-to-br from-[#3a4a66] to-[#6aa8f0] shadow-[0_20px_64px_rgba(36,42,66,0.16),0_8px_32px_rgba(47,111,212,0.13)] outline outline-1 outline-[#22304a] ${alert.type === "gold" ? "bg-[#fffbeb] border-[#fde68a] text-[#b38600]" : alert.type === "sky" ? "bg-[#e3f0fa] border-[#6aa8f0] text-[#1e3a5c]" : alert.type === "amber" ? "bg-[#fef8e8] border-[#f0d98a] text-[#8a6200]" : "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === "gold" ? "bg-[#b38600]" : alert.type === "sky" ? "bg-primary" : alert.type === "amber" ? "bg-[#8a6200]" : "bg-[#15744f]"}`}
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
                  const dqDateStr =
                    trackingStatus.dq_date || state.metadata?.dqDate;
                  const currentSchedulingMonthYear = state.metadata
                    ?.currentSchedulingMonthYear as string | undefined;
                  const postLabel = (state.metadata?.post ||
                    state.metadata?.dqPost ||
                    "Embassy") as string;

                  if (!dqDateStr) {
                    return (
                      <div className="bg-[#0f1f38] rounded-[22px] border border-white/10 p-6 text-white mb-4">
                        <div className="flex items-center gap-4 text-slate-400">
                          <Clock size={20} />
                          <p className="text-[13px]">
                            Please record your DQ date in{" "}
                            <b>Chapter 2, Step 10</b> to see scheduling
                            estimates.
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
                  const dqLabel =
                    isDqDateInvalid
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
                      <div className="bg-[#0f1f38] rounded-[22px] border border-[#2f6fd4]/30 p-6 text-white mb-4 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="relative z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#d0e4f7] text-[10px] font-black uppercase tracking-[0.15em] text-[#6aa8f0] mb-4">
                            Interview Queue ({postLabel})
                          </div>
                          <h3 className="text-[18px] font-black mb-2">
                            In Queue — Awaiting Estimate
                          </h3>
                          <p className="text-[12.5px] text-slate-400 leading-relaxed mb-4 max-w-md">
                            Your DQ date is recorded. To see your estimated
                            interview window, go to <b>Chapter 2 → Step 11</b>{" "}
                            and sync the official embassy scheduling month.
                          </p>
                          <div className="bg-white rounded-xl p-3 border border-[#d0e4f7] flex items-center justify-between">
                            <span className="text-[12px] font-bold">
                              DQ Date:{" "}
                              {dqDateObj.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className={`text-[10px] font-black uppercase ${isDqDateInvalid ? "text-amber-400" : "text-[#34d399]"}`}>
                              {isDqDateInvalid ? "⚠ Date seems incorrect" : dqLabel.toUpperCase()}
                            </span>
                          </div>
                          {isDqDateInvalid && (
                            <p className="text-[11px] text-amber-400 mt-2">
                              DQ dates are in the past. Please go to <b>Chapter 2 → Step 10</b> and correct your DQ date.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Estimation Logic
                  const [ivY, ivM] = currentSchedulingMonthYear
                    .split("-")
                    .map(Number);
                  const ivDate = new Date(ivY, ivM - 1, 1);
                  const waitMonths = Math.max(
                    0,
                    (dqDateObj.getFullYear() - ivDate.getFullYear()) * 12 +
                      (dqDateObj.getMonth() - ivDate.getMonth()),
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
                    <div className="bg-[#0f1f38] rounded-[24px] border border-[#2f6fd4]/30 shadow-2xl p-6 text-white mb-6 relative overflow-hidden animate-in zoom-in-95 duration-500">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                      <div className="flex flex-col gap-4 mb-6 border-b border-white/10 pb-4">
                        <div>
                          <h3 className="text-[20px] font-black leading-tight">
                            In Interview Queue ({postLabel})
                          </h3>
                          <p className="text-slate-400 text-[12px] mt-1">
                            Estimated timeline based on your DQ date and the
                            official IV Status Tool.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="bg-white rounded-2xl p-4 border border-[#d0e4f7]">
                          <div className="text-[10px] uppercase tracking-widest text-[#6b8097] mb-2 font-black">
                            Your DQ Date
                          </div>
                          <div className="text-[18px] font-bold">
                            {dqDateObj.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[11px] text-[#34d399] mt-1 font-bold uppercase">
                            {dqLabel}
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-[#d0e4f7] flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#6b8097] mb-1 font-black leading-tight">
                              Embassy is currently scheduling cases DQ'd in
                            </div>
                            <div className="text-[18px] font-bold text-[#6aa8f0] mt-1">
                              {embassyMonthStr}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html",
                                "_blank",
                              )
                            }
                            className="mt-3 text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-1 transition-colors group"
                          >
                            Check Latest Official Tool{" "}
                            <ExternalLink
                              size={10}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </button>
                        </div>
                        <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                          <div className="text-[10px] uppercase tracking-widest text-amber-500/80 mb-2 font-black">
                            Estimated Interview Window
                          </div>
                          <div className="text-[20px] font-black text-amber-400">
                            {windowStr}
                          </div>
                          <div className="text-[10px] text-amber-500/60 mt-1 font-medium">
                            Subject to visa availability
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-[#d0e4f7] rounded-2xl p-4 relative">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                            <Shield className="text-primary" size={16} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black mb-1">
                              Status Intelligence
                            </h4>
                            <p className="text-[12.5px] text-slate-300 leading-relaxed">
                              The embassy is currently scheduling cases that
                              became DQ'd in <b>{embassyMonthStr}</b>. Your case
                              became DQ'd in{" "}
                              <b>
                                {dqDateObj.toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </b>
                              , which means you are{" "}
                              <b>approximately {waitMonths} months</b> behind
                              the current processing group.
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
      </div>
    </div>
  );
}
