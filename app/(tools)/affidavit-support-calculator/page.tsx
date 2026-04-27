"use client";

import React, { useState, useEffect } from "react";
import SponsorshipCalculatorTool from "@/components/tools/SponsorshipCalculatorTool";
import { useAuth } from "@/app/context/AuthContext";
export default function AffidavitSupportCalculatorPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => setIsOpen(false);

  const handleSave = (result: any) => {
    console.log("Sponsorship result saved:", result);
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#fafcff] flex items-center justify-center p-6">
      {!isOpen && (
        <div className="text-center animate-in fade-in duration-700">
          <h1 className="text-3xl font-black text-[#0f1f38] mb-4">Affidavit Support Calculator</h1>
          <p className="text-[#3a4f63] mb-8">Determine your sponsorship setup based on USCIS requirements.</p>
          <button
            onClick={() => setIsOpen(true)}
            className="p-[14px_32px] bg-[#0d7377] text-white rounded-[12px] font-semibold shadow-lg hover:opacity-90 transition-all"
          >
            Launch Calculator
          </button>
        </div>
      )}

      <SponsorshipCalculatorTool
        isOpen={isOpen}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
