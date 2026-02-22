"use client";

import React from "react";
import { useCnicWizard } from "../../CnicContext";
import {
  Download,
  UserPlus,
  FileText,
  Fingerprint,
  CreditCard,
  MapPin,
  Camera,
  Keyboard,
  CheckCircle2,
} from "lucide-react";

export default function Step4() {
  const { state, setCurrentStep, completeStep } = useCnicWizard();

  const isOnline = state.applicationMethod === "online";

  const handleNext = () => {
    completeStep(4);
    setCurrentStep(5);
  };
  const handleBack = () => setCurrentStep(3);

  const onlineSteps = [
    {
      title: "Download PakID App",
      desc: "Available on iOS and Android. Register your new account using mobile/email.",
      icon: Download,
    },
    {
      title: "Start Application",
      desc: `Select '${state.applicationType === "new" ? "New CNIC" : "Modify CNIC"}' from the dashboard categories.`,
      icon: UserPlus,
    },
    {
      title: "Details & Uploads",
      desc: "Enter your personal information and upload scanned pictures of required documents.",
      icon: FileText,
    },
    {
      title: "Fingerprints",
      desc: "Use the app's camera to capture your fingerprints directly from your phone.",
      icon: Fingerprint,
    },
    {
      title: "Payment & Submit",
      desc: "Pay the fee online via credit/debit card. Submit and track the status in-app.",
      icon: CreditCard,
    },
  ];

  const inpersonSteps = [
    {
      title: "Locate Center",
      desc: "Find your nearest NADRA Registration Center (NRC). Go early to avoid rush.",
      icon: MapPin,
    },
    {
      title: "Token & Photo",
      desc: "Get a queue token. When called to the counter, your photo will be captured.",
      icon: Camera,
    },
    {
      title: "Data Entry",
      desc: "Provide your details and original documents to the NADRA operator.",
      icon: Keyboard,
    },
    {
      title: "Biometrics",
      desc: "Provide your fingerprints on the scanner and securely sign the digital form.",
      icon: Fingerprint,
    },
    {
      title: "Review & Submit",
      desc: "Carefully verify the printed form data, sign it, and collect your tracking receipt.",
      icon: CheckCircle2,
    },
  ];

  const roadmapSteps = isOnline ? onlineSteps : inpersonSteps;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center mb-4 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
          Custom Roadmap
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Your Step-by-Step Process
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          Here is exactly what you will experience applying{" "}
          <strong>{isOnline ? "Online via App" : "In-Person at NADRA"}</strong>.
        </p>
      </div>

      <div className="relative pl-8 border-l-2 border-slate-200 space-y-8 py-4 mb-10">
        {roadmapSteps.map((step, i) => (
          <div key={i} className="relative group">
            <div className="absolute -left-[41px] top-0 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-primary/10 text-primary z-10">
              <step.icon className="w-5 h-5" />
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/10">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <span className="text-primary/50">0{i + 1}.</span> {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
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
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            Step 4 of 6
          </div>
          <button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-primary/20"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
