"use client";

import React, { useState, useEffect, useMemo } from "react";
import SponsorshipCalculatorTool from "@/components/tools/SponsorshipCalculatorTool";
import { useToast } from "@/app/components/shared/ToastProvider";
import { CheckCircle2, Calculator, Info } from "lucide-react";
import Link from "next/link";

const STANDALONE_STORAGE_KEY = "standalone_sponsorship_calc";

export default function AffidavitSupportCalculatorPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();
  const [savedResult, setSavedResult] = useState<any>(null);

  // Load isolated standalone saved calculation
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STANDALONE_STORAGE_KEY);
      if (cached) {
        setSavedResult(JSON.parse(cached));
      }
    } catch {
      setSavedResult(null);
    }
  }, []);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const initialData = useMemo(() => {
    return savedResult?.raw || null;
  }, [savedResult]);

  const handleClose = () => setIsOpen(false);

  const handleSave = (result: any) => {
    try {
      localStorage.setItem(STANDALONE_STORAGE_KEY, JSON.stringify(result));
      setSavedResult(result);
      showToast("Sponsorship calculation saved in your browser.", "success");
    } catch (e) {
      console.error("Error saving standalone sponsorship calculation:", e);
      showToast("Plan calculated successfully.", "info");
    }
    setIsOpen(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundImage: "url('/assets/images/affidavit-bg.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {!isOpen && (
        <div className="animate-in fade-in text-center duration-700 max-w-lg bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-4">
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>Standalone Tool</span>
          </div>

          <h1 className="mb-2 text-3xl font-black text-[#0f1f38]">Affidavit of Support</h1>
          <p className="mb-6 text-[#3a4f63] text-sm leading-relaxed">
            Determine your income sponsorship threshold and required USCIS forms (I-864, I-864A, I-864EZ) under federal poverty guidelines.
          </p>

          {savedResult && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
                  Last Saved Calculation
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${savedResult.isEligible ? "text-teal-700" : "text-rose-600"}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {savedResult.isEligible ? "Eligible" : "Requires Joint Sponsor / Assets"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Household Size: <strong>{savedResult.householdSize}</strong> · Required: <strong>${(savedResult.requiredIncome ?? 0).toLocaleString()}</strong> · Total: <strong>${(savedResult.totalIncome ?? 0).toLocaleString()}</strong>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-[12px] bg-[#0d7377] p-[14px_32px] font-semibold text-white shadow-lg transition-all hover:opacity-90 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              {savedResult ? "Recalculate" : "Launch Calculator"}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-start gap-2 text-left bg-slate-50 p-3 rounded-xl">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Want this calculation automatically applied to your petition forms and tracked on your roadmap?{" "}
              <Link href="/visa-exploration" className="font-semibold text-[#0d7377] hover:underline">
                Explore Visa Journeys &rarr;
              </Link>
            </p>
          </div>
        </div>
      )}

      <SponsorshipCalculatorTool
        isOpen={isOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={initialData}
        lockState={false}
        mode="standalone"
      />
    </div>
  );
}
