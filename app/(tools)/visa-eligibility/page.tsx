"use client";

import { VisaEligibilityTool } from "./components/VisaEligibilityTool";
import { useEffect } from "react";

export default function VisaSuggestionPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return (
    <div className="w-full bg-slate-50 flex flex-col items-center justify-center overflow-hidden site-main-px site-main-py">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
          Visa Eligibility Checker
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Check your eligibility for visa based on your profile and
          circumstances
        </p>
      </header>

      <div className="w-full h-full flex items-center justify-center">
        <VisaEligibilityTool />
      </div>
    </div>
  );
}
