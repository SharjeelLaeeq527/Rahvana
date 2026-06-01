// components/Ds260BaselineCapture.tsx
//
// Captures the same three high-value dates AGAIN at the DS-260 step (step_2_3):
//   - Marriage date
//   - Petitioner date of birth
//   - Beneficiary date of birth
//
// Unlike the I-130 baseline (ConsistencyBaselineCapture at step_1_4), this
// component's whole purpose is the CROSS-FORM CHECK: the values the user
// enters here are compared live against the I-130 baseline via
// `compareBaselines`. Any divergence is surfaced immediately as a critical
// advisory, because form-to-form inconsistencies between the I-130 and DS-260
// are one of the most common causes of NVC delays and interview RFEs.
//
// Stored in wizard metadata as `ds260Baseline`. The step_2_3 case-strength
// checker reads the SAME metadata + the SAME compareBaselines function, so the
// inline panel and the side panel always agree.
//
// Pure additive UI — does not modify the DS-260 itself, only stores a separate
// Rahvana baseline for consistency checking.
//
// Sourcing: U.S. Department of State 9 FAM 504.4 (DS-260 adjudication);
// INA 212(a)(6)(C) — material misrepresentation.

import React, { useMemo, useState } from "react";
import { CalendarDays, ShieldAlert, CheckCircle2, Save, Check } from "lucide-react";
import { compareBaselines } from "@/lib/case-strength";
import type { BaselineDates } from "@/lib/case-strength";

export interface Ds260Baseline {
  marriageDate?: string;
  petitionerDateOfBirth?: string;
  beneficiaryDateOfBirth?: string;
  capturedAt?: string;
}

