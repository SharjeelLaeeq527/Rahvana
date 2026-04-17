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

const CEAC_STATUS_UI: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  "Administrative Processing": { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", icon: Clock },
  "Ready":                    { bg: "bg-blue-500/10",  text: "text-blue-500",  border: "border-blue-500/20",  icon: Shield },
  "Issued":                    { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", icon: CheckCircle2 },
  "Approved":                  { bg: "bg-teal-500/10",  text: "text-teal-500",  border: "border-teal-500/20",  icon: CheckCircle2 },
  "Refused":                   { bg: "bg-red-500/10",   text: "text-red-500",   border: "border-red-500/20",   icon: AlertTriangle },
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
  const daysInAP = startDate 
    ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statusUI = CEAC_STATUS_UI[apDetails.ceacStatus] || CEAC_STATUS_UI["Administrative Processing"];
  const StatusIcon = statusUI.icon;

  return (
    <div className="bg-[#0f1f38] rounded-[26px] border border-red-500/20 shadow-2xl overflow-hidden relative mb-4">
      {/* Background Accents */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Header / Trigger */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full relative z-10 p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg transition-all ${statusUI.bg} ${statusUI.border}`}>
            <StatusIcon className={`${statusUI.text} h-6 w-6`} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-current ${statusUI.text} bg-white/5`}>
                {apDetails.ceacStatus}
              </span>
              <span className="text-white/20 text-[10px]">•</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">AP Status Tracker</span>
            </div>
            <h3 className="text-[20px] font-black text-white leading-tight">Administrative Processing</h3>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[12px] font-bold text-red-400">{daysInAP} Days Passed</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interview Timeline</span>
              </div>
              <p className="text-[13px] font-bold text-white">
                {startDate ? startDate.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not recorded'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Date AP was initiated by Officer</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documents Request</span>
              </div>
              <p className={`text-[13px] font-bold ${apDetails.docsRequested === 'yes' ? 'text-amber-400' : 'text-green-400'}`}>
                {apDetails.docsRequested === 'yes' ? 'Additional Docs Pending' : 'No Documents Requested'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Status of 221(g) requirements</p>
            </div>
          </div>

          {/* Assistant Intelligence Logic */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-red-400" size={16} />
                </div>
                <div>
                   <h4 className="text-[13px] font-black text-red-300 mb-1">Islamabad AP Check</h4>
                   <p className="text-[12px] text-red-200/70 leading-relaxed font-medium">
                     {daysInAP < 30 
                       ? "Initial processing phase. Most cases from Islamabad resolve within 60-90 days, though security clearances can take longer."
                       : daysInAP < 90 
                         ? "You are within the standard AP window. Ensure your CEAC status is checked weekly for updates or 'Refused' to 'Administrative Processing' changes."
                         : "Case has exceeded 90 days. You may consider reaching out to the embassy for a status inquiry via the official contact form."}
                   </p>
                </div>
             </div>
          </div>

          {/* Update History Log */}
          {updateLog.length > 0 && (
            <div className="mt-2 text-white">
              <div className="flex items-center gap-2 mb-4">
                <History size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Status Updates</span>
              </div>
              <div className="space-y-3">
                {updateLog.slice(0, 3).map((log, idx) => (
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

          {/* Link to CEAC */}
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
