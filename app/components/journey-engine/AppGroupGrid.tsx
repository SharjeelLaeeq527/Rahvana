"use client";

import React, { useState } from "react";
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
  ArrowRight,
} from "lucide-react";
import { AppGroup } from "@/types/app-groups";
import { JOURNEY_APP_GROUPS } from "@/lib/constants/journey-app-groups";
import { AppGroupModal } from "./AppGroupModal";

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
  groups = JOURNEY_APP_GROUPS,
  className = "",
  state,
}: AppGroupGridProps) {
  const [selectedGroup, setSelectedGroup] = useState<AppGroup | null>(null);

  return (
    <section className={`w-full ${className}`}>
      {/* ── Section Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Journey Toolbox &amp; Services
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integrated tools, guides, and services for this journey
            </p>
          </div>
        </div>

        <span className="hidden rounded-full border border-teal-500/20 bg-teal-50/80 px-2.5 py-1 text-[11px] font-bold text-[#0d7377] sm:inline-flex dark:bg-teal-950/40 dark:text-teal-300">
          Auto-Saved
        </span>
      </div>

      {/* ── 3 Folder Tiles ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {groups.map((group) => {
          const GroupIcon = ICON_MAP[group.iconName] || Wrench;
          // Preview first 4 item icons for folder thumbnail
          const previewItems = group.items.slice(0, 4);

          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#0d7377]/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                {/* Top Row: Main Icon + Thumbnail Folder + Item Count Badge */}
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${group.color}15`,
                      color: group.color,
                    }}
                  >
                    <GroupIcon className="h-6 w-6" />
                  </div>

                  {/* 2x2 Folder Thumbnail Preview */}
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1.5 shadow-2xs dark:border-slate-700 dark:bg-slate-800/80">
                    {previewItems.map((item, idx) => {
                      const ThumbIcon = ICON_MAP[item.iconName] || Wrench;
                      return (
                        <div
                          key={idx}
                          className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-slate-500 shadow-2xs dark:bg-slate-700 dark:text-slate-300"
                        >
                          <ThumbIcon className="h-3 w-3" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Title and Description */}
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#0d7377] dark:text-slate-100 dark:group-hover:text-teal-400">
                    {group.title}
                  </h4>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {group.items.length}
                  </span>
                </div>

                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {group.description}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-[#0d7377] dark:border-slate-800 dark:text-teal-400">
                <span>Browse {group.id}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── App Group Modal ── */}
      <AppGroupModal
        group={selectedGroup}
        isOpen={Boolean(selectedGroup)}
        onClose={() => setSelectedGroup(null)}
        state={state}
        onLaunchItem={(componentKey) => {
          setSelectedGroup(null);
          onLaunchTool(componentKey);
        }}
      />
    </section>
  );
}
