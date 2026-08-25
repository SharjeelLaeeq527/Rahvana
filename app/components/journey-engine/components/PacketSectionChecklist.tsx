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
      className="mt-[12px] px-3 sm:px-4 md:px-0"
      role="region"
      aria-label="Packet section checklist"
    >
      <div className="max-w-3xl w-full mx-auto">
        <div
          className="rounded-[12px] border-[1.5px] p-4 sm:p-5"
          style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
        >
          {/* Header */}
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    background: allRequiredDone ? "#ecfdf5" : "#eff6ff",
                    border: `1px solid ${allRequiredDone ? "#a7f3d0" : "#bfdbfe"}`,
                  }}
                >
                  <PackageCheck size={18} color={allRequiredDone ? "#065f46" : "#1e40af"} />
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-bold text-[#1c1917] leading-snug truncate">
                  {config.title ?? "Packet section checklist"}
                </h3>
              </div>
              <div
                className="text-[12px] font-bold whitespace-nowrap px-2 py-0.5 rounded shrink-0"
                style={{
                  background: allRequiredDone ? "#dcfce7" : "#dbeafe",
                  color: allRequiredDone ? "#065f46" : "#1e40af",
                }}
              >
                {requiredDone} / {requiredSections.length}
              </div>
            </div>
            <p className="text-[12px] text-[#57534e] leading-relaxed w-full">
              {config.instruction ??
                "Confirm each section is present and in correct order before mailing."}
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-[6px] rounded-full overflow-hidden mb-4"
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
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#57534e] mb-2">
              Required sections ({requiredSections.length})
            </h4>
            <div
              className="rounded-[8px] border bg-white overflow-hidden"
              style={{ borderColor: "#e7e5e4" }}
            >
              {requiredSections.map((section, i) => {
                const isChecked = !!checkedMap[section.id];
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleToggle(section.id)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-[#f5f5f4] transition-colors"
                    style={{
                      borderBottom: i < requiredSections.length - 1 ? "1px solid #f5f5f4" : "none",
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare size={18} color="#16a34a" className="shrink-0 mt-0.5" />
                    ) : (
                      <Square size={18} color="#a8a29e" className="shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[12.5px] sm:text-[13px] font-semibold leading-snug"
                        style={{
                          color: isChecked ? "#15803d" : "#1c1917",
                          textDecoration: isChecked ? "line-through" : "none",
                          textDecorationColor: "#86efac",
                        }}
                      >
                        {section.label}
                      </div>
                      {section.position && (
                        <div className="text-[11px] text-[#78716c] mt-0.5 leading-tight">
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
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#57534e] mb-2">
                Conditional sections ({conditionalSections.length})
              </h4>
              <div
                className="rounded-[8px] border bg-white overflow-hidden"
                style={{ borderColor: "#e7e5e4" }}
              >
                {conditionalSections.map((section, i) => {
                  const isChecked = !!checkedMap[section.id];
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleToggle(section.id)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-[#f5f5f4] transition-colors"
                      style={{
                        borderBottom:
                          i < conditionalSections.length - 1 ? "1px solid #f5f5f4" : "none",
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={18} color="#16a34a" className="shrink-0 mt-0.5" />
                      ) : (
                        <Square size={18} color="#a8a29e" className="shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[12.5px] sm:text-[13px] font-semibold leading-snug"
                          style={{
                            color: isChecked ? "#15803d" : "#1c1917",
                            textDecoration: isChecked ? "line-through" : "none",
                            textDecorationColor: "#86efac",
                          }}
                        >
                          {section.label}
                        </div>
                        {section.required_when && (
                          <div className="text-[11px] text-[#92400e] mt-0.5 leading-snug italic">
                            Required when: {section.required_when}
                          </div>
                        )}
                        {section.position && (
                          <div className="text-[11px] text-[#78716c] mt-0.5 leading-tight">
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
              className="rounded-[10px] border p-3 flex items-start gap-3 mb-3"
              style={{ background: "#fffbeb", borderColor: "#fde68a" }}
            >
              <AlertCircle size={16} color="#92400e" className="shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed" style={{ color: "#78350f" }}>
                {requiredSections.length - requiredDone} required section
                {requiredSections.length - requiredDone === 1 ? "" : "s"} remaining. Do not seal the
                envelope until every required section is in the packet.
              </p>
            </div>
          )}

          {allRequiredDone && (
            <div
              className="rounded-[10px] border p-3 flex items-start gap-3 mb-3"
              style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}
            >
              <PackageCheck size={16} color="#065f46" className="shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed" style={{ color: "#065f46" }}>
                All required sections are checked off. Do one final flip-through of the packet for
                legibility and page order before sealing.
              </p>
            </div>
          )}

          {/* Source */}
          <p className="text-[10.5px] text-[#78716c] leading-relaxed italic">
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
