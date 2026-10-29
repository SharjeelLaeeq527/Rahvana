"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  Camera,
  Calculator,
  MessageSquare,
  Scan,
  ShieldAlert,
  FileEdit,
  Languages,
  BookOpen,
  BookMarked,
  ShieldCheck,
  Activity,
  Compass,
  Briefcase,
  UserCheck,
  CalendarCheck,
  FileCheck,
  LifeBuoy,
  Clock,
  Files,
  PenTool,
  Wand2,
  Globe,
  FileText,
  Heart,
  Shield,
  Syringe,
  FileUp,
} from "lucide-react";
import { AppGroup } from "@/types/app-groups";
import {
  JOURNEY_APP_GROUPS,
  getJourneyAppGroups,
  getOverlayPageRoute,
} from "@/lib/constants/journey-app-groups";
import { AppGroupModal } from "./AppGroupModal";
import { preloadGuidePage } from "@/app/components/shared/GuidePageOverlay";
import { useCandidate } from "@/app/context/CandidateContext";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";

interface AppGroupGridProps {
  onLaunchTool: (componentKey: string) => void;
  groups?: AppGroup[];
  className?: string;
  state?: any;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Camera,
  Calculator,
  MessageSquare,
  Scan,
  ShieldAlert,
  FileEdit,
  Languages,
  BookOpen,
  BookMarked,
  ShieldCheck,
  Activity,
  Compass,
  Briefcase,
  UserCheck,
  CalendarCheck,
  FileCheck,
  LifeBuoy,
  Clock,
  Files,
  PenTool,
  Wand2,
  Globe,
  FileText,
  Heart,
  Shield,
  Syringe,
  FileUp,
};

export function AppGroupGrid({
  onLaunchTool,
  groups,
  className = "",
  state,
}: AppGroupGridProps) {
  const [selectedGroup, setSelectedGroup] = useState<AppGroup | null>(null);
  const { activeCandidateId, activeCandidate } = useCandidate();
  const { journeyCategory } = useJourneyEnvironment();

  const resolvedCategory =
    journeyCategory ||
    (activeCandidate?.visaCategory ? getBaseVisaCategory(activeCandidate.visaCategory) : null);

  const effectiveGroups = useMemo(() => {
    if (groups) return groups;
    return getJourneyAppGroups(resolvedCategory);
  }, [groups, resolvedCategory]);

  // Warming starts on hover, before the folder is even open, so a guide clicked
  // straight afterwards still has its chunk and its saved progress ready.
  const warmGroup = (group: AppGroup) => {
    const candidateId = activeCandidateId || "candidate-1";
    group.items.forEach((item) =>
      preloadGuidePage(getOverlayPageRoute(item.componentKey), candidateId)
    );
  };

  return (
    <section className={`w-full ${className}`}>
      {/* ── One compact row: title on the left, phone-style folders on the right ── */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Journey Toolbox &amp; Services
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Integrated tools, guides, and services for this journey
          </p>
        </div>

        <div className="flex items-start gap-5 sm:gap-6 ms-auto">
          {effectiveGroups.map((group) => {

            // Folder thumbnail: the first four item icons, like an app-group on a phone.
            const previewItems = group.items.slice(0, 4);

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group)}
                onMouseEnter={() => warmGroup(group)}
                onFocus={() => warmGroup(group)}
                title={`${group.title} (${group.items.length})`}
                aria-label={`${group.title}, ${group.items.length} items`}
                className="group flex w-[68px] cursor-pointer flex-col items-center gap-1.5 focus:outline-hidden"
              >
                <span
                  className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xs transition-all group-hover:-translate-y-0.5 group-hover:border-[#0d7377]/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-[#0d7377]/40 dark:border-slate-800 dark:bg-slate-900"
                  aria-hidden="true"
                >
                  {previewItems.map((item, idx) => {
                    const ThumbIcon = ICON_MAP[item.iconName] || Wrench;
                    return (
                      <span
                        key={idx}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800"
                        style={{ color: group.color }}
                      >
                        <ThumbIcon className="h-3.5 w-3.5" />
                      </span>
                    );
                  })}
                </span>

                <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600 group-hover:text-[#0d7377] dark:text-slate-300 dark:group-hover:text-teal-400">
                  {group.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── App Group Modal ── */}
      <AppGroupModal
        group={selectedGroup}
        isOpen={Boolean(selectedGroup)}
        onClose={() => setSelectedGroup(null)}
        state={state}
        onLaunchItem={(componentKey) => {
          setSelectedGroup(null);
          // Guides go through the SAME launch path as tools, so the journey nav
          // keeps its back arrow + "Dashboard / <item>" breadcrumb + close button.
          onLaunchTool(componentKey);
        }}
      />
    </section>
  );
}
