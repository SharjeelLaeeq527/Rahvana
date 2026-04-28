"use client";

import React from "react";
import { Activity, ArrowRight, AlertTriangle } from "lucide-react";

interface MedicalExamGuideToolProps {
  tool: any;
  setMedicalGuideIdx: (idx: number) => void;
  setIsMedicalGuideOpen: (open: boolean) => void;
  guard?: () => boolean;
}

export const MedicalExamGuideTool: React.FC<MedicalExamGuideToolProps> = ({
  tool,
  setMedicalGuideIdx,
  setIsMedicalGuideOpen,
  guard,
}) => {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
      {/* Header Chips */}
      <div className="flex items-center gap-[7px] flex-wrap mb-8">
        {["Medical Exam", "What to Expect", "Preparation Guide"].map(
          (label, i) => (
            <span
              key={i}
              className={`text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full border ${
                i === 0
                  ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                  : i === 1
                    ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                    : "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
              }`}
            >
              {label}
            </span>
          ),
        )}
      </div>

      {/* Launch Module */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-70" />
        <div className="p-[30px_32px_26px]">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0 text-white/75">
              <Activity size={21} strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                Medical Exam Guide
              </div>
              <h2 className="text-[clamp(18px,2.6vw,22px)]  text-white/90 leading-[1.25]">
                Walkthrough of the medical exam appointment
              </h2>
            </div>
          </div>
          <div className="h-px bg-white/9 mb-[18px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-[22px]">
            {[
              "What to bring to the exam",
              "How the exam typically proceeds",
              "Vaccination and paperwork requirements",
              "Common mistakes to avoid",
            ].map((cue, i) => (
              <div
                key={i}
                className="bg-white/6 border border-white/10 rounded-lg p-[10px_12px] flex items-start gap-2"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5.5px]" />
                <span className="text-[13px] text-white/55 leading-[1.4]">
                  {cue}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (guard && !guard()) return;
              setMedicalGuideIdx(0);
              setIsMedicalGuideOpen(true);
            }}
            className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>View Medical Exam Guide</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Two-col lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[16px]">
        {/* What to bring */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#2f6fd4]" />
            <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#6b8097]">
              What to bring
            </span>
          </div>
          <div className="flex flex-col gap-[7px]">
            {tool.bring?.map((it: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#2f6fd4] shrink-0 mt-[7px]" />
                <span className="text-[13px] text-[#3a4f63] leading-[1.45]">
                  {it}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Common pitfalls */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#b91c1c]" />
            <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#6b8097]">
              Common pitfalls
            </span>
          </div>
          <div className="flex flex-col gap-[7px]">
            {tool.pitfalls?.map((it: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 p-[7px_10px] bg-[#fef2f2] rounded-[10px] border border-[#fecaca]/30"
              >
                <AlertTriangle
                  size={13}
                  className="text-[#b91c1c] shrink-0 mt-[1.5px]"
                />
                <span className="text-[13px] text-[#b91c1c] leading-[1.45]">
                  {it}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Helpful tips card */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] mb-[16px] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#15744f]" />
          <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#6b8097]">
            Helpful tips
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
          {tool.tips?.map((it: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#15744f] shrink-0 mt-[7px]" />
              <span className="text-[13px] text-[#3a4f63] leading-[1.45]">
                {it}
              </span>
            </div>
          ))}
        </div>
      </div>

      {tool.disclaimer && (
        <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px]">
          {tool.disclaimer}
        </p>
      )}
    </div>
  );
};
