"use client";

import React, { useState } from "react";
import { Search, Clock, Scale, BellRing, Save, ExternalLink } from "lucide-react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

interface AwaitingReviewStepProps {
  data: any;
  state?: WizardState;
  actions?: {
    updateMetadata: (data: Record<string, unknown>) => void;
  };
}

export const AwaitingReviewStep: React.FC<AwaitingReviewStepProps> = ({ data }) => {
  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <style jsx global>{`
        @keyframes pulse-custom {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        .animate-pulse-custom {
          animation: pulse-custom 2.2s ease-in-out infinite;
        }
        .animate-pulse-delayed {
          animation: pulse-custom 2.2s ease-in-out infinite;
          animation-delay: 0.2s;
        }
      `}</style>

      {/* Page Shell */}
      <div className="flex w-full max-w-[680px] flex-col mx-auto px-4 sm:px-6 md:px-8 pt-5 pb-10 md:pt-8">
        {/* Eyebrow */}
        {/* {data.eyebrow && (
          <div className="flex items-center gap-[8px] mb-[6px] animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097]">
              {data.eyebrow.chapter}
            </span>
            <span className="text-[11px] text-[#b8d4f0]">›</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f6fd4]">
              {data.eyebrow.step}
            </span>
          </div>
        )} */}

        <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0c1b33] leading-[1.2] mb-[10px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[40ms]">
          {data.title}
        </h1>

        <p className="text-[#3a4f63] text-[15px] leading-[1.7] mb-3.5 sm:mb-[22px] max-w-[500px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[80ms]">
          {data.description}
        </p>

        <div className="flex flex-wrap gap-[7px] mb-3.5 sm:mb-[32px] animate-in fade-in slide-in-from-top-2 duration-300 delay-120">
          {data.chips.map((chip: any, i: number) => (
            <span
              key={i}
              className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border whitespace-nowrap ${
                chip.type === "nvc"
                  ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                  : chip.type === "status"
                    ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                    : "bg-[#e8f6f6] text-[#0d6b6b] border-[#9fd6d6]"
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {/* Status Card (Navy) */}
        <div className="relative  bg-[var(--rv-ch2-module-bg)] rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] animate-in fade-in slide-in-from-top-2 duration-300 delay-[160ms]">
          {/* Top Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-80" />

          <div className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/40 mb-[8px]">
            {data.statusCard.label}
          </div>

          <h2 className="text-[20px]  text-white/92 leading-tight mb-[16px] flex items-center gap-[8px]">
            <span className="w-[7px] h-[7px] rounded-full bg-[#c56ca3] animate-pulse-custom shrink-0" />
            {data.statusCard.heading}
          </h2>

          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 gap-[12px]">
            {data.statusCard.grid.map((item: any, i: number) => (
              <div key={i} className="flex flex-col gap-[3px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                  {item.label}
                </div>
                <div className="text-[13px] font-semibold text-white/88">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card: What NVC is reviewing */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in slide-in-from-top-2 duration-300 delay-[200ms]">
          <div className="flex items-center gap-[10px] mb-[14px]">
            <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
              <Search size={17} className="text-[#2f6fd4]" strokeWidth={1.7} />
            </div>
            <h3 className="text-[14px] font-semibold text-[#0c1b33]">{data.reviewItems.title}</h3>
          </div>
          <div className="flex flex-col gap-[7px]">
            {data.reviewItems.items.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
              >
                <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Section */}
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-[14px] mb-[14px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[240ms]">
          {/* While You Wait */}
          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
            <div className="flex items-center gap-[10px] mb-[14px]">
              <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                <Clock size={17} className="text-[#15744f]" strokeWidth={1.7} />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                {data.whileYouWait.title}
              </h3>
            </div>
            <div className="flex flex-col gap-[7px]">
              {data.whileYouWait.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                >
                  <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
            <div className="flex items-center gap-[10px] mb-[14px]">
              <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                <Scale size={17} className="text-[#2f6fd4]" strokeWidth={1.7} />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0c1b33]">{data.timeline.title}</h3>
            </div>
            <div className="flex flex-col gap-0 relative pl-[18px]">
              {/* Vertical Line */}
              <div className="absolute left-[6px] top-[10px] bottom-[10px] w-[2px] bg-[#d0e4f7] rounded-[2px]" />

              <div className="flex flex-col gap-[10px]">
                {data.timeline.steps.map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-[8px]">
                    {step.status === "completed" ? (
                      <div className="w-[12px] h-[12px] rounded-full bg-[#15744f] shrink-0 z-10 ml-[-6px]" />
                    ) : step.status === "current" ? (
                      <div className="w-[12px] h-[12px] rounded-full border-2 border-[#2f6fd4] bg-white shrink-0 z-10 ml-[-6px] animate-pulse-custom" />
                    ) : (
                      <div className="w-[12px] h-[12px] rounded-full bg-[#d0e4f7] shrink-0 z-10 ml-[-6px]" />
                    )}
                    <span
                      className={`text-[12px] ${
                        step.status === "completed"
                          ? "text-[#0e5c3c] font-semibold"
                          : step.status === "current"
                            ? "text-[#2f6fd4] font-semibold"
                            : "text-[#6b8097]"
                      }`}
                    >
                      {step.label}
                      {step.status === "current" ? " ← you are here" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Card: Corrections */}
        <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-[18px_20px] mb-[16px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[280ms]">
          <div className="flex items-center gap-[9px] mb-[10px]">
            <span className="text-[18px]">📋</span>
            <h3 className="text-[14px] font-semibold text-[#8a6200]">
              {data.correctionsAlert.title}
            </h3>
          </div>
          <div className="flex flex-col gap-[7px]">
            {data.correctionsAlert.items.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-[8px] text-[13px] text-[#8a6200] leading-[1.5]"
              >
                <div className="w-[4px] h-[4px] rounded-full bg-[#8a6200] mt-[5px] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[320ms]">
          {data.disclaimer}
        </p>
      </div>
    </div>
  );
};
