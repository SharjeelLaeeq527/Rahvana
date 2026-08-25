// components/PacketSectionChecklist.tsx
//
// Interactive packet-assembly checklist rendered on step_1_13 (Assemble Filing
// Packet — mailing path). Reads the section list from JSON
// (step_1_13.action_data.packet_section_checklist) and lets the user check
// off each section as it goes into the physical mailing packet.
//
// Persists to state.metadata.packetChecklist as a key→boolean map.
//
// Source basis: USCIS I-130 paper filing instructions (uscis.gov/i-130)

import React, { useMemo } from "react";
import { PackageCheck, Square, CheckSquare, AlertCircle } from "lucide-react";

export interface PacketSectionConfig {
  id: string;
  label: string;
  position?: string;
  required?: boolean;
  required_when?: string;
}

export interface PacketChecklistConfig {
  title?: string;
  instruction?: string;
  sections: PacketSectionConfig[];
  source_basis?: string;
}

interface PacketSectionChecklistProps {
  config: PacketChecklistConfig | undefined | null;
  checked: Record<string, boolean> | undefined | null;
  onToggle: (next: Record<string, boolean>) => void;
}

export function PacketSectionChecklist({ config, checked, onToggle }: PacketSectionChecklistProps) {
  if (!config?.sections || config.sections.length === 0) return null;

  const checkedMap = checked ?? {};

  const requiredSections = useMemo(
    () => config.sections.filter((s) => s.required === true),
    [config.sections]
  );
  const conditionalSections = useMemo(
    () => config.sections.filter((s) => !!s.required_when),
    [config.sections]
  );

  const requiredDone = requiredSections.filter((s) => checkedMap[s.id]).length;
  const allRequiredDone = requiredDone === requiredSections.length;

  const handleToggle = (id: string) => {
    const next = { ...checkedMap, [id]: !checkedMap[id] };
    onToggle(next);
  };

  return (
    <div
      className="mt-[12px] px-3 sm:mb-7 sm:px-4 md:px-0"
      role="region"
      aria-label="Packet section checklist"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div
          className="rounded-[12px] border-[1.5px] p-4 sm:p-5"
          style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
        >
          {/* Header */}
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                  style={{
                    background: allRequiredDone ? "#ecfdf5" : "#eff6ff",
                    border: `1px solid ${allRequiredDone ? "#a7f3d0" : "#bfdbfe"}`,
                  }}
                >
                  <PackageCheck size={18} color={allRequiredDone ? "#065f46" : "#1e40af"} />
                </div>
                <h3 className="truncate text-[14px] leading-snug font-bold text-[#1c1917] sm:text-[15px]">
                  {config.title ?? "Packet section checklist"}
                </h3>
              </div>
              <div
                className="shrink-0 rounded px-2 py-0.5 text-[12px] font-bold whitespace-nowrap"
                style={{
                  background: allRequiredDone ? "#dcfce7" : "#dbeafe",
                  color: allRequiredDone ? "#065f46" : "#1e40af",
                }}
              >
                {requiredDone} / {requiredSections.length}
              </div>
            </div>
            <p className="w-full text-[12px] leading-relaxed text-[#57534e]">
              {config.instruction ??
                "Confirm each section is present and in correct order before mailing."}
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="mb-4 h-[6px] w-full overflow-hidden rounded-full"
            style={{ background: "#f1f5f9" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  requiredSections.length === 0 ? 0 : (requiredDone / requiredSections.length) * 100
                }%`,
                background: allRequiredDone ? "#16a34a" : "#3b82f6",
              }}
            />
          </div>

          {/* Required sections */}
          <div className="mb-4">
            <h4 className="mb-2 text-[11px] font-bold tracking-wider text-[#57534e] uppercase">
              Required sections ({requiredSections.length})
            </h4>
            <div
              className="overflow-hidden rounded-[8px] border bg-white"
              style={{ borderColor: "#e7e5e4" }}
            >
              {requiredSections.map((section, i) => {
                const isChecked = !!checkedMap[section.id];
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleToggle(section.id)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f5f4]"
                    style={{
                      borderBottom: i < requiredSections.length - 1 ? "1px solid #f5f5f4" : "none",
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare size={18} color="#16a34a" className="mt-0.5 shrink-0" />
                    ) : (
                      <Square size={18} color="#a8a29e" className="mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[12.5px] leading-snug font-semibold sm:text-[13px]"
                        style={{
                          color: isChecked ? "#15803d" : "#1c1917",
                          textDecoration: isChecked ? "line-through" : "none",
                          textDecorationColor: "#86efac",
                        }}
                      >
                        {section.label}
                      </div>
                      {section.position && (
                        <div className="mt-0.5 text-[11px] leading-tight text-[#78716c]">
                          Position: {section.position}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional sections */}
          {conditionalSections.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-[11px] font-bold tracking-wider text-[#57534e] uppercase">
                Conditional sections ({conditionalSections.length})
              </h4>
              <div
                className="overflow-hidden rounded-[8px] border bg-white"
                style={{ borderColor: "#e7e5e4" }}
              >
                {conditionalSections.map((section, i) => {
                  const isChecked = !!checkedMap[section.id];
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleToggle(section.id)}
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f5f4]"
                      style={{
                        borderBottom:
                          i < conditionalSections.length - 1 ? "1px solid #f5f5f4" : "none",
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={18} color="#16a34a" className="mt-0.5 shrink-0" />
                      ) : (
                        <Square size={18} color="#a8a29e" className="mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[12.5px] leading-snug font-semibold sm:text-[13px]"
                          style={{
                            color: isChecked ? "#15803d" : "#1c1917",
                            textDecoration: isChecked ? "line-through" : "none",
                            textDecorationColor: "#86efac",
                          }}
                        >
                          {section.label}
                        </div>
                        {section.required_when && (
                          <div className="mt-0.5 text-[11px] leading-snug text-[#92400e] italic">
                            Required when: {section.required_when}
                          </div>
                        )}
                        {section.position && (
                          <div className="mt-0.5 text-[11px] leading-tight text-[#78716c]">
                            Position: {section.position}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion advisory */}
          {!allRequiredDone && requiredDone > 0 && (
            <div
              className="mb-3 flex items-start gap-3 rounded-[10px] border p-3"
              style={{ background: "#fffbeb", borderColor: "#fde68a" }}
            >
              <AlertCircle size={16} color="#92400e" className="mt-0.5 shrink-0" />
              <p className="text-[11.5px] leading-relaxed" style={{ color: "#78350f" }}>
                {requiredSections.length - requiredDone} required section
                {requiredSections.length - requiredDone === 1 ? "" : "s"} remaining. Do not seal the
                envelope until every required section is in the packet.
              </p>
            </div>
          )}

          {allRequiredDone && (
            <div
              className="mb-3 flex items-start gap-3 rounded-[10px] border p-3"
              style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}
            >
              <PackageCheck size={16} color="#065f46" className="mt-0.5 shrink-0" />
              <p className="text-[11.5px] leading-relaxed" style={{ color: "#065f46" }}>
                All required sections are checked off. Do one final flip-through of the packet for
                legibility and page order before sealing.
              </p>
            </div>
          )}

          {/* Source */}
          <p className="text-[10.5px] leading-relaxed text-[#78716c] italic">
            Source:{" "}
            {config.source_basis ?? "USCIS I-130 paper filing instructions, uscis.gov/i-130"}.
            Advisory checklist, not legal advice. Verify the current USCIS instructions before
            mailing.
          </p>
        </div>
      </div>
    </div>
  );
}
