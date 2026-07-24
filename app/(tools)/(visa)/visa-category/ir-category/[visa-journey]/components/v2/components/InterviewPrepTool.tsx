"use client";

import React from "react";
import { MessageSquare, ExternalLink } from "lucide-react";

interface InterviewPrepToolProps {
  tool: any;
  isPrepLaunched: boolean;
  setIsPrepLaunched: (launched: boolean) => void;
  guard?: () => boolean;
  journeyId?: string;
}

export const InterviewPrepTool: React.FC<InterviewPrepToolProps> = ({
  tool,
  isPrepLaunched,
  setIsPrepLaunched,
  guard,
  journeyId,
}) => {
  return (
    <div className="flex flex-col mt-4">
      {/* Launcher Card (Large) */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/10 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#4a2d8a] via-[#6aa8f0] to-transparent opacity-80" />

        <div className="p-7 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-[44px] h-[44px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <MessageSquare className="text-white/75" size={21} strokeWidth={1.6} />
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
            {tool.launch_module?.cues?.map((cue: string, i: number) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-[10px] p-2.5 flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#6aa8f0]/60 mt-[5.5px] shrink-0" />
                <span className="text-[13px] text-white/55 leading-tight">{cue}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (guard && !guard()) return;
              setIsPrepLaunched(true);
              // Build URL with journey_id if available
              const baseUrl = "https://www.rahvana.com/interview-prep";
              // const baseUrl = "http://localhost:3000/interview-prep";
              const url = journeyId ? `${baseUrl}?journey_id=${journeyId}` : baseUrl;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Launch Interview Prep Tool</span>
            <ExternalLink size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {isPrepLaunched && (
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[10px] p-[16px_18px] mb-5 animate-in fade-in slide-in-from-top-1">
          <div className="text-[13px] font-bold text-[#15744f] mb-1">✓ Prep tool opened</div>
          <div className="text-[12px] text-[#3a4f63] leading-relaxed">
            Return here after your prep session. Review the readiness checklist below regularly
            before interview day.
          </div>
        </div>
      )}

      {/* Readiness Grid */}
      {tool.readiness_grid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-[22px]">
          {tool.readiness_grid.map((card: any, idx: number) => (
            <div
              key={idx}
              className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-4.5"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b8097] mb-2.5 border-b border-[#f1f5f9] pb-2">
                {card.title}
              </div>
              <div className="flex flex-col gap-2">
                {card.items.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-[5px] h-[5px] rounded-full bg-purple-600 mt-[6.5px] shrink-0 opacity-70" />
                    <span className="text-[13px] text-[#3a4f63] leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
