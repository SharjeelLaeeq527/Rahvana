"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableTooltipProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  defaultOpen?: boolean;
}

export const ExpandableTooltip = ({
  icon,
  title,
  message,
  defaultOpen = true,
}: ExpandableTooltipProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 border border-[#14a0a6]/30 rounded-lg bg-[#e8f6f6] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#d4f0f0] transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#0d7377] text-white text-xs flex items-center justify-center font-semibold">
            {icon}
          </div>
          <span className="text-sm font-medium text-[#0d7377]">
            {title}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-[#14a0a6] transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 py-3 border-t border-[#14a0a6]/30 bg-white">
          <p className="text-sm text-[#0d7377] leading-relaxed">{message}</p>
        </div>
      )}
    </div>
  );
};
