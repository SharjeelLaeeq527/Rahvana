"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { JourneyServiceRecord } from "@/lib/journey/toolModeGuards";
import { JourneyGuideOverlay, type JourneyGuideStep } from "./JourneyGuideOverlay";

export interface ServiceDecisionPath {
  id: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  note?: string;
}

interface JourneyServiceModuleProps {
  chips: { label: string; type?: string }[];
  decision: {
    eyebrow: string;
    heading: string;
    paths: ServiceDecisionPath[];
  };
  guideSteps: JourneyGuideStep[];
  guideEyebrow?: string;
  disclaimer?: string;
  record: JourneyServiceRecord | null;
  locked: boolean;
  /** Opens the live service overlay (first / "service" path). */
  onOpen: () => void;
  /** Heading shown above the summary card (e.g. "Your Medical Appointment"). */
  summaryTitle: string;
  /** Key/value rows shown in the summary card when a record exists. */
  summaryRows: [string, string | undefined][];
  /** Copy shown in the empty (not-yet-requested) state. */
  summaryEmptyText: string;
  /** Overrides the disabled-tile hint (default: "Active until {referenceDate}"). */
  lockedHint?: string;
  /** Extra content rendered below the summary card (e.g. PCC pending/received lifecycle cards). */
  afterSummary?: React.ReactNode;
}

/**
 * Shared journey module for the tier-gated services (medical booking / PCC filing).
 * Renders the "how would you like to …" decision card (two paths), a clean Sponsorship-style
 * summary card below it, and a read-through guide overlay for the self-service path.
 */
export const JourneyServiceModule: React.FC<JourneyServiceModuleProps> = ({
  chips,
  decision,
  guideSteps,
  guideEyebrow,
  disclaimer,
  record,
  locked,
  onOpen,
  summaryTitle,
  summaryRows,
  summaryEmptyText,
  lockedHint,
  afterSummary,
}) => {
  const [guideOpen, setGuideOpen] = useState(false);
  const hasRecord = Boolean(record && Object.keys(record).length > 0);

  return (
    <div className="mb-[28px] w-full">
      {/* Decision card (two paths) */}
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/5 bg-[#0e1e38] shadow-2xl">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-linear-to-r from-teal-500 to-blue-500 opacity-75" />
        <div className="p-8">
          <div className="mb-1 text-[10px] font-black tracking-widest text-white/30 uppercase">
            {decision.eyebrow}
          </div>
          <div className="mb-6 text-xl font-bold text-white/95">{decision.heading}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {decision.paths.map((p) => {
              const isService = p.id === "service";
              const disabled = isService && locked;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (isService) {
                      onOpen();
                    } else {
                      setGuideOpen(true);
                    }
                  }}
                  disabled={disabled}
                  className={`group rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all active:translate-y-0 ${
                    disabled
                      ? "cursor-not-allowed opacity-60"
                      : "hover:-translate-y-1 hover:bg-white/10"
                  }`}
                >
                  <div className="mb-3 text-2xl transition-transform group-hover:scale-110">
                    {p.icon}
                  </div>
                  <div className="mb-1 text-sm font-bold text-white">{p.title}</div>
                  <div className="text-[10px] leading-relaxed text-white/50">{p.sub}</div>
                  {p.note && <div className="mt-2 text-[10px] text-white/40">{p.note}</div>}
                  {disabled && (lockedHint ?? record?.referenceDate) && (
                    <div className="mt-2 text-[10px] font-semibold text-teal-300">
                      {lockedHint ?? `Active until ${record?.referenceDate}`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {disclaimer && (
        <p className="mb-5 text-center text-[11.5px] leading-[1.65] text-[#6b8097]">{disclaimer}</p>
      )}

      {/* Summary card (Sponsorship style) */}
      <div className="w-full">
        <div className="mb-[12px] text-[12px] font-semibold tracking-wide text-[#6b8097] uppercase">
          {summaryTitle}
        </div>
        {!hasRecord ? (
          <div className="rounded-[10px] border-[1.5px] border-dashed border-[#d0e4f7] bg-[#fafcff] p-[24px] text-center">
            <div className="text-[14px] leading-[1.6] text-[#6b8097]">{summaryEmptyText}</div>
          </div>
        ) : (
          <div className="animate-in fade-in rounded-[10px] border-[1.5px] border-[#d0e4f7] bg-[#fafcff] p-[20px] duration-300">
            <div className="mb-[14px] flex items-center justify-between">
              <div className="text-[10px] font-bold tracking-widest text-[#3b7dd8] uppercase">
                Request Summary
              </div>
              <div className="flex items-center gap-1.5 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                <CheckCircle2 size={12} />
                {record?.status ? record.status : "Requested"}
              </div>
            </div>
            <div className="flex flex-col gap-[6px]">
              {summaryRows
                .filter(([, v]) => Boolean(v))
                .map(([k, v], i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between border-b border-[#d0e4f7]/50 py-[6px] text-[13px] last:border-b-0"
                  >
                    <span className="text-[#6b8097]">{k}</span>
                    <span className="max-w-[60%] text-right font-semibold text-[#0c1b33]">{v}</span>
                  </div>
                ))}
            </div>
            {!locked && (
              <button
                type="button"
                onClick={onOpen}
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-teal-700 hover:underline"
              >
                Start a new request <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {afterSummary}

      {/* Guide overlay (self-service path) */}
      <JourneyGuideOverlay
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        eyebrowPrefix={guideEyebrow}
        steps={guideSteps}
      />
    </div>
  );
};

export default JourneyServiceModule;
