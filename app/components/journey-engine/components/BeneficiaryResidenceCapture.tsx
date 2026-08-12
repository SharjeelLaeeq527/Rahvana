// components/BeneficiaryResidenceCapture.tsx
//
// Captures the beneficiary's residence-country history on step_1_5 (Fill I-130A).
// Per 9 FAM 504.4-4(B)(2), the beneficiary needs a police certificate from every
// country where they lived for 6+ months since age 16. This component:
//
//   1. Captures current country of residence
//   2. Captures additional countries lived in (6+ months in last 5 years)
//   3. Surfaces a derived list of police certificates that will be required at
//      Chapter 3 (step_3_2)
//   4. Flags long-distance marriage indicator if current country differs from
//      petitioner's known country (when available)
//
// Saved to state.metadata.beneficiaryBaseline. Pure additive UI — does not
// modify the I-130A form data.

import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, X, FileCheck, AlertTriangle, Save, Check, Globe } from "lucide-react";

export interface BeneficiaryBaseline {
  currentCountry?: string;
  currentCity?: string;
  additionalCountries?: string[];
  capturedAt?: string;
}

interface ResidenceConfig {
  title?: string;
  subtitle?: string;
  rule_summary?: string;
  source_basis?: string;
  exempt_country_note?: string;
  age_threshold?: number;
  duration_threshold_months?: number;
  lookback_years?: number;
}

interface BeneficiaryResidenceCaptureProps {
  baseline: BeneficiaryBaseline | undefined | null;
  config: ResidenceConfig | undefined | null;
  petitionerCountry?: string;
  onSave: (next: BeneficiaryBaseline) => void;
}

