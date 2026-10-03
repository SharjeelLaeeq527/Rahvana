"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  ArrowRight,
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

interface AppGroupModalProps {
  group: AppGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchItem: (componentKey: string) => void;
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

export function AppGroupModal({ group, isOpen, onClose, onLaunchItem }: AppGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !group || !mounted) return null;

  const GroupIcon = ICON_MAP[group.iconName] || Wrench;

  const filteredItems = group.items.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalContent = (
    <div className="fixed inset-0 z-[100000] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="animate-in fade-in fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Centering Wrapper with top/bottom padding to prevent any top cut-off */}
      <div className="flex min-h-full items-center justify-center p-4 py-10 sm:p-6 sm:py-16">
        {/* Modal Card */}
        <div className="animate-in zoom-in-95 relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl duration-200 dark:border-slate-800 dark:bg-slate-900">
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

          {/* ── Items Grid / List ── */}
          <div className="flex-1 overflow-y-auto p-6">
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
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onClose();
                        onLaunchItem(item.componentKey);
                      }}
                      className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-[#0d7377]/40 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                    >
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs transition-transform group-hover:scale-105 dark:bg-slate-700"
                            style={{ color: group.color }}
                          >
                            <ItemIcon className="h-5 w-5" />
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#0d7377] opacity-0 transition-opacity group-hover:opacity-100">
                            <span>Launch</span>
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0d7377] dark:text-slate-100 dark:group-hover:text-teal-400">
                          {item.label}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] font-semibold text-teal-700 dark:border-slate-700/60 dark:text-teal-400">
                        <span>Auto-saves in Journey</span>
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
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
