"use client";

import React, { useState } from "react";
import { usePolioWizard } from "../../PolioContext";
import { User, Users, Globe, ChevronRight, FileText } from "lucide-react";

export default function Step1() {
  const { state, setPersonType, setCurrentStep } = usePolioWizard();
  const [selectedType, setSelectedType] = useState<string | null>(
    state.personType,
  );

  const OPTIONS = [
    {
      id: "adult",
      title: "Pakistani Adult (Travel)",
      desc: "For citizens leaving the country.",
      icon: User,
      docs: ["Original CNIC", "Original Passport"],
    },
    {
      id: "child",
      title: "Pakistani Child",
      desc: "Minors needing the certificate.",
      icon: Users,
      docs: ["B-Form", "Birth Certificate"],
    },
    {
      id: "foreigner",
      title: "Foreigner (Long-term)",
      desc: "Foreigners staying > 4 weeks in Pakistan.",
      icon: Globe,
      docs: ["Passport", "Visa proof"],
    },
  ];

  const handleNext = () => {
    if (selectedType) {
      setPersonType(selectedType);
      setCurrentStep(2);
    }
  };

  const selectedOptionData = OPTIONS.find((o) => o.id === selectedType);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
          Who is getting the certificate?
        </h2>
        <p className="text-slate-600 text-lg">
          Select the applicant&apos;s profile to determine the exact documents
          required at the vaccination center.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {OPTIONS.map((option) => {
          const isSelected = selectedType === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 group relative overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/20 scale-[1.02]"
                  : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[100px] -z-10" />
              )}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3
                className={`font-bold text-lg mb-2 ${
                  isSelected ? "text-primary" : "text-slate-800"
                }`}
              >
                {option.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  isSelected ? "text-primary/80 font-medium" : "text-slate-500"
                }`}
              >
                {option.desc}
              </p>
            </button>
          );
        })}
      </div>

      {selectedType && selectedOptionData && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <FileText className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Required Documents Check
              </h3>
              <p className="text-slate-700 mb-4 font-medium">
                When you go to the vaccination center, YOU MUST bring:
              </p>
              <ul className="space-y-3">
                {selectedOptionData.docs.map((doc, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    </div>
                    <span className="font-bold text-emerald-950">{doc}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 p-3 bg-white/60 rounded-lg text-sm text-emerald-800 font-medium">
                Make sure health workers record this document number in NIMS
                accurately!
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
        <button
          onClick={handleNext}
          disabled={!selectedType}
          className={`px-8 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
            selectedType
              ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
