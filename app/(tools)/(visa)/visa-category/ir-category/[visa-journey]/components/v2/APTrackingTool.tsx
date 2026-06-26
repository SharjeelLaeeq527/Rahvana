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
  Sparkles,
  Target,
  Activity,
} from "lucide-react";
// NOTE: When pasting into your codebase, replace this with:
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
// type WizardState = { metadata?: Record<string, any> };

interface APTrackingToolProps {
  state: WizardState;
}

/* ------------------------------------------------------------------ */
/*  Status design system                                              */
/* ------------------------------------------------------------------ */

type StatusKey =
  | "Administrative Processing"
  | "In Transit"
  | "Ready"
  | "Pending"
  | "Not Available"
  | "Issued"
  | "Approved"
  | "Refused";

interface StatusUI {
  /** Primary accent — used for borders, glow, icon ring */
  accent: string;
  /** Soft accent tint for subtle fills */
  accentSoft: string;
  /** Status chip text/background */
  chipBg: string;
  chipColor: string;
  heading: string;
  trackerLabel: string;
  counterLabel: (days: number) => string;
  intLabel: string;
  icon: any;
}

const CEAC_STATUS_UI: Record<StatusKey, StatusUI> = {
  "Administrative Processing": {
    accent: "#B58AE0",
    accentSoft: "rgba(181,138,224,0.14)",
    chipBg: "rgba(181,138,224,0.18)",
    chipColor: "#E5D2F5",
    heading: "Administrative Processing",
    trackerLabel: "AP Status Tracker",
    counterLabel: (d) => `${d} Day${d !== 1 ? "s" : ""} In AP`,
    intLabel: "AP Intelligence",
    icon: Clock,
  },
  "In Transit": {
    accent: "#38BDF8",
    accentSoft: "rgba(56,189,248,0.14)",
    chipBg: "rgba(56,189,248,0.18)",
    chipColor: "#CFF0FF",
    heading: "Case In Transit",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Just Entered In Transit" : `In Transit · ${d} Day${d !== 1 ? "s" : ""}`,
    intLabel: "What \u201CIn Transit\u201D Means",
    icon: Clock,
  },
  Ready: {
    accent: "#38BDF8",
    accentSoft: "rgba(56,189,248,0.14)",
    chipBg: "rgba(56,189,248,0.18)",
    chipColor: "#CFF0FF",
    heading: "Ready — Case at Embassy",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Just Became Ready" : `Ready · ${d} Day${d !== 1 ? "s" : ""}`,
    intLabel: "What \u201CReady\u201D Means",
    icon: Shield,
  },
  Pending: {
    accent: "#F59E0B",
    accentSoft: "rgba(245,158,11,0.14)",
    chipBg: "rgba(245,158,11,0.18)",
    chipColor: "#FCE3B0",
    heading: "Pending — Awaiting Processing",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Pending Since Today" : `Pending · ${d} Day${d !== 1 ? "s" : ""}`,
    intLabel: "What \u201CPending\u201D Means",
    icon: Clock,
  },
  "Not Available": {
    accent: "#F59E0B",
    accentSoft: "rgba(245,158,11,0.14)",
    chipBg: "rgba(245,158,11,0.18)",
    chipColor: "#FCE3B0",
    heading: "Status Not Available",
    trackerLabel: "CEAC Status Tracker",
    counterLabel: (d) =>
      d === 0 ? "Status Unavailable" : `Unavailable · ${d} Day${d !== 1 ? "s" : ""}`,
    intLabel: "Why Is Status Not Available?",
    icon: AlertTriangle,
  },
  Issued: {
    accent: "#22C55E",
    accentSoft: "rgba(34,197,94,0.14)",
    chipBg: "rgba(34,197,94,0.18)",
    chipColor: "#C5F2D6",
    heading: "Visa Issued — Congratulations",
    trackerLabel: "Visa Status",
    counterLabel: (d) => (d === 0 ? "Issued Today" : `Issued ${d} Day${d !== 1 ? "s" : ""} Ago`),
    intLabel: "Next Step — Track Your Courier",
    icon: CheckCircle2,
  },
  Approved: {
    accent: "#22C55E",
    accentSoft: "rgba(34,197,94,0.14)",
    chipBg: "rgba(34,197,94,0.18)",
    chipColor: "#C5F2D6",
    heading: "Visa Approved",
    trackerLabel: "Visa Status",
    counterLabel: (d) => `Approved ${d} Day${d !== 1 ? "s" : ""} Ago`,
    intLabel: "Next Steps",
    icon: CheckCircle2,
  },
  Refused: {
    accent: "#EF4444",
    accentSoft: "rgba(239,68,68,0.14)",
    chipBg: "rgba(239,68,68,0.18)",
    chipColor: "#FBD3D3",
    heading: "Refused — Review Your Written Notice",
    trackerLabel: "Refusal & 221(g) Tracker",
    counterLabel: (d) => `${d} Day${d !== 1 ? "s" : ""} Since Refusal`,
    intLabel: "221(g) or Final Denial?",
    icon: AlertTriangle,
  },
};

