// components/ConsistencyBaselineCapture.tsx
//
// Captures three high-value dates at the I-130 fill step (step_1_4):
//   - Marriage date
//   - Petitioner date of birth
//   - Beneficiary date of birth
//
// These dates are stored in wizard metadata as `consistencyBaseline` and are
// used to:
//   (a) enable date-driven risk patterns from lib/case-strength
//       (e.g., short marriage duration)
//   (b) provide a canonical baseline for future cross-form consistency checks
//       (DS-260 at step_2_3, I-864 at step_2_5).
//
// Pure additive UI — does not modify the I-130 form data, only stores a
// separate Rahvana baseline.

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ShieldAlert, AlertTriangle, Save, Check } from "lucide-react";
import { detectRiskFlags } from "@/lib/case-strength";
import type { RiskFlag } from "@/lib/case-strength";

export interface ConsistencyBaseline {
  marriageDate?: string;
  petitionerDateOfBirth?: string;
  beneficiaryDateOfBirth?: string;
  capturedAt?: string;
}

interface ConsistencyBaselineCaptureProps {
  baseline: ConsistencyBaseline | undefined | null;
  onSave: (next: ConsistencyBaseline) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

function ageGapYears(petitionerDob: string, beneficiaryDob: string): number | null {
  const p = new Date(petitionerDob);
  const b = new Date(beneficiaryDob);
  if (Number.isNaN(p.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.abs((p.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export function ConsistencyBaselineCapture({ baseline, onSave }: ConsistencyBaselineCaptureProps) {
  const [marriageDate, setMarriageDate] = useState(baseline?.marriageDate ?? "");
  const [petitionerDob, setPetitionerDob] = useState(baseline?.petitionerDateOfBirth ?? "");
  const [beneficiaryDob, setBeneficiaryDob] = useState(baseline?.beneficiaryDateOfBirth ?? "");
  const [justSaved, setJustSaved] = useState(false);

  // The parent feeds defaults derived from the user's profile (e.g. dates auto-filled
  // from passport OCR), which can arrive after first render (profile loads async).
  //
  // DOBs follow the passport: whenever the incoming value CHANGES (a passport was
  // uploaded/updated) we sync the field to it so this step never disagrees with the
  // Step 2 passport. The dependency array gates the effect to only fire on an actual
  // prop change, so a correction the user types between uploads is never clobbered.
  // Marriage date has no passport source, so it's only seeded when still empty.
  useEffect(() => {
    if (baseline?.marriageDate) setMarriageDate((v) => v || baseline.marriageDate!);
  }, [baseline?.marriageDate]);

  useEffect(() => {
    if (baseline?.petitionerDateOfBirth) setPetitionerDob(baseline.petitionerDateOfBirth);
  }, [baseline?.petitionerDateOfBirth]);

  useEffect(() => {
    if (baseline?.beneficiaryDateOfBirth) setBeneficiaryDob(baseline.beneficiaryDateOfBirth);
  }, [baseline?.beneficiaryDateOfBirth]);

  const handleSave = () => {
    const next: ConsistencyBaseline = {
      marriageDate: marriageDate || undefined,
      petitionerDateOfBirth: petitionerDob || undefined,
      beneficiaryDateOfBirth: beneficiaryDob || undefined,
      capturedAt: new Date().toISOString(),
    };
    onSave(next);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // Date-driven risk detection — uses the existing library
  const flags: RiskFlag[] = useMemo(() => {
    if (!baseline?.marriageDate) return [];
    return detectRiskFlags({
      marriage_date: baseline.marriageDate,
      petitioner_dob: baseline.petitionerDateOfBirth,
      beneficiary_dob: baseline.beneficiaryDateOfBirth,
    });
  }, [baseline?.marriageDate, baseline?.petitionerDateOfBirth, baseline?.beneficiaryDateOfBirth]);

  // Age gap advisory (separate from the library risk patterns)
  const gapAdvisory = useMemo(() => {
    if (!baseline?.petitionerDateOfBirth || !baseline?.beneficiaryDateOfBirth) return null;
    const gap = ageGapYears(baseline.petitionerDateOfBirth, baseline.beneficiaryDateOfBirth);
    if (gap === null) return null;
    if (gap >= 15) {
      return {
        title: `Significant age gap (${gap.toFixed(0)} years)`,
        advisory:
          "Large age gaps between spouses can attract additional adjudicator attention. " +
          "Address this proactively by including a relationship-context cover letter and " +
          "providing strong bona fide evidence (joint financial documents, communication " +
          "history, third-party affidavits).",
        source_basis: "Practitioner-reported adjudication pattern; not a formal USCIS rule",
      };
    }
    return null;
  }, [baseline?.petitionerDateOfBirth, baseline?.beneficiaryDateOfBirth]);

  const allFlagsCount = flags.length + (gapAdvisory ? 1 : 0);

  return (
    <div className="mt-[12px] mb-6" role="region" aria-label="Capture key dates">
      <div
        className="rounded-[12px] border-[1.5px] p-4 sm:p-5"
        style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <CalendarDays size={18} color="#1e40af" />
            </div>
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#1c1917] leading-snug">
              Save key dates for consistency checking
            </h3>
          </div>
          <p className="text-[12px] text-[#57534e] leading-relaxed">
            Saving these here lets Rahvana detect date-driven risk patterns (e.g., short marriage
            duration, age gap) and cross-check the same values against DS-260 and I-864 later.
            Independent of the I-130 form data.
          </p>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#57534e]">
              Marriage date
            </label>
            <input
              type="date"
              max={TODAY}
              value={marriageDate}
              onChange={(e) => setMarriageDate(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#57534e]">
              Petitioner DOB
            </label>
            <input
              type="date"
              max={TODAY}
              value={petitionerDob}
              onChange={(e) => setPetitionerDob(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#57534e]">
              Beneficiary DOB
            </label>
            <input
              type="date"
              max={TODAY}
              value={beneficiaryDob}
              onChange={(e) => setBeneficiaryDob(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!marriageDate && !petitionerDob && !beneficiaryDob}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12.5px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#0e1e38" }}
          >
            {justSaved ? <Check size={14} /> : <Save size={14} />}
            {justSaved ? "Saved" : "Save baseline"}
          </button>
          {baseline?.capturedAt && (
            <span className="text-[11px] text-[#78716c]">
              Last saved: {new Date(baseline.capturedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Date-driven risk flags */}
        {allFlagsCount > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} color="#991b1b" />
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#991b1b]">
                {allFlagsCount} date-driven advisor{allFlagsCount === 1 ? "y" : "ies"}
              </span>
            </div>

            {flags.map((flag) => {
              const isCritical = flag.severity === "critical";
              const bg = isCritical ? "#fef2f2" : "#fffbeb";
              const border = isCritical ? "#fecaca" : "#fde68a";
              const fg = isCritical ? "#7f1d1d" : "#78350f";
              const titleColor = isCritical ? "#991b1b" : "#92400e";
              const Icon = isCritical ? ShieldAlert : AlertTriangle;
              return (
                <div
                  key={flag.id}
                  className="rounded-[10px] border p-3 flex items-start gap-3"
                  style={{ background: bg, borderColor: border }}
                >
                  <Icon size={16} className="shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h5
                      className="text-[12.5px] font-semibold leading-snug"
                      style={{ color: titleColor }}
                    >
                      {flag.title}
                    </h5>
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: fg }}>
                      {flag.advisory}
                    </p>
                    <p
                      className="text-[10.5px] mt-1.5 leading-relaxed italic opacity-80"
                      style={{ color: fg }}
                    >
                      Source: {flag.source_basis}
                    </p>
                  </div>
                </div>
              );
            })}

            {gapAdvisory && (
              <div
                className="rounded-[10px] border p-3 flex items-start gap-3"
                style={{ background: "#fffbeb", borderColor: "#fde68a" }}
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5" color="#92400e" />
                <div className="min-w-0">
                  <h5
                    className="text-[12.5px] font-semibold leading-snug"
                    style={{ color: "#92400e" }}
                  >
                    {gapAdvisory.title}
                  </h5>
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#78350f" }}>
                    {gapAdvisory.advisory}
                  </p>
                  <p
                    className="text-[10.5px] mt-1.5 leading-relaxed italic opacity-80"
                    style={{ color: "#78350f" }}
                  >
                    Source: {gapAdvisory.source_basis}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-[10.5px] text-[#78716c] mt-3 leading-relaxed italic">
          Advisory only, not legal advice. Rahvana stores these values separately from the I-130
          form data.
        </p>
      </div>
    </div>
  );
}