interface Ds260BaselineCaptureProps {
  /** The canonical I-130 baseline captured at step_1_4 (read-only here). */
  i130Baseline: BaselineDates | undefined | null;
  /** The DS-260 baseline being captured at this step. */
  baseline: Ds260Baseline | undefined | null;
  onSave: (next: Ds260Baseline) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function Ds260BaselineCapture({
  i130Baseline,
  baseline,
  onSave,
}: Ds260BaselineCaptureProps) {
  const [marriageDate, setMarriageDate] = useState(baseline?.marriageDate ?? "");
  const [petitionerDob, setPetitionerDob] = useState(baseline?.petitionerDateOfBirth ?? "");
  const [beneficiaryDob, setBeneficiaryDob] = useState(baseline?.beneficiaryDateOfBirth ?? "");
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    const next: Ds260Baseline = {
      marriageDate: marriageDate || undefined,
      petitionerDateOfBirth: petitionerDob || undefined,
      beneficiaryDateOfBirth: beneficiaryDob || undefined,
      capturedAt: new Date().toISOString(),
    };
    onSave(next);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const hasI130 = !!(
    i130Baseline?.marriageDate ||
    i130Baseline?.petitionerDateOfBirth ||
    i130Baseline?.beneficiaryDateOfBirth
  );

  // Live cross-form comparison against the SAVED DS-260 baseline.
  // Uses the same pure function as the step_2_3 checker so they never diverge.
  const mismatches = useMemo(
    () => compareBaselines(i130Baseline ?? null, baseline ?? null),
    [i130Baseline, baseline]
  );

  // Of the fields present on both forms, how many actually match?
  const matchedCount = useMemo(() => {
    if (!hasI130 || !baseline) return 0;
    let n = 0;
    for (const f of ["marriageDate", "petitionerDateOfBirth", "beneficiaryDateOfBirth"] as const) {
      const a = (i130Baseline?.[f] ?? "").trim();
      const b = (baseline?.[f] ?? "").trim();
      if (a && b && a === b) n++;
    }
    return n;
  }, [hasI130, i130Baseline, baseline]);

  return (
    <div className="mt-[12px]" role="region" aria-label="Capture DS-260 dates for consistency">
      <div
        className="rounded-[12px] border-[1.5px] p-4 sm:p-5"
        style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
          >
            <CalendarDays size={18} color="#1e40af" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#1c1917] leading-snug">
              Confirm these dates match your DS-260
            </h3>
            <p className="text-[12px] text-[#57534e] mt-0.5 leading-relaxed">
              Enter the dates exactly as you put them on the DS-260. Rahvana compares them against
              what you filed on the I-130 — any mismatch between the two forms is flagged so you can
              correct it before submitting. Independent of the DS-260 form data.
            </p>
          </div>
        </div>

        {/* If no I-130 baseline yet, tell the user to capture it first */}
        {!hasI130 && (
          <div
            className="rounded-[10px] border p-3 mb-3 flex items-start gap-3"
            style={{ background: "#fffbeb", borderColor: "#fde68a" }}
          >
            <ShieldAlert size={16} className="shrink-0 mt-0.5" color="#92400e" />
            <p className="text-[12px] leading-relaxed" style={{ color: "#78350f" }}>
              No I-130 baseline found. Save your key dates at the I-130 step (step 1.4) first so
              Rahvana can compare the two forms.
            </p>
          </div>
        )}

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
              className="rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
            {i130Baseline?.marriageDate && (
              <span className="text-[10px] text-[#78716c]">
                I-130: {i130Baseline.marriageDate}
              </span>
            )}
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
              className="rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
            {i130Baseline?.petitionerDateOfBirth && (
              <span className="text-[10px] text-[#78716c]">
                I-130: {i130Baseline.petitionerDateOfBirth}
              </span>
            )}
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
              className="rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
            {i130Baseline?.beneficiaryDateOfBirth && (
              <span className="text-[10px] text-[#78716c]">
                I-130: {i130Baseline.beneficiaryDateOfBirth}
              </span>
            )}
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
            {justSaved ? "Saved" : "Save & compare"}
          </button>
          {baseline?.capturedAt && (
            <span className="text-[11px] text-[#78716c]">
              Last saved: {new Date(baseline.capturedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Cross-form comparison result */}
        {baseline?.capturedAt && hasI130 && (
          <div className="mt-4 flex flex-col gap-2">
            {mismatches.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} color="#991b1b" />
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#991b1b]">
                    {mismatches.length} field{mismatches.length === 1 ? "" : "s"} do not match the
                    I-130
                  </span>
                </div>
                {mismatches.map((m) => (
                  <div
                    key={m.field}
                    className="rounded-[10px] border p-3 flex items-start gap-3"
                    style={{ background: "#fef2f2", borderColor: "#fecaca" }}
                  >
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" color="#991b1b" />
                    <div className="min-w-0">
                      <h5
                        className="text-[12.5px] font-semibold leading-snug"
                        style={{ color: "#991b1b" }}
                      >
                        {m.label} differs between forms
                      </h5>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#7f1d1d" }}>
                        I-130 says <strong>{m.i130Value}</strong>, DS-260 says{" "}
                        <strong>{m.ds260Value}</strong>. Correct one of them so both forms agree —
                        inconsistencies between the I-130 and DS-260 are a leading cause of NVC
                        delays and interview questions.
                      </p>
                      <p
                        className="text-[10.5px] mt-1.5 leading-relaxed italic opacity-80"
                        style={{ color: "#7f1d1d" }}
                      >
                        Source: 9 FAM 504.4; INA 212(a)(6)(C) — material misrepresentation
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              matchedCount > 0 && (
                <div
                  className="rounded-[10px] border p-3 flex items-start gap-3"
                  style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
                >
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" color="#15803d" />
                  <p className="text-[12px] leading-relaxed" style={{ color: "#166534" }}>
                    All {matchedCount} compared field{matchedCount === 1 ? "" : "s"} match your
                    I-130. Keep these consistent on every later form.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        <p className="text-[10.5px] text-[#78716c] mt-3 leading-relaxed italic">
          Advisory only — not legal advice. Rahvana stores these values separately from the DS-260
          form data.
        </p>
      </div>
    </div>
  );
}
