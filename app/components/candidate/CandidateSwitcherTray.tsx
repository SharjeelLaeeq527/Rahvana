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
  Pencil,
  Trash2,
  X,
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
    updateCandidate,
    removeCandidate,
  } = useCandidate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inline name editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (candidate: CandidateProfile) => {
    setEditingId(candidate.id);
    // Seed with the current name (fall back to empty so the placeholder shows).
    setEditName(
      candidate.fullName && candidate.fullName !== candidate.relation ? candidate.fullName : ""
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = (candidateId: string) => {
    const trimmed = editName.trim();
    updateCandidate(candidateId, { fullName: trimmed });
    cancelEdit();
  };

  const visaCategory = activeCandidate.visaCategory || "IR-5";

  const handleSelectCandidate = (candidateId: string) => {
    setActiveCandidateId(candidateId);
    onCandidateSwitched?.();

    // If currently on a journey roadmap route, navigate to the selected candidate's journey route
    const target = candidates.find((c) => c.id === candidateId);
    if (target && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      // Any journey roadmap route (category-agnostic). When switching to a candidate of a
      // different category, navigate to that category's roadmap so the URL, active candidate,
      // and loaded journey stay in sync.
      const isRoadmapRoute =
        currentPath.includes("/visa-category/") || currentPath.includes("-roadmap");

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

          const isEditing = editingId === candidate.id;

          return (
            <div
              key={candidate.id}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                isActive
                  ? `${style.bg} ${style.border} border shadow-xs ring-1 ${style.ring}`
                  : "hover:bg-muted/60 border border-transparent"
              }`}
            >
              {/* Selectable area (switch candidate). Disabled while editing this row. */}
              <button
                type="button"
                onClick={() => !isEditing && handleSelectCandidate(candidate.id)}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              >
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
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(candidate.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder={`${candidate.relation}'s full name`}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {candidate.fullName && candidate.fullName !== candidate.relation
                            ? `${candidate.label}: ${candidate.fullName}`
                            : candidate.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {candidate.visaCategory}
                      </div>
                    </>
                  )}
                </div>
              </button>

              {/* Right-side controls */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveEdit(candidate.id)}
                      title="Save name"
                      className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs hover:bg-primary/90"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      title="Cancel"
                      className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/70"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(candidate)}
                      title="Edit name"
                      className="w-6 h-6 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {candidate.id !== "candidate-1" && candidates.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (
                            confirm(
                              `Are you sure you want to delete ${
                                candidate.fullName || candidate.label
                              }?`
                            )
                          ) {
                            removeCandidate(candidate.id);
                          }
                        }}
                        title={`Delete ${candidate.label}`}
                        aria-label={`Delete ${candidate.label}`}
                        className="w-6 h-6 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {isActive && (
                      <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate - category-agnostic entry (a candidate is a person/beneficiary; the
          journey is the system's result). The modal picks the exact relation/category. */}
      <div className="mt-2 pt-1.5 border-t border-border/50">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/30"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Candidate</span>
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
