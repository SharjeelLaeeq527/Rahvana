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
    <div className="flex flex-col mb-8 mt-6 sm:mt-12 md:mt-16 lg:mt-20 xl:mt-24 animate-in fade-in slide-in-from-top-4 duration-500 px-2 sm:px-4 md:px-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#636b97]">
          Chapter {chapterNumber} · {chapterName}
        </span>
        <ChevronRight size={10} className="text-[#b8d4f0]" />
        <span
          className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${
            isBeneficiaryTheme ? "text-[#0f7373]" : "text-[#3b7dd8]"
          }`}
        >
          {stepName}
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-[clamp(18px,7vw,32px)] sm:text-[clamp(28px,4.5vw,42px)] font-black text-[#0c1b33] leading-tight tracking-tight mb-2 break-words mt-2 sm:mt-4 md:mt-6">
        {stepName}
      </h1>

      {/* Description */}
      {stepDescription && (
        <p className="text-[#3a4f63] text-[14px] sm:text-[15px] leading-relaxed max-w-full sm:max-w-[540px] break-words">
          {stepDescription}
        </p>
      )}
    </div>
  );
};
