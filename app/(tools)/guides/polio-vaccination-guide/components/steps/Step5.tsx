"use client";

import React from "react";
import { usePolioWizard } from "../../PolioContext";
import {
  Download,
  CreditCard,
  Laptop,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export default function Step5() {
  const {
    setCurrentStep,
    resetWizard,
    state: { personType },
  } = usePolioWizard();

  const idType =
    personType === "child"
      ? "B-Form / CRC Number"
      : personType === "foreigner"
        ? "Passport Number"
        : "CNIC & Passport Number";

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
          <Download className="w-4 h-4" />
          Step 4 of 4
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          Download Your Certificate
        </h2>
        <p className="text-slate-600 text-lg">
          Get your digital copy instantly from the official NADRA portal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
            <Laptop className="w-6 h-6 text-slate-700" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">
            1. Visit the Portal
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            Go to the official NIMS website and select the &quot;Other
            Vaccination – Polio / Yellow Fever&quot; option.
          </p>
          <a
            href="https://nims.nadra.gov.pk/nims/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors"
          >
            Open NIMS Portal <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">
            2. Enter Details
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            To retrieve your specific records, you will need your:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              {idType}
            </li>
            <li className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Issue Date
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-slate-700" />
              <h3 className="font-bold text-lg text-slate-900">
                3. Make Payment & Download
              </h3>
            </div>
            <p className="text-slate-600 text-sm max-w-lg">
              Verify your information on the screen, pay the one-time processing
              fee online (≈ Rs. 100), and hit Download. Save the PDF securely on
              your phone for easy access.
            </p>
          </div>
          <div className="text-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm min-w-[140px]">
            <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
              Total Fee
            </span>
            <span className="text-2xl font-black text-primary">Rs. 100</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-auto">
        <button
          onClick={() => setCurrentStep(3)}
          className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            Step 4 of 4
          </div>
          <button
            onClick={resetWizard}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md"
          >
            Restart Guide
          </button>
        </div>
      </div>
    </div>
  );
}
