"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronDown, ArrowRight, ExternalLink, Clock, Shield, AlertTriangle } from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  getNextBestAction,
  getStageProgress,
  isStageUnlocked,
} from "./journeyHelpers";
import APTrackingTool from "./APTrackingTool";

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

export function DashboardView({
  data,
  state,
  onSelectChapter,
  onSelectStep,
  actions,
}: DashboardViewProps) {
  const trackingStatus = useMemo(
    () => (state.metadata?.tracking_status as any) || {},
    [state.metadata?.tracking_status],
  );
  const hasTrackingData = useMemo(
    () => Object.keys(trackingStatus).length > 0,
    [trackingStatus],
  );
  const isCaseRegistered = !!state.metadata?.nvcCaseNum;

  const nextActionData = useMemo(
    () => getNextBestAction(data, state),
    [data, state],
  );
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {
      "case-details": true,
      "milestones": false,
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
      action?: { label: string; url?: string; onAction?: () => void };
    }[] = [];
    const meta = state.metadata || {};
    const done = state.answers || {};
    const trackingStatus = (state.metadata?.tracking_status as any) || {};
    const isCaseRegistered = !!state.metadata?.nvcCaseNum;
    const hasTrackingData = Object.keys(trackingStatus).length > 0;

    // Admin tracking-based alerts
    if (trackingStatus.ap_status === "pending") {
      list.push({
        type: "amber",
        iconColor: "d-amber",
        title: "Administrative Processing",
        text: "Your case is under additional review. This is normal and can take several weeks.",
        action: {
          label: "Check CEAC Status",
          url: "https://ceac.state.gov/CEAC/",
        },
      });
    }

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

    if (
      trackingStatus.dq_status === "qualified" &&
      !trackingStatus.interview_date
    ) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "In scheduling queue",
        text: `NVC has completed their review. Your case is now in the interview scheduling queue. (DQ date: ${trackingStatus.dq_date || "N/A"})`,
        action: {
          label: "Check IV Wait Times",
          onAction: () => {
            if (trackingStatus.interview_embassy) {
              window.open(
                `/iv-tool?city=${trackingStatus.interview_embassy}`,
                "_blank",
              );
            }
          },
        },
      });
    }

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

    if (
      meta.dqDate &&
      !meta.interviewDate &&
      trackingStatus.dq_status !== "qualified" &&
      !list.some((a) => a.title === "In scheduling queue")
    ) {
      list.push({
        type: "sky",
        iconColor: "d-sky",
        title: "In scheduling queue (Manual)",
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

    return list;
  }, [state, actions]);

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
    return () => { cancelled = true; };
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
    <div className="flex-1 overflow-y-auto py-9 px-6 pb-20 scrollbar-hide bg-[#f4f7fb]">
      <div className="w-full max-w-[1200px] mx-auto animate-in fade-in duration-700">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
          IR-1 Spouse Visa · Pakistan
        </div>
        <h1 className="font-black text-[clamp(22px,3vw,28px)] text-[#0c1b33] mb-8">
          Case Dashboard
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Content Column */}
          <div className="flex-1 flex flex-col gap-6 order-1">
            <section className="bg-[#0c1b33] rounded-2xl p-[28px_32px] relative overflow-hidden animate-in zoom-in duration-500 after:content-[''] after:absolute after:-top-[50px] after:-right-[50px] after:w-[180px] after:h-[180px] after:rounded-full after:bg-[#2f6fd41f] after:pointer-events-none">
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-1.5">
                  Next roadmap step
                </div>
                <h2 className="text-white/95 text-xl font-black leading-tight mb-2">
                  {nextActionData?.step.step_name || "Journey Complete!"}
                </h2>
                <p className="text-white/45 text-[13px] leading-relaxed mb-6 max-w-md">
                  {nextActionData?.step.step_description ||
                    "You have reached the end of the roadmap. All major verification steps are fulfilled."}
                </p>
                <button
                  onClick={() => {
                    if (nextActionData) {
                      if (onSelectStep) {
                        onSelectStep(nextActionData.chapterIdx, nextActionData.stepIdxInChapter);
                      } else {
                        actions.setStage(nextActionData.chapterIdx);
                        actions.setCurrentStep(nextActionData.stepIdxInChapter);
                      }
                    }
                  }}
                  disabled={!nextActionData}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-[12px] font-bold text-[14px] shadow-lg shadow-primary/40 transition-all active:scale-95 group"
                >
                  Continue Roadmap
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(data.chapters || (data as any).stages || [])
                .map((stage: any, originalIdx: number) => ({ stage, originalIdx }))
                .filter(({ stage }) => !state.scenarioType || !stage.scenarioSpecific || stage.scenarioSpecific === state.scenarioType)
                .map(({ stage, originalIdx }) => {
                  const prog = getStageProgress(data, originalIdx, state);
                  const isLocked = !isStageUnlocked(data, originalIdx, state);
                  const isDone = prog.pct === 100;
                  const isActive = !isLocked && prog.pct > 0 && !isDone;

                  return (
                    <div
                      key={stage.chapter_key || stage.id}
                      onClick={() => !isLocked && onSelectChapter(originalIdx)}
                      className={`bg-white border-[1.5px] rounded-[14px] p-4 transition-all flex flex-col gap-3 min-h-[110px] ${
                        isLocked ? "opacity-50 cursor-default border-[#d0e4f7]" : 
                        isDone ? "border-[#a8d9be] cursor-pointer hover:border-[#b8d4f0] hover:shadow-sm" : 
                        isActive ? "border-primary bg-primary/8 cursor-pointer" : "border-[#d0e4f7] cursor-pointer hover:border-[#b8d4f0] hover:shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#6b8097] mb-1">Chapter {originalIdx + 1}</div>
                        <h3 className="text-[13px] font-bold text-[#0c1b33] leading-[1.3]">
                          {(stage.chapter_name || stage.name).replace(/^Stage\s[IVX]+:\s/, "")}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <div className="flex-1 h-1.5 bg-[#d0e4f7] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-primary/70" style={{ width: `${prog.pct}%` }} />
                        </div>
                        <div className="text-[10px] font-bold text-[#6b8097]">{prog.done}/{prog.total}</div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[20px] overflow-hidden">
              {/* Case Details Accordion */}
              <div className="border-t first:border-t-0 border-[#d0e4f7]">
                <div onClick={() => toggleAccordion("case-details")} className={`flex items-center p-4 cursor-pointer hover:bg-[#eef3fa] transition-colors ${openAccordions["case-details"] ? "bg-[#eef3fa]/50" : ""}`}>
                  <span className="text-[13px] font-bold text-[#0c1b33]">Case details</span>
                  <span className="text-[11px] text-[#6b8097] ml-auto mr-2">{caseFields.some((f) => f.value) ? "Recorded" : "Not recorded"}</span>
                  <div className={`transition-transform duration-200 ${openAccordions["case-details"] ? "rotate-180" : ""}`}><ChevronDown size={14} strokeWidth={2.5} className="text-[#6b8097]" /></div>
                </div>
                {openAccordions["case-details"] && (
                  <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col">
                      {caseFields.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#d0e4f7]/50 last:border-0">
                          <span className="text-[12.5px] text-[#6b8097]">{item.label}</span>
                          <span className={`text-[12.5px] font-medium ${!item.value ? "text-[#6b8097] italic" : "text-[#0c1b33]"}`}>{item.value || "Not recorded"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone History Accordion */}
              <div className="border-t border-[#d0e4f7]">
                <div onClick={() => toggleAccordion("milestones")} className={`flex items-center p-4 cursor-pointer hover:bg-[#eef3fa] transition-colors ${openAccordions["milestones"] ? "bg-[#eef3fa]/50" : ""}`}>
                  <span className="text-[13px] font-bold text-[#0c1b33]">Milestone history</span>
                  <span className="text-[11px] text-[#6b8097] ml-auto mr-2">{milestonesReached} of {milestones.length} reached</span>
                  <div className={`transition-transform duration-200 ${openAccordions["milestones"] ? "rotate-180" : ""}`}><ChevronDown size={14} strokeWidth={2.5} className="text-[#6b8097]" /></div>
                </div>
                {openAccordions["milestones"] && (
                  <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col gap-1 py-1">
                      {milestones.map((m, i) => {
                        const isDone = m.key && m.sid ? (state.metadata && state.metadata[m.key]) || (state.completedSteps?.has?.(m.sid)) : 
                                       m.key ? !!(state.metadata && state.metadata[m.key]) : 
                                       (state.completedSteps?.has?.(m.sid!)) || (state.answers && state.answers[m.sid!]) || (state.metadata && state.metadata[m.sid!]);
                        return (
                          <div key={i} className="flex items-center gap-3 py-2 border-b border-[#d0e4f7]/50 last:border-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? "bg-[#15744f] text-white" : "bg-[#d0e4f7] text-[#6b8097]"}`}>
                              {isDone ? "✓" : "•"}
                            </div>
                            <span className={`text-[12.5px] font-medium ${isDone ? "text-[#1c2b3a]" : "text-[#6b8097]"}`}>{m.label}</span>
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
          <div className="w-full lg:w-[360px] shrink-0 order-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[12px] font-black uppercase tracking-[0.1em] text-[#0c1b33]">Live Case Tracking</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[#6b8097]">Linked to Embassy</span>
              </div>
            </div>

            {/* Unified Alerts */}
            {alerts.length > 0 && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                {alerts.map((alert, i) => (
                  <div key={i} className={`flex gap-2.5 items-start p-3 rounded-[10px] border shadow-xs ${alert.type === "gold" ? "bg-[#fffbeb] border-[#fde68a] text-[#b38600]" : alert.type === "sky" ? "bg-primary/5 border-[#d0e4f7] text-primary" : alert.type === "amber" ? "bg-[#fef8e8] border-[#f0d98a] text-[#8a6200]" : "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === "gold" ? "bg-[#b38600]" : alert.type === "sky" ? "bg-primary" : alert.type === "amber" ? "bg-[#8a6200]" : "bg-[#15744f]"}`} />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="text-[12px] leading-relaxed"><span className="font-bold">{alert.title}: </span><span className="opacity-80">{alert.text}</span></div>
                      {alert.action && (
                        <div className="flex gap-2">
                          {alert.action.url ? (
                            <a href={alert.action.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 underline">{alert.action.label}</a>
                          ) : (
                            <button onClick={alert.action.onAction} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 underline text-left">{alert.action.label}</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Scheduling Tracker - Professional Redesign */}
            {((trackingStatus.dq_status === "qualified") || (state.metadata?.dqStatus === "qualified") || (state.metadata?.nvc_review_outcome === "qualified")) && !trackingStatus.interview_date && (() => {
              const dqDateStr = trackingStatus.dq_date || state.metadata?.dqDate;
              const currentSchedulingMonthYear = state.metadata?.currentSchedulingMonthYear as string | undefined;
              const postLabel = (state.metadata?.post || state.metadata?.dqPost || "Embassy") as string;

              if (!dqDateStr) {
                return (
                  <div className="bg-[#0f1f38] rounded-[22px] border border-white/10 p-6 text-white mb-4">
                    <div className="flex items-center gap-4 text-slate-400">
                      <Clock size={20} />
                      <p className="text-[13px]">Please record your DQ date in <b>Chapter 2, Step 10</b> to see scheduling estimates.</p>
                    </div>
                  </div>
                );
              }

              const dqDateObj = new Date(dqDateStr + "T00:00:00");
              const diffTime = new Date().getTime() - dqDateObj.getTime();
              const daysSinceDq = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

              if (!currentSchedulingMonthYear) {
                return (
                  <div className="bg-[#0f1f38] rounded-[22px] border border-[#2f6fd4]/30 p-6 text-white mb-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] text-[#6aa8f0] mb-4">Interview Queue ({postLabel})</div>
                      <h3 className="text-[18px] font-black mb-2">In Queue — Awaiting Estimate</h3>
                      <p className="text-[12.5px] text-slate-400 leading-relaxed mb-4 max-w-md">Your DQ date is recorded. To see your estimated interview window, go to <b>Chapter 2 → Step 11</b> and sync the official embassy scheduling month.</p>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                        <span className="text-[12px] font-bold">DQ Date: {dqDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span className="text-[10px] text-[#34d399] font-black uppercase">{daysSinceDq} DAYS AGO</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Estimation Logic
              const [ivY, ivM] = currentSchedulingMonthYear.split("-").map(Number);
              const ivDate = new Date(ivY, ivM - 1, 1);
              const waitMonths = Math.max(0, (dqDateObj.getFullYear() - ivDate.getFullYear()) * 12 + (dqDateObj.getMonth() - ivDate.getMonth()));
              const lowDate = new Date(); lowDate.setMonth(lowDate.getMonth() + waitMonths);
              const highDate = new Date(lowDate); highDate.setMonth(highDate.getMonth() + 2);
              const fmt = { month: 'short', year: 'numeric' } as const;
              const windowStr = waitMonths === 0 ? "Approaching Soon" : `${lowDate.toLocaleDateString('en-US', fmt)} – ${highDate.toLocaleDateString('en-US', fmt)}`;
              const embassyMonthStr = ivDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

              return (
                <div className="bg-[#0f1f38] rounded-[24px] border border-[#2f6fd4]/30 shadow-2xl p-6 text-white mb-6 relative overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="flex flex-col gap-4 mb-6 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-[20px] font-black leading-tight">In Interview Queue ({postLabel})</h3>
                      <p className="text-slate-400 text-[12px] mt-1">Estimated timeline based on your DQ date and the official IV Status Tool.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="text-[10px] uppercase tracking-widest text-[#6b8097] mb-2 font-black">Your DQ Date</div>
                      <div className="text-[18px] font-bold">{dqDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      <div className="text-[11px] text-[#34d399] mt-1 font-bold uppercase">{daysSinceDq} Days Ago</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#6b8097] mb-1 font-black leading-tight">Embassy is currently scheduling cases DQ'd in</div>
                        <div className="text-[18px] font-bold text-[#6aa8f0] mt-1">{embassyMonthStr}</div>
                      </div>
                      <button onClick={() => window.open("https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html", "_blank")} className="mt-3 text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-1 transition-colors group">
                        Check Latest Official Tool <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                    <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                      <div className="text-[10px] uppercase tracking-widest text-amber-500/80 mb-2 font-black">Estimated Interview Window</div>
                      <div className="text-[20px] font-black text-amber-400">{windowStr}</div>
                      <div className="text-[10px] text-amber-500/60 mt-1 font-medium">Subject to visa availability</div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20"><Shield className="text-primary" size={16} /></div>
                      <div>
                        <h4 className="text-[13px] font-black mb-1">Status Intelligence</h4>
                        <p className="text-[12.5px] text-slate-300 leading-relaxed">The embassy is currently scheduling cases that became DQ'd in <b>{embassyMonthStr}</b>. Your case became DQ'd in <b>{dqDateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</b>, which means you are <b>approximately {waitMonths} months</b> behind the current processing group.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AP Tracking Tool */}
            {(() => {
              const hasStartedAp = state.completedSteps?.has("c3s8") || state.completedSteps?.has("step_3_8") || trackingStatus.ap_status === "pending" || !!(state.metadata?.apStartDate);
              if (!hasStartedAp) return null;
              return <APTrackingTool state={state} />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
