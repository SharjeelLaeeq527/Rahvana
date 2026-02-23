"use client";

import React, { useState } from "react";
import { useCnicWizard } from "../CnicContext";
import {
  Info,
  AlertTriangle,
  ExternalLink,
  Link as LinkIcon,
  CreditCard,
  History,
  Activity,
  MessageSquare,
  PhoneCall,
  Clock,
} from "lucide-react";

type ContextDataMap = {
  tips?: string[];
  pitfalls?: string[];
  links?: { title: string; url: string }[];
};

const CONTEXT_DATA: Record<number, ContextDataMap> = {
  0: {
    // Welcome
    tips: [
      "The Computerised National Identity Card (CNIC) is your primary proof of identity in Pakistan.",
      "It is mandatory for all citizens aged 18 and above.",
      "First-time applicants must apply in-person or use the Pak ID app, but biometric capture is crucial.",
    ],
    pitfalls: [
      "Do not delay applying after turning 18; it can complicate university admissions or bank account openings.",
      "If using the online app, poor lighting can reject your fingerprints.",
    ],
    links: [
      {
        title: "NADRA Official Website",
        url: "https://www.nadra.gov.pk/",
      },
    ],
    // lastVerified: "February 2026",
  },
  1: {
    // Who is applying
    tips: [
      "For a standard 18+ application, you must have a blood relative (parent or sibling) verifiable in the NADRA database.",
      "If you don't have blood relatives (e.g., orphan), you can still apply through a special verification process.",
    ],
    pitfalls: [
      "Special cases (Orphans) require court or guardian verification which takes more time.",
      "Lying about family members will lead to permanent blocking of your CNIC.",
    ],
    links: [],
    // lastVerified: "February 2026",
  },
  2: {
    // Application Type
    tips: [
      "The Government frequently announces 'Free First CNIC' campaigns. Check if one is active.",
      "For lost CNICs, you may no longer need a strict police FIR, but it's good practice to keep a report.",
    ],
    pitfalls: [
      "Corrections to your date of birth or name require verified school records or court orders.",
      "Do not try to get a 'New' CNIC if you already lost your old one. Ensure you apply for a 'Replacement'.",
    ],
    links: [],
    // lastVerified: "February 2026",
  },
  3: {
    // Method
    tips: [
      "The Pak ID mobile app is highly recommended. You can avoid queueing at NADRA centers completely.",
      "At a NADRA center, go early in the morning to avoid the midday rush.",
    ],
    pitfalls: [
      "The mobile app's fingerprint scanner requires practice. Ensure your phone camera is clean and fingers are dry.",
      "In-person applications without original documents will be rejected at the counter.",
    ],
    links: [
      {
        title: "Download Pak ID (Android)",
        url: "https://play.google.com/store/apps/details?id=pk.gov.nadra.pakid",
      },
      {
        title: "Download Pak ID (iOS)",
        url: "https://apps.apple.com/pk/app/pak-identity/id1563975817",
      },
    ],
    // lastVerified: "February 2026",
  },
  4: {
    // Roadmap
    tips: [
      "Normal processing takes ~30 days, Urgent ~15 days, Executive ~6 days.",
      "You can track your application status via SMS (send Tracking ID to 8400).",
    ],
    pitfalls: [
      "Delivery to rural areas might take an additional 3-5 days beyond the processing time.",
      "Holidays and system downtimes can unpredictably delay processing.",
    ],
    links: [],
    // lastVerified: "February 2026",
  },
  5: {
    // Documents
    tips: [
      "Always carry the ORIGINAL B-Form or CRC and the original CNIC of your parent/guardian.",
      "Utility bills or domicile are optional but highly recommended to prove current address.",
    ],
    pitfalls: [
      "Photocopies, even if attested, are NOT accepted in place of original documents.",
      "If your B-form has a spelling mistake, fix the B-form first before applying for the CNIC.",
    ],
    links: [],
    // lastVerified: "February 2026",
  },
  6: {
    // Fees & Tracking
    tips: [
      "Check the NADRA website for the exact updated fee structure, as prices change.",
      "Online payments can be made via credit/debit card directly in the Pak ID app.",
    ],
    pitfalls: [
      "Never pay agents or middlemen for 'fast tracking' your CNIC. They cannot bypass the NADRA system.",
    ],
    links: [
      {
        title: "NADRA Fee Schedule",
        url: "https://www.nadra.gov.pk/fee-structure/",
      },
    ],
    // lastVerified: "February 2026",
  },
};

