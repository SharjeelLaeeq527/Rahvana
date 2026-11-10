"use client";

import React from "react";
import { ArrowRight, CalendarCheck } from "lucide-react";
import type { CompanionToolV3 } from "../types";

/**
 * A small card that opens a toolbox tool from a step or a quest result. It launches through
 * the same path as the toolbox (`onLaunchTool(component_key)`), so the tool opens in journey
 * mode with this journey's data and the tool's own entitlement rule.
 */
export function CompanionToolCard({
  config,
  onLaunch,
  className = "",
}: {
  config: CompanionToolV3;
  onLaunch: (componentKey: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-[#d0e4f7] bg-[#f5f9ff] p-4 text-left sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d7377] text-white">
        <CalendarCheck className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold text-[#0f1f38]">{config.title}</div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[#3a4f63]">{config.body}</p>
      </div>
      <button
        type="button"
        onClick={() => onLaunch(config.component_key)}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0d7377] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#095457]"
      >
        {config.button_label}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
