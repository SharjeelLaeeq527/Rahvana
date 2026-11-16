"use client";

import { useEffect, useRef } from "react";
import {
  BookOpen,
  Briefcase,
  Calculator,
  Camera,
  Clock,
  FileText,
  FileUp,
  Files,
  Globe,
  Heart,
  LifeBuoy,
  MessageSquare,
  PenTool,
  Shield,
  Syringe,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useQuickAccess } from "@/app/context/QuickAccessContext";

/** Lucide icons the toolbox items use (lib/constants/journey-app-groups.ts). */
const ICONS: Record<string, LucideIcon> = {
  BookOpen, Briefcase, Calculator, Camera, Clock, FileText, FileUp, Files,
  Globe, Heart, LifeBuoy, MessageSquare, PenTool, Shield, Syringe, Wrench,
};

const MAX_ON_ARC = 9;

/**
 * This journey's favourites fanned out on an arc above the Favourites shortcut.
 * Rendered inside the shortcut's positioned wrapper; closes on Esc / outside click.
 */
export function FavouritesFan({
  journeyId,
  onClose,
  onLaunch,
  onShowAll,
}: {
  journeyId?: string;
  onClose: () => void;
  onLaunch: (componentKey: string) => void;
  onShowAll: () => void;
}) {
  const { items, isPending } = useQuickAccess(journeyId ? { type: "journey", journeyId } : { type: "account" });
  const list = journeyId ? items : [];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => {
      const host = ref.current?.parentElement;
      if (host && !host.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  const shown = list.slice(0, list.length > MAX_ON_ARC ? MAX_ON_ARC - 1 : MAX_ON_ARC);
  const extra = list.length - shown.length;
  const slots = shown.length + (extra > 0 ? 1 : 0);
  // Upper half-circle, wider radius as it fills up.
  const radius = slots <= 3 ? 78 : slots <= 6 ? 100 : 122;
  const spread = slots <= 1 ? 0 : Math.min(170, 40 + slots * 18);
  const angleAt = (i: number) => (slots <= 1 ? -90 : -90 - spread / 2 + (spread * i) / (slots - 1));
  const pos = (i: number) => {
    const a = (angleAt(i) * Math.PI) / 180;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  };

  return (
    <div ref={ref} className="fan" role="menu" aria-label="Journey favourites">
      {isPending && list.length === 0 ? (
        <div className="fan-msg">Loading favourites</div>
      ) : list.length === 0 ? (
        <div className="fan-msg">
          <b>No favourites yet</b>
          Tap the heart on any tool, guide or service in the toolbox to pin it here.
        </div>
      ) : (
        <>
          {shown.map((item, i) => {
            const Ico = (item.icon_name && ICONS[item.icon_name]) || Wrench;
            const { x, y } = pos(i);
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="fan-i"
                style={{ ["--x" as string]: `${x}px`, ["--y" as string]: `${y}px`, animationDelay: `${i * 35}ms` }}
                onClick={() => onLaunch(item.id)}
                aria-label={item.title}
              >
                <Ico size={19} strokeWidth={1.9} />
                <span className="fan-l">{item.title}</span>
              </button>
            );
          })}
          {extra > 0 &&
            (() => {
              const { x, y } = pos(shown.length);
              return (
                <button
                  type="button"
                  role="menuitem"
                  className="fan-i more"
                  style={{ ["--x" as string]: `${x}px`, ["--y" as string]: `${y}px`, animationDelay: `${shown.length * 35}ms` }}
                  onClick={onShowAll}
                  aria-label={`Show all ${list.length} favourites`}
                >
                  +{extra}
                  <span className="fan-l">Show all</span>
                </button>
              );
            })()}
        </>
      )}
    </div>
  );
}
