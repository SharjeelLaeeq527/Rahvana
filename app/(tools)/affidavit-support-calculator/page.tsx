"use client";

import React, { useState, useEffect } from "react";
import SponsorshipCalculatorTool from "@/components/tools/SponsorshipCalculatorTool";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
export default function AffidavitSupportCalculatorPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  // Standalone entry: pre-fill the saved sponsor state when available, but keep
  // the selector shown (lockState=false) so the user always confirms it.
  const presetState = profile?.sponsor?.address?.state || "";

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => setIsOpen(false);

  const handleSave = (result: any) => {
    console.log("Sponsorship result saved:", result);
    setIsOpen(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6"
    style={{
      backgroundImage: "url('/assets/images/affidavit-bg.png')",
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
    >
      {!isOpen && (
        <div
          className="animate-in fade-in text-center duration-700">
          <h1 className="mb-4 text-3xl font-black text-[#0f1f38]">Affidavit Support Calculator</h1>
          <p className="mb-8 text-[#3a4f63]">
            Determine your sponsorship setup based on USCIS requirements.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-[12px] bg-[#0d7377] p-[14px_32px] font-semibold text-white shadow-lg transition-all hover:opacity-90"
          >
            Launch Calculator
          </button>
        </div>
      )}

      <SponsorshipCalculatorTool
        isOpen={isOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={{ state: presetState }}
        lockState={false}
      />
    </div>
  );
}
