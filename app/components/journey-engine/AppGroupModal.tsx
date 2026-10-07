"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  ArrowRight,
  Lock,
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
  Info,
} from "lucide-react";
import { AppGroup } from "@/types/app-groups";
import { TOOL_FEATURE_MAP, getOverlayPageRoute } from "@/lib/constants/journey-app-groups";
import { preloadGuidePage } from "@/app/components/shared/GuidePageOverlay";
import { useJourneyPlan } from "@/app/context/useJourneyPlan";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { useCandidate } from "@/app/context/CandidateContext";
import { JourneyPlanBadge } from "@/app/components/shared/JourneyPlanBadge";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";

interface AppGroupModalProps {
  group: AppGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchItem: (componentKey: string) => void;
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
  Info,
};

export function AppGroupModal({ group, isOpen, onClose, onLaunchItem, state }: AppGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);

  const plan = useJourneyPlan(state);
  const { activeCandidateId } = useCandidate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Warm the chunk AND the saved progress of every page-backed item (guides) as soon as
  // the folder opens, so launching one renders instantly instead of hitting a loader.
  useEffect(() => {
    if (!isOpen || !group) return;
    const candidateId = activeCandidateId || "candidate-1";
    group.items.forEach((item) =>
      preloadGuidePage(getOverlayPageRoute(item.componentKey), candidateId)
    );
  }, [isOpen, group, activeCandidateId]);

  if (!isOpen || !group || !mounted) return null;

  const GroupIcon = ICON_MAP[group.iconName] || Wrench;

  const filteredItems = group.items.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isServicesGroup = group.title.toLowerCase() === "services";

  const modalContent = (
    <>
      {upgradeFeature && (
        <UpgradeModal feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} />
      )}

      <div className="fixed inset-0 z-[100000] overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <div
          className="animate-in fade-in fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Padding + card max-h must total <= 100dvh, otherwise the overlay itself scrolls a little */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          {/* Modal Card */}
          <div className="animate-in zoom-in-95 relative z-10 flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl duration-200 dark:border-slate-800 dark:bg-slate-900">
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs"
                  style={{ backgroundColor: `${group.color}15`, color: group.color }}
                >
                  <GroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-slate-100">
                    {group.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Search Bar ── */}
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${group.title.toLowerCase()}...`}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-10 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/20 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {isServicesGroup && (
              <div className="shrink-0 px-6 pt-3">
                <ExpandableTooltip
                  icon={<Info size={12} />}
                  title="Scoped to this journey"
                  message="Anything you request from this modal is tagged to this journey and only appears here. Requests you filed from the standalone service pages will not show up inside journey."
                  defaultOpen={false}
                />
              </div>
            )}

            {/* ── Items Grid / List ── */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    No tools or items matched &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredItems.map((item) => {
                    const ItemIcon = ICON_MAP[item.iconName] || Wrench;
                    const featureKey = TOOL_FEATURE_MAP[item.componentKey];
                    const isLocked = featureKey ? plan.isLocked(featureKey) : false;
                    const targetTier = featureKey
                      ? plan.entitlement(featureKey)?.upgradeTarget
                      : null;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isLocked && featureKey) {
                            setUpgradeFeature(featureKey);
                          } else {
                            onClose();
                            onLaunchItem(item.componentKey);
                          }
                        }}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                          isLocked
                            ? "border-slate-200/90 bg-white/95 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60"
                            : "border-slate-200/80 bg-slate-50/50 hover:border-[#0d7377]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs transition-transform group-hover:scale-105 dark:bg-slate-700"
                              style={{ color: group.color }}
                            >
                              <ItemIcon className="h-5 w-5" />
                            </div>

                            {isLocked ? (
                              <JourneyPlanBadge tier={targetTier || "premium"} />
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#0d7377] opacity-0 transition-opacity group-hover:opacity-100 dark:text-teal-400">
                                <span>Launch</span>
                                <ArrowRight className="h-3 w-3" />
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0d7377] dark:text-slate-100 dark:group-hover:text-teal-400">
                            {item.label}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-slate-700/60">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {isLocked ? (
                              <span className="capitalize">
                                {targetTier ? `${targetTier} Plan` : "Upgrade Required"}
                              </span>
                            ) : (
                              <span>Auto-saves in Journey</span>
                            )}
                          </span>

                          {isLocked ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (featureKey) {
                                  setUpgradeFeature(featureKey);
                                } else {
                                  onClose();
                                  onLaunchItem(item.componentKey);
                                }
                              }}
                              className="flex items-center gap-1.5 text-xs font-semibold text-[#0d7377] decoration-2 underline-offset-2 transition-all hover:underline dark:text-[#32e0c4]"
                            >
                              <Lock size={13} className="mb-[0.5px]" />
                              <span>Unlock</span>
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#0d7377] decoration-2 underline-offset-2 group-hover:underline dark:text-teal-400">
                              <span>Open Tool</span>
                              <ArrowRight
                                size={13}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer Notice ── */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/75 px-6 py-3.5 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
              Tools launched here are bound to your active candidate profile and auto-sync progress.
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
