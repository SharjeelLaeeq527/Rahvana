"use client";

import { useRef, useEffect, useState } from "react";
import { Menu, BookOpen, Check } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import type { CandidateProfile } from "@/types/candidate";

interface HeaderProps {
  formTitle?: string;
  formSubtitle?: string;
  onOpenMenu?: () => void;
  showMenu?: boolean;
  isAutoSaving?: boolean;
  lastSavedAt?: string | null;
  activeCandidate?: CandidateProfile | null;
  candidates?: CandidateProfile[];
  onSelectCandidate?: (id: string) => void;
  isMultiCandidate?: boolean;
  /** True when the form is running outside a journey (standalone route). */
  isStandalone?: boolean;
  /** True when rendered inside an embedded container (e.g. journey step panel). */
  isEmbedded?: boolean;
  /** Called when the user clicks the close / back button in embedded mode. */
  onClose?: () => void;
  /** Hide the journey "Back" link when true */
  hideBack?: boolean;
  /** Hide the candidate switcher pill when true */
  hideCandidateSwitcher?: boolean;
}

export function Header({
  formTitle,
  formSubtitle,
  onOpenMenu,
  showMenu,
  isAutoSaving,
  lastSavedAt,
  isStandalone = false,
}: HeaderProps) {
  return (
    <div
      className="sticky top-0 backdrop-blur-xl border-b z-40 bg-white/90 w-full"
      style={{ borderColor: "rgba(13, 115, 119, 0.12)" }}
    >
      <div className="w-full px-4 sm:px-6 md:px-8 py-3">
        <div className="flex items-center justify-between gap-3 w-full">

          {/* Left: Form Info — aligned to the extreme left */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger (mobile only) */}
            {showMenu && (
              <button
                onClick={onOpenMenu}
                className="lg:hidden p-2 rounded-lg hover:bg-[#e8f6f6] text-[#0d7377] transition shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Teal icon badge */}
            <div
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl shrink-0"
              style={{ background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)" }}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>

            {/* Form title + subtitle */}
            <div className="min-w-0 text-left">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {formTitle || "Form"}
              </h1>
              {formSubtitle && (
                <p className="text-[11px] sm:text-xs text-gray-500 truncate hidden sm:block">
                  {formSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Save status — only shown in standalone mode */}
          {isStandalone && (isAutoSaving || lastSavedAt) && (
            <div className="flex items-center shrink-0">
              {isAutoSaving ? (
                <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium shadow-sm">
                  <Loader size="sm" />
                  <span>Saving...</span>
                </div>
              ) : lastSavedAt ? (
                <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-sm">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Saved</span>
                  <span className="text-xs font-normal text-emerald-700 opacity-80">
                    {formatRelativeTime(lastSavedAt)}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(iso?: string | null) {
  if (!iso) return "";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}
