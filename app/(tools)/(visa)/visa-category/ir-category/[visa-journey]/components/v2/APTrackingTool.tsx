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
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

interface APTrackingToolProps {
  state: WizardState;
}

// Brand color palette used throughout:
// Primary: #0d7377, Success: #afdbdb, Neutral: #89a4a0, Warning: #cdadcc, Critical: #db8090

interface StatusUI {
  iconBg: string;
  iconColor: string;
  iconBorder: string;
  chipBg: string;
  chipColor: string;
  counterColor: string;
  cardBorder: string;
  accentTop: string;
  accentBottom: string;
  heading: string;
  trackerLabel: string;
  counterLabel: (days: number) => string;
  intBg: string;
  intBorder: string;
  intTitle: string;
  intLabel: string;
  icon: any;
}

const CEAC_STATUS_UI: Record<string, StatusUI> = {
  "Administrative Processing": {
    iconBg: "#f5eef5",
    iconColor: "#8a5a86",
    iconBorder: "#d5c0d3",
    chipBg: "#f5eef5",
    chipColor: "#8a5a86",
    counterColor: "#8a5a86",
    cardBorder: "#d5c0d3",
    accentTop: "rgba(205,173,204,0.12)",
    accentBottom: "rgba(205,173,204,0.06)",
    heading: "Administrative Processing",
    trackerLabel: "AP Status Tracker",
    counterLabel: (d) => `${d} Day${d !== 1 ? "s" : ""} in AP`,
    intBg: "#f9f3f9",
    intBorder: "#e8d4e7",
    intTitle: "#8a5a86",
    intLabel: "AP Intelligence",
    icon: Clock,
  },
  "In Transit": {
    iconBg: "#e6f5f5",
    iconColor: "#0d7377",
    iconBorder: "#a8d4d5",
    chipBg: "#e6f5f5",
    chipColor: "#095c5f",
    counterColor: "#0d7377",
    cardBorder: "#a8d4d5",
    accentTop: "rgba(13,115,119,0.10)",
    accentBottom: "rgba(13,115,119,0.05)",
    heading: "Case In Transit — Being Transferred",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Just entered In Transit" : `In Transit for ${d} day${d !== 1 ? "s" : ""}`,
    intBg: "#e6f5f5",
    intBorder: "#a8d4d5",
    intTitle: "#095c5f",
    intLabel: "What 'In Transit' means",
    icon: Clock,
  },
  Ready: {
    iconBg: "#e6f5f5",
    iconColor: "#0d7377",
    iconBorder: "#a8d4d5",
    chipBg: "#e6f5f5",
    chipColor: "#095c5f",
    counterColor: "#0d7377",
    cardBorder: "#a8d4d5",
    accentTop: "rgba(13,115,119,0.10)",
    accentBottom: "rgba(13,115,119,0.05)",
    heading: "Status: Ready — Case at Embassy",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Just became Ready" : `Ready for ${d} day${d !== 1 ? "s" : ""}`,
    intBg: "#e6f5f5",
    intBorder: "#a8d4d5",
    intTitle: "#095c5f",
    intLabel: "What 'Ready' means",
    icon: Shield,
  },
  Pending: {
    iconBg: "#f0f5f4",
    iconColor: "#64748b",
    iconBorder: "#b7c2c0",
    chipBg: "#f0f5f4",
    chipColor: "#4a6260",
    counterColor: "#4a6260",
    cardBorder: "#b7c2c0",
    accentTop: "rgba(137,164,160,0.10)",
    accentBottom: "rgba(137,164,160,0.05)",
    heading: "Status: Pending — Awaiting Processing",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Pending since today" : `Pending for ${d} day${d !== 1 ? "s" : ""}`,
    intBg: "#f0f5f4",
    intBorder: "#b7c2c0",
    intTitle: "#4a6260",
    intLabel: "What 'Pending' means",
    icon: Clock,
  },
  "Not Available": {
    iconBg: "#f0f5f4",
    iconColor: "#4a6260",
    iconBorder: "#89a4a0",
    chipBg: "#f0f5f4",
    chipColor: "#4a6260",
    counterColor: "#4a6260",
    cardBorder: "#89a4a0",
    accentTop: "rgba(137,164,160,0.10)",
    accentBottom: "rgba(137,164,160,0.05)",
    heading: "Status: Not Available",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Status unavailable" : `Unavailable for ${d} day${d !== 1 ? "s" : ""}`,
    intBg: "#f0f5f4",
    intBorder: "#89a4a0",
    intTitle: "#4a6260",
    intLabel: "Why is status Not Available?",
    icon: AlertTriangle,
  },
  Issued: {
    iconBg: "#e6f5f5",
    iconColor: "#0d7377",
    iconBorder: "#afdbdb",
    chipBg: "#e6f5f5",
    chipColor: "#095c5f",
    counterColor: "#095c5f",
    cardBorder: "#afdbdb",
    accentTop: "rgba(175,219,219,0.15)",
    accentBottom: "rgba(175,219,219,0.08)",
    heading: "Visa Issued — Congratulations!",
    trackerLabel: "Visa Status",
    counterLabel: (d) => (d === 0 ? "Issued today!" : `Issued ${d} day${d !== 1 ? "s" : ""} ago`),
    intBg: "#e6f5f5",
    intBorder: "#afdbdb",
    intTitle: "#095c5f",
    intLabel: "Next step — track your courier",
    icon: CheckCircle2,
  },
  Approved: {
    iconBg: "#e6f5f5",
    iconColor: "#0d7377",
    iconBorder: "#afdbdb",
    chipBg: "#e6f5f5",
    chipColor: "#095c5f",
    counterColor: "#095c5f",
    cardBorder: "#afdbdb",
    accentTop: "rgba(175,219,219,0.15)",
    accentBottom: "rgba(175,219,219,0.08)",
    heading: "Visa Approved",
    trackerLabel: "Visa Status",
    counterLabel: (d) => `Approved ${d} day${d !== 1 ? "s" : ""} ago`,
    intBg: "#e6f5f5",
    intBorder: "#afdbdb",
    intTitle: "#095c5f",
    intLabel: "Next steps",
    icon: CheckCircle2,
  },
  Refused: {
    iconBg: "#fbe8ec",
    iconColor: "#b85a6a",
    iconBorder: "#f0c8d0",
    chipBg: "#fbe8ec",
    chipColor: "#7a3a4a",
    counterColor: "#b85a6a",
    cardBorder: "#f0c8d0",
    accentTop: "rgba(219,128,144,0.12)",
    accentBottom: "rgba(219,128,144,0.06)",
    heading: "Refused — Review Your Written Notice",
    trackerLabel: "Refusal & 221(g) Tracker",
    counterLabel: (d) => `${d} Day${d !== 1 ? "s" : ""} since refusal`,
    intBg: "#fbe8ec",
    intBorder: "#f0c8d0",
    intTitle: "#7a3a4a",
    intLabel: "221(g) or Final Denial? — Read your notice",
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
      <div
        className="rounded-[22px] border p-6 text-white mb-4 relative overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, #0d7377 0%, #063e40 100%)",
          borderColor: "#db8090",
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] pointer-events-none"
          style={{ background: "rgba(219,128,144,0.15)" }}
        />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{ background: "rgba(219,128,144,0.2)", borderColor: "rgba(219,128,144,0.35)" }}
            >
              <Shield className="text-[#db8090]" size={22} />
            </div>
            <div>
              <h3 className="text-[16px] font-black">AP Tracking Active</h3>
              <p className="text-[12px] text-white/60">
                Please record your AP details in Chapter 3, Step 9 to activate dashboard tracking.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all text-white hover:bg-white/20"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const ceacStatusRaw = (apDetails.ceacStatus as string) || "Administrative Processing";
  const isTransitionalStatus = ["Ready", "In Transit", "Pending", "Not Available"].includes(
    ceacStatusRaw
  );
  // Admin-set last check date (from admin panel) — user cannot edit this
  const adminLastCheckDate = state.metadata?.admin_last_check_date as string | undefined;
  const dateField = isTransitionalStatus ? apDetails.interviewDate : apDetails.interviewDate;
  const startDate = dateField ? new Date(dateField) : null;
  const isDateInFuture = startDate ? startDate.getTime() > Date.now() : false;
  const daysInAP =
    startDate && !isDateInFuture
      ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const statusUI = CEAC_STATUS_UI[ceacStatusRaw] || CEAC_STATUS_UI["Administrative Processing"];
  const StatusIcon = statusUI.icon;

  const ceacStatus = ceacStatusRaw;
  const isIssued = ceacStatus === "Issued" || ceacStatus === "Approved";
  const isRefused = ceacStatus === "Refused";
  const isAP = ceacStatus === "Administrative Processing";
  const isTransitional = isTransitionalStatus;

  // Intelligence message — changes per status and days elapsed
  const intelligenceMessage = isIssued
    ? "Log into your USVisaScheduling courier account now and track your passport delivery. Confirm your delivery address is correct. If there is a delivery issue, contact the courier service — not the embassy."
    : isRefused
      ? "Read your written notice from the officer carefully. It will state whether this is a 221(g) request (case still active — submit the requested documents) or a final denial under a specific INA ground. These two situations require completely different responses."
      : isAP
        ? daysInAP < 30
          ? "Initial processing phase. Most cases resolve within 60–90 days, though security clearances can take longer. No action needed right now — check CEAC weekly and update here if anything changes."
          : daysInAP < 90
            ? "You are within the standard AP window. Check CEAC every 1–2 weeks. Do not contact the embassy repeatedly — it does not speed up the process."
            : "Your case has exceeded 90 days in AP. Consider a congressional inquiry or consulting an immigration attorney. Continue checking CEAC weekly."
        : ceacStatus === "In Transit"
          ? "Your case has left NVC and is being transferred to the U.S. Embassy or consulate. This status is usually brief — hours to a few days. Watch for the status to change to 'Ready' or your post-interview outcome. No action needed."
          : ceacStatus === "Ready"
            ? "'Ready' means your case is Documentarily Qualified (DQ) and has been sent to the U.S. Embassy or consulate. The embassy has your file and is scheduling or processing your interview. This is a pre-interview status. Check CEAC regularly — once your interview is complete, the status will change to Issued, Administrative Processing, or Refused within a few days."
            : ceacStatus === "Pending"
              ? "'Pending' means your case has not yet been processed by NVC or the consulate. This is normal in early stages. Check back in 2–3 days. If it persists beyond 2 weeks, verify your case number is correct."
              : ceacStatus === "Not Available"
                ? "CEAC cannot find your case number. Double-check the case number you entered. It can take 2–5 business days after NVC registration for the case to appear. If it persists beyond 1 week, contact NVC."
                : "Monitor your CEAC status and update it here when it changes.";

  return (
    <div
      className="rounded-[26px] shadow-xl overflow-hidden relative mb-4"
      style={{
        background: "linear-gradient(135deg, #0d7377 0%, #063e40 100%)",
        border: `1px solid ${statusUI.cardBorder}`,
      }}
    >
      {/* Background Accents — dynamic per status */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
        style={{ background: statusUI.accentTop }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
        style={{ background: statusUI.accentBottom }}
      />

      {/* Main Header / Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full relative z-10 p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{ background: statusUI.iconBg, borderColor: statusUI.iconBorder }}
          >
            <StatusIcon
              style={{ color: statusUI.iconColor }}
              className="h-6 w-6"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: statusUI.chipBg,
                  color: statusUI.chipColor,
                  border: `1px solid ${statusUI.iconBorder}`,
                }}
              >
                {ceacStatus}
              </span>
              <span className="text-white/25 text-[10px]">•</span>
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                {statusUI.trackerLabel}
              </span>
            </div>
            <h3 className="text-[20px] font-black text-white leading-tight">{statusUI.heading}</h3>
            <div className="flex items-center gap-3 mt-1">
              {isDateInFuture && !isIssued && !isRefused ? (
                <span className="text-[12px] font-bold text-[#cdadcc]">
                  Interview date is upcoming — tracking starts after your interview
                </span>
              ) : isDateInFuture && (isIssued || isRefused) ? (
                <span className="text-[12px] font-bold text-[#cdadcc]">
                  Please verify your interview date — it appears to be in the future
                </span>
              ) : (
                <span className="text-[12px] font-bold" style={{ color: statusUI.counterColor }}>
                  {statusUI.counterLabel(daysInAP)}
                </span>
              )}
              {adminLastCheckDate && (
                <span
                  className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: "#afdbdb" }}
                >
                  <ShieldCheck size={11} />
                  Verified{" "}
                  {new Date(adminLastCheckDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/50"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative z-10 px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-white/8 mb-6" />

          {/* Info Cards — AP/Refused only (not for transitional statuses or Issued) */}
          {!isIssued && !isTransitional && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Interview Date
                  </span>
                </div>
                <p className="text-[13px] font-bold text-white">
                  {startDate
                    ? startDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not recorded"}
                </p>
                <p className="text-[11px] text-white/40 mt-1">
                  {isAP ? "Date AP was placed on your case" : "Date of your interview"}
                </p>
              </div>

              {(isAP || isRefused) && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      221(g) Documents
                    </span>
                  </div>
                  {apDetails.docsRequested === "yes" ? (
                    <>
                      <p className="text-[13px] font-bold text-[#cdadcc]">
                        Additional docs requested
                      </p>
                      {apDetails.docs221gSubmittedAt ? (
                        <p className="text-[11px] mt-1 font-bold" style={{ color: "#afdbdb" }}>
                          ✓ Submitted{" "}
                          {new Date(apDetails.docs221gSubmittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      ) : (
                        <p className="text-[11px] text-white/50 mt-1">
                          Pending submission — update Step 9 when sent
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] font-bold text-white/70">No documents requested</p>
                      <p className="text-[11px] text-white/40 mt-1">221(g) not applicable</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Issued — courier tracking card */}
          {isIssued && (
            <div
              className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4"
              style={{ background: "#e6f5f5", border: "1px solid #afdbdb" }}
            >
              <div>
                <p className="text-[13px] font-black text-[#095c5f] mb-1">
                  Track your courier delivery
                </p>
                <p className="text-[11px] text-[#0d7377]/70">
                  Log into USVisaScheduling to track your passport shipment.
                </p>
              </div>
              <button
                onClick={() => window.open("https://www.usvisascheduling.com", "_blank")}
                className="shrink-0 px-4 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all hover:brightness-110"
                style={{ background: "#0d7377", color: "white", border: "1px solid #095c5f" }}
              >
                Track <ExternalLink size={10} />
              </button>
            </div>
          )}

          {/* Intelligence Block — dynamic content and color per status */}
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: statusUI.intBg, border: `1px solid ${statusUI.intBorder}` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: statusUI.iconBg }}
              >
                <StatusIcon style={{ color: statusUI.iconColor }} size={16} />
              </div>
              <div>
                <h4 className="text-[13px] font-black mb-1" style={{ color: statusUI.intTitle }}>
                  {statusUI.intLabel}
                </h4>
                <p className="text-[12px] text-white/60 leading-relaxed font-medium">
                  {intelligenceMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Update History Log */}
          {updateLog.length > 0 && (
            <div className="mt-2 text-white">
              <div className="flex items-center gap-2 mb-4">
                <History size={14} className="text-white/40" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Status History
                </span>
              </div>
              <div className="space-y-3">
                {updateLog.slice(0, 3).map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl p-3 flex justify-between items-center"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <div className="text-[10px] font-bold text-white/40">
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                      <div className="text-[12px] font-medium text-white/70 mt-0.5">
                        {log.note || "Status checked"}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-white/30">{log.ceac}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() =>
              window.open("https://ceac.state.gov/CEACStatTracker/Status.aspx", "_blank")
            }
            className="w-full mt-6 py-4 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black text-white transition-all group hover:bg-white/15"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Check Official CEAC Tracker
            <ExternalLink
              size={14}
              className="text-white/40 group-hover:text-white transition-colors"
            />
          </button>
        </div>
      )}
    </div>
  );
}
