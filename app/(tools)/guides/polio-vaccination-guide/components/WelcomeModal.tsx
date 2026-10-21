"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePolioWizard } from "../PolioContext";
import { X, Info, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function WelcomeModal() {
  const { showWelcomeModal, setShowWelcomeModal } = usePolioWizard();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showWelcomeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showWelcomeModal]);

  if (!showWelcomeModal || !mounted || typeof document === "undefined") return null;

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("dont_show_polio_welcome", "true");
    }
    setShowWelcomeModal(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-none sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 welcome-thick-scrollbar">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl shrink-0">
                <ShieldCheck className="w-6 sm:w-8 h-6 sm:h-8 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">
                  Polio Vaccination Wizard
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 break-words">
                  Official Polio Certificate (2026) Guide
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Close modal"
            >
              <X className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            <section>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
                What does this guide cover?
              </h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                A Polio Vaccination Certificate is an official document that proves you have
                received the polio vaccine. It is managed by NADRA through the National Immunization
                Management System (NIMS). This interactive wizard will customize the process based
                on your profile (Adult/Child) and location, guiding you through vaccination centers
                and the online download process.
              </p>
            </section>

            <section>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 sm:mb-3">
                How this interactive guide helps you
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4 text-primary shrink-0" />
                  </div>
                  <span>
                    <strong className="text-slate-800">Targeted Locations:</strong> Find recognized
                    DHOs and hospitals in your specific province.
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4 text-primary shrink-0" />
                  </div>
                  <span>
                    <strong className="text-slate-800">Avoid Pitfalls:</strong> Learn why private
                    hospital certificates might get rejected for travel.
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4 text-primary shrink-0" />
                  </div>
                  <span>
                    <strong className="text-slate-800">Clear Roadmap:</strong> A robust step-by-step
                    path detailing exactly how to use the NIMS portal.
                  </span>
                </li>
              </ul>
            </section>

            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-100/50">
              <div className="flex items-start gap-2 sm:gap-3">
                <Info className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-800">
                  <p className="font-bold mb-1">Disclaimer</p>
                  <p>
                    This is an informational guide and not an official NADRA website. Always confirm
                    specific requirements with your airline or destination country&apos;s embassy
                    prior to travel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-auto shrink-0">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary focus:ring-2 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
              Don&apos;t show this again
            </span>
          </label>
          <button
            onClick={handleClose}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
