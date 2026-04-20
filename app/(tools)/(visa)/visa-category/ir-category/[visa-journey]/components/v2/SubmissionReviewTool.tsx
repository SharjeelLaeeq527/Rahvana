"use client";

import React, { useState } from "react";
import { ExternalLink, ChevronRight, Check, AlertTriangle } from "lucide-react";

interface SubmissionReviewToolProps {
  tool: any;
  submissionChecklistStatus: Record<number, boolean>;
  setSubmissionChecklistStatus: (status: Record<number, boolean>) => void;
  setSubmissionGuideIdx: (idx: number) => void;
  setIsSubmissionGuideOpen: (open: boolean) => void;
}

export const SubmissionReviewTool: React.FC<SubmissionReviewToolProps> = ({
  tool,
  submissionChecklistStatus,
  setSubmissionChecklistStatus,
  setSubmissionGuideIdx,
  setIsSubmissionGuideOpen,
}) => {
  const handleToggleSubmissionCheck = (index: number) => {
    setSubmissionChecklistStatus({
      ...submissionChecklistStatus,
      [index]: !submissionChecklistStatus[index],
    });
  };

  return (
    <div className="flex flex-col mt-4">
      {/* Launcher Card (Large) */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/7 overflow-hidden mb-[24px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary via-primary/70 to-transparent opacity-70" />
        <div className="p-[30px_32px_26px]">
          <div className="flex items-start gap-[16px] mb-[20px]">
            <div className="w-[44px] h-[44px] rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <ExternalLink size={21} className="text-white/75" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-[4px]">
                {tool.launch_module.label}
              </div>
              <div className="text-[clamp(18px,2.6vw,22px)]  text-white/92 leading-[1.25]">
                {tool.launch_module.title}
              </div>
            </div>
          </div>
          <div className="h-px bg-white/9 mb-[18px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px] mb-[22px]">
            {tool.launch_module.features.map((feat: string, i: number) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-[10px] p-[10px_12px] flex items-start gap-[8px]"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[#6aa8f0]/70 shrink-0 mt-[5px]" />
                <div className="text-[13px] text-white/55 leading-[1.4]">
                  {feat}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setSubmissionGuideIdx(0);
              setIsSubmissionGuideOpen(true);
            }}
            className="w-full p-[15px_24px] bg-[#b48ad6] text-white border-none rounded-[12px] font-sans text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#561864] hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(47,111,212,0.35)] flex items-center justify-center gap-[9px]"
          >
            <span>{tool.launch_module.buttonText}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Checklist and Pitfalls Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[18px]">
        {/* Final Review Checklist */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px]">
          <div className="text-[13px] font-bold tracking-wide uppercase text-[#6b8097] mb-[14px] flex items-center gap-[8px]">
            <span className="w-[8px] h-[8px] rounded-full bg-[#15744f]" />
            Final Review Checklist
          </div>
          <div className="flex flex-col gap-[8px]">
            {[
              "All required files uploaded to CEAC",
              "Correct person selected for each document",
              "Correct document type assigned to each file",
              "Certified English translations paired with originals",
              "No cropped, blurry, or unreadable scans",
              "Comments added only where genuinely needed",
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => handleToggleSubmissionCheck(i)}
                className={`flex items-start gap-[10px] p-[9px_12px] rounded-[10px] cursor-pointer transition-all border-[1.5px] ${
                  submissionChecklistStatus[i]
                    ? "bg-[#e8f5ef] border-[#a8d9be]"
                    : "border-transparent hover:bg-[#eef3fa]"
                }`}
              >
                <div
                  className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 mt-[1px] ${
                    submissionChecklistStatus[i]
                      ? "bg-[#15744f] border-[#15744f]"
                      : "bg-white border-[#d0e4f7]"
                  }`}
                >
                  {submissionChecklistStatus[i] && (
                    <Check size={10} className="text-white" />
                  )}
                </div>
                <span
                  className={`text-[13px] leading-[1.45] ${
                    submissionChecklistStatus[i]
                      ? "text-[#0e5c3c]"
                      : "text-[#3a4f63]"
                  }`}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Pitfalls to Avoid */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px]">
          <div className="text-[13px] font-bold tracking-wide uppercase text-[#6b8097] mb-[14px] flex items-center gap-[8px]">
            <span className="w-[8px] h-[8px] rounded-full bg-[#b91c1c]" />
            Common Pitfalls to Avoid
          </div>
          <div className="flex flex-col gap-[8px]">
            {[
              "Wrong person selected — file under beneficiary vs petitioner",
              "Wrong document category — civil doc filed as financial",
              "Missing translation — uploaded original without translation",
              "Incomplete scan — page cut off or text obscured",
              "Missing financial/civil pairings — both required",
              "Unnecessary comments — clutter without purpose",
            ].map((pitfall, i) => (
              <div
                key={i}
                className="flex items-start gap-[10px] p-[9px_12px] rounded-[10px] border-[1.5px] border-[#fecaca] bg-[#fef2f2]"
              >
                <span className="text-[14px] shrink-0 mt-[1px]">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </span>
                <span className="text-[13px] leading-[1.45] text-[#3a4f63]">
                  {pitfall}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
