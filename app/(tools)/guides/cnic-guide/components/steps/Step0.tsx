"use client";

import React from "react";
import { useCnicWizard } from "../../CnicContext";
import { IdCard, ShieldCheck, Globe, Clock } from "lucide-react";

export default function Step0() {
  const { setCurrentStep, completeStep } = useCnicWizard();

  const handleNext = () => {
    completeStep(0);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
          <ShieldCheck className="w-4 h-4" />
          Official Guide
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          What is a CNIC?
        </h2>
        <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
          The Computerised National Identity Card (CNIC) is an official 13-digit
          identity document for Pakistani citizens aged 18 and older, issued by
          NADRA.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          {
            icon: Globe,
            title: "Universal ID",
            desc: "Recognized throughout Pakistan for all legal and official purposes.",
          },
          {
            icon: Clock,
            title: "Validity",
            desc: "Remains valid up to age 60, after which it becomes a lifetime document.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex gap-4"
          >
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 h-fit">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/10 rounded-2xl p-6 border border-primary/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-primary/10 rounded-full w-32 h-32 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <IdCard className="w-6 h-6 text-primary" />
            Why you need it
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-primary font-medium text-sm">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>{" "}
              Opening bank accounts
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> SIM
              card registration
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>{" "}
              Applying for Passport
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>{" "}
              Property documentation
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Voting
              & Elections
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>{" "}
              Government/Welfare Services
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={handleNext}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-medium transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
        >
          Begin Questionnaire
          <svg
            className="w-5 h-5 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
