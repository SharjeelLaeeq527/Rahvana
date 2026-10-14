"use client";

import React, { useEffect, useState } from "react";
import { X, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

/**
 * A single read-through step from a journey guide (medical / PCC "do it yourself" path).
 * Supports both data shapes historically used across the journey roadmap JSON and the
 * spouse TS data files (sub|instruction, alert|warn).
 */
export interface JourneyGuideStep {
  label?: string;
  heading: string;
  sub?: string;
  instruction?: string;
  info?: string;
  alert?: string;
  warn?: string;
  guideUrl?: string;
  nav?: { back?: boolean; next?: string; done?: string };
}

interface JourneyGuideOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Small uppercase eyebrow shown above the heading (defaults to "Step N of M"). */
  eyebrowPrefix?: string;
  steps: JourneyGuideStep[];
}

/**
 * Full-screen overlay wizard for the "I'll do it myself" guide path. Read-through only —
 * it never books or files anything; it just walks the user through the official steps.
 */
export const JourneyGuideOverlay: React.FC<JourneyGuideOverlayProps> = ({
  open,
  onClose,
  eyebrowPrefix,
  steps,
}) => {
  const [index, setIndex] = useState(0);

  // Reset to the first step each time the overlay opens.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Lock background scroll while open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open || !steps || steps.length === 0) return null;

  const total = steps.length;
  const s = steps[Math.min(index, total - 1)];
  const pct = Math.round(((index + 1) / total) * 100);
  const isLast = index === total - 1;
  const body = s.sub || s.instruction;
  const notice = s.alert || s.warn;

  return (
    <div className="animate-in slide-in-from-bottom-[18px] fixed inset-0 z-[150] overflow-y-auto bg-white font-sans duration-[0.28s] ease-in-out">
      {/* Topbar: close + progress */}
      <div className="sticky top-0 z-10 flex h-[64px] items-center gap-3 border-b border-[#d0e4f7] bg-white px-4 sm:gap-4 sm:px-6">
        <button
          onClick={onClose}
          aria-label="Close"
          className="hover:bg-primary/10 focus:ring-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all outline-none focus:ring-2"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <div className="h-[5px] min-w-4 flex-1 overflow-hidden rounded-[10px] bg-[#d0e4f7]">
          <div
            className="h-full bg-linear-to-r transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: "#0f766e" }}
          />
        </div>
        <div className="shrink-0 text-[12px] font-medium whitespace-nowrap text-[#6b8097]">
          {index + 1} / {total}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-lg px-5 py-12">
        <div className="mb-2 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
          {eyebrowPrefix || `Step ${index + 1} of ${total}`}
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">{s.heading}</h2>
        {body && <p className="mb-6 text-sm leading-relaxed text-slate-600">{body}</p>}

        {/* {s.info && (
          <div className="mb-6 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
            {s.info}
          </div>
        )} */}

        {notice && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900">
            {notice}
          </div>
        )}

        {s.guideUrl && (
          <a
            href={s.guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:underline"
          >
            Open the full guide <ExternalLink size={14} />
          </a>
        )}

        <div className="mt-8 flex gap-3">
          {index > 0 && (
            <button
              onClick={() => setIndex((v) => Math.max(0, v - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-4 font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) onClose();
              else setIndex((v) => Math.min(total - 1, v + 1));
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 p-4 font-bold text-white transition-colors hover:bg-teal-800"
          >
            {isLast ? "Done" : s.nav?.next || "Next"}
            {!isLast && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyGuideOverlay;
