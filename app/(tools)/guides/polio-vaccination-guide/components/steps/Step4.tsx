"use client";

import React from "react";
import { usePolioWizard } from "../../PolioContext";
import {
  Activity,
  Database,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

export default function Step4() {
  const { setCurrentStep, completeStep } = usePolioWizard();

  const handleNext = () => {
    completeStep(4);
    setCurrentStep(5);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
          <Activity className="w-4 h-4" />
          Step 2 of 3
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          NIMS Data Entry
        </h2>
        <p className="text-slate-600 text-lg">
          The most critical step: Ensuring your vaccination record is saved
          online.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8 text-center md:text-left relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border-4 border-white shadow-md">
            <Database className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              National Immunization Management System
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              After vaccination, the health worker <strong>must</strong> enter
              your details into NIMS. Only NIMS records allow you to download or
              print the official certificate online.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h3 className="font-bold text-lg text-amber-900">Before Leaving</h3>
          </div>
          <p className="text-amber-800 text-sm leading-relaxed font-medium">
            Ask the health worker to confirm your data is uploaded. If they
            forget, you will not find your record online when trying to download
            the certificate.
          </p>
        </div>

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <h3 className="font-bold text-lg text-rose-900">Missing Data?</h3>
          </div>
          <p className="text-rose-800 text-sm leading-relaxed font-medium">
            If your record doesn&apos;t show on NIMS later, you must return to
            the vaccination center with your original ID/Passport to have them
            upload it.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-auto">
        <button
          onClick={() => setCurrentStep(3)}
          className="text-slate-500 hover:text-slate-800 font-medium transition-colors px-4 py-2"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
        >
          Next: Download Online
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