export default function ContextPanel() {
  const { state } = useCnicWizard();
  const [activeTab, setActiveTab] = useState("tips");
  // const [showOfficeModal, setShowOfficeModal] = useState(false);
  // const [mounted, setMounted] = useState(false);

  const isNew = state.applicationType === "new";

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  // // Prevent background scrolling when modal is open
  // useEffect(() => {
  //   if (showOfficeModal) {
  //     document.body.style.overflow = "hidden";
  //   } else {
  //     document.body.style.overflow = "";
  //   }
  //   return () => {
  //     document.body.style.overflow = "";
  //   };
  // }, [showOfficeModal]);

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

        {/* Fee Structure Section */}
        <div className="mt-8 pb-4 border-t border-slate-200 pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
              Fee Structure
            </h2>
          </div>

          {isNew && (
            <div className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-4 text-white mb-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-full shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1 leading-none">
                    First CNIC May Be Free
                  </h3>
                  <p className="text-white/90 leading-relaxed text-[0.8rem]">
                    Recent government initiatives frequently waive fees for
                    first-time applicants aged 18+. Check with NADRA staff to
                    avoid paying!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Processing Tiers
            </h3>
            <div className="flex flex-col gap-3">
              {[
                {
                  type: "Normal",
                  price: "~750",
                  days: "approx. 30 days",
                  badge: "bg-blue-100 text-blue-700",
                },
                {
                  type: "Urgent",
                  price: "~1,500",
                  days: "approx. 15 days",
                  badge: "bg-purple-100 text-purple-700",
                },
                {
                  type: "Executive",
                  price: "~2,500",
                  days: "approx. 6 days",
                  badge: "bg-orange-100 text-orange-700",
                },
              ].map((tier, i) => (
                <div
                  key={i}
                  className="bg-white border text-center border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="text-left flex flex-col gap-1 items-start">
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${tier.badge}`}
                    >
                      {tier.type}
                    </div>
                    <p className="text-[0.75rem] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tier.days}
                    </p>
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    <span className="text-xs font-medium text-slate-400 mr-1 align-top relative top-0.5">
                      Rs.
                    </span>
                    {tier.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracking Section (Moved from RoadmapStep) */}
        <div className="mt-2 pb-4 border-t border-slate-200 pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
              Tracking
            </h2>
            {/* <p className="text-slate-600 text-[0.85rem]">
              Everything you need to know about processing costs and how to
              monitor your CNIC application.
            </p> */}
          </div>

          <div className="bg-slate-100/50 rounded-2xl p-4 border border-slate-200/60">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              How to track
            </h3>
            <div className="flex flex-col gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[0.8rem] mb-0.5">
                    SMS Tracking
                  </p>
                  <p className="text-[0.75rem] text-slate-500 leading-relaxed">
                    Send your tracking ID to <strong>8400</strong> via SMS.
                  </p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[0.8rem] mb-0.5">
                    Helpline
                  </p>
                  <p className="text-[0.75rem] text-slate-500 leading-relaxed">
                    Call <strong>1777</strong> (mobile) or{" "}
                    <strong>051-111-786-100</strong> (landline).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Locate Nearest Office Button */}
      {/* <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={() => setShowOfficeModal(true)}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Building2 className="w-5 h-5" />
          Locate Nearest NADRA Office
        </button>
      </div> */}

      {/* Office Modal */}
      {/* {mounted &&
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
        )} */}
    </div>
  );
}
