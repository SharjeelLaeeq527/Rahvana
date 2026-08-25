"use client";

import React, { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Calendar,
  Globe,
  ShieldAlert,
  AlertTriangle,
  Info,
  CircleCheck,
  CircleDashed,
  ChevronDown,
} from "lucide-react";
import {
  detectRiskFlags,
  detectRiskFlagsFromEligibilityQuest,
  type RiskFlag,
} from "@/lib/case-strength";
import type { ConsistencyBaseline } from "./ConsistencyBaselineCapture";
import type { BeneficiaryBaseline } from "./BeneficiaryResidenceCapture";

interface PreSubmissionSnapshotProps {
  consistencyBaseline?: ConsistencyBaseline | null;
  beneficiaryBaseline?: BeneficiaryBaseline | null;
  filingMethod?: string;
  eligibilityAnswers?: Record<string, Record<string, string | string[]> | undefined> | null;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface ChecklistRow {
  label: string;
  value: string;
  captured: boolean;
}

const SEV_STYLE: Record<
  RiskFlag["severity"],
  {
    rowBg: string;
    rowBorder: string;
    titleColor: string;
    fg: string;
    chipBg: string;
    chipFg: string;
    label: string;
    iconColor: string;
    Icon: React.ComponentType<{ size?: number }>;
  }
> = {
  critical: {
    rowBg: "#fff8f8",
    rowBorder: "#fecaca",
    titleColor: "#991b1b",
    fg: "#7f1d1d",
    chipBg: "#fee2e2",
    chipFg: "#7f1d1d",
    label: "Critical",
    iconColor: "#dc2626",
    Icon: ShieldAlert,
  },
  warning: {
    rowBg: "#fffdf5",
    rowBorder: "#fde68a",
    titleColor: "#92400e",
    fg: "#78350f",
    chipBg: "#fef3c7",
    chipFg: "#78350f",
    label: "Warning",
    iconColor: "#d97706",
    Icon: AlertTriangle,
  },
  advisory: {
    rowBg: "#f8fbff",
    rowBorder: "#bfdbfe",
    titleColor: "#1e40af",
    fg: "#1e3a8a",
    chipBg: "#dbeafe",
    chipFg: "#1e3a8a",
    label: "Note",
    iconColor: "#3b82f6",
    Icon: Info,
  },
};

function FlagRow({ flag, defaultOpen }: { flag: RiskFlag; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const s = SEV_STYLE[flag.severity];
  const Icon = s.Icon;
  return (
    <div
      className="rounded-[8px] border overflow-hidden"
      style={{ borderColor: s.rowBorder, background: s.rowBg }}
    >
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon size={14} style={{ color: s.iconColor }} />
        <span
          className="flex-1 text-[12.5px] font-semibold leading-snug"
          style={{ color: s.titleColor }}
        >
          {flag.title}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
          style={{ background: s.chipBg, color: s.chipFg }}
        >
          {s.label}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: s.iconColor,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
          className="shrink-0"
        />
      </button>
      {open && (
        <div className="px-3 pb-2.5 pt-0.5 border-t" style={{ borderColor: s.rowBorder }}>
          <p className="text-[11.5px] leading-relaxed" style={{ color: s.fg }}>
            {flag.advisory}
          </p>
          <p className="text-[10px] text-[#a8a29e] mt-1 leading-snug">{flag.source_basis}</p>
        </div>
      )}
    </div>
  );
}

export function PreSubmissionSnapshot({
  consistencyBaseline,
  beneficiaryBaseline,
  filingMethod,
  eligibilityAnswers,
}: PreSubmissionSnapshotProps) {
  const allFlags: RiskFlag[] = useMemo(() => {
    const fromDates = consistencyBaseline?.marriageDate
      ? detectRiskFlags({
          marriage_date: consistencyBaseline.marriageDate,
          petitioner_dob: consistencyBaseline.petitionerDateOfBirth,
          beneficiary_dob: consistencyBaseline.beneficiaryDateOfBirth,
        })
      : [];
    const fromQuest = detectRiskFlagsFromEligibilityQuest(eligibilityAnswers);
    const seen = new Set<string>();
    const out: RiskFlag[] = [];
    for (const f of [...fromDates, ...fromQuest]) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        out.push(f);
      }
    }
    const order: Record<RiskFlag["severity"], number> = { critical: 0, warning: 1, advisory: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [
    consistencyBaseline?.marriageDate,
    consistencyBaseline?.petitionerDateOfBirth,
    consistencyBaseline?.beneficiaryDateOfBirth,
    eligibilityAnswers,
  ]);

  const criticalCount = allFlags.filter((f) => f.severity === "critical").length;
  const warningCount = allFlags.filter((f) => f.severity === "warning").length;

  const dateRows: ChecklistRow[] = [
    {
      label: "Marriage date",
      value: fmtDate(consistencyBaseline?.marriageDate),
      captured: !!consistencyBaseline?.marriageDate,
    },
    {
      label: "Petitioner date of birth",
      value: fmtDate(consistencyBaseline?.petitionerDateOfBirth),
      captured: !!consistencyBaseline?.petitionerDateOfBirth,
    },
    {
      label: "Beneficiary date of birth",
      value: fmtDate(consistencyBaseline?.beneficiaryDateOfBirth),
      captured: !!consistencyBaseline?.beneficiaryDateOfBirth,
    },
  ];

  const residenceRows: ChecklistRow[] = [
    {
      label: "Current country",
      value: beneficiaryBaseline?.currentCountry ?? "",
      captured: !!beneficiaryBaseline?.currentCountry,
    },
    {
      label: "Current city",
      value: beneficiaryBaseline?.currentCity ?? "",
      captured: !!beneficiaryBaseline?.currentCity,
    },
    {
      label: "Other countries (last 5 yrs)",
      value: beneficiaryBaseline?.additionalCountries?.length
        ? beneficiaryBaseline.additionalCountries.join(", ")
        : "None",
      captured: true,
    },
  ];

  const missingDates = dateRows.filter((r) => !r.captured).length;
  const missingResidence = residenceRows.filter((r) => !r.captured).length;

  return (
    <div className="mt-3" role="region" aria-label="Pre-submission snapshot">
      <div
        className="rounded-[12px] border-[1.5px] overflow-hidden"
        style={{ borderColor: "#e7e5e4" }}
      >
        {/* Header strip */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: "#fafaf9", borderBottom: "1px solid #f0ece8" }}
        >
          <ClipboardCheck size={15} color="#1e40af" className="shrink-0" />
          <span className="text-[13px] font-semibold text-[#1c1917] flex-1">
            Pre-submission snapshot
          </span>
          {filingMethod && (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]">
              {filingMethod}
            </span>
          )}
        </div>

        <div className="p-3 sm:p-4 flex flex-col gap-4" style={{ background: "#fefefe" }}>
          {/* Risk flags — only when present */}
          {allFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={13} color={criticalCount > 0 ? "#dc2626" : "#d97706"} />
                <span className="text-[11.5px] font-bold text-[#1c1917] flex-1">
                  Outstanding risk signals
                </span>
                <div className="flex items-center gap-1">
                  {criticalCount > 0 && (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#fee2e2] text-[#7f1d1d]">
                      {criticalCount} critical
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f]">
                      {warningCount} warning
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {allFlags.map((f) => (
                  <FlagRow key={f.id} flag={f} defaultOpen={false} />
                ))}
              </div>
            </div>
          )}

          {/* Key dates */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={13} color="#1e40af" />
              <span className="text-[11.5px] font-bold text-[#1c1917] flex-1">
                Key dates, I-130
              </span>
              {missingDates > 0 && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f]">
                  {missingDates} missing
                </span>
              )}
            </div>
            <div className="rounded-[8px] border bg-white" style={{ borderColor: "#e7e5e4" }}>
              {dateRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{ borderBottom: i < dateRows.length - 1 ? "1px solid #f5f5f4" : "none" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {row.captured ? (
                      <CircleCheck size={13} color="#16a34a" className="shrink-0" />
                    ) : (
                      <CircleDashed size={13} color="#a8a29e" className="shrink-0" />
                    )}
                    <span className="text-[12px] text-[#3a4f63] truncate">{row.label}</span>
                  </div>
                  <span
                    className="text-[12px] font-semibold whitespace-nowrap"
                    style={{ color: row.captured ? "#1c1917" : "#a8a29e" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Beneficiary residence */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={13} color="#155e75" />
              <span className="text-[11.5px] font-bold text-[#1c1917] flex-1">
                Beneficiary residence, I-130A
              </span>
              {missingResidence > 0 && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f]">
                  {missingResidence} missing
                </span>
              )}
            </div>
            <div className="rounded-[8px] border bg-white" style={{ borderColor: "#e7e5e4" }}>
              {residenceRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-2.5 gap-3"
                  style={{
                    borderBottom: i < residenceRows.length - 1 ? "1px solid #f5f5f4" : "none",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {row.captured ? (
                      <CircleCheck size={13} color="#16a34a" className="shrink-0" />
                    ) : (
                      <CircleDashed size={13} color="#a8a29e" className="shrink-0" />
                    )}
                    <span className="text-[12px] text-[#3a4f63] truncate">{row.label}</span>
                  </div>
                  <span
                    className="text-[12px] font-semibold text-right max-w-[55%]"
                    style={{ color: row.captured ? "#1c1917" : "#a8a29e" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit reminder */}
          <div
            className="rounded-[8px] border p-3 text-[11.5px] leading-relaxed"
            style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}
          >
            <strong>Before clicking Submit on USCIS:</strong> confirm names, dates, and addresses on
            the portal review screen match the values above.
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2.5 border-t"
          style={{ borderColor: "#f0ece8", background: "#fafaf9" }}
        >
          <p className="text-[10.5px] text-[#a8a29e] leading-snug">
            Advisory only, not legal advice. Values reflect only what you captured in Rahvana.
          </p>
        </div>
      </div>
    </div>
  );
}
