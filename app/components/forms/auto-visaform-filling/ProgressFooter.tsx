"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface Section {
  title: string;
  fields: unknown[];
}

interface ProgressFooterProps {
  current: number;
  total: number;
  progress: number;
  sections: Section[];
}

export function ProgressFooter({ current, total, progress, sections }: ProgressFooterProps) {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const getCleanSectionName = (title: string) => {
    return title.replace(/^\d+\.\s*/, "");
  };

  return (
    <div
      className="mt-8 border-t border-[#e8f6f6] py-4 px-3 sm:py-6 sm:px-4 md:px-8"
      style={{
        background: "linear-gradient(135deg, #0b5f63 0%, #0d7377 50%, #0f8f94 100%)",
      }}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Step dots with tooltips */}
        <div className="flex items-center justify-between flex-1 gap-1 sm:gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < current;
            const isActive = stepNum === current;
            const section = sections[i];
            const cleanTitle = section ? getCleanSectionName(section.title) : "";

            // Determine tooltip positioning based on dot position
            const isLeftDot = i < Math.ceil(total / 3);
            const isRightDot = i >= Math.floor((total * 2) / 3);
            let tooltipPositionClass = "left-1/2 -translate-x-1/2";
            let arrowPositionClass = "left-1/2 -translate-x-1/2";

            if (isLeftDot) {
              tooltipPositionClass = "left-0";
              arrowPositionClass = "left-4";
            } else if (isRightDot) {
              tooltipPositionClass = "right-0";
              arrowPositionClass = "right-4";
            }

            return (
              <div
                key={i}
                className="flex-1 flex justify-center relative group/tooltip shrink-0"
                onMouseEnter={() => setHoveredDot(i)}
                onMouseLeave={() => setHoveredDot(null)}
              >
                {/* Tooltip */}
                <div
                  className={`absolute top-full mt-2 w-56 sm:w-72 p-3 sm:p-4 bg-linear-to-br from-gray-900 to-gray-800 text-white text-xs rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl border border-gray-700 ${tooltipPositionClass}`}
                >
                  <div className="font-semibold text-xs sm:text-sm">
                    Section {stepNum} of {total}
                  </div>
                  <div className="text-[10px] sm:text-[11px] opacity-80 mt-1">{cleanTitle}</div>
                  <div
                    className={`absolute -top-2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900 ${arrowPositionClass}`}
                  />
                </div>

                {/* Dot */}
                <motion.div
                  className="rounded-full cursor-pointer transition-all"
                  animate={{
                    scale: isActive ? 1.25 : hoveredDot === i ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: isActive ? 8 : 6,
                    height: isActive ? 8 : 6,
                    minWidth: 6,
                    minHeight: 6,
                    backgroundColor: isDone
                      ? "#ffffff"
                      : isActive
                        ? "#32e0c4"
                        : "rgba(255,255,255,0.35)",
                    boxShadow: isActive
                      ? "0 0 0 5px rgba(50, 224, 196, 0.25)"
                      : hoveredDot === i
                        ? "0 0 0 3px rgba(255,255,255,0.25)"
                        : "none",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Progress percentage aligned right */}
        <div className="flex items-baseline gap-0.5 sm:gap-1 shrink-0 ml-2 sm:ml-4">
          <span className="text-base sm:text-lg md:text-xl font-bold tabular-nums text-white">
            {Math.round(progress)}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-white/70">%</span>
        </div>
      </div>
    </div>
  );
}
