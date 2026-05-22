"use client";

import React from "react";
import { Check, Info, Truck } from "lucide-react";

interface TrackVisaIssuanceToolProps {
  tool: any;
  state: any;
  actions: any;
  guard?: () => boolean;
}

export const TrackVisaIssuanceTool: React.FC<TrackVisaIssuanceToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      {tool.congratulations && (
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-[24px] shadow-[0_4px_24px_rgba(21,116,79,0.08)] mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#15744f] mb-2">
            {tool.congratulations.eyebrow}
          </div>
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0c1b33] leading-tight mb-3">
            {tool.congratulations.title}
          </h2>
          <p className="text-[14px] text-[#15744f]/90 leading-relaxed">
            {tool.congratulations.body}
          </p>
        </div>
      )}

      {tool.launch_module && (
        <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/10 overflow-hidden mb-4 shadow-[0_20px_60px_rgba(12,27,51,0.18)] p-6 sm:p-8">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#15744f] via-[#6aa8f0] to-transparent opacity-80" />
          <div className="flex flex-col items-center text-center">
            <div className="w-[48px] h-[48px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mb-4">
              <Truck className="text-white/75" size={24} />
            </div>
            <button
              onClick={() => {
                if (guard && !guard()) return;
                window.open(tool.launch_module.url, "_blank");
              }}
              className="w-full sm:w-auto px-8 py-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8]/90 transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{tool.launch_module.button_label}</span>
              <Truck size={18} />
            </button>
          </div>
        </div>
      )}

      {tool.checklist && (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[#6b8097] mb-4">
            Next steps checklist
          </div>
          <div className="flex flex-col gap-3">
            {tool.checklist.map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3b7dd8] mt-[7px] shrink-0" />
                <span className="text-[13.5px] text-[#3a4f63] leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tool.info_sections && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {tool.info_sections.map((section: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 shadow-[0_4px_20px_rgba(12,27,51,0.06)]"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    section.type === "sky"
                      ? "bg-[#e8f1fb] border-[#d0e4f7]"
                      : "bg-[#e8f6f6] border-[#9fd6d6]"
                  }`}
                >
                  {section.icon === "info" ? (
                    <Info size={16} className="text-[#2f6fd4]" strokeWidth={2} />
                  ) : (
                    <Check size={16} className="text-[#0d6b6b]" strokeWidth={2.5} />
                  )}
                </div>
                <div className="text-[14px] font-bold text-[#0c1b33]">{section.title}</div>
              </div>
              <div className="flex flex-col gap-2.5">
                {section.items.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-[#d0e4f7] mt-[7.5px] shrink-0" />
                    <span className="text-[13px] text-[#3a4f63] leading-relaxed">{item}</span>
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
