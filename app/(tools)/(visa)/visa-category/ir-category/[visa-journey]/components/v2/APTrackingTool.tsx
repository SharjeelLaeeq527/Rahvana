"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Calendar,
  History,
  ArrowRight
} from "lucide-react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

interface APTrackingToolProps {
  state: WizardState;
}

const CEAC_STATUS_UI: Record<string, {
  bg: string; text: string; border: string; icon: any;
  cardBorder: string; accentTop: string; accentBottom: string;
  heading: string; trackerLabel: string;
  counterColor: string; counterLabel: (days: number) => string;
  intelligenceBg: string; intelligenceTitle: string;
}> = {
  "Administrative Processing": {
    bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20",
    cardBorder: "border-red-500/20", accentTop: "bg-red-500/10", accentBottom: "bg-amber-500/5",
    heading: "Administrative Processing",
    trackerLabel: "AP Status Tracker",
    counterColor: "text-red-400",
    counterLabel: (d) => `${d} Day${d !== 1 ? 's' : ''} in AP`,
    intelligenceBg: "bg-red-500/10 border-red-500/20",
    intelligenceTitle: "Islamabad AP Check",
    icon: Clock,
  },
  "In Transit": {
    bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20",
    cardBorder: "border-indigo-500/20", accentTop: "bg-indigo-500/10", accentBottom: "bg-indigo-500/5",
    heading: "Case In Transit — Being Transferred",
    trackerLabel: "CEAC Status Tracker",
    counterColor: "text-indigo-400",
    counterLabel: (d) => d === 0 ? "Just entered In Transit" : `In Transit for ${d} day${d !== 1 ? 's' : ''}`,
    intelligenceBg: "bg-indigo-500/10 border-indigo-500/20",
    intelligenceTitle: "What 'In Transit' means",
    icon: Clock,
  },
  "Ready": {
    bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20",
    cardBorder: "border-blue-500/20", accentTop: "bg-blue-500/10", accentBottom: "bg-blue-500/5",
    heading: "Status: Ready — Case at Embassy",
    trackerLabel: "CEAC Status Tracker",
    counterColor: "text-blue-400",
    counterLabel: (d) => d === 0 ? "Just became Ready" : `Ready for ${d} day${d !== 1 ? 's' : ''}`,
    intelligenceBg: "bg-blue-500/10 border-blue-500/20",
    intelligenceTitle: "What 'Ready' means",
    icon: Shield,
  },
  "Pending": {
    bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20",
    cardBorder: "border-slate-500/20", accentTop: "bg-slate-500/10", accentBottom: "bg-slate-500/5",
    heading: "Status: Pending — Awaiting Processing",
    trackerLabel: "CEAC Status Tracker",
    counterColor: "text-slate-400",
    counterLabel: (d) => d === 0 ? "Pending since today" : `Pending for ${d} day${d !== 1 ? 's' : ''}`,
    intelligenceBg: "bg-slate-500/10 border-slate-500/20",
    intelligenceTitle: "What 'Pending' means",
    icon: Clock,
  },
  "Not Available": {
    bg: "bg-slate-600/10", text: "text-slate-500", border: "border-slate-600/20",
    cardBorder: "border-slate-600/20", accentTop: "bg-slate-600/10", accentBottom: "bg-slate-600/5",
    heading: "Status: Not Available",
    trackerLabel: "CEAC Status Tracker",
    counterColor: "text-slate-500",
    counterLabel: (d) => d === 0 ? "Status unavailable" : `Unavailable for ${d} day${d !== 1 ? 's' : ''}`,
    intelligenceBg: "bg-slate-600/10 border-slate-600/20",
    intelligenceTitle: "Why is status Not Available?",
    icon: AlertTriangle,
  },
  "Issued": {
    bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20",
    cardBorder: "border-green-500/30", accentTop: "bg-green-500/10", accentBottom: "bg-emerald-500/5",
    heading: "Visa Issued — Congratulations!",
    trackerLabel: "Visa Status",
    counterColor: "text-green-400",
    counterLabel: (d) => d === 0 ? "Issued today!" : `Issued ${d} day${d !== 1 ? 's' : ''} ago`,
    intelligenceBg: "bg-green-500/10 border-green-500/20",
    intelligenceTitle: "Next step — track your courier",
    icon: CheckCircle2,
  },
  "Approved": {
    bg: "bg-teal-500/10", text: "text-teal-500", border: "border-teal-500/20",
    cardBorder: "border-teal-500/20", accentTop: "bg-teal-500/10", accentBottom: "bg-teal-500/5",
    heading: "Visa Approved",
    trackerLabel: "Visa Status",
    counterColor: "text-teal-400",
    counterLabel: (d) => `Approved ${d} day${d !== 1 ? 's' : ''} ago`,
    intelligenceBg: "bg-teal-500/10 border-teal-500/20",
    intelligenceTitle: "Next steps",
    icon: CheckCircle2,
  },
  "Refused": {
    bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20",
    cardBorder: "border-red-500/30", accentTop: "bg-red-500/10", accentBottom: "bg-red-500/5",
    heading: "Refused — Review Your Written Notice",
    trackerLabel: "Refusal & 221(g) Tracker",
    counterColor: "text-red-400",
    counterLabel: (d) => `${d} Day${d !== 1 ? 's' : ''} since refusal`,
    intelligenceBg: "bg-red-500/10 border-red-500/20",
    intelligenceTitle: "221(g) or Final Denial? — Read your notice",
    icon: AlertTriangle,
  },
};

