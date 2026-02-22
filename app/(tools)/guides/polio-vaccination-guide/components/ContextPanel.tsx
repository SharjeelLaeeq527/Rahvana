"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePolioWizard } from "../PolioContext";
import {
  Info,
  AlertTriangle,
  ExternalLink,
  Link as LinkIcon,
  Activity,
} from "lucide-react";

import OfficeFinderStep from "./steps/OfficeFinderStep";

type ContextDataMap = {
  tips?: string[];
  pitfalls?: string[];
  links?: { title: string; url: string }[];
};

const CONTEXT_DATA: Record<number, ContextDataMap> = {
  0: {
    // Welcome
    tips: [
      "The Polio Vaccination Certificate is becoming increasingly necessary for international travel from Pakistan.",
      "Many countries require proof of vaccination to prevent international spread of the virus.",
    ],
    pitfalls: [
      "Waiting until the last minute before travel can cause issues, as some airlines suggest getting vaccinated 4 weeks prior.",
    ],
    links: [
      {
        title: "NIMS Official Portal",
        url: "https://nims.nadra.gov.pk/nims/",
      },
    ],
  },
  1: {
    // Who Needs It / Docs
    tips: [
      "Always take your original passport and CNIC if you are applying for a travel-related certificate.",
      "For children, ensure you carry their B-Form or official Birth Certificate.",
    ],
    pitfalls: [
      "Without original identification documents, health workers cannot correctly register your data in the system.",
    ],
    links: [],
  },
  2: {
    // Where to Go
    tips: [
      "District Health Offices (DHOs) are often the most reliable places to get registered simultaneously on NIMS.",
      "Visit government centers early in the morning to avoid closures.",
    ],
    pitfalls: [
      "Private hospitals can administer the vaccine, but ONLY government or recognized EPI teams can record it in NIMS.",
    ],
    links: [],
  },
  3: {
    // Step 1: Get Vaccinated
    tips: [
      "Both bOPV (oral drops) and IPV (injectable) vaccines are acceptable for the certificate.",
    ],
    pitfalls: [
      "Ensure you explicitly state that you need the vaccination for an official certificate/travel, so they know to record it.",
    ],
    links: [],
  },
  4: {
    // Step 2: NIMS Entry
    tips: [
      "PRO TIP: Always verify your NIMS record before leaving the vaccination center. Ask the staff to show you the entry confirmation on their tab/system.",
    ],
    pitfalls: [
      "If the health office forgets to record your vaccine in NIMS, you will NOT be able to download the certificate later. You would have to go back.",
    ],
    links: [],
  },
  5: {
    // Step 3: Download Online
    tips: [
      "Issuance is almost immediate once your data is in NIMS.",
      "You can print multiple copies once downloaded, keeping one saved on your phone.",
    ],
    pitfalls: [
      "The certificate only costs approx Rs. 100. Be wary of anyone charging exorbitant fees for this service.",
    ],
    links: [
      {
        title: "Download from NIMS",
        url: "https://nims.nadra.gov.pk/nims/",
      },
    ],
  },
};

export default function ContextPanel() {
  const { state } = usePolioWizard();
  const [activeTab, setActiveTab] = useState("tips");
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showOfficeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOfficeModal]);

  // fallback to step 0 if not found
  const context = CONTEXT_DATA[state.currentStep] || CONTEXT_DATA[0];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("tips")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "tips"
              ? "text-primary border-primary"
              : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            <span>Tips</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("pitfalls")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "pitfalls"
              ? "text-primary border-primary"
              : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Pitfalls</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "links"
              ? "text-primary border-primary"
              : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <LinkIcon className="w-4 h-4" />
            <span>Links</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
        {activeTab === "tips" && (
          <div className="space-y-4">
            {context.tips && context.tips.length > 0 ? (
              context.tips.map((tip: string, index: number) => (
                <div
                  key={index}
                  className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                >
                  <div className="shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No tips available for this step.
              </p>
            )}
          </div>
        )}

        {activeTab === "pitfalls" && (
          <div className="space-y-4">
            {context.pitfalls && context.pitfalls.length > 0 ? (
              context.pitfalls.map((pitfall: string, index: number) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100/50"
                >
                  <AlertTriangle className="shrink-0 w-5 h-5 mt-0.5 text-rose-500" />
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {pitfall}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No pitfalls specified for this step.
              </p>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-3">
            {context.links && context.links.length > 0 ? (
              context.links.map((link, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors group"
                >
                  <ExternalLink className="shrink-0 w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary truncate">
                    {link.title}
                  </span>
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No links available for this step.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Locate Nearest Center Button */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={() => setShowOfficeModal(true)}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Activity className="w-5 h-5" />
          Locate Nearest Center
        </button>
      </div>

      {/* Office Modal */}
      {mounted &&
        showOfficeModal &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
              onClick={() => setShowOfficeModal(false)}
            />
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-xl z-10 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <OfficeFinderStep onClose={() => setShowOfficeModal(false)} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
