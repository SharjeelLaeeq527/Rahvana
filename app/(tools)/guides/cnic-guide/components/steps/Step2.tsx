"use client";

import React from "react";
import { useCnicWizard } from "../../CnicContext";
import { FilePlus2, RefreshCw, FileEdit } from "lucide-react";

const APPLICATION_TYPES = [
  {
    id: "new",
    title: "New CNIC",
    description: "Applying for the very first time (age 18+)",
    icon: FilePlus2,
    color: "from-blue-50 to-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "correction",
    title: "Correction / Update",
    description: "Fixing details (name, DOB, marital status, address)",
    icon: FileEdit,
    color: "from-primary/10 to-primary/10",
    iconColor: "text-primary",
  },
  {
    id: "replacement",
    title: "Replacement / Renewal",
    description: "CNIC is expired, lost, stolen, or damaged",
    icon: RefreshCw,
    color: "from-purple-50 to-purple-100",
    iconColor: "text-purple-600",
  },
];

export default function Step2() {
  const { state, setApplicationType, setCurrentStep } = useCnicWizard();

  const handleSelect = (typeId: string) => {
    setApplicationType(typeId);
    setTimeout(() => setCurrentStep(3), 300);
  };

  const handleBack = () => {
    setCurrentStep(1.5);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          What is the purpose of application?
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          The processing requirements vary significantly depending on why you
          are applying.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {APPLICATION_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = state.applicationType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`group p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center ${
                isSelected
                  ? "border-primary shadow-md ring-4 ring-primary/10 bg-white scale-105"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white"
              }`}
            >
              <div
                className={`w-20 h-20 rounded-2xl bg-linear-to-br ${type.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-10 h-10 ${type.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {type.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-100">
        <button
          onClick={handleBack}
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
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Step 2 of 6
        </div>
      </div>
    </div>
  );
}
