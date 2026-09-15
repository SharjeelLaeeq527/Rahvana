import React, { useState, useEffect } from "react";
import { fmtDate, fmtDateTime } from "@/lib/register-receipt";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, BookOpen, Scale, Info, Shield, Bell } from "lucide-react";
import { GuideTutorialOverlay } from "../GuideTutorialOverlays";
import {
  AfterI130ApprovalModal,
  RelationshipEvidenceModal,
  AffidavitSupportModal,
} from "../StatusModals";
import {
  buildTimelineItems,
  type ReceiptRecord,
  type RegisterReceiptPayload,
  type RegisterReceiptError,
} from "@/lib/register-receipt";

const TrackCaseStatusStep: React.FC<any> = ({
  tool,
  state,
  actions,
  isChapter1 = false,
  isChapter2 = false,
  isChapter3 = false,
}) => {
  // Receipt status state
  const [receiptInfo, setReceiptInfo] = useState<any>(null);
  const [receiptError, setReceiptError] = useState("");
  // You may want to get the receipt number from props, state, or context
  const receiptNumber = tool?.receiptNumber || state?.receiptNumber || "";

  // journeyId should be available from tool, state, or props
  const journeyId = tool?.journeyId || state?.journeyId || state?.backendId || "";
  useEffect(() => {
    if (!journeyId) return;
    const load = async () => {
      const res = await fetch(`/api/receipt/journey?journeyId=${encodeURIComponent(journeyId)}`);
      const data = await res.json();
      if (!res.ok || data.error) return;
      setReceiptInfo({
        receiptNumber: data.receipt_number,
        noticeDate: data.notice_date,
        priorityDate: data.priority_date,
        caseLabel: data.case_label,
        source: data.source,
        trackingEnabled: data.tracking_enabled,
        lastKnownStatus: data.last_known_status,
        lastCheckedAt: data.last_checked_at,
        savedAt: data.saved_at,
      });
    };
    load();
  }, [journeyId]); // fetch on mount and when journeyId changes
  // Modal state
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [statusGuideStep, setStatusGuideStep] = useState(0);
  const [showAfterI130Modal, setShowAfterI130Modal] = useState(false);
  const [showRelationshipEvidenceModal, setShowRelationshipEvidenceModal] = useState(false);
  const [showAffidavitSupportModal, setShowAffidavitSupportModal] = useState(false);

  // Chapter 1 accent (this component is for Chapter 1)
  const launchAccentColor = "var(--rv-ch1)";

  // Tutorial steps (copied from StepView)
  const USCIS_STATUS_TUTORIAL_STEPS = [
    {
      label: "Step 1 of 4, Open official USCIS status tools",
      heading: "Start with the official case-status view",
      instruction:
        "USCIS case-status tools revolve around the receipt number. The official status view usually reflects the latest recorded action on the case.",
      url: "egov.uscis.gov",
      kicker: "Official USCIS tracking",
      head: "Case Status Online",
      copy: "Track your case using the 13-character receipt number.",
      pills: ["Receipt number required", "Last action shown", "Official USCIS tool"],
      note: "A quiet status page does not necessarily mean nothing is happening internally. It usually means there has been no new official outward-facing update yet.",
    },
    {
      label: "Step 2 of 4, Understand common pending statuses",
      heading: "Learn the difference between waiting and action-required states",
      instruction:
        'Most of the time, a pending case is in a waiting state like "Case Was Received" or "Case Is Being Actively Reviewed." The important distinction is whether USCIS is simply processing or has asked for something.',
      url: "rahvana.local/status-map",
      kicker: "Status guide",
      head: "Status meanings",
      copy: "Separate passive waiting from states that require action.",
      pills: ["Received", "Actively reviewed", "RFE", "Approved"],
      note: "Use this guide to understand whether you need to act now or simply stay prepared.",
    },
    {
      label: "Step 3 of 4, Use the waiting period well",
      heading: "Turn waiting time into preparation time",
      instruction:
        "Use this waiting period to stay prepared, keep your records current, and learn what usually comes next in the journey.",
      url: "rahvana.local/pending-prep",
      kicker: "While-you-wait tools",
      head: "Stay prepared while waiting",
      copy: "A prep checklist, next-step preview, and useful modules for this waiting period.",
      pills: ["Prep checklist", "Coming next", "Useful right now"],
      note: "A few small tasks now can make the next phase feel much easier when the case moves forward.",
    },
    {
      label: "Step 4 of 4, Know when the page should pivot",
      heading: "Be ready for the next meaningful change",
      instruction:
        "If USCIS later issues a request for evidence, approval, or another major update, your next step here should change with it.",
      url: "rahvana.local/conditional-next-steps",
      kicker: "Next-step guide",
      head: "Pivot when USCIS changes the status",
      copy: "RFE and approval should each unlock their own dedicated next-step experiences.",
      pills: ["Conditional branches", "Next step unlocks", "Action clarity"],
      note: "Your next task should match the actual update USCIS gives you.",
    },
  ];

  // MetaChips
  function MetaChips() {
    return (
      <div className="accent-rose mb-3 flex flex-wrap gap-[7px] sm:mb-5">
        <span className="chip chip-role rounded-full border border-[#d0e4f7] bg-[#e8f1fb] px-[12px] py-[5px] text-[11px] font-semibold tracking-[0.06em] text-[#2d4a6e] uppercase">
          Petitioner
        </span>
        <span className="chip chip-path rounded-full border border-[#fed7aa] bg-[#fff7ed] px-[12px] py-[5px] text-[11px] font-semibold tracking-[0.06em] text-[#b45309] uppercase">
          Online Filing
        </span>
        <span className="chip chip-track rounded-full border border-[#c9bef2] bg-[#f3f0fb] px-[12px] py-[5px] text-[11px] font-semibold tracking-[0.06em] text-[#4a2d8a] uppercase">
          USCIS Tracking
        </span>
      </div>
    );
  }

  return (
    // <div className="min-h-screen w-full ch1step-bg">
    <div className="min-h-screen w-full">
      {/* CHANGE 1: px-4 py-8 on mobile, md:px-6 md:py-12 on desktop */}
      <div className="step mx-auto flex w-full max-w-[680px] flex-col px-4 pt-5 pb-10 sm:px-6 md:px-8 md:pt-8">
        {/* Title & Desc */}

        <h1 className="page-title mb-1 text-[clamp(28px,4vw,36px)] leading-[1.15] font-bold tracking-tight text-[#0c1b33]">
          Monitor USCIS Case Status
        </h1>
        <p className="page-desc mb-2.5 max-w-[620px] text-[15px] leading-[1.72] text-[#3a4f63] sm:mb-4">
          Stay prepared while USCIS reviews your case. Rahvana keeps the tracking context in one
          place, explains what the current status means, and gives you useful next-step prep so the
          waiting period does not become dead time.
        </p>
        <MetaChips />
        {/* Launch Module with tracking buttons */}
        {tool.launch_module && (
          <div
            className="launch-module step-modal-spacing relative mb-4 overflow-hidden rounded-2xl border md:mb-2"
            style={{
              backgroundColor: "var(--rv-ch1-module-bg)",
              borderColor: launchAccentColor,
            }}
          >
            <div
              className="absolute top-0 right-0 left-0 h-[2px] opacity-80"
              style={{
                background:
                  "linear-gradient(90deg, var(--rv-ch1), var(--rv-ch1-module-bg), transparent)",
              }}
            />
            {/* CHANGE 2: p-5 on mobile, md:p-8, lg:p-[32px_34px_28px] */}
            <div className="launch-inner p-5 md:p-8 lg:p-[32px_34px_28px]">
              {/* CHANGE 3: flex-wrap added so badge wraps on small screens */}
              <div className="launch-top mb-4 flex flex-wrap items-start gap-4 sm:mb-6">
                <div className="launch-header flex flex-col items-start gap-2">
                  {/* Icon + eyebrow side by side */}
                  <div className="flex items-center gap-4">
                    <div
                      className="launch-icon flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px]"
                      style={{
                        backgroundColor: "var(--rv-ch1)",
                        border: "1px solid var(--rv-ch1-dark)",
                        boxShadow: "0 8px 30px rgba(130,132,191,0.06)",
                      }}
                    >
                      <Shield className="h-7 w-7 text-[#ffffff]" />
                    </div>
                    <div
                      className="launch-eyebrow text-[10px] leading-[1.6] font-bold tracking-widest uppercase"
                      style={{
                        color: launchAccentColor,
                        borderLeft: `5px solid ${launchAccentColor}`,
                        paddingLeft: 10,
                      }}
                    >
                      Pending with USCIS
                      <br />
                      Active Monitoring
                    </div>
                  </div>
                  {/* Hero + copy below the icon */}
                  <div>
                    <div className="text-[clamp(21px,3vw,26px)] leading-tight text-white">
                      {tool.launch_module.status?.hero}
                    </div>
                    <div className="launch-copy max-w-[470px] text-[13.5px] leading-snug text-[#f7f8ff]">
                      {tool.launch_module.status?.copy}
                    </div>
                  </div>
                </div>
                {/* CHANGE 4: self-start shrink-0 prevents badge from stretching/squishing */}
                <span className={`status-badge ml-auto shrink-0 self-start text-[#b668b8]`}>
                  {tool.launch_module.status?.badge}
                </span>
              </div>
              <div
                className="launch-divider mb-5 h-px"
                style={{ backgroundColor: "rgba(130,132,191,0.20)" }}
              />
              {/* What's Coming Next - horizontal progress stepper */}
              {tool.future_timeline && (
                <div className="mb-6">
                  <div className="mb-5">
                    <div className="text-[16px] font-semibold leading-tight text-white">
                      What's Coming Next
                    </div>
                    <div
                      className="mt-1 max-w-[540px] text-[13px] leading-relaxed"
                      style={{ color: "rgba(247,248,255,0.82)" }}
                    >
                      See the likely path ahead so you can prepare early without feeling rushed
                      into work that does not matter yet.
                    </div>
                  </div>
                  <div className="relative">
                    {/* connector line behind the dots (desktop only) */}
                    <div
                      className="pointer-events-none absolute top-[15px] right-[12.5%] left-[12.5%] hidden h-px md:block"
                      style={{ background: "rgba(255,255,255,0.16)" }}
                    />
                    <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-4">
                      {tool.future_timeline.map((item: any, idx: number) => {
                        const isCurrent = String(item.pill || "")
                          .toLowerCase()
                          .includes("current");
                        return (
                          <div key={idx} className="relative flex flex-col items-center text-center">
                            {/* Stop indicator */}
                            <span className="relative z-10 mb-3.5 block h-[30px] w-[30px]">
                              {isCurrent && (
                                <span
                                  className="absolute inset-0 animate-ping rounded-full"
                                  style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                                />
                              )}
                              <span
                                className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] text-[12px] font-bold"
                                style={{
                                  borderColor: isCurrent ? "#ffffff" : launchAccentColor,
                                  backgroundColor: isCurrent
                                    ? "#ffffff"
                                    : "var(--rv-ch1-module-bg)",
                                  color: isCurrent ? "var(--rv-ch1)" : "#ffffff",
                                  boxShadow: isCurrent
                                    ? "0 0 0 5px rgba(255,255,255,0.14)"
                                    : "none",
                                }}
                              >
                                {idx + 1}
                              </span>
                            </span>
                            {/* Phase card */}
                            <div
                              className="flex w-full flex-1 flex-col rounded-2xl border p-4 transition"
                              style={{
                                borderColor: isCurrent
                                  ? "rgba(255,255,255,0.55)"
                                  : "rgba(255,255,255,0.14)",
                                backgroundColor: isCurrent
                                  ? "rgba(255,255,255,0.12)"
                                  : "rgba(255,255,255,0.05)",
                                boxShadow: isCurrent
                                  ? "0 8px 24px rgba(0,0,0,0.18)"
                                  : "none",
                              }}
                            >
                              <div className="mb-1.5 text-[13.5px] font-semibold leading-tight text-white">
                                {item.title}
                              </div>
                              <div
                                className="mb-3 flex-1 text-[12px] leading-relaxed"
                                style={{ color: "rgba(247,248,255,0.78)" }}
                              >
                                {item.copy}
                              </div>
                              {item.pill && (
                                <span
                                  className="mx-auto inline-block rounded-full border px-2.5 py-1 text-[9.5px] font-bold tracking-wide uppercase"
                                  style={
                                    isCurrent
                                      ? {
                                          borderColor: "transparent",
                                          backgroundColor: "#ffffff",
                                          color: "var(--rv-ch1)",
                                        }
                                      : {
                                          borderColor: "rgba(255,255,255,0.25)",
                                          backgroundColor: "rgba(255,255,255,0.06)",
                                          color: "rgba(247,248,255,0.9)",
                                        }
                                  }
                                >
                                  {item.pill}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {/* Metrics */}
              {/* CHANGE 5: grid-cols-2 on mobile (was grid-cols-1), md:grid-cols-4 */}
              <div className="metrics mb-4 grid grid-cols-2 items-stretch gap-3 md:grid-cols-4">
                {/* Status */}
                <div
                  className="metric flex h-full min-h-[118px] flex-col rounded-[12px] px-4 py-3"
                  style={{
                    borderColor: launchAccentColor,
                    backgroundColor: "var(--rv-ch1-feature-bg)",
                  }}
                >
                  <div
                    className="metric-label mb-1 text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: launchAccentColor }}
                  >
                    Status
                  </div>
                  <div
                    className="metric-value text-[14px] font-semibold"
                    style={{ color: "var(--rv-ch1-text)" }}
                  >
                    {receiptInfo?.lastKnownStatus || ""}
                  </div>
                  <div className="metric-sub mt-1 text-[11px] text-white">
                    Current USCIS case status
                  </div>
                </div>

                {/* Last Checked */}
                <div
                  className="metric flex h-full min-h-[118px] flex-col rounded-[12px] px-4 py-3"
                  style={{
                    borderColor: launchAccentColor,
                    backgroundColor: "var(--rv-ch1-feature-bg)",
                  }}
                >
                  <div
                    className="metric-label mb-1 text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: launchAccentColor }}
                  >
                    Last Checked
                  </div>
                  <div
                    className="metric-value text-[14px] font-semibold"
                    style={{ color: "var(--rv-ch1-text)" }}
                  >
                    {receiptInfo?.lastCheckedAt ? fmtDateTime(receiptInfo.lastCheckedAt) : ""}
                  </div>
                  <div className="metric-sub mt-1 text-[11px] text-white">
                    Latest system refresh
                  </div>
                </div>

                {/* Notice Date */}
                <div
                  className="metric flex h-full min-h-[118px] flex-col rounded-[12px] px-4 py-3"
                  style={{
                    borderColor: launchAccentColor,
                    backgroundColor: "var(--rv-ch1-feature-bg)",
                  }}
                >
                  <div
                    className="metric-label mb-1 text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: launchAccentColor }}
                  >
                    Notice Date
                  </div>
                  <div
                    className="metric-value text-[14px] font-semibold"
                    style={{ color: "var(--rv-ch1-text)" }}
                  >
                    {receiptInfo?.noticeDate ? fmtDate(receiptInfo.noticeDate) : ""}
                  </div>
                  <div className="metric-sub mt-1 text-[11px] text-white">USCIS receipt notice</div>
                </div>

                {/* Priority Date */}
                <div
                  className="metric flex h-full min-h-[118px] flex-col rounded-[12px] px-4 py-3"
                  style={{
                    borderColor: launchAccentColor,
                    backgroundColor: "var(--rv-ch1-feature-bg)",
                  }}
                >
                  <div
                    className="metric-label mb-1 text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: launchAccentColor }}
                  >
                    Priority Date
                  </div>
                  <div
                    className="metric-value text-[14px] font-semibold"
                    style={{ color: "var(--rv-ch1-text)" }}
                  >
                    {receiptInfo?.priorityDate ? fmtDate(receiptInfo.priorityDate) : ""}
                  </div>
                  <div className="metric-sub mt-1 text-[11px] text-white">
                    Filing priority reference
                  </div>
                </div>
              </div>
              {/* Tracking Action Buttons */}
              <div className="launch-actions mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* <Button
                  className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition"
                  style={
                    {
                      backgroundColor: isChapter1 ? "var(--rv-ch1)" : launchAccentColor,
                      color: "#fff",
                      "--hover-bg": isChapter1
                        ? "rgba(186, 169, 218, 0.86)"
                        : isChapter2
                          ? "var(--rv-ch2-feature-bg)"
                          : "#031020",
                    } as any
                  }
                  onMouseEnter={(e) => {
                    if (isChapter1) {
                      e.currentTarget.style.backgroundColor = "rgba(123, 127, 243, 0.88)";
                      e.currentTarget.style.color = "var(--rv-ch1-text)";
                    } else {
                      e.currentTarget.style.backgroundColor = isChapter2
                        ? "var(--rv-ch2-feature-bg)"
                        : "#031020";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isChapter1) {
                      e.currentTarget.style.backgroundColor = "var(--rv-ch1)";
                      e.currentTarget.style.color = "#fff";
                    } else {
                      e.currentTarget.style.backgroundColor = launchAccentColor;
                    }
                  }} */}
                {/*    onClick={() => {
                   }}
                 >
                   <svg
                     className="h-4 w-4"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                   >
                     <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                     <polyline points="21 3 21 9 15 9" />
                   </svg>
                   Refresh tracking status
                 </Button> */}
                <Button
                  variant="outline"
                  className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white`}
                  onClick={() => setShowStatusGuide(true)}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  What does this status mean?
                </Button>
                {/* Status Guide Tutorial Overlay */}
                <GuideTutorialOverlay
                  isOpen={showStatusGuide}
                  onClose={() => setShowStatusGuide(false)}
                  tutorial={USCIS_STATUS_TUTORIAL_STEPS}
                  index={statusGuideStep}
                  setIndex={setStatusGuideStep}
                  title="What does this status mean?"
                />
              </div>
            </div>
          </div>
        )}
        {/* Useful Right Now Panel */}
        {tool.useful_now && (
          <div
            className="mb-8 rounded-[22px] bg-white/80 p-4 shadow-[0_8px_24px_rgba(12,27,51,0.07)] md:mb-6 md:p-8"
            style={{
              borderWidth: "1px",
              borderColor: launchAccentColor,
            }}
          >
            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-1 text-[28px] leading-tight text-[#0c1b33] md:text-[32px]">
                  Useful Right Now
                </h2>
                <div className="max-w-[560px] text-[15px] leading-[1.7] text-[#3a4f63]">
                  These are focused, case-relevant resources you can use while USCIS is still
                  processing your petition.
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
              {tool.useful_now.map((u: any, i: number) => {
                const iconColor =
                  u.icon === "green"
                    ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]"
                    : u.icon === "purple"
                      ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                      : u.icon === "amber"
                        ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                        : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]";
                const Icon =
                  u.icon === "green"
                    ? CheckCircle
                    : u.icon === "purple"
                      ? BookOpen
                      : u.icon === "amber"
                        ? Scale
                        : Info;
                return (
                  <div
                    key={i}
                    className="flex h-full flex-col rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_rgba(12,27,51,0.07)] transition hover:shadow-md sm:p-4"
                    style={{
                      borderWidth: "1px",
                      borderColor: launchAccentColor,
                    }}
                  >
                    <div
                      className={`mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border ${iconColor}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="mb-1 text-[15px] leading-tight font-semibold text-[#0c1b33]">
                      {u.title}
                    </div>
                    <div className="mb-4 flex-1 text-[13px] leading-[1.55] text-[#3a4f63]">
                      {u.copy}
                    </div>
                    <Button
                      variant="outline"
                      title={u.action}
                      size="sm"
                      className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--rv-navy)]"
                      style={{
                        borderWidth: "1px",
                        borderColor: launchAccentColor,
                        backgroundColor: isChapter1
                          ? "var(--rv-purple-bg)"
                          : isChapter2
                            ? "var(--rv-launch-note)"
                            : "var(--rv-sky)",
                      }}
                      onClick={() => {
                        if (u.action?.toLowerCase().includes("preview"))
                          setShowAfterI130Modal(true);
                        else if (u.action?.toLowerCase().includes("evidence guide"))
                          setShowRelationshipEvidenceModal(true);
                        else if (u.action?.toLowerCase().includes("see future prep"))
                          setShowAffidavitSupportModal(true);
                      }}
                    >
                      <span className="truncate">{u.action}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <AfterI130ApprovalModal
              open={showAfterI130Modal}
              onClose={() => setShowAfterI130Modal(false)}
            />
            <RelationshipEvidenceModal
              open={showRelationshipEvidenceModal}
              onClose={() => setShowRelationshipEvidenceModal(false)}
            />
            <AffidavitSupportModal
              open={showAffidavitSupportModal}
              onClose={() => setShowAffidavitSupportModal(false)}
            />
          </div>
        )}
        {/* USCIS Notice Prompt — unlocks step_1_18 */}
        {(() => {
          const alreadyReported = state?.metadata?.uscisNoticeReceived === true;
          return (
            <div
              className="mb-6 overflow-hidden rounded-2xl"
              style={{
                border: alreadyReported ? "1.5px solid #a8d9be" : "1.5px solid #e8a87c",
                background: alreadyReported ? "#f0faf4" : "#fff8f3",
              }}
            >
              <div className="flex items-start gap-4 p-5 md:p-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: alreadyReported ? "#d1f5e2" : "#fde8d4",
                    border: alreadyReported ? "1px solid #a8d9be" : "1px solid #e8a87c",
                  }}
                >
                  <Bell
                    className="h-5 w-5"
                    style={{ color: alreadyReported ? "#15744f" : "#b85c00" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="mb-0.5 text-[15px] font-semibold"
                    style={{ color: alreadyReported ? "#15744f" : "#7a3c00" }}
                  >
                    {alreadyReported
                      ? "USCIS notice reported — guidance is ready"
                      : "Did you receive a notice from USCIS?"}
                  </div>
                  <div
                    className="text-[13px] leading-[1.65]"
                    style={{ color: alreadyReported ? "#2a6644" : "#8a4a00" }}
                  >
                    {alreadyReported
                      ? "You reported receiving a USCIS notice. Open the next step in your journey to identify the notice type and get specific response guidance."
                      : "USCIS may issue a Request for Evidence (RFE), Request for Additional Information (RFI), Request for Original (RFO), or a Notice of Intent to Deny (NOID) while your case is pending. If you received any notice, let Rahvana know so it can guide your response."}
                  </div>
                  {!alreadyReported && (
                    <button
                      id="uscis-notice-received-btn"
                      type="button"
                      className="mt-4 flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold transition"
                      style={{
                        background: "#b85c00",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#8a4400")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#b85c00")
                      }
                      onClick={async () => {
                        if (actions?.updateMetadata) {
                          await actions.updateMetadata({
                            uscisNoticeReceived: true,
                          });
                        }
                      }}
                    >
                      <Bell className="h-4 w-4" />
                      I received a USCIS notice
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Footer Note */}
        {tool.footer_note && (
          <p className="footer-note pt-4 text-center text-[11.5px] text-[#6b8097]">
            {tool.footer_note}
          </p>
        )}
      </div>
    </div>
  );
};

export default TrackCaseStatusStep;
