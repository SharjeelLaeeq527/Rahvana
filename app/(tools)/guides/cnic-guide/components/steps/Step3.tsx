"use client";

import React from "react";
import { useCnicWizard } from "../../CnicContext";
import { Smartphone, Building2 } from "lucide-react";

const APPLICATION_METHODS = [
  {
    id: "online",
    title: "Online via Pak ID App",
    description:
      "Highly Recommended. Apply using your smartphone from anywhere.",
    features: [
      "Avoid long queues",
      "Home delivery via courier",
      "Upload documents from phone",
      "Fingerprints via phone camera",
    ],
    icon: Smartphone,
    color: "from-primary to-primary/70",
    badge: "Recommended",
  },
  {
    id: "inperson",
    title: "NADRA Registration Center",
    description: "Traditional processing at an office counter.",
    features: [
      "Staff assistance for form filling",
      "Instant biometric capture",
      "Best for complex/special cases",
      "Wait times apply",
    ],
    icon: Building2,
    color: "from-slate-700 to-slate-900",
  },
];

export default function Step3() {
  const { state, setApplicationMethod, setCurrentStep } = useCnicWizard();

  const handleSelect = (methodId: string) => {
    setApplicationMethod(methodId);
    setTimeout(() => setCurrentStep(4), 300);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          How do you want to apply?
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          NADRA provides a modern online alternative that saves time and travel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {APPLICATION_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = state.applicationMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id)}
              className={`group relative text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                isSelected
                  ? "border-primary shadow-xl ring-4 ring-primary/10 scale-[1.02]"
                  : "border-slate-200 hover:border-slate-300 shadow-md hover:shadow-lg"
              }`}
            >
              {method.badge && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white z-10 border border-white/30">
                  {method.badge}
                </div>
              )}

              <div
                className={`p-8 h-full bg-linear-to-br ${method.color} text-white relative z-0`}
              >
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>

                <Icon className="w-12 h-12 mb-6 text-white/90" />
                <h3 className="text-2xl font-bold mb-2 tracking-tight">
                  {method.title}
                </h3>
                <p className="text-white/80 leading-relaxed text-sm mb-6 max-w-[90%]">
                  {method.description}
                </p>

                <div className="space-y-3 pt-6 border-t border-white/20">
                  <p className="text-xs uppercase font-bold text-white/60 tracking-wider">
                    Features
                  </p>
                  <ul className="space-y-2">
                    {method.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-white/90 font-medium"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
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
          Step 3 of 6
        </div>
      </div>
    </div>
  );
}
