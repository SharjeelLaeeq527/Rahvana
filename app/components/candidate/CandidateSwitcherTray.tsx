// app/components/candidate/CandidateSwitcherTray.tsx
// ============================================================================
// Candidate Switcher Tray Component
// Rendered inside SiteHeader profile dropdown tray.
// Allows 1-click candidate profile switching, preview additions, and sync notices.
// ============================================================================

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Heart,
  Baby,
  UserPlus,
  Check,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCandidate } from "@/app/context/CandidateContext";
import type { CandidateProfile, CandidateRelation } from "@/types/candidate";
import { getJourneyHrefByType } from "@/lib/constants/routes";
import { AddCandidateModal } from "./AddCandidateModal";

const RELATION_ICONS: Record<CandidateRelation, React.ComponentType<{ className?: string }>> = {
  Mother: Heart,
  Father: Users,
  Stepparent: Users,
  AdoptiveParent: Heart,
  Child: Baby,
  Spouse: Heart,
  Other: Users,
};

const COLOR_STYLES: Record<string, { bg: string; text: string; ring: string; border: string }> = {
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    ring: "ring-purple-600",
    border: "border-purple-200 dark:border-purple-800",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-300",
    ring: "ring-teal-600",
    border: "border-teal-200 dark:border-teal-800",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-600",
    border: "border-blue-200 dark:border-blue-800",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-600",
    border: "border-amber-200 dark:border-amber-800",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-600",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-600",
    border: "border-rose-200 dark:border-rose-800",
  },
};

export function CandidateSwitcherTray({
  onCandidateSwitched,
}: {
  onCandidateSwitched?: () => void;
}) {
  const router = useRouter();
  const {
    candidates,
    activeCandidateId,
    setActiveCandidateId,
    activeCandidate,
    isMultiCandidate,
    removeCandidate,
  } = useCandidate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const visaCategory = activeCandidate.visaCategory || "IR-5";
  const isIr5 = visaCategory.toUpperCase().includes("IR-5") || visaCategory.toUpperCase().includes("IR5");
  const isIr2 = visaCategory.toUpperCase().includes("IR-2") || visaCategory.toUpperCase().includes("IR2");

  const handleSelectCandidate = (candidateId: string) => {
    setActiveCandidateId(candidateId);
    onCandidateSwitched?.();

    // If currently on a journey roadmap route, navigate to the selected candidate's journey route
    const target = candidates.find((c) => c.id === candidateId);
    if (target && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isRoadmapRoute =
        currentPath.includes("/visa-category/ir1-journey") ||
        currentPath.includes("/visa-category/ir5-journey") ||
        currentPath.includes("/ir-1-roadmap") ||
        currentPath.includes("/visa-category/ir-1") ||
        currentPath.includes("/visa-category/ir-5");

      if (isRoadmapRoute) {
        const targetRoute = getJourneyHrefByType(target.visaCategory);
        if (targetRoute && !currentPath.includes(targetRoute)) {
          router.push(targetRoute);
        }
      }
    }
  };

  return (
    <div className="border-b border-border py-2.5 px-3 bg-muted/20">
      {/* Header with sync status */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Beneficiary Profiles
          </span>
          {isMultiCandidate && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {candidates.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400" title="Sponsor information is automatically synced across all candidates">
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Sponsor synced</span>
        </div>
      </div>

      {/* Candidate list */}
      <div className="space-y-1.5">
        {candidates.map((candidate: CandidateProfile) => {
          const isActive = candidate.id === activeCandidateId;
          const Icon = RELATION_ICONS[candidate.relation] || Users;
          const style = COLOR_STYLES[candidate.colorTag || "teal"] || COLOR_STYLES.teal;

          return (
            <div
              key={candidate.id}
              className={`group/candidate relative flex items-center w-full rounded-lg transition-all ${
                isActive
                  ? `${style.bg} ${style.border} border shadow-xs ring-1 ${style.ring}`
                  : "hover:bg-muted/60 border border-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectCandidate(candidate.id)}
                className="flex items-center justify-between p-2 flex-1 min-w-0 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Avatar Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? "bg-white dark:bg-slate-900 shadow-xs" : "bg-muted"
                    } ${style.text}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Candidate Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {candidate.fullName && candidate.fullName !== candidate.relation
                          ? `${candidate.label}: ${candidate.fullName}`
                          : candidate.label}
                      </span>
                      {candidate.isPreview && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                          Preview
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {candidate.visaCategory} · {candidate.relation}
                    </div>
                  </div>
                </div>

                {/* Active checkmark */}
                {isActive && (
                  <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-1.5 shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Delete Candidate Button (available when more than 1 candidate exists) */}
              {candidates.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (confirm(`Are you sure you want to delete ${candidate.label}?`)) {
                      removeCandidate(candidate.id);
                    }
                  }}
                  className="p-1.5 mr-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all opacity-70 group-hover/candidate:opacity-100 shrink-0 cursor-pointer"
                  title={`Delete ${candidate.label}`}
                  aria-label={`Delete ${candidate.label}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Candidate (for IR-5 2nd parent or IR-2 children) */}
      <div className="mt-2 pt-1.5 border-t border-border/50">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/30"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>
            {isIr5
              ? candidates.length === 1
                ? "+ Add 2nd Parent (Preview)"
                : "+ Add Parent Profile"
              : isIr2
                ? "+ Add Child Profile"
                : "+ Add Beneficiary"}
          </span>
        </button>
      </div>

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        visaCategory={visaCategory}
      />
    </div>
  );
}