export default function APTrackingTool({ state }: APTrackingToolProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Pulling data directly from the Roadmap Step 9 recorded metadata
  const apDetails = state.metadata?.apDetails || {};
  const apSaved = state.metadata?.apSaved === "true";
  const updateLog = (state.metadata?.apUpdateLog as any[]) || [];

  if (!apSaved) {
    return (
      <div className="bg-[#0f1f38] rounded-[22px] border border-red-500/20 p-6 text-white mb-4 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <Shield className="text-red-400" size={22} />
            </div>
            <div>
              <h3 className="text-[16px] font-black">AP Tracking Active</h3>
              <p className="text-[12px] text-slate-400">Please record your AP details in Chapter 3, Step 9 to activate dashboard tracking.</p>
            </div>
          </div>
          <button 
             onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
             className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const startDate = apDetails.interviewDate ? new Date(apDetails.interviewDate) : null;
  // AP date must be in the past (interview already happened).
  // If user accidentally entered a future date, show 0 with a hint instead of negative.
  const isDateInFuture = startDate ? startDate.getTime() > Date.now() : false;
  const daysInAP = (startDate && !isDateInFuture)
    ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statusUI = CEAC_STATUS_UI[apDetails.ceacStatus] || CEAC_STATUS_UI["Administrative Processing"];
  const StatusIcon = statusUI.icon;

  const ceacStatus = apDetails.ceacStatus as string || "Administrative Processing"
  const isIssued      = ceacStatus === "Issued" || ceacStatus === "Approved"
  const isRefused     = ceacStatus === "Refused"
  const isAP          = ceacStatus === "Administrative Processing"
  const isTransitional = ceacStatus === "In Transit" || ceacStatus === "Ready" || ceacStatus === "Pending" || ceacStatus === "Not Available"

  // Intelligence message — changes per status and days elapsed
  const intelligenceMessage =
    isIssued
      ? "Log into your USVisaScheduling courier account now and track your passport delivery. Confirm your delivery address is correct. If there is a delivery issue, contact the courier service — not the embassy."
    : isRefused
      ? "Read your written notice from the officer carefully. It will state whether this is a 221(g) request (case still active — submit the requested documents) or a final denial under a specific INA ground. These two situations require completely different responses."
    : isAP
      ? (daysInAP < 30
          ? "Initial processing phase. Most cases resolve within 60–90 days, though security clearances can take longer. No action needed right now — check CEAC weekly and update here if anything changes."
          : daysInAP < 90
            ? "You are within the standard AP window. Check CEAC every 1–2 weeks. Do not contact the embassy repeatedly — it does not speed up the process."
            : "Your case has exceeded 90 days in AP. Consider a congressional inquiry or consulting an immigration attorney. Continue checking CEAC weekly.")
    : ceacStatus === "In Transit"
      ? "Your case has left NVC and is being transferred to the U.S. Embassy or consulate. This status is usually brief — hours to a few days. Watch for the status to change to 'Ready' or your post-interview outcome. No action needed."
    : ceacStatus === "Ready"
      ? "'Ready' means the embassy or consulate has your file and your case is being processed. If this is post-interview, the final outcome (Issued, AP, or Refused) will appear within days. Check CEAC every few days."
    : ceacStatus === "Pending"
      ? "'Pending' means your case has not yet been processed by NVC or the consulate. This is normal in early stages. Check back in 2–3 days. If it persists beyond 2 weeks, verify your case number is correct."
    : ceacStatus === "Not Available"
      ? "CEAC cannot find your case number. Double-check the case number you entered. It can take 2–5 business days after NVC registration for the case to appear. If it persists beyond 1 week, contact NVC."
    : "Monitor your CEAC status and update it here when it changes."

  return (
    <div className={`bg-[#0f1f38] rounded-[26px] border ${statusUI.cardBorder} shadow-2xl overflow-hidden relative mb-4`}>
      {/* Background Accents — dynamic per status */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 ${statusUI.accentTop} rounded-full blur-[100px] pointer-events-none`} />
      <div className={`absolute -bottom-20 -left-20 w-64 h-64 ${statusUI.accentBottom} rounded-full blur-[100px] pointer-events-none`} />

      {/* Main Header / Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full relative z-10 p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${statusUI.bg} ${statusUI.border}`}>
            <StatusIcon className={`${statusUI.text} h-6 w-6`} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-current ${statusUI.text} bg-white/5`}>
                {ceacStatus}
              </span>
              <span className="text-white/20 text-[10px]">•</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{statusUI.trackerLabel}</span>
            </div>
            <h3 className="text-[20px] font-black text-white leading-tight">{statusUI.heading}</h3>
            <div className="flex items-center gap-3 mt-1">
              {isDateInFuture && !isIssued && !isRefused ? (
                // Only warn about future date for AP/Ready — not for post-interview outcomes
                <span className="text-[12px] font-bold text-amber-400">Interview date is upcoming — tracking starts after your interview</span>
              ) : isDateInFuture && (isIssued || isRefused) ? (
                // Issued/Refused with future date = user entered wrong date
                <span className="text-[12px] font-bold text-amber-400">Please verify your interview date — it appears to be in the future</span>
              ) : (
                <span className={`text-[12px] font-bold ${statusUI.counterColor}`}>
                  {statusUI.counterLabel(daysInAP)}
                </span>
              )}
              {apDetails.lastCheck && (
                <span className="text-[11px] text-slate-500">Checked: {new Date(apDetails.lastCheck).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 border border-white/5">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative z-10 px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-white/5 mb-6" />

          {/* Info Cards — AP/Refused only (not for transitional statuses or Issued) */}
          {!isIssued && !isTransitional && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interview Date</span>
                </div>
                <p className="text-[13px] font-bold text-white">
                  {startDate ? startDate.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not recorded'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{isAP ? "Date AP was placed on your case" : "Date of your interview"}</p>
              </div>

              {(isAP || isRefused) && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">221(g) Documents</span>
                  </div>
                  {apDetails.docsRequested === 'yes' ? (
                    <>
                      <p className="text-[13px] font-bold text-amber-400">Additional docs requested</p>
                      {apDetails.docs221gSubmittedAt ? (
                        <p className="text-[11px] text-green-400 mt-1 font-bold">
                          ✓ Submitted {new Date(apDetails.docs221gSubmittedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-300/70 mt-1">Pending submission — update Step 9 when sent</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] font-bold text-slate-300">No documents requested</p>
                      <p className="text-[11px] text-slate-500 mt-1">221(g) not applicable</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Issued — courier tracking card */}
          {isIssued && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-black text-green-300 mb-1">Track your courier delivery</p>
                <p className="text-[11px] text-green-200/60">Log into USVisaScheduling to track your passport shipment.</p>
              </div>
              <button
                onClick={() => window.open("https://www.usvisascheduling.com", "_blank")}
                className="shrink-0 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-[11px] font-black text-green-300 hover:bg-green-500/30 transition-all flex items-center gap-1.5"
              >
                Track <ExternalLink size={10} />
              </button>
            </div>
          )}

          {/* Intelligence Block — dynamic content and color per status */}
          <div className={`${statusUI.intelligenceBg} border rounded-2xl p-5 mb-6`}>
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusUI.bg}`}>
                <StatusIcon className={statusUI.text} size={16} />
              </div>
              <div>
                <h4 className={`text-[13px] font-black mb-1 ${statusUI.text}`}>{statusUI.intelligenceTitle}</h4>
                <p className="text-[12px] text-white/60 leading-relaxed font-medium">{intelligenceMessage}</p>
              </div>
            </div>
          </div>

          {/* Update History Log */}
          {updateLog.length > 0 && (
            <div className="mt-2 text-white">
              <div className="flex items-center gap-2 mb-4">
                <History size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status History</span>
              </div>
              <div className="space-y-3">
                {updateLog.slice(0, 3).map((log: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500">{new Date(log.date).toLocaleDateString()}</div>
                      <div className="text-[12px] font-medium text-slate-300 mt-0.5">{log.note || 'Status checked'}</div>
                    </div>
                    <div className="text-[10px] font-black text-white/40">{log.ceac}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => window.open("https://ceac.state.gov/CEACStatTracker/Status.aspx", "_blank")}
            className="w-full mt-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black text-white hover:bg-white/10 transition-all group"
          >
            Check Official CEAC Tracker
            <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}
