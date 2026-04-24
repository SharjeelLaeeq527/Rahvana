"use client";

import { motion } from "framer-motion";
import { Menu, BookOpen } from "lucide-react";

interface ProgressBarProps {
  current: number;
  total: number;
  progress: number;
  sectionName?: string;
  formTitle?: string;
  formSubtitle?: string;
  onOpenMenu?: () => void;
  showMenu?: boolean;
}

export function ProgressBar({
  current,
  total,
  progress,
  sectionName,
  formTitle,
  formSubtitle,
  onOpenMenu,
  showMenu,
}: ProgressBarProps) {
  const cleanName = sectionName
    ? sectionName.replace(/^\d+\.\s*/, "")
    : "";

  return (
    <div
      className="mt-12 backdrop-blur-xl border-b"
      style={{
        backgroundColor: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
        borderColor: "rgba(13, 115, 119, 0.08)",
      }}
    >
      <div className="px-4 md:px-8 py-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">

          {/* Hamburger */}
          {showMenu && (
            <button
              onClick={onOpenMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-[#e8f6f6] transition"
              style={{ color: "#0d7377" }}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Icon */}
          <div
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
            }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">
              {formTitle || "Form"}
            </h1>
            {formSubtitle && (
              <p className="text-xs md:text-sm text-gray-500 truncate">
                {formSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full">

          {/* Header row */}
          <div className="flex items-end justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm shadow-md shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
                }}
              >
                {current}
              </div>

              <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "#0a5a5d" }}
                >
                  Section {current} of {total}
                </p>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {cleanName || "In progress"}
                </h3>
              </div>
            </div>

            <div className="flex items-baseline gap-1 shrink-0">
              <span
                className="text-2xl md:text-3xl font-bold tabular-nums"
                style={{ color: "#0d7377" }}
              >
                {Math.round(progress)}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: "#14a0a6" }}
              >
                %
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="relative w-full h-2.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "#e8f6f6" }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #0d7377 0%, #14a0a6 60%, #32e0c4 100%)",
                boxShadow: "0 0 12px rgba(50, 224, 196, 0.45)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-between mt-3 px-0.5">
            {Array.from({ length: total }).map((_, i) => {
              const stepNum = i + 1;
              const isDone = stepNum < current;
              const isActive = stepNum === current;

              return (
                <div key={i} className="flex-1 flex justify-center">
                  <motion.div
                    className="rounded-full"
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: isActive ? 8 : 6,
                      height: isActive ? 8 : 6,
                      backgroundColor: isDone
                        ? "#0d7377"
                        : isActive
                        ? "#14a0a6"
                        : "#e8f6f6",
                      boxShadow: isActive
                        ? "0 0 0 4px rgba(20, 160, 166, 0.18)"
                        : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}