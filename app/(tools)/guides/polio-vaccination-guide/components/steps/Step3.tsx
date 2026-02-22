"use client";

import React from "react";
import { usePolioWizard } from "../../PolioContext";
import { Syringe, AlertCircle, ChevronRight, ShieldCheck } from "lucide-react";

export default function Step3() {
  const { setCurrentStep, completeStep } = usePolioWizard();

  const handleNext = () => {
    completeStep(3);
    setCurrentStep(4);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
          <Syringe className="w-4 h-4" />
          Step 1 of 3
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          Get Vaccinated
        </h2>
        <p className="text-slate-600 text-lg">
          Visit your chosen government facility to receive the polio
          vaccination.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">
            Vaccine Types
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            The health worker will administer one of two approved vaccine types:
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800">bOPV:</span>
              <span className="text-slate-600">Oral Drops</span>
            </li>
            <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800">IPV:</span>
              <span className="text-slate-600">Injectable</span>
            </li>
          </ul>
          <p className="text-sm text-primary/90 font-medium mt-4">
            Both are widely accepted for international travel certificates.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              What to Say
            </h3>
            <p className="text-slate-600">
              When you arrive, explicitly state you need the vaccination for
              <strong> travel or an official certificate</strong> so they
              register appropriately.
            </p>
          </div>

          <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100 shadow-sm flex items-start gap-4">
            <div className="mt-1">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-rose-900 mb-1">Timing</h3>
              <p className="text-rose-800/80 text-sm leading-relaxed">
                Some airlines suggest getting vaccinated at least{" "}
                <strong>4 weeks</strong> before departure. While enforcement
                varies, it is best not to wait until the last minute.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-auto">
        <button
          onClick={() => setCurrentStep(2)}
          className="text-slate-500 hover:text-slate-800 font-medium transition-colors px-4 py-2"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
        >
          Next: NIMS Entry
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