export function BeneficiaryResidenceCapture({
  baseline,
  config,
  petitionerCountry,
  onSave,
}: BeneficiaryResidenceCaptureProps) {
  const [currentCountry, setCurrentCountry] = useState(baseline?.currentCountry ?? "");
  const [currentCity, setCurrentCity] = useState(baseline?.currentCity ?? "");
  const [additional, setAdditional] = useState<string[]>(baseline?.additionalCountries ?? []);
  const [newCountry, setNewCountry] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  // The parent feeds defaults derived from the profile (e.g. the beneficiary's
  // country from passport OCR), which can arrive after first render (profile loads
  // async). Seed-only (`v || ...`) so we fill an empty field but never clobber what
  // the user is typing — residence is user-authoritative, the profile is just a hint.
  useEffect(() => {
    if (baseline?.currentCountry) setCurrentCountry((v) => v || baseline.currentCountry!);
  }, [baseline?.currentCountry]);

  useEffect(() => {
    if (baseline?.currentCity) setCurrentCity((v) => v || baseline.currentCity!);
  }, [baseline?.currentCity]);

  const addCountry = () => {
    const trimmed = newCountry.trim();
    if (!trimmed) return;
    if (additional.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setNewCountry("");
      return;
    }
    setAdditional((prev) => [...prev, trimmed]);
    setNewCountry("");
  };

  const removeCountry = (idx: number) => {
    setAdditional((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const next: BeneficiaryBaseline = {
      currentCountry: currentCountry.trim() || undefined,
      currentCity: currentCity.trim() || undefined,
      additionalCountries: additional.length > 0 ? additional : undefined,
      capturedAt: new Date().toISOString(),
    };
    onSave(next);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // Build the consolidated list of countries requiring police certificates.
  // Use the saved baseline (not the in-memory edit state) so the advisory
  // matches what's been persisted.
  const policeCertCountries = useMemo(() => {
    const all = new Set<string>();
    if (baseline?.currentCountry) all.add(baseline.currentCountry);
    (baseline?.additionalCountries ?? []).forEach((c) => all.add(c));
    return Array.from(all);
  }, [baseline?.currentCountry, baseline?.additionalCountries]);

  // Long-distance marriage indicator
  const longDistance = useMemo(() => {
    if (!baseline?.currentCountry || !petitionerCountry) return false;
    return baseline.currentCountry.trim().toLowerCase() !== petitionerCountry.trim().toLowerCase();
  }, [baseline?.currentCountry, petitionerCountry]);

  const ruleSummary =
    config?.rule_summary ??
    "A police certificate is required from every country where the beneficiary lived " +
      "for 6 months or more since age 16.";
  const sourceBasis =
    config?.source_basis ?? "9 FAM 504.4-4(B)(2), Police Certificate Requirement";

  return (
    <div className="mt-[12px] mb-6 " role="region" aria-label="Beneficiary residence history">
      <div
        className="rounded-[12px] border-[1.5px] p-4 sm:p-5"
        style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}
          >
            <Globe size={18} color="#155e75" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#1c1917] leading-snug">
              {config?.title ?? "Beneficiary residence history"}
            </h3>
            <p className="text-[12px] text-[#57534e] mt-0.5 leading-relaxed">
              {config?.subtitle ??
                "Save the beneficiary's residence countries here so Rahvana can pre-prepare police certificate requirements."}
            </p>
          </div>
        </div>

        {/* Rule summary */}
        <div
          className="rounded-[8px] border p-3 mb-4 text-[11.5px] leading-relaxed"
          style={{ background: "#fef9c3", borderColor: "#fde68a", color: "#713f12" }}
        >
          <strong>Rule:</strong> {ruleSummary} <em className="opacity-80">Source: {sourceBasis}</em>
        </div>

        {/* Current country/city */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#57534e]">
              Current country
            </label>
            <input
              type="text"
              value={currentCountry}
              onChange={(e) => setCurrentCountry(e.target.value)}
              placeholder="e.g., Pakistan"
              className="rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#57534e]">
              Current city <span className="normal-case opacity-70">(optional)</span>
            </label>
            <input
              type="text"
              value={currentCity}
              onChange={(e) => setCurrentCity(e.target.value)}
              placeholder="e.g., Lahore"
              className="rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
          </div>
        </div>

        {/* Additional countries */}
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#57534e]">
            Other countries lived in for 6+ months in last 5 years
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCountry();
                }
              }}
              placeholder="Add a country and press Enter"
              className="flex-1 rounded-md px-3 py-2 text-[13px] outline-none border bg-white"
              style={{ borderColor: "#d6d3d1" }}
            />
            <button
              type="button"
              onClick={addCountry}
              disabled={!newCountry.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-semibold border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "#d6d3d1", color: "#1c1917", background: "white" }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {additional.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {additional.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border"
                  style={{
                    background: "#ecfeff",
                    borderColor: "#a5f3fc",
                    color: "#155e75",
                  }}
                >
                  <MapPin size={11} />
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCountry(i)}
                    className="ml-0.5 opacity-70 hover:opacity-100"
                    aria-label={`Remove ${c}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!currentCountry.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12.5px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#0e1e38" }}
          >
            {justSaved ? <Check size={14} /> : <Save size={14} />}
            {justSaved ? "Saved" : "Save residence history"}
          </button>
          {baseline?.capturedAt && (
            <span className="text-[11px] text-[#78716c]">
              Last saved: {new Date(baseline.capturedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Police certificate advisory */}
        {policeCertCountries.length > 0 && (
          <div
            className="mt-4 rounded-[10px] border p-3 flex items-start gap-3"
            style={{ background: "#ecfeff", borderColor: "#a5f3fc" }}
          >
            <FileCheck size={18} color="#155e75" className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h5 className="text-[12.5px] font-semibold leading-snug" style={{ color: "#155e75" }}>
                Police certificates likely required from {policeCertCountries.length}{" "}
                {policeCertCountries.length === 1 ? "country" : "countries"}
              </h5>
              <ul
                className="text-[12px] mt-1.5 leading-relaxed list-disc pl-5"
                style={{ color: "#0e7490" }}
              >
                {policeCertCountries.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="text-[11px] mt-2 leading-relaxed italic" style={{ color: "#0e7490" }}>
                Refer to the <strong>travel.state.gov Reciprocity Schedule</strong> for each
                country&apos;s police certificate process and any exemptions.
                {config?.exempt_country_note ? ` ${config.exempt_country_note}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Long-distance marriage indicator */}
        {longDistance && (
          <div
            className="mt-3 rounded-[10px] border p-3 flex items-start gap-3"
            style={{ background: "#fffbeb", borderColor: "#fde68a" }}
          >
            <AlertTriangle size={16} color="#92400e" className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h5 className="text-[12.5px] font-semibold leading-snug" style={{ color: "#92400e" }}>
                Long-distance marriage indicator
              </h5>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#78350f" }}>
                Petitioner and beneficiary appear to live in different countries (
                {petitionerCountry} vs. {baseline?.currentCountry}). USCIS may expect richer
                communication-history evidence and a relationship timeline. Strengthen the petition
                with call logs, video-call records, joint travel records, and any in-person visit
                documentation.
              </p>
              <p className="text-[11px] mt-1.5 leading-relaxed italic" style={{ color: "#78350f" }}>
                Source: Practitioner-reported adjudication pattern for consular-process IR-1 cases.
              </p>
            </div>
          </div>
        )}

        <p className="text-[10.5px] text-[#78716c] mt-3 leading-relaxed italic">
          Advisory only, not legal advice. Rahvana stores these values separately from the I-130A
          form data.
        </p>
      </div>
    </div>
  );
}
