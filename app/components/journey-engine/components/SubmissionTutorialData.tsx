"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { SafeHtml } from "../../shared/SafeHTML";

export interface SubmissionStep {
  label: string;
  heading: string;
  instruction: string;
  vlabel: string;
  visual: string;
  note: string | null;
}

export function SubmissionTutorialOverlay({
  isOpen,
  onClose,
  currentIdx,
  steps,
  onSetIdx,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentIdx: number;
  steps: SubmissionStep[];
  onSetIdx: (idx: number) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[currentIdx];
  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 bg-[#fafcff] z-[200] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans bg-white">
      {/* Topbar */}
      <div className="flex items-center h-[54px] sm:h-[72px] border-b border-[#d0e4f7] px-3.5 sm:px-6 gap-3 sm:gap-4 shrink-0 bg-[#fafcff]">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-[0.4s] ease-out"
            style={{
              width: `${(currentIdx / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {currentIdx + 1} / {steps.length}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center bg-white">
        <div className="w-full max-w-[580px] flex flex-col">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-primary mb-3.5">
            Submission Guide · {currentStep.label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
            {currentStep.heading}
          </h2>
          <SafeHtml
  className="text-[14px] text-[#3a4f63] leading-[1.7] mb-[18px]"
  html={currentStep.instruction}
/>

          {/* Screenshot / Visual Mockup */}
          <div className="w-full bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
            <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-[6px]">
              <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
              <div className="ml-auto text-[10px] font-bold text-[#6b8097] tracking-wider uppercase">
                {currentStep.vlabel}
              </div>
            </div>
            <SafeHtml
  className="p-[18px] bg-white transition-all min-h-[140px] flex flex-col justify-center"
  html={currentStep.visual}
/>
          </div>

          {/* Note Block */}
          {currentStep.note && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] mb-5">
              <div className="text-[13px] text-[#8a6200] leading-[1.55]">
                <strong className="font-bold">Important:</strong> {currentStep.note}
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="flex gap-[10px] items-center mt-auto">
            {currentIdx > 0 && (
              <button
                onClick={() => onSetIdx(currentIdx - 1)}
                className="p-[12px_20px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33] flex items-center gap-2"
              >
                ← Back
              </button>
            )}
            {currentIdx < steps.length - 1 ? (
              <button
                onClick={() => onSetIdx(currentIdx + 1)}
                className="flex-1 p-[12px_20px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-bold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px text-center flex items-center justify-center gap-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 p-[12px_20px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-bold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center flex items-center justify-center gap-2"
              >
                Done, return to step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
