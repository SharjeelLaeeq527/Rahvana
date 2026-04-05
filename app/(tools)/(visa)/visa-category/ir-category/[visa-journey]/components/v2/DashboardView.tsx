"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { RoadmapData } from "../types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getNextBestAction, getStageProgress, isStageUnlocked } from "./journeyHelpers";

interface DashboardViewProps {
  data: RoadmapData;
  state: WizardState;
  onSelectChapter: (idx: number) => void;
  actions: {
    setCurrentStep: (idx: number) => void;
  };
}

export function DashboardView({
  data,
  state,
  onSelectChapter,
  actions,
}: DashboardViewProps) {
  const nextActionData = useMemo(
    () => getNextBestAction(data, state),
    [data, state],
  );
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "case-details": true,
  });

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

    if (meta.interviewDate) {
      list.push({
        type: "gold",
        iconColor: "d-gold",
        title: "Interview scheduled",
        text: `${meta.interviewDate} ${meta.interviewEmbassy ? `· ${meta.interviewEmbassy}` : ""}`,
      });
    }

    if (meta.dqDate && !meta.interviewDate) {
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
    { label: "Eligibility confirmed", sid: "c1s1" },
    { label: "Documents gathered", sid: "c1s2" },
    { label: "Filing method selected", key: "filingMethod" },
    { label: "I-130 submitted to USCIS", key: "receiptNum" },
    { label: "NVC fees paid", sid: "c2s3" },
    { label: "DS-260 submitted", sid: "c2s4" },
    { label: "Documents submitted to NVC", sid: "c2s5" },
    { label: "Documentarily Qualified", key: "dqDate" },
    { label: "Medical exam scheduled", key: "medicalDate" },
    { label: "Interview scheduled", key: "interviewDate" },
    { label: "Medical exam attended", sid: "c3s5" },
    { label: "Visa interview attended", sid: "c3s6" },
  ];

  const milestonesReached = milestones.filter((m) => {
    if (m.key) return !!(state.metadata && state.metadata[m.key]);
    if (m.sid) return !!(state.answers && state.answers[m.sid]);
    return false;
  }).length;

  const caseFields = [
    { label: "Filing method", value: state.metadata.filingMethod },
    { label: "Receipt number", value: state.metadata.receiptNum },
    { label: "NVC case number", value: state.metadata.nvcCaseNum },
    { label: "NVC invoice ID", value: state.metadata.nvcInvoice },
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
        <h1 className="font-serif text-[clamp(22px,3vw,28px)] text-[#0c1b33] mb-6">Case Dashboard</h1>

        {/* Hero Section */}
        <section className="bg-[#0c1b33] rounded-2xl p-[22px_26px] mb-3 relative overflow-hidden animate-in zoom-in duration-500 after:content-[''] after:absolute after:-top-[50px] after:-right-[50px] after:w-[180px] after:h-[180px] after:rounded-full after:bg-primary/12 after:pointer-events-none">
          <div className="relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Next best action
            </div>
            <h2 className="text-white/95 text-xl font-serif leading-tight mb-1">
              {nextActionData?.step.name || "Journey Complete!"}
            </h2>
            <p className="text-white/45 text-[12.5px] leading-relaxed mb-4 max-w-md">
              {nextActionData?.step.description || "You have reached the end of the roadmap. All major verification steps are fulfilled."}
            </p>
            <button
              onClick={() => nextActionData && actions.setCurrentStep(nextActionData.stepIdxInStage)}
              disabled={!nextActionData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-[10px] font-bold text-[13px] shadow-lg shadow-primary/40 transition-all active:scale-95 group"
            >
              Continue
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            </button>
          </div>
        </section>

        {/* Dynamic Alerts */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-2 mb-3 animate-in fade-in slide-in-from-top-2 duration-500">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex gap-2.5 items-start p-3 rounded-[7px] border ${
                  alert.type === "gold"
                    ? "bg-[#fffbeb] border-[#fde68a] text-[#b38600]"
                    : alert.type === "sky"
                      ? "bg-primary/5 border-[#d0e4f7] text-primary"
                      : alert.type === "amber"
                        ? "bg-[#fef8e8] border-[#f0d98a] text-[#8a6200]"
                        : "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  alert.type === "gold" ? "bg-[#b38600]" : alert.type === "sky" ? "bg-primary" : alert.type === "amber" ? "bg-[#8a6200]" : "bg-[#15744f]"
                }`} />
                <div className="text-[12.5px] leading-relaxed">
                  <strong className="font-bold block">{alert.title}</strong>
                  <span className="opacity-80">{alert.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chapter Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
          {data.stages
            .map((stage, originalIdx) => ({ stage, originalIdx }))
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
                  key={stage.id}
                  onClick={() => !isLocked && onSelectChapter(originalIdx)}
                  className={`bg-white border-[1.5px] rounded-[10px] p-[14px_16px] transition-all flex flex-col ${
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
                  <h3 className="text-[12.5px] font-bold text-[#0c1b33] leading-[1.3] mb-2">
                    {stage.name.replace(/^Stage\s[IVX]+:\s/, "")}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-auto">
                    <div className="flex-1 h-1 bg-[#d0e4f7] rounded-[10px] overflow-hidden">
                      <div
                        className="h-full rounded-[10px] transition-all duration-500 bg-gradient-to-r from-primary to-[#6aa8f0]"
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
              <span className="text-[12.5px] font-bold text-[#0c1b33]">Case details</span>
              <span className="text-[11px] text-[#6b8097] ml-auto mr-2">
                {caseFields.some(f => f.value) ? "Recorded" : "Not recorded"}
              </span>
              <div className={`transition-transform duration-200 ${openAccordions["case-details"] ? "rotate-180" : ""}`}>
                <ChevronDown size={14} strokeWidth={2.5} className="text-[#6b8097]" />
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
                      <span className="text-[12.5px] text-[#6b8097]">{item.label}</span>
                      <span className={`text-[12.5px] font-medium ${!item.value ? "text-[#6b8097] italic" : "text-[#0c1b33]"}`}>
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
              <span className="text-[12.5px] font-bold text-[#0c1b33]">Milestone history</span>
              <span className="text-[11px] text-[#6b8097] ml-auto mr-2">
                {milestonesReached} of {milestones.length} reached
              </span>
              <div className={`transition-transform duration-200 ${openAccordions["milestones"] ? "rotate-180" : ""}`}>
                <ChevronDown size={14} strokeWidth={2.5} className="text-[#6b8097]" />
              </div>
            </div>
            {openAccordions["milestones"] && (
              <div className="px-[18px] pb-4 pt-1 animate-in fade-in slide-in-from-top-1">
                <div className="flex flex-col gap-1.5 py-1">
                  {milestones.map((m, i) => {
                    const isDone = m.key
                      ? !!(state.metadata && state.metadata[m.key])
                      : !!(state.answers && state.answers[m.sid!]);
                    return (
                      <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-[#d0e4f7]/50 last:border-0">
                        <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold ${
                          isDone ? "bg-[#15744f] text-white" : "bg-[#d0e4f7] text-[#6b8097]"
                        }`}>
                          {isDone ? "✓" : "•"}
                        </div>
                        <span className={`text-[12.5px] font-medium ${isDone ? "text-[#1c2b3a]" : "text-[#6b8097]"}`}>
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
