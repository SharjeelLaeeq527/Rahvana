"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Heart,
  HeartOff,
  Wrench,
  Camera,
  Calculator,
  MessageSquare,
  Scan,
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
  Shield,
  Syringe,
  FileUp,
  Info,
} from "lucide-react";
import { useQuickAccess, type QuickAccessScope } from "@/app/context/QuickAccessContext";
import { useAuth } from "@/app/context/AuthContext";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Camera,
  Calculator,
  MessageSquare,
  Scan,
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

interface JourneyFavoritesTrayProps {
  /** journeys.id (UUID). From RoadmapLayoutEngine `state.backendId`. */
  journeyId?: string;
  /** Launch a journey tool by componentKey (== favorite item.id), same as "Open Tool". */
  onLaunchTool?: (componentKey: string) => void;
}

export function JourneyFavoritesTray({ journeyId, onLaunchTool }: JourneyFavoritesTrayProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const scope: QuickAccessScope | undefined = journeyId
    ? { type: "journey", journeyId }
    : undefined;

  // When journeyId is not ready yet, fall back to an empty account read so the
  // hook is still called unconditionally (hooks must not be conditional).
  const { items, isPending } = useQuickAccess(scope ?? { type: "account" });
  const journeyItems = scope ? items : [];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user || !journeyId) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Journey Favorites"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#d0e4f7] bg-white text-[#0d7377] shadow-xs transition-colors hover:bg-[#0d7377]/10"
      >
        <Heart className={`h-4 w-4 ${open ? "fill-[#0d7377]" : ""}`} />
        {journeyItems.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white/60 bg-[#0d7377] px-1 text-[9px] font-semibold text-white">
            {journeyItems.length > 9 ? "9+" : journeyItems.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[9999] mt-2 w-72 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 fill-[#0d7377] text-[#0d7377]" />
              <span className="text-sm font-bold text-slate-900">Journey Favorites</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              {journeyItems.length}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isPending && journeyItems.length === 0 ? (
              <div className="px-6 py-10 text-center text-xs text-slate-400">Loading…</div>
            ) : journeyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <Heart className="h-5 w-5 text-[#0d7377]/40" />
                <p className="text-sm font-semibold text-slate-700">No favorites in this journey</p>
                <p className="max-w-[210px] text-xs leading-relaxed text-slate-400">
                  Tap the heart on any tool, guide, or service in the Journey Toolbox to pin it
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {journeyItems.map((item) => {
                  const Icon = (item.icon_name && ICON_MAP[item.icon_name]) || Wrench;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0d7377]/10 text-[#0d7377]">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onLaunchTool?.(item.id);
                        }}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-800 hover:text-[#0d7377]"
                        title={`Open ${item.title}`}
                      >
                        {item.title}
                      </button>
                      <UnfavoriteButton id={item.id} scope={{ type: "journey", journeyId }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Small scoped remove control (keeps the row's Link click independent). */
function UnfavoriteButton({ id, scope }: { id: string; scope: QuickAccessScope }) {
  const { removeItem } = useQuickAccess(scope);
  return (
    <button
      type="button"
      title="Unfavorite"
      onClick={() => removeItem(id)}
      className="rounded-md p-1.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
    >
      <HeartOff className="h-3.5 w-3.5" />
    </button>
  );
}