/* ------------------------------------------------------------------ */
/*  Reusable glass surface                                            */
/* ------------------------------------------------------------------ */

const GLASS_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function APTrackingTool({ state }: APTrackingToolProps) {
  // Collapsed by default per spec
  const [isExpanded, setIsExpanded] = useState(false);

  const apDetails = state.metadata?.apDetails || {};
  const apSaved = state.metadata?.apSaved === "true";
  const updateLog = (state.metadata?.apUpdateLog as any[]) || [];

  /* ----------- inactive state ----------- */
  if (!apSaved) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-6 flex items-center justify-between"
        style={{
          background: "linear-gradient(180deg, #0d7377 0%, #09585b 100%)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-[15px] font-bold">AP Tracking Inactive</div>
            <div className="text-white/70 text-[12px] mt-0.5 truncate">
              Record your AP details in Chapter 3, Step 9 to activate dashboard tracking.
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
          }
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ml-3"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* ----------- derived data ----------- */
  const ceacStatusRaw = (apDetails.ceacStatus as StatusKey) || "Administrative Processing";
  const isTransitionalStatus = ["Ready", "In Transit", "Pending", "Not Available"].includes(
    ceacStatusRaw
  );
  const adminLastCheckDate = state.metadata?.admin_last_check_date as string | undefined;
  const startDate = apDetails.interviewDate ? new Date(apDetails.interviewDate) : null;
  const isDateInFuture = startDate ? startDate.getTime() > Date.now() : false;
  const daysInAP =
    startDate && !isDateInFuture
      ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const statusUI = CEAC_STATUS_UI[ceacStatusRaw] || CEAC_STATUS_UI["Administrative Processing"];
  const StatusIcon = statusUI.icon;

  const isIssued = ceacStatusRaw === "Issued" || ceacStatusRaw === "Approved";
  const isRefused = ceacStatusRaw === "Refused";
  const isAP = ceacStatusRaw === "Administrative Processing";

  /* ----------- intelligence + recommended action ----------- */
  const intelligenceMessage = isIssued
    ? "Visa issued. Track your passport delivery via the courier portal."
    : isRefused
      ? "Carefully read your written notice — it tells you whether this is a 221(g) request or a final denial under a specific INA ground."
      : isAP
        ? daysInAP < 30
          ? "Initial processing phase. Most AP cases resolve within 60–90 days."
          : daysInAP < 90
            ? "You are within the standard AP window. No escalation recommended yet."
            : "Case has exceeded 90 days in AP. Consider escalation."
        : ceacStatusRaw === "In Transit"
          ? "Case is being transferred to the embassy. This status is usually brief."
          : ceacStatusRaw === "Ready"
            ? "Case is documentarily qualified and at the embassy. Pre-interview status."
            : ceacStatusRaw === "Pending"
              ? "Case not yet processed by NVC or the consulate. Normal in early stages."
              : ceacStatusRaw === "Not Available"
                ? "CEAC cannot locate this case number. Verify the number or wait 2–5 business days."
                : "Monitor your CEAC status and update it here when it changes.";

  const recommendedAction = isIssued
    ? "Log into USVisaScheduling and confirm your delivery address."
    : isRefused
      ? apDetails.docsRequested === "yes"
        ? "Submit the requested 221(g) documents as soon as possible."
        : "Review your refusal notice and consult an immigration attorney."
      : isAP
        ? daysInAP < 90
          ? "Continue monitoring CEAC weekly. No action required."
          : "Consider a congressional inquiry or attorney consultation."
        : ceacStatusRaw === "Ready" || ceacStatusRaw === "In Transit"
          ? "Check CEAC every 2–3 days for status changes."
          : ceacStatusRaw === "Pending"
            ? "Check back in 2–3 days. No action required."
            : ceacStatusRaw === "Not Available"
              ? "Re-verify your case number. Contact NVC if it persists beyond 1 week."
              : "Continue monitoring CEAC weekly.";

  /* ----------- timeline milestones ----------- */
  type Milestone = { label: string; sub?: string; date?: string; done: boolean; current?: boolean };
  const timeline: Milestone[] = [];
  if (startDate) {
    timeline.push({
      label: "Interview Completed",
      date: startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      done: !isDateInFuture,
      current: false,
    });
  }
  if (isAP || isRefused) {
    if (apDetails.docsRequested === "yes") {
      timeline.push({
        label: "221(g) Issued",
        sub: "Additional documents requested",
        done: true,
      });
      timeline.push({
        label: apDetails.docs221gSubmittedAt ? "Documents Submitted" : "Documents Pending",
        sub: apDetails.docs221gSubmittedAt ? "Awaiting review" : "Submission required",
        date: apDetails.docs221gSubmittedAt
          ? new Date(apDetails.docs221gSubmittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined,
        done: !!apDetails.docs221gSubmittedAt,
      });
    }
  }
  timeline.push({
    label: statusUI.heading,
    sub: statusUI.counterLabel(daysInAP),
    done: true,
    current: true,
  });

  /* ----------- render ----------- */
  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(180deg, #0d7377 0%, #09585b 100%)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      {/* Status accent glow */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(60% 100% at 50% 0%, ${statusUI.accentSoft} 0%, transparent 70%)`,
        }}
      />

      {/* ============ HEADER (always visible) ============ */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative z-10 w-full p-6 text-left"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {/* Status Icon */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: statusUI.accentSoft,
                border: `1px solid ${statusUI.accent}55`,
                boxShadow: `0 0 0 4px ${statusUI.accent}14`,
              }}
            >
              <StatusIcon className="w-5 h-5" style={{ color: statusUI.accent }} />
            </div>

            <div className="min-w-0 flex-1">
              {/* Tracker label */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                  style={{ background: statusUI.chipBg, color: statusUI.chipColor }}
                >
                  {ceacStatusRaw}
                </span>
              </div>

              <span
    className="lg:mt-2 lg:ml-8
      shrink-0
      inline-flex
      items-center
      px-3 py-1.5
      rounded-full
      text-[9px]
      font-bold
      uppercase
      tracking-[0.18em]
      text-white/80
      bg-white/[0.08]
      border border-white/[0.12]
      backdrop-blur-md
      shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
      transition-all duration-300
      hover:bg-white/[0.12]
      hover:border-white/[0.20]
      hover:text-white
      whitespace-nowrap
    "
  >
    {statusUI.trackerLabel}
  </span>

              
              {/* Counter + verified */}
              {/* <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {isDateInFuture && !isIssued && !isRefused ? (
                  <span className="text-white/70 text-[12px]">
                    Interview is upcoming — tracking starts after your interview
                  </span>
                ) : (
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: statusUI.accent }}
                  >
                    {statusUI.counterLabel(daysInAP)}
                  </span>
                )}
                {adminLastCheckDate && (
                  <span className="inline-flex items-center gap-1 text-white/60 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    Verified{" "}
                    {new Date(adminLastCheckDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div> */}
            </div>
          </div>

          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* ============ EXPANDED CONTENT ============ */}
      {isExpanded && (
        <div className="relative z-10 px-6 pb-6 space-y-4">
          {/* ---- Section 2: Case Progress Timeline ---- */}
          <section style={GLASS_STYLE} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-3.5 h-3.5 text-white/60" />
              <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-wider">
                Case Progress
              </h3>
            </div>

            <ol className="relative">
              {timeline.map((m, i) => {
                const isLast = i === timeline.length - 1;
                const dotColor = m.current
                  ? statusUI.accent
                  : m.done
                    ? "#ffffff"
                    : "rgba(255,255,255,0.3)";
                return (
                  <li key={i} className="relative pl-6 pb-4 last:pb-0">
                    {/* Connector */}
                    {!isLast && (
                      <span
                        className="absolute left-[5px] top-3 bottom-0 w-px"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                      />
                    )}
                    {/* Dot */}
                    <span
                      className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full"
                      style={{
                        background: dotColor,
                        boxShadow: m.current
                          ? `0 0 0 4px ${statusUI.accent}33`
                          : "0 0 0 2px rgba(255,255,255,0.08)",
                      }}
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className="text-[13px] font-bold leading-tight"
                          style={{ color: m.current ? statusUI.accent : "white" }}
                        >
                          {m.label}
                        </div>
                        {m.sub && (
                          <div className="text-white/60 text-[11px] mt-0.5">{m.sub}</div>
                        )}
                      </div>
                      {m.date && (
                        <span className="text-white/50 text-[11px] shrink-0">{m.date}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---- Section 3: AP Intelligence (compact insight) ---- */}
          <section
            className="p-4 flex gap-3"
            style={{
              ...GLASS_STYLE,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: statusUI.accentSoft }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: statusUI.accent }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[11px] font-bold uppercase tracking-wider mb-1"
                style={{ color: statusUI.accent }}
              >
                {statusUI.intLabel}
              </div>
              <p className="text-white/85 text-[13px] leading-relaxed">{intelligenceMessage}</p>
            </div>
          </section>

          {/* ---- Section 4: Recommended Action ---- */}
          <section style={GLASS_STYLE} className="p-4 flex gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1">
                Recommended Action
              </div>
              <p className="text-white text-[13px] font-semibold leading-relaxed">
                {recommendedAction}
              </p>
            </div>
          </section>

          {/* ---- Issued helper: courier tracking ---- */}
          {isIssued && (
            <button
              onClick={() => window.open("https://www.usvisascheduling.com", "_blank")}
              className="w-full p-4 rounded-2xl flex items-center justify-between gap-3 transition-all hover:brightness-110"
              style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.35)",
              }}
            >
              <div className="text-left min-w-0">
                <div className="text-white text-[13px] font-bold">Track Your Courier</div>
                <div className="text-white/70 text-[11px] mt-0.5">
                  Log into USVisaScheduling to track passport delivery
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-white shrink-0" />
            </button>
          )}

          {/* ---- Section 5: Status Activity Feed ---- */}
          {updateLog.length > 0 && (
            <section style={GLASS_STYLE} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-3.5 h-3.5 text-white/60" />
                <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-wider">
                  Status Activity
                </h3>
              </div>

              <ol className="relative">
                {updateLog.slice(0, 5).map((log: any, idx: number) => {
                  const isLast = idx === Math.min(updateLog.length, 5) - 1;
                  return (
                    <li key={idx} className="relative pl-6 pb-3 last:pb-0">
                      {!isLast && (
                        <span
                          className="absolute left-[5px] top-3 bottom-0 w-px"
                          style={{ background: "rgba(255,255,255,0.12)" }}
                        />
                      )}
                      <span
                        className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full"
                        style={{
                          background:
                            idx === 0 ? statusUI.accent : "rgba(255,255,255,0.4)",
                          boxShadow:
                            idx === 0
                              ? `0 0 0 4px ${statusUI.accent}33`
                              : "0 0 0 2px rgba(255,255,255,0.08)",
                        }}
                      />
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white text-[12px] font-bold">
                            {log.ceac || "Status Checked"}
                          </div>
                          {log.note && (
                            <div className="text-white/60 text-[11px] mt-0.5">{log.note}</div>
                          )}
                        </div>
                        <span className="text-white/50 text-[11px] shrink-0">
                          {new Date(log.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* ---- CEAC button ---- */}
          <button
            onClick={() =>
              window.open("https://ceac.state.gov/CEACStatTracker/Status.aspx", "_blank")
            }
            className="w-full mt-2 py-4 rounded-2xl flex items-center justify-center gap-3 text-[13px] font-black text-white transition-all hover:bg-white/15"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Check Official CEAC Tracker
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
