"use client";

/**
 * CaseStatusHero — Unified Case Status hero section.
 *
 * Replaces multiple disconnected status cards with a single
 * modern SaaS-style hero showing:
 * - Current Stage
 * - Current Status
 * - Upcoming Event
 * - Next Required Action (primary CTA)
 */

import React from "react";
import { ArrowRight, Calendar, MapPin, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import type { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import type { RoadmapData } from "@/app/(tools)/(visa)/visa-category/[visa-journey]/components/types";

export interface CaseStatusHeroProps {
  data: RoadmapData;
  state: WizardState;
  nextActionData: {
    step: { step_key: string; step_name: string; step_description: string };
    chapterIdx: number;
    stepIdxInChapter: number;
  } | null;
  onContinue: () => void;
  isLocked?: boolean;
}

// ─── Stage Determination ────────────────────────────────────────────────────────

function getCurrentStage(
  state: WizardState,
  data: RoadmapData
): {
  stage: string;
  status: string;
  statusColor: string;
  upcomingEvent?: string;
  upcomingDate?: string;
} {
  const meta = state.metadata || {};
  const tracking = (meta.tracking_status as any) || {};
  const interviewDate = tracking.interview_date || (meta.interviewDate as string | undefined);
  const interviewAttended =
    state.completedSteps?.has("step_3_8") ||
    state.completedSteps?.has("c3s8") ||
    !!tracking.ap_status;
  const interviewOutcome = meta.interviewOutcome as string | undefined;
  const journeyCompletedAt = meta.journeyCompletedAt as string | undefined;
  const isDqPhase =
    (!!meta.dqDate || tracking.dq_status === "qualified" || meta.dqStatus === "qualified") &&
    !interviewDate;

  // Journey complete
  if (journeyCompletedAt) {
    return {
      stage: "Journey Complete",
      status: "Visa Issued",
      statusColor: "#afdbdb",
    };
  }

  // Visa approved
  if (interviewAttended && interviewOutcome === "approved") {
    return {
      stage: "Post-Interview",
      status: "Visa Approved",
      statusColor: "#afdbdb",
      upcomingEvent: "Awaiting visa issuance",
    };
  }

  // 221(g) / Administrative Processing
  if (interviewOutcome === "221g" || (interviewAttended && tracking.ap_status === "pending")) {
    return {
      stage: "Post-Interview",
      status: "221(g) Administrative Processing",
      statusColor: "#cdadcc",
      upcomingEvent: "Respond to 221(g) requirements",
    };
  }

  // Interview scheduled
  if (interviewDate && !interviewAttended) {
    return {
      stage: "Medical & Interview",
      status: "Interview Scheduled",
      statusColor: "#0d7377",
      upcomingEvent: `Interview, ${interviewDate}${tracking.interview_time ? ` at ${tracking.interview_time}` : ""}`,
      upcomingDate: interviewDate,
    };
  }

  // DQ phase — waiting for interview scheduling
  if (isDqPhase) {
    return {
      stage: "Documentarily Qualified",
      status: "Awaiting Interview Scheduling",
      statusColor: "#0d7377",
      upcomingEvent: "Interview date pending embassy scheduling",
    };
  }

  // NVC processing
  if (meta.nvcCaseNum || tracking.nvc_review_complete) {
    return {
      stage: "NVC Document Processing",
      status:
        tracking.dq_status === "qualified" ? "Documentarily Qualified" : "Documents Under Review",
      statusColor: tracking.dq_status === "qualified" ? "#0d7377" : "#89a4a0",
    };
  }

  // Chapter 1 — petition prep
  return {
    stage: "Petition Preparation",
    status: "Gathering Documents",
    statusColor: "#89a4a0",
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function CaseStatusHero({
  data,
  state,
  nextActionData,
  onContinue,
  isLocked,
}: CaseStatusHeroProps) {
  const { stage, status, statusColor, upcomingEvent, upcomingDate } = getCurrentStage(state, data);
  const meta = state.metadata || {};
  const tracking = (meta.tracking_status as any) || {};

  return (
    <section className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(13,115,119,0.12),0_4px_16px_rgba(0,0,0,0.06)]">
      {/* Background — brand teal gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d7377] via-[#095c5f] to-[#063e40]" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/6 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#afdbdb]/8 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#afdbdb] via-[#0d7377] to-transparent opacity-60" />

      <div className="relative z-10 p-6 md:p-8">
        {/* Top row: eyebrow + stage chip */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              Current Stage
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full border"
              style={{
                background: `${statusColor}20`,
                borderColor: `${statusColor}60`,
                color: statusColor,
              }}
            >
              {stage}
            </span>
          </div>
          {isLocked && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
              <ShieldCheck size={12} /> Read-Only
            </span>
          )}
        </div>

        {/* Main status */}
        <div className="flex flex-col gap-5">
          {/* Top: Status + upcoming event */}
          <div>
            <h1 className="text-white/95 text-2xl md:text-[28px] font-black leading-tight mb-2">
              {status}
            </h1>

            {upcomingEvent && (
              <div className="flex items-center gap-2 text-white/50 text-sm mt-3">
                <Calendar size={14} className="shrink-0 text-white/30" />
                <span>{upcomingEvent}</span>
              </div>
            )}

            {/* Quick meta row */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {meta.filingMethod && (
                <div className="text-[11px] text-white/30">
                  Filing: <span className="text-white/60 font-semibold">{meta.filingMethod}</span>
                </div>
              )}
              {meta.receiptNum && (
                <div className="text-[11px] text-white/30">
                  Receipt: <span className="text-white/60 font-semibold">{meta.receiptNum}</span>
                </div>
              )}
              {meta.nvcCaseNum && (
                <div className="text-[11px] text-white/30">
                  NVC: <span className="text-white/60 font-semibold">{meta.nvcCaseNum}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: Next action CTA */}
          {nextActionData && !isLocked && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-1">
                  Next Action
                </div>
                <div className="text-[16px] font-bold text-white/90 leading-snug">
                  {nextActionData.step.step_name}
                </div>
                {nextActionData.step.step_description && (
                  <p className="text-[12px] text-white/45 leading-relaxed mt-1 max-w-md">
                    {nextActionData.step.step_description}
                  </p>
                )}
              </div>
              <button
                onClick={onContinue}
                className="shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white hover:bg-white/90 text-[#0d7377] rounded-xl font-bold text-[14px] shadow-lg shadow-black/10 transition-all active:scale-95 group w-full sm:w-auto"
              >
                Continue Journey
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                  strokeWidth={2.5}
                />
              </button>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl w-fit">
              <AlertTriangle size={14} className="text-[#cdadcc]" />
              <span className="text-[11px] font-semibold text-white/50">
                Journey in read-only mode
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
