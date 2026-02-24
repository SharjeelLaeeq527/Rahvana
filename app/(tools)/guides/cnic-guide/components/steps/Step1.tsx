"use client";

import React, { useState } from "react";
import { useCnicWizard } from "../../CnicContext";
import {
  User,
  Users,
  AlertCircle,
  FilePlus2,
  RefreshCw,
  FileEdit,
  Smartphone,
  Building2,
  CheckCircle2,
} from "lucide-react";

const PERSON_TYPES = [
  {
    id: "adult",
    title: "Standard Adult",
    description: "Has parents or siblings already registered with NADRA.",
    icon: Users,
    color: "from-primary/10 to-primary/10",
    iconColor: "text-primary",
  },
  {
    id: "special",
    title: "Special Case / Orphan",
    description: "No blood relative with a NADRA record available.",
    icon: User,
    color: "from-amber-50 to-amber-100",
    iconColor: "text-amber-600",
  },
];

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

// const APPLICATION_METHODS = [
//   {
//     id: "online",
//     title: "Online via Pak ID App",
//     description: "Highly Recommended. Apply using your smartphone.",
//     features: ["Avoid queues", "Home delivery", "Upload from phone"],
//     icon: Smartphone,
//     color: "from-primary to-primary/70",
//     badge: "Recommended",
//   },
//   {
//     id: "inperson",
//     title: "NADRA Center",
//     description: "Traditional processing at an office counter.",
//     features: ["Staff assistance", "Instant biometrics", "For special cases"],
//     icon: Building2,
//     color: "from-slate-700 to-slate-900",
//   },
// ];

export default function Step1() {
  const {
    state,
    setPersonType,
    setApplicationType,
    // setApplicationMethod,
    setCurrentStep,
    // completeStep,
  } = useCnicWizard();

  // We maintain internal state to reveal sections sequentially
  const [internalStep, setInternalStep] = useState(1);

  const handlePersonSelect = (typeId: string) => {
    setPersonType(typeId);
    setInternalStep(2);
  };

  const handleAppTypeSelect = (typeId: string) => {
    setApplicationType(typeId);
    setInternalStep(3);
  };

  // const handleMethodSelect = (methodId: string) => {
  //   setApplicationMethod(methodId);
  //   setTimeout(() => {
  //     completeStep(1);
  //     setCurrentStep(2);
  //   }, 400);
  // };

  const handleBack = () => {
    if (internalStep > 1) {
      setInternalStep(internalStep - 1);
    } else {
      setCurrentStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Application Setup
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          Help us customize the process by telling us a bit about your
          situation.
        </p>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[23px] md:before:ml-[27px] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:border-slate-300">
        {/* Phase 1: Who is applying? */}
        <div className="relative pl-12 md:pl-14">
          <div className="absolute left-0 top-1 w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all bg-primary/10 text-primary z-10">
            {internalStep > 1 ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <span className="font-bold text-lg">1</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Who is applying?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSON_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = state.personType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => handlePersonSelect(type.id)}
                  className={`group text-left p-4 rounded-xl border-2 transition-all duration-200 bg-linear-to-br ${type.color} ${
                    isSelected
                      ? "border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]"
                      : "border-transparent opacity-90 hover:opacity-100 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm backdrop-blur-sm`}
                    >
                      <Icon className={`w-5 h-5 ${type.iconColor}`} />
                    </div>
                    <h4 className="font-bold text-slate-900">{type.title}</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs font-medium">
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>

          {internalStep === 1 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex gap-3 text-slate-600 text-xs">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <p>
                <strong>Note:</strong> Women, men, and transgender individuals
                fall under the standard category as long as they have verifiable
                blood relatives.
              </p>
            </div>
          )}
        </div>

        {/* Phase 2: Application Type */}
        <div
          className={`relative pl-12 md:pl-14 transition-all duration-500 ${internalStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none hidden"}`}
        >
          <div
            className={`absolute left-0 top-1 w-12 h-12 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all z-10 ${internalStep > 2 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}
          >
            {internalStep > 2 ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <span className="font-bold text-lg">2</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            What is the purpose?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {APPLICATION_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = state.applicationType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => handleAppTypeSelect(type.id)}
                  className={`group p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center bg-linear-to-br ${type.color} ${
                    isSelected
                      ? "border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]"
                      : "border-transparent opacity-90 hover:opacity-100 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mb-3 shadow-sm backdrop-blur-sm`}
                  >
                    <Icon className={`w-6 h-6 ${type.iconColor}`} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {type.title}
                  </h4>
                  <p className="text-slate-600 leading-snug text-xs font-medium">
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase 3: Application Method */}
        {/* <div
          className={`relative pl-12 md:pl-14 transition-all duration-500 ${internalStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none hidden"}`}
        >
          <div
            className={`absolute left-0 top-1 w-12 h-12 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all z-10 ${internalStep > 3 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}
          >
            <span className="font-bold text-lg">3</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            How do you want to apply?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {APPLICATION_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = state.applicationMethod === method.id;

              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className={`group relative text-left rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? "border-primary shadow-md ring-2 ring-primary/10 scale-[1.02]"
                      : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  {method.badge && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white z-10 border border-white/30">
                      {method.badge}
                    </div>
                  )}

                  <div
                    className={`p-5 h-full bg-linear-to-br ${method.color} text-white relative z-0`}
                  >
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="w-8 h-8 text-white/90" />
                      {isSelected && (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-1 tracking-tight">
                      {method.title}
                    </h3>
                    <p className="text-white/80 leading-snug text-xs mb-4 max-w-[90%]">
                      {method.description}
                    </p>

                    <ul className="space-y-1">
                      {method.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-white/90 font-medium"
                        >
                          <div className="w-1 h-1 rounded-full bg-white/80"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
        </div> */}
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
        {/* <div className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          Step 1 of 5
        </div> */}
        {internalStep < 2 && (
          <div className="px-4 py-2 text-sm text-slate-400 font-medium">
            Make a selection above
          </div>
        )}
      </div>
    </div>
  );
}
