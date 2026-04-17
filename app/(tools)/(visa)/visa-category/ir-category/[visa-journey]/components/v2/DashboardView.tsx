"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  getNextBestAction,
  getStageProgress,
  isStageUnlocked,
} from "./journeyHelpers";
import WaitingStateCard from "./WaitingStateCard";

interface DashboardViewProps {
  data: RoadmapData;
  state: WizardState;
  onSelectChapter: (idx: number) => void;
  onSelectStep?: (cIdx: number, sIdx: number) => void;
  actions: {
    setCurrentStep: (idx: number) => void;
    setStage: (idx: number) => void;
  };
}

export function DashboardView({
  data,
  state,
  onSelectChapter,
  onSelectStep,
  actions,
}: DashboardViewProps) {
  const nextActionData = useMemo(
    () => getNextBestAction(data, state),
    [data, state],
  );
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {
      "case-details": true,
    },
  );

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const alerts = useMemo(() => {
    const list: {
      type: "gold" | "sky" | "amber" | "green";
      iconColor: string;
      title: string;
      text: string;
    }[] = [];
    const meta = state.metadata || {};
    const done = state.answers || {};
    const trackingStatus = (state.metadata?.tracking_status as any) || {};

    // Admin tracking-based alerts
    if (trackingStatus.interview_date) {
      list.push({
        type: "gold",
        iconColor: "d-gold",
        title: "Interview scheduled",
        text: `${trackingStatus.interview_date} ${trackingStatus.interview_embassy ? `· ${trackingStatus.interview_embassy}` : ""}`,
      });
    }

    if (
      trackingStatus.dq_status === "qualified" &&
      !trackingStatus.interview_date
    ) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "In scheduling queue",
        text: `DQ date: ${trackingStatus.dq_date || "N/A"}. Monitor CEAC for your interview appointment.`,
      });
    }

    if (trackingStatus.ap_status === "pending") {
      list.push({
        type: "amber",
        iconColor: "d-amber",
        title: "Administrative Processing",
        text: "Your case is under additional review. This is normal and can take several weeks.",
      });
    }

    // Legacy metadata-based alerts
    if (meta.interviewDate && !trackingStatus.interview_date) {
      list.push({
        type: "gold",
        iconColor: "d-gold",
        title: "Interview scheduled",
        text: `${meta.interviewDate} ${meta.interviewEmbassy ? `· ${meta.interviewEmbassy}` : ""}`,
      });
    }

    if (
      meta.dqDate &&
      !meta.interviewDate &&
      trackingStatus.dq_status !== "qualified"
    ) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "In scheduling queue",
        text: `DQ date: ${meta.dqDate}. Monitor CEAC for your interview appointment.`,
      });
    }

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

    return list;
  }, [state]);

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
  ];

  const milestonesReached = milestones.filter((m) => {
    // For milestones with both key and sid, consider either as completion
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
      // Check completedSteps, answers, and metadata for sid-based milestones
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

  // Securely fetch and display NVC case number and invoice ID from the API
  const [nvcCaseNum, setNvcCaseNum] = useState<string | undefined>(undefined);
  const [nvcInvoice, setNvcInvoice] = useState<string | undefined>(undefined);
  const [nvcLoading, setNvcLoading] = useState(true);
  const [nvcError, setNvcError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNvcLoading(true);
    setNvcError(null);
    async function fetchNvcFields() {
      // Fallback to 'NVC' if portalType is missing
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
          setNvcError(null);
        } else if (!cancelled) {
          setNvcCaseNum(undefined);
          setNvcInvoice(undefined);
          setNvcError("No details found");
        }
      } catch {
        if (!cancelled) {
          setNvcCaseNum(undefined);
          setNvcInvoice(undefined);
          setNvcError("Failed to fetch NVC fields");
        }
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
      value: nvcLoading
        ? "Loading..."
        : nvcError
          ? `Error: ${nvcError}`
          : nvcCaseNum,
    },
    {
      label: "NVC invoice ID",
      value: nvcLoading
        ? "Loading..."
        : nvcError
          ? `Error: ${nvcError}`
          : nvcInvoice,
    },
    { label: "DQ date", value: state.metadata.dqDate },
    { label: "Interview date", value: state.metadata.interviewDate },
    { label: "Embassy", value: state.metadata.interviewEmbassy },
    { label: "Medical date", value: state.metadata.medicalDate },
  ];

  return (
    <div className="flex-1 overflow-y-auto py-9 px-6 pb-20 scrollbar-hide bg-[#f4f7fb]">
      <div className="w-full max-w-[780px] mx-auto animate-in fade-in duration-700">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
          IR-1 Spouse Visa · Pakistan
        </div>
        <h1 className="font-black text-[clamp(22px,3vw,28px)] text-[#0c1b33] mb-6">
          Case Dashboard
        </h1>
        {/* Tracking Status & Hero Section */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Admin Tracking Status Cards (PROMINENT) */}
          {(() => {
            const trackingStatus =
              (state.metadata?.tracking_status as any) || {};
            const hasTrackingData = Object.keys(trackingStatus).length > 0;
            const isCaseRegistered = !!state.metadata?.nvcCaseNum;

            if (!hasTrackingData && !isCaseRegistered) return null;

            // Identify all active tracking cards
            const trackingCards = [
              // Order: Most advanced to least advanced
              trackingStatus.ap_status === "pending" && (
                <WaitingStateCard
                  key="ap"
                  icon="alert"
                  title="Administrative Processing"
                  description="Your case is under additional administrative review. This is normal and can take several weeks."
                  date={trackingStatus.ap_date}
                  status="waiting"
                  actionLabel="Check CEAC Status"
                  actionUrl="https://ceac.state.gov/CEAC/"
                />
              ),
              trackingStatus.interview_date && (
                <WaitingStateCard
                  key="interview-scheduled"
                  icon="calendar"
                  title="Interview Scheduled"
                  description={`Your visa interview is scheduled. Please prepare all required documents and attend on time.`}
                  date={`${trackingStatus.interview_date} ${trackingStatus.interview_time ? `at ${trackingStatus.interview_time}` : ""}`}
                  status="complete"
                  actionLabel="Interview Prep Guide"
                  onAction={() => {
                    actions.setStage(2);
                    actions.setCurrentStep(3);
                  }}
                />
              ),
              trackingStatus.interview_queue &&
                !trackingStatus.interview_date && (
                  <WaitingStateCard
                    key="interview-queue"
                    icon="clock"
                    title="In Interview Queue"
                    description="Your case is in the scheduling queue at the embassy. Interview dates will be assigned based on visa bulletin and wait times."
                    status="waiting"
                    showIVToolLink
                    ivEmbassy={trackingStatus.interview_embassy}
                  />
                ),
              trackingStatus.dq_status === "qualified" && (
                <>
                  <WaitingStateCard
                    key="dq"
                    icon="check"
                    title="Documentarily Qualified!"
                    description="NVC has completed their review. Your case is now in the interview scheduling queue."
                    date={trackingStatus.dq_date}
                    status="complete"
                    actionLabel="Check IV Wait Times"
                    onAction={() => {
                      if (trackingStatus.interview_embassy) {
                        window.open(
                          `/iv-tool?city=${trackingStatus.interview_embassy}`,
                          "_blank",
                        );
                      }
                    }}
                  />
                  <WaitingStateCard
                    key="dq1"
                    icon="check"
                    title="Documentarily Qualified!"
                    description="NVC has completed their review. Your case is now in the interview scheduling queue."
                    date={trackingStatus.dq_date}
                    status="complete"
                    actionLabel="Check IV Wait Times"
                    onAction={() => {
                      if (trackingStatus.interview_embassy) {
                        window.open(
                          `/iv-tool?city=${trackingStatus.interview_embassy}`,
                          "_blank",
                        );
                      }
                    }}
                  />
                  <WaitingStateCard
                    key="dq2"
                    icon="check"
                    title="Documentarily Qualified!"
                    description="NVC has completed their review. Your case is now in the interview scheduling queue."
                    date={trackingStatus.dq_date}
                    status="complete"
                    actionLabel="Check IV Wait Times"
                    onAction={() => {
                      if (trackingStatus.interview_embassy) {
                        window.open(
                          `/iv-tool?city=${trackingStatus.interview_embassy}`,
                          "_blank",
                        );
                      }
                    }}
                  />
                </>
              ),
              trackingStatus.nvc_review_complete && (
                <WaitingStateCard
                  key="nvc"
                  icon="check"
                  title="NVC Document Review Complete"
                  description="NVC has reviewed your documents. Your case is being processed for Documentarily Qualified status."
                  date={trackingStatus.nvc_review_date}
                  status="complete"
                />
              ),
              !hasTrackingData && isCaseRegistered && (
                <WaitingStateCard
                  key="review"
                  icon="clock"
                  title="Case Registered & Under Review"
                  description="Your NVC identifiers have been recorded. Our admin team will verify your case status at the embassy/NVC shortly. Check back for updates."
                  status="waiting"
                />
              ),
            ].filter(Boolean) as React.ReactElement[];

            return (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
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

                {/* Bento Box Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {trackingCards.map((card, idx) => {
                    // First (most advanced) card takes 2 columns, others take 1
                    const gridClass =
                      idx === 0 && trackingCards.length > 1
                        ? "md:col-span-2"
                        : "md:col-span-1";

                    // If only one card, let it take full width
                    const finalGridClass =
                      trackingCards.length === 1 ? "md:col-span-3" : gridClass;

                    return React.cloneElement(card, {
                      className: `${card.props.className || ""} ${finalGridClass}`,
                    });
                  })}
                </div>
              </div>
            );
          })()}

          {/* Hero Section */}
          <section className="bg-[#0c1b33] rounded-2xl p-[22px_26px] relative overflow-hidden animate-in zoom-in duration-500 after:content-[''] after:absolute after:-top-[50px] after:-right-[50px] after:w-[180px] after:h-[180px] after:rounded-full after:bg-[#2f6fd41f] after:pointer-events-none">
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
                  if (nextActionData) {
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
                disabled={!nextActionData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-[10px] font-bold text-[13px] shadow-lg shadow-primary/40 transition-all active:scale-95 group"
              >
                Continue Roadmap
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                  strokeWidth={3}
                />
              </button>
            </div>
          </section>
        </div>

        {/* Dynamic Alerts (Secondary Info) */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-2 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            {alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={`flex gap-2.5 items-start p-3 rounded-[7px] border shadow-xs ${
                  alert.type === "gold"
                    ? "bg-[#fffbeb] border-[#fde68a] text-[#b38600]"
                    : alert.type === "sky"
                      ? "bg-primary/5 border-[#d0e4f7] text-primary"
                      : alert.type === "amber"
                        ? "bg-[#fef8e8] border-[#f0d98a] text-[#8a6200]"
                        : "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    alert.type === "gold"
                      ? "bg-[#b38600]"
                      : alert.type === "sky"
                        ? "bg-primary"
                        : alert.type === "amber"
                          ? "bg-[#8a6200]"
                          : "bg-[#15744f]"
                  }`}
                />
                <div className="text-[12px] leading-relaxed">
                  <span className="font-bold">{alert.title}: </span>
                  <span className="opacity-80">{alert.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chapter Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
          {(data.chapters || (data as any).stages || [])
            .map((stage: any, originalIdx: number) => ({ stage, originalIdx }))
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

              return (
                <div
                  key={stage.chapter_key || stage.id}
                  onClick={() => !isLocked && onSelectChapter(originalIdx)}
                  className={`bg-white border-[1.5px] rounded-[10px] p-[12px_16px] transition-all flex flex-col ${
                    isLocked
                      ? "opacity-50 cursor-default border-[#d0e4f7]"
                      : isDone
                        ? "border-[#a8d9be] cursor-pointer hover:border-[#b8d4f0] hover:shadow-sm"
                        : isActive
                          ? "border-primary bg-primary/8 cursor-pointer"
                          : "border-[#d0e4f7] cursor-pointer hover:border-[#b8d4f0] hover:shadow-sm"
                  }`}
                >
                  <div className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#6b8097] mb-1.25">
                    Chapter {originalIdx + 1}
                  </div>
                  <h3 className="text-[12.5px] font-semibold text-[#0c1b33] leading-[1.3] mb-2">
                    {(stage.chapter_name || stage.name).replace(
                      /^Stage\s[IVX]+:\s/,
                      "",
                    )}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-auto">
                    <div className="flex-1 h-1 bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                      <div
                        className="h-full rounded-[10px] transition-all duration-500 bg-gradient-to-r from-primary to-primary/70"
                        style={{ width: `${prog.pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-bold text-[#6b8097] whitespace-nowrap">
                      {prog.done}/{prog.total}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Accordions */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-2xl mb-2.5 overflow-hidden">
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
                {caseFields.some((f) => f.value) ? "Recorded" : "Not recorded"}
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
                        className="flex items-center gap-2.5 py-1.5 border-b border-[#d0e4f7]/50 last:border-0"
                      >
                        <div
                          className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold ${
                            isDone
                              ? "bg-[#15744f] text-white"
                              : "bg-[#d0e4f7] text-[#6b8097]"
                          }`}
                        >
                          {isDone ? "✓" : "•"}
                        </div>
                        <span
                          className={`text-[12.5px] font-medium ${isDone ? "text-[#1c2b3a]" : "text-[#6b8097]"}`}
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
    </div>
  );
}
