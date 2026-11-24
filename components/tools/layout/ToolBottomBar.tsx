"use client";

import React from "react";
import type { ToolRule, ToolFaq, ToolSource, DrawerTabKey } from "./types";

interface ToolBottomBarProps {
  rules?: ToolRule[];
  faqs?: ToolFaq[];
  sources?: ToolSource[];
  disclaimer?: React.ReactNode;
  onOpenDrawerTab: (tab: DrawerTabKey) => void;
  className?: string;
}

export function ToolBottomBar({
  rules = [],
  faqs = [],
  sources = [],
  disclaimer,
  onOpenDrawerTab,
  className = "",
}: ToolBottomBarProps) {
  const hasRules = rules.length > 0;
  const hasFaqs = faqs.length > 0;
  const hasSources = sources.length > 0;
  const hasAnyLink = hasRules || hasFaqs || hasSources;

  // If there are no links and no disclaimer, omit the bottom bar entirely
  if (!hasAnyLink && !disclaimer) {
    return null;
  }

  return (
    <div
      className={`mx-auto max-w-6xl flex flex-wrap items-center gap-y-2 gap-x-6 pt-5 pb-14 text-sm text-[#66787A] ${className}`}
    >
      {/* Optional Drawer link triggers */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {hasRules && (
          <button
            type="button"
            onClick={() => onOpenDrawerTab("rules")}
            className="cursor-pointer font-medium text-[#0A4F49] underline underline-offset-4 transition-opacity hover:opacity-75"
          >
            Rules
          </button>
        )}

        {hasFaqs && (
          <button
            type="button"
            onClick={() => onOpenDrawerTab("faq")}
            className="cursor-pointer font-medium text-[#0A4F49] underline underline-offset-4 transition-opacity hover:opacity-75"
          >
            Common questions
          </button>
        )}

        {hasSources && (
          <button
            type="button"
            onClick={() => onOpenDrawerTab("src")}
            className="cursor-pointer font-medium text-[#0A4F49] underline underline-offset-4 transition-opacity hover:opacity-75"
          >
            Official sources
          </button>
        )}
      </div>

      {/* Optional Disclaimer (floats to right on desktop) */}
      {disclaimer && (
        <span className="sm:ml-auto text-xs sm:text-[13px] text-[#66787A]/90 italic">
          {disclaimer}
        </span>
      )}
    </div>
  );
}
