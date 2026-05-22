"use client";

import React from "react";
import { X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { MEDICAL_EXAM_DATA } from "../MedicalExamData";
import Link from "next/link";

interface MedicalExamToolProps {
  state: any;
  actions: any;
  medState: {
    medSaved: boolean;
    setMedSaved: (v: boolean) => void;
    medDate: string;
    setMedDate: (v: string) => void;
    medTime: string;
    setMedTime: (v: string) => void;
    medClinic: string;
    setMedClinic: (v: string) => void;
    isMedWizardOpen: boolean;
    setIsMedWizardOpen: (v: boolean) => void;
    medWizardStep: number;
    setMedWizardStep: (v: any) => void;
    medWizardMode: "service" | "guide" | "";
    setMedWizardMode: (v: "service" | "guide" | "") => void;
  };
  guard?: () => boolean;
}

export const MedicalExamTool: React.FC<MedicalExamToolProps> = ({ actions, medState, guard }) => {
  const {
    medSaved,
    setMedSaved,
    medDate,
    setMedDate,
    medTime,
    setMedTime,
    medClinic,
    setMedClinic,
    isMedWizardOpen,
    setIsMedWizardOpen,
    medWizardStep,
    setMedWizardStep,
    medWizardMode,
    setMedWizardMode,
  } = medState;
  const [isSaving, setIsSaving] = React.useState(false);
  const [medErrors, setMedErrors] = React.useState<Record<string, string>>({});
  const data = MEDICAL_EXAM_DATA;

  const to12h = (t24: string) => {
    if (!t24) return "";
    const [h, m] = t24.split(":");
    const hours = parseInt(h);
    const suffix = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${m} ${suffix}`;
  };

  const to24h = (t12: string) => {
    if (!t12) return "";
    const match = t12.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
    if (!match) return "";
    let h = parseInt(match[1]);
    const m = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  };

  const currentSteps = medWizardMode === "service" ? data.serviceSteps : data.guideSteps;
  const s = currentSteps[medWizardStep];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span
            key={i}
            className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "med" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      {!medSaved ? (
        <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-teal-500 to-blue-500 opacity-75" />
          <div className="p-8">
            <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">
              {data.decisionModule.eyebrow}
            </div>
            <div className="text-xl text-white/95 font-bold mb-6">
              {data.decisionModule.heading}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.decisionModule.paths.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (guard && !guard()) return;
                    setMedWizardMode(p.id);
                    setMedWizardStep(0);
                    setIsMedWizardOpen(true);
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 text-left transition-all hover:bg-white/10 hover:-translate-y-1 active:translate-y-0 group"
                >
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{p.title}</div>
                  <div className="text-[10px] text-white/50 leading-relaxed">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mb-4 shadow-sm flex justify-between items-center animate-in fade-in">
          <div>
            <div className="text-[10px] font-black uppercase text-emerald-800 mb-1">
              ✓ Medical Appointment Confirmed
            </div>
            <div className="text-sm font-bold text-emerald-900">
              {medDate} at {medTime}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium">{medClinic}</div>
          </div>
          <button
            onClick={() => setMedSaved(false)}
            className="text-primary font-bold text-xs hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {isMedWizardOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 border-b flex items-center gap-4">
            <button
              onClick={() => setIsMedWizardOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${((medWizardStep + 1) / currentSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-400">
              {medWizardStep + 1} / {currentSteps.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-lg">
              <div className="text-[10px] font-bold text-primary uppercase mb-2">
                Step {medWizardStep + 1} — {medWizardMode === "service" ? "Service" : "Guide"}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{s.heading}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">{s.sub}</p>

              {(s as any).card && (
                <div className="bg-slate-50 border rounded-2xl p-6 mb-8 shadow-sm">
                  <div className="font-bold text-slate-900 mb-1">{(s as any).card.title}</div>
                  <div className="text-sm text-slate-500 mb-6">{(s as any).card.description}</div>
                  <Link
                    href={(s as any).card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {(s as any).card.buttonLabel}{" "}
                    <ExternalLink
                      size={16}
                      className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                    />
                  </Link>
                </div>
              )}

              {s.form && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                    <input
                      type="date"
                      value={medDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setMedDate(e.target.value);
                        setMedErrors((prev) => ({ ...prev, medDate: "" }));
                      }}
                      className={`p-3 border rounded-xl ${medErrors.medDate ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    {medErrors.medDate && (
                      <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                        {medErrors.medDate}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Time</label>
                    <input
                      type="time"
                      value={to24h(medTime)}
                      onChange={(e) => {
                        setMedTime(to12h(e.target.value));
                        setMedErrors((prev) => ({ ...prev, medTime: "" }));
                      }}
                      className={`p-3 border rounded-xl font-mono appearance-none ${medErrors.medTime ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    {medErrors.medTime && (
                      <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                        {medErrors.medTime}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Clinic / Physician Name
                      </label>
                      <span
                        className={`text-[9px] font-medium ${medClinic.length >= 80 ? "text-red-500" : "text-slate-400"}`}
                      >
                        {medClinic.length}/80
                      </span>
                    </div>
                    <input
                      type="text"
                      value={medClinic}
                      maxLength={80}
                      placeholder="e.g. IOM Islamabad"
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/[^a-zA-Z0-9\s\-\.,\/]/g, "")
                          .slice(0, 80);
                        setMedClinic(val);
                        setMedErrors((prev) => ({ ...prev, medClinic: "" }));
                      }}
                      className={`p-3 border rounded-xl ${medErrors.medClinic ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    {medErrors.medClinic && (
                      <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                        {medErrors.medClinic}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {medWizardStep > 0 && (
                  <button
                    onClick={() => setMedWizardStep((v: number) => v - 1)}
                    className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={async () => {
                    if ((s as any).nav?.save) {
                      const saveErrors: Record<string, string> = {};
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      if (!medDate) {
                        saveErrors.medDate = "Date is required.";
                      } else if (new Date(medDate) < today) {
                        saveErrors.medDate = "Appointment date cannot be in the past.";
                      }

                      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
                      if (!medTime || !timeRegex.test(medTime)) {
                        saveErrors.medTime = "Enter a valid time (e.g. 09:30 AM).";
                      }

                      const clinic = medClinic.trim();
                      if (!clinic) {
                        saveErrors.medClinic = "Clinic name is required.";
                      } else if (clinic.length < 2) {
                        saveErrors.medClinic = "Must be at least 2 characters.";
                      } else if (!/^[a-zA-Z0-9\s\-\.,\/]+$/.test(clinic)) {
                        saveErrors.medClinic =
                          "Only letters, numbers, spaces, and basic punctuation allowed.";
                      }

                      if (Object.keys(saveErrors).length > 0) {
                        setMedErrors(saveErrors);
                        toast.error("Please fix the errors before saving.");
                        return;
                      }
                      setIsSaving(true);
                      try {
                        setMedSaved(true);
                        await actions.updateMetadata({
                          med_appt_saved: "true",
                          med_date: medDate,
                          med_time: medTime,
                          med_clinic: medClinic,
                        });
                        setIsMedWizardOpen(false);
                        toast.success("Medical appointment saved!");
                      } finally {
                        setIsSaving(false);
                      }
                    } else if (medWizardStep < currentSteps.length - 1) {
                      setMedWizardStep((v: number) => v + 1);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white p-4 rounded-xl font-bold hover:bg-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : (s as any).nav?.save
                      ? "Save Appointment"
                      : (s as any).nav?.next || "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
