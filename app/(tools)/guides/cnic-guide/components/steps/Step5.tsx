"use client";

import React from "react";
import { useCnicWizard } from "../../CnicContext";
import {
  CreditCard,
  History,
  Clock,
  Activity,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

export default function Step5() {
  const { state, setCurrentStep, resetWizard } = useCnicWizard();

  const isNew = state.applicationType === "new";

  const handleBack = () => setCurrentStep(3);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Fees & Tracking
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          Everything you need to know about processing costs and how to monitor
          your CNIC application.
        </p>
      </div>

      {isNew && (
        <div className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-6 text-white mb-8 shadow-md">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-full shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">First CNIC May Be Free</h3>
              <p className="text-white/90 leading-relaxed text-sm">
                Recent government initiatives frequently waive fees for
                first-time applicants aged 18+ (for standard non-smart cards).
                Check with the NADRA staff if this campaign is currently active
                to avoid paying any processing fees!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          Processing Tiers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="bg-white border text-center border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div
                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${tier.badge}`}
              >
                {tier.type}
              </div>
              <div className="text-3xl font-black text-slate-900 mb-2">
                <span className="text-sm font-medium text-slate-400 mr-1 align-top relative top-1">
                  Rs.
                </span>
                {tier.price}
              </div>
              <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {tier.days}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">
          * Fees are subject to updates by NADRA. Always verify on the official
          website.
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          How to track your status
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-primary/10 p-2.5 rounded-lg text-primary shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm mb-1">
                SMS Tracking
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send your application tracking ID to <strong>8400</strong> via
                SMS to instantly get the current status.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm mb-1">
                NADRA Helpline
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Call <strong>1777</strong> from mobile or{" "}
                <strong>051-111-786-100</strong> from landline for direct
                assistance.
              </p>
            </div>
          </div>
        </div>
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
            Step 4 of 4
          </div>
          <button
            onClick={resetWizard}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md"
          >
            Restart Guide
          </button>
        </div>
      </div>
    </div>
  );
}
