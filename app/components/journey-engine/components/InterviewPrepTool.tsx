"use client";

import React, { useState } from "react";
import { MessageSquare, ExternalLink } from "lucide-react";
import { ToolPageOverlay } from "@/app/components/shared/ToolPageOverlay";

import { useJourneyEnvironment } from "@/lib/hooks/useJourneyEnvironment";
import { useCandidate } from "@/app/context/CandidateContext";
import {
  getBaseVisaCategory,
  UNKNOWN_VISA_CATEGORY,
} from "@/lib/candidate/candidateSyncService";
import {
  resolveCategorySlug,
  isMultiCandidateCategorySlug,
} from "@/lib/interview-prep/journey-category-map";

export const DEFAULT_PREP_TOOL_DATA = {
  type: "interview_prep",
  launch_module: {
    title: "Rahvana Interview Prep Tool",
    heading: "Practice questions, review facts, build confidence",
    icon: "message",
    cues: [
      "Review likely interview questions and ideal answers",
      "Review your DS-260 responses for consistency",
      "Strengthen recall of your relationship timeline",
      "Practice concise, truthful, confident answers",
    ],
  },
  readiness_grid: [
    {
      title: "Review before your interview",
      items: [
        "DS-260 answers, know every section you completed",
        "Relationship timeline, dates, meetings, visits",
        "Sponsor income and financial details",
        "Civil document details, names, dates, record history",
        "Travel history and prior U.S. visa history if any",
      ],
    },
    {
      title: "Mindset and approach",
      items: [
        "Answer only what is asked, do not volunteer extra information",
        "Answer truthfully and consistently with your filed documents",
        "Stay calm, the officer is doing their job, not targeting you",
        "If unsure, say so calmly, do not guess",
        "Practice out loud, not just in your head",
      ],
    },
  ],
};

interface InterviewPrepToolProps {
  tool?: any;
  isPrepLaunched?: boolean;
  setIsPrepLaunched?: (launched: boolean) => void;
  guard?: () => boolean;
  journeyId?: string;
  journeyTier?: string;
  plan?: any;
  candidateId?: string;
}

export const InterviewPrepTool: React.FC<InterviewPrepToolProps> = ({
  tool,
  isPrepLaunched: propIsPrepLaunched,
  setIsPrepLaunched: propSetIsPrepLaunched,
  guard,
  journeyId,
  journeyTier,
  plan,
  candidateId: propCandidateId,
}) => {
  const [internalPrepLaunched, setInternalPrepLaunched] = useState(false);
  const isPrepLaunched = propIsPrepLaunched !== undefined ? propIsPrepLaunched : internalPrepLaunched;
  const setIsPrepLaunched = propSetIsPrepLaunched || setInternalPrepLaunched;

  const [toolHref, setToolHref] = useState<string | null>(null);
  const journeyEnv = useJourneyEnvironment();

  let candidateCtx;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    candidateCtx = useCandidate();
  } catch {
    candidateCtx = undefined;
  }

  const activeCandidate = candidateCtx?.activeCandidate;
  const activeCandidateId =
    propCandidateId ||
    candidateCtx?.activeCandidateId ||
    journeyEnv.candidateId ||
    "candidate-1";
  const isMultiCandidate = candidateCtx?.isMultiCandidate || false;

  const rawCategory =
    activeCandidate?.visaCategory ||
    journeyEnv.journeyCategory ||
    journeyEnv.journeyDataKey ||
    journeyEnv.journeySlug;
  const baseCategory = getBaseVisaCategory(rawCategory);
  const journeyCategory =
    baseCategory !== UNKNOWN_VISA_CATEGORY
      ? baseCategory
      : (journeyEnv.journeySlug?.includes("5") ? "IR-5" : journeyEnv.journeySlug?.includes("2") ? "IR-2" : "IR-1");
  const categorySlug = resolveCategorySlug(journeyCategory) || "ir-1-spouse";

  const safeTool = tool || DEFAULT_PREP_TOOL_DATA;
  const launchModule = safeTool.launch_module || DEFAULT_PREP_TOOL_DATA.launch_module;
  const readinessGrid = safeTool.readiness_grid || DEFAULT_PREP_TOOL_DATA.readiness_grid;
  const effectiveTier = journeyTier ?? plan?.tier ?? journeyEnv.journeyCategory ?? "basic";

  return (
    <div className="flex flex-col mt-4">
      {/* Launcher Card (Large) */}
      <div className="relative bg-[#0e1e38] rounded-[16px] border border-white/10 overflow-hidden mb-[16px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#4a2d8a] via-[#6aa8f0] to-transparent opacity-80" />

        <div className="p-7 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-[44px] h-[44px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <MessageSquare className="text-white/75" size={21} strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                  {launchModule.title}
                </div>
                {isMultiCandidate && activeCandidate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#6aa8f0]/15 text-[#93c5fd] border border-[#6aa8f0]/30 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6aa8f0]" />
                    Preparing for: {activeCandidate.fullName || activeCandidate.label}
                    {activeCandidate.relation ? ` (${activeCandidate.relation})` : ""}
                  </span>
                )}
              </div>
              <h3 className=" text-[20px] sm:text-[22px] text-white/95 leading-tight">
                {launchModule.heading}
              </h3>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-[18px]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {launchModule?.cues?.map((cue: string, i: number) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-[10px] p-2.5 flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#6aa8f0]/60 mt-[5.5px] shrink-0" />
                <span className="text-[13px] text-white/55 leading-tight">{cue}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (guard && !guard()) return;
              setIsPrepLaunched(true);
              const baseUrl = "/interview-prep";
              const queryParams = new URLSearchParams();
              if (journeyId) queryParams.set("journey_id", journeyId);
              if (categorySlug) queryParams.set("category_slug", categorySlug);
              if (activeCandidateId) queryParams.set("candidate_id", activeCandidateId);
              const qs = queryParams.toString();
              const url = qs ? `${baseUrl}?${qs}` : baseUrl;
              setToolHref(url);
            }}
            className="w-full p-4 bg-[#3b7dd8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3b7dd8] transition-all shadow-[0_4px_20px_rgba(47,111,212,0.35)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Launch Interview Prep Tool</span>
            <ExternalLink size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {isPrepLaunched && (
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[10px] p-[16px_18px] mb-5 animate-in fade-in slide-in-from-top-1">
          <div className="text-[13px] font-bold text-[#15744f] mb-1">✓ Prep tool opened</div>
          <div className="text-[12px] text-[#3a4f63] leading-relaxed">
            Return here after your prep session. Review the readiness checklist below regularly
            before interview day.
          </div>
        </div>
      )}

      {/* Readiness Grid */}
      {readinessGrid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-[22px]">
          {readinessGrid.map((card: any, idx: number) => (
            <div
              key={idx}
              className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-4.5"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b8097] mb-2.5 border-b border-[#f1f5f9] pb-2">
                {card.title}
              </div>
              <div className="flex flex-col gap-2">
                {card.items.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-[5px] h-[5px] rounded-full bg-purple-600 mt-[6.5px] shrink-0 opacity-70" />
                    <span className="text-[13px] text-[#3a4f63] leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tool Overlay */}
      <ToolPageOverlay
        toolHref={toolHref}
        onClose={() => setToolHref(null)}
        showJourneyHeader
        tier={effectiveTier}
        plan={plan}
        toolProps={{
          journeyId,
          categorySlug,
          journeyCategory,
          journeyTier: effectiveTier,
          candidateId: activeCandidateId,
        }}
      />
    </div>
  );
};

