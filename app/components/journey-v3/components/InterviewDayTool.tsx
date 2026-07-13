"use client";

import React from "react";
import {
  Briefcase,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  XCircle,
} from "lucide-react";

interface InterviewDayToolProps {
  tool: any;
  setInterviewDayTutIdx: (idx: number) => void;
  setIsInterviewDayTutOpen: (open: boolean) => void;
  guard?: () => boolean;
}

export const InterviewDayTool: React.FC<InterviewDayToolProps> = ({
  tool,
  setInterviewDayTutIdx,
  setIsInterviewDayTutOpen,
  guard,
}) => {
  return (
    <div className="flex flex-col">
      {/* Launcher Card (Dark) */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/10 overflow-hidden mb-4 shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#4a2d8a] via-[#6aa8f0] to-transparent opacity-80" />

        <div className="p-7 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-[44px] h-[44px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Briefcase className="text-white/75" size={21} strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                {tool.launch_module.title}
              </div>
              <h3 className=" text-[20px] sm:text-[22px] text-white/95 leading-tight">
                {tool.launch_module.heading}
              </h3>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-[18px]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {tool.launch_module.cues.map((cue: string, i: number) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-[10px] p-2.5 flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 mt-[5.5px] shrink-0" />
                <span className="text-[13px] text-white/55 leading-tight">{cue}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (guard && !guard()) return;
              setInterviewDayTutIdx(0);
              setIsInterviewDayTutOpen(true);
            }}
            className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Open Interview Day Guide</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Two-column Bringing + Pitfalls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-4">
        {tool.checklists?.map((list: any, idx: number) => (
          <div
            key={idx}
            className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${list.type === "bring" ? "bg-primary" : "bg-red-600"}`}
              />
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#6b8097]">
                {list.title}
              </div>
            </div>
            <div className="flex flex-col gap-[7px]">
              {list.items.map((item: string, i: number) =>
                list.type === "bring" ? (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-[6px] shrink-0" />
                    <span className="text-[13px] text-[#3a4f63] leading-tight">{item}</span>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-red-700 text-[13px] leading-tight"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Helpful Tips Card */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#15744f] shrink-0" />
          <div className="text-[12px] font-bold uppercase tracking-wider text-[#6b8097]">
            Helpful tips
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {tool.tips?.map((tip: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#15744f] mt-[6px] shrink-0" />
              <span className="text-[13px] text-[#3a4f63] leading-tight">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes Card */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4">
        <div className="text-[13px] font-bold uppercase tracking-wider text-[#6b8097] mb-3">
          Possible outcomes after the interview
        </div>
        <div className="flex flex-col gap-2">
          {tool.outcomes?.map((outcome: any, i: number) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                outcome.type === "approved"
                  ? "bg-[#e8f5ef] border-[#a8d9be]"
                  : outcome.type === "ap"
                    ? "bg-[#fef8e8] border-[#f0d98a]"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <div className="shrink-0 mt-1">
                {outcome.icon === "check-circle" && (
                  <CheckCircle2 size={18} className="text-[#15744f]" />
                )}
                {outcome.icon === "clipboard" && <Clipboard size={18} className="text-[#8a6200]" />}
                {outcome.icon === "x-circle" && <XCircle size={18} className="text-red-600" />}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#0c1b33]">{outcome.label}</div>
                <div className="text-[12px] text-[#6b8097] leading-relaxed">{outcome.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
