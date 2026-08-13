"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface StepHeaderProps {
  stepNumber?: number;
  chapterNumber: number;
  chapterName: string;
  stepName: string;
  stepDescription?: string;
  isBeneficiaryTheme?: boolean;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  chapterNumber,
  chapterName,
  stepName,
  stepDescription,
  isBeneficiaryTheme,
}) => {
  return (
    <div className="flex flex-col mb-3.5 sm:mb-8 mt-0 pt-0 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Breadcrumbs */}
      {/* <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#636b97]">
          Chapter {chapterNumber} · {chapterName}
        </span>
        <ChevronRight size={10} className="text-[#b8d4f0]" />
        <span
          className={`text-[11px] font-bold uppercase tracking-widest ${
            isBeneficiaryTheme ? "text-[#0f7373]" : "text-[#3b7dd8]"
          }`}
        >
          {stepName}
        </span>
      </div> */}

      {/* Main Title */}
      <h1 className="text-[clamp(28px,4vw,36px)] font-bold text-[#0c1b33] leading-[1.15] tracking-tight mb-2">
        {stepName}
      </h1>

      {/* Description */}
      {stepDescription && (
        <p className="text-[#3a4f63] text-[15px] leading-relaxed max-w-[540px]">
          {stepDescription}
        </p>
      )}
    </div>
  );
};
