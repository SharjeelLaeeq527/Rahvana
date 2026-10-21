// app/components/candidate/ActiveCandidateBadge.tsx
// ============================================================================
// Active Candidate Badge Component for SiteHeader Navbar
// Displays the active candidate (e.g. "Mother" / "Father") next to avatar.
// ============================================================================

"use client";

import React from "react";
import { Users, Heart, Baby } from "lucide-react";
import { useCandidate } from "@/app/context/CandidateContext";
import type { CandidateRelation } from "@/types/candidate";

const RELATION_ICONS: Record<CandidateRelation, React.ComponentType<{ className?: string }>> = {
  Mother: Heart,
  Father: Users,
  Stepparent: Users,
  AdoptiveParent: Heart,
  Child: Baby,
  Spouse: Heart,
  Other: Users,
};

export function ActiveCandidateBadge({
  onClick,
}: {
  onClick?: () => void;
}) {
  const { activeCandidate, isMultiCandidate } = useCandidate();

  // Category-agnostic (decision 2): the badge is a multi-candidate affordance, not an
  // IR-5/IR-2-only one. Only show it once the account genuinely has more than one candidate,
  // so a single-journey account (IR-1 or otherwise) is never crowded with it.
  if (!isMultiCandidate) return null;

  const Icon = RELATION_ICONS[activeCandidate.relation] || Users;
  const shortLabel =
    activeCandidate.relation === "Mother"
      ? "Mother"
      : activeCandidate.relation === "Father"
        ? "Father"
        : activeCandidate.relation === "Child"
          ? "Child"
          : activeCandidate.label;

  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors cursor-pointer"
      title={`Active Beneficiary: ${activeCandidate.label}. Click to switch in profile menu.`}
    >
      <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span className="truncate max-w-[100px]">{shortLabel}</span>
      {activeCandidate.isPreview && (
        <span className="px-1 rounded text-[8.5px] font-bold uppercase tracking-wider bg-amber-200/60 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
          Preview
        </span>
      )}
    </button>
  );
}
