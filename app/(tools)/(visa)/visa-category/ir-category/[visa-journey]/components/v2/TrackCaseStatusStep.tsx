import React, { useState, useMemo, useEffect } from "react";
import { fmtDate, fmtDateTime } from "@/lib/register-receipt";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, BookOpen, Scale, Info, Shield } from "lucide-react";
import { GuideTutorialOverlay } from "./GuideTutorialOverlays";
import { AfterI130ApprovalModal, RelationshipEvidenceModal, AffidavitSupportModal, AddEvidenceNoteModal, ProcessingTimeModal, MilestonesModal } from "./StatusModals";
import {
  buildTimelineItems,
  type ReceiptRecord,
  type RegisterReceiptPayload,
  type RegisterReceiptError,
} from "@/lib/register-receipt";

const TrackCaseStatusStep: React.FC<any> = ({ tool, state, actions, isChapter1 = false, isChapter2 = false, isChapter3 = false }) => {
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
        receiptNumber:   data.receipt_number,
        noticeDate:      data.notice_date,
        priorityDate:    data.priority_date,
        caseLabel:       data.case_label,
        source:          data.source,
        trackingEnabled: data.tracking_enabled,
        lastKnownStatus: data.last_known_status,
        lastCheckedAt:   data.last_checked_at,
        savedAt:         data.saved_at,
      });
    };
    load();
  }, [journeyId]); // fetch on mount and when journeyId changes
  // Modal and checklist state
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [statusGuideStep, setStatusGuideStep] = useState(0);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [showAfterI130Modal, setShowAfterI130Modal] = useState(false);
  const [showRelationshipEvidenceModal, setShowRelationshipEvidenceModal] = useState(false);
  const [showAffidavitSupportModal, setShowAffidavitSupportModal] = useState(false);
  const [showAddEvidenceNoteModal, setShowAddEvidenceNoteModal] = useState(false);

  // Interactive checklist state (persisted to localStorage)
  const checklistKey = "ir1_step12_checklist";
  const initialChecklist = useMemo(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(checklistKey);
      if (saved) return JSON.parse(saved);
    }
    return tool.checklist ? tool.checklist.map(() => false) : [];
  }, [tool.checklist]);
  const [checklist, setChecklist] = useState(initialChecklist);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(checklistKey, JSON.stringify(checklist));
    }
  }, [checklist]);
  const toggleChecklist = (idx: number) => {
    setChecklist((prev: boolean[]) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // Chapter 1 accent (this component is for Chapter 1)
  const launchAccentColor = "var(--rv-ch1)";

  // Tutorial steps (copied from StepView)
  const USCIS_STATUS_TUTORIAL_STEPS = [
    {
      label: "Step 1 of 4 — Open official USCIS status tools",
      heading: "Start with the official case-status view",
      instruction:
        "USCIS case-status tools revolve around the receipt number. The official status view usually reflects the latest recorded action on the case.",
      url: "egov.uscis.gov",
      kicker: "Official USCIS tracking",
      head: "Case Status Online",
      copy: "Track your case using the 13-character receipt number.",
      pills: [
        "Receipt number required",
        "Last action shown",
        "Official USCIS tool",
      ],
      note: "A quiet status page does not necessarily mean nothing is happening internally. It usually means there has been no new official outward-facing update yet.",
    },
    {
      label: "Step 2 of 4 — Understand common pending statuses",
      heading:
        "Learn the difference between waiting and action-required states",
      instruction:
        "Most of the time, a pending case is in a waiting state like “Case Was Received” or “Case Is Being Actively Reviewed.” The important distinction is whether USCIS is simply processing or has asked for something.",
      url: "rahvana.local/status-map",
      kicker: "Status guide",
      head: "Status meanings",
      copy: "Separate passive waiting from states that require action.",
      pills: ["Received", "Actively reviewed", "RFE", "Approved"],
      note: "Use this guide to understand whether you need to act now or simply stay prepared.",
    },
    {
      label: "Step 3 of 4 — Use the waiting period well",
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
      label: "Step 4 of 4 — Know when the page should pivot",
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
      <div className="flex gap-2 flex-wrap mb-6 accent-rose">
        <span className="chip chip-role bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7] text-[11px] font-semibold uppercase px-3 py-1 rounded-full">Petitioner</span>
        <span className="chip chip-path bg-[#fff7ed] text-[#b45309] border border-[#fed7aa] text-[11px] font-semibold uppercase px-3 py-1 rounded-full">Online Filing</span>
        <span className="chip chip-track bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2] text-[11px] font-semibold uppercase px-3 py-1 rounded-full">USCIS Tracking</span>
      </div>
    );
  }

  return (
    // <div className="min-h-screen w-full ch1step-bg">
      <div className="min-h-screen w-full">
    {/* CHANGE 1: px-4 py-8 on mobile, md:px-6 md:py-12 on desktop */}
    <div className="max-w-[760px] mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col gap-3 step step-modal-spacing">
  {/* Title & Desc */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">Chapter 1 · USCIS Petition Filing</span>
        <span className="text-[11px] text-[#b8d4f0]">›</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider accent-brown">Monitor USCIS Case Status</span>
      </div>
      <h1 className="page-title text-[clamp(30px,4.6vw,40px)] accent-brown leading-[1.12] tracking-tight mb-1 font-bold">Monitor USCIS Case Status</h1>
      <p className="page-desc text-[15px] accent-brown leading-[1.72] max-w-[620px] mb-3">Stay prepared while USCIS reviews your case. Rahvana keeps the tracking context in one place, explains what the current status means, and gives you useful next-step prep so the waiting period does not become dead time.</p>
      <MetaChips />
      {/* Launch Module with tracking buttons */}
      {tool.launch_module && (
        <div className="rounded-2xl border mb-2 relative overflow-hidden launch-module step-modal-spacing" style={{
          backgroundColor: "var(--rv-ch1-module-bg)",
          borderColor: launchAccentColor
        }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-80" style={{
            background: "linear-gradient(90deg, var(--rv-ch1), var(--rv-ch1-module-bg), transparent)"
          }} />
          {/* CHANGE 2: p-5 on mobile, md:p-8, lg:p-[32px_34px_28px] */}
          <div className="launch-inner p-5 md:p-8 lg:p-[32px_34px_28px]">
            {/* CHANGE 3: flex-wrap added so badge wraps on small screens */}
            <div className="launch-top flex items-start gap-4 mb-6 flex-wrap">
              <div className="launch-header flex gap-4 items-start">
                <div className="launch-icon w-[48px] h-[48px] rounded-[12px] flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--rv-ch1)", border: '1px solid var(--rv-ch1-dark)', boxShadow: '0 8px 30px rgba(130,132,191,0.06)' }}>
                  <Shield className="w-7 h-7 text-[#ffffff]" />
                </div>
                <div>
                  <div className="launch-eyebrow text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--rv-ch1-text)", borderLeft: `5px solid ${launchAccentColor}`, paddingLeft: 10 }}>Pending with USCIS · Active Monitoring</div>
                  <div className="text-[clamp(21px,3vw,26px)] leading-tight text-white">{tool.launch_module.status?.hero}</div>
                  <div className="launch-copy text-[13.5px] text-[#f7f8ff] leading-snug max-w-[470px]">{tool.launch_module.status?.copy}</div>
                </div>
              </div>
              {/* CHANGE 4: self-start shrink-0 prevents badge from stretching/squishing */}
              <span className={`status-badge ml-auto self-start shrink-0 text-[#b668b8]`}>{tool.launch_module.status?.badge}</span>
            </div>
            <div className="launch-divider h-px mb-5" style={{ backgroundColor: "rgba(130,132,191,0.20)" }} />
            {/* Metrics */}
            {/* CHANGE 5: grid-cols-2 on mobile (was grid-cols-1), md:grid-cols-4 */}
            <div className="metrics grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"> 
               {/* Status */}
  <div className="metric rounded-[12px] px-4 py-3 flex flex-col" style={{ borderColor: launchAccentColor, backgroundColor: "var(--rv-ch1-feature-bg)" }}>
    <div className="metric-label text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: launchAccentColor }}>
      Status
    </div>
    <div className="metric-value text-[14px] font-semibold" style={{ color: 'var(--rv-ch1-text)' }}>
      {receiptInfo?.lastKnownStatus || "—"}
    </div>
    <div className="metric-sub text-[11px] mt-1 text-white">
      Current USCIS case status
    </div>
  </div>

  {/* Last Checked */}
  <div className="metric rounded-[12px] px-4 py-3 flex flex-col" style={{ borderColor: launchAccentColor, backgroundColor: "var(--rv-ch1-feature-bg)" }}>
    <div className="metric-label text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: launchAccentColor }}>
      Last Checked
    </div>
    <div className="metric-value text-[14px] font-semibold" style={{ color: 'var(--rv-ch1-text)' }}>
      {receiptInfo?.lastCheckedAt
        ? fmtDateTime(receiptInfo.lastCheckedAt)
        : "—"}
    </div>
    <div className="metric-sub text-[11px] mt-1 text-white">
      Latest system refresh
    </div>
  </div>

  {/* Notice Date */}
  <div className="metric rounded-[12px] px-4 py-3 flex flex-col" style={{ borderColor: launchAccentColor, backgroundColor: "var(--rv-ch1-feature-bg)" }}>
    <div className="metric-label text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: launchAccentColor }}>
      Notice Date
    </div>
    <div className="metric-value text-[14px] font-semibold" style={{ color: 'var(--rv-ch1-text)' }}>
      {receiptInfo?.noticeDate ? fmtDate(receiptInfo.noticeDate) : "—"}
    </div>
    <div className="metric-sub text-[11px] mt-1 text-white">
      USCIS receipt notice
    </div>
  </div>

  {/* Priority Date */}
  <div className="metric rounded-[12px] px-4 py-3 flex flex-col" style={{ borderColor: launchAccentColor, backgroundColor: "var(--rv-ch1-feature-bg)" }}>
    <div className="metric-label text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: launchAccentColor }}>
      Priority Date
    </div>
    <div className="metric-value text-[14px] font-semibold" style={{ color: 'var(--rv-ch1-text)' }}>
      {receiptInfo?.priorityDate ? fmtDate(receiptInfo.priorityDate) : "—"}
    </div>
    <div className="metric-sub text-[11px] mt-1 text-white">
      Filing priority reference
    </div>
  </div>
</div>
            {/* Tracking Action Buttons */}
            <div className="launch-actions grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <Button className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition" style={{
                backgroundColor: isChapter1 ? 'var(--rv-ch1)' : launchAccentColor,
                color: '#fff',
                '--hover-bg': isChapter1 ? 'rgba(186, 169, 218, 0.86)' : isChapter2 ? 'var(--rv-ch2-feature-bg)' : '#031020'
              } as any}
              onMouseEnter={(e) => {
                if (isChapter1) {
                  e.currentTarget.style.backgroundColor = 'rgba(123, 127, 243, 0.88)';
                  e.currentTarget.style.color = 'var(--rv-ch1-text)';
                } else {
                  e.currentTarget.style.backgroundColor = isChapter2 ? 'var(--rv-ch2-feature-bg)' : '#031020';
                }
              }}
              onMouseLeave={(e) => {
                if (isChapter1) {
                  e.currentTarget.style.backgroundColor = 'var(--rv-ch1)';
                  e.currentTarget.style.color = '#fff';
                } else {
                  e.currentTarget.style.backgroundColor = launchAccentColor;
                }
              }}
              onClick={() => { /* TODO: implement refresh logic */ }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" /></svg>
                Refresh tracking status
              </Button>
              <Button variant="outline" className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold transition border-white/10 bg-white/5 text-white hover:bg-white`} onClick={() => setShowStatusGuide(true)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                What does this status mean?
              </Button>
              {/* Status Guide Tutorial Overlay */}
              <GuideTutorialOverlay isOpen={showStatusGuide} onClose={() => setShowStatusGuide(false)} tutorial={USCIS_STATUS_TUTORIAL_STEPS} index={statusGuideStep} setIndex={setStatusGuideStep} title="What does this status mean?" />
            </div>
          </div>
        </div>
      )}
      {/* Interactive Checklist Panel */}
      <div className="mb-2 rounded-[18px] bg-white/80 shadow-[0_8px_24px_rgba(12,27,51,0.07)] p-6 md:p-8" style={{
        borderWidth: "1px",
        borderColor: launchAccentColor
      }}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 gap-2">
          <div>
            <h2 className="text-[22px] md:text-[32px] text-[#0c1b33] leading-tight mb-1">Stay Prepared While USCIS Reviews Your Case</h2>
            <div className="text-[13px] text-[#3a4f63] leading-[1.7] max-w-[560px]">Use this waiting period to stay organized, build stronger records, and prepare for the steps that usually come after USCIS review.</div>
          </div>
          <span className="ml-auto mt-2 md:mt-0 px-3 py-1 rounded-full text-[#2d4a6e] text-[11px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap flex-shrink-0" style={{
            backgroundColor: isChapter1 ? "#f0f1fb" : isChapter2 ? "var(--rv-ch2-feature-bg)" : "#e8ecf3",
            borderWidth: "1px",
            borderColor: launchAccentColor
          }}>High-value now</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left: Explainer */}
          <div className="rounded-[14px] bg-white p-6 flex flex-col h-full" style={{
            borderColor: launchAccentColor,
            borderWidth: "1px"
          }}>
            <div className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: launchAccentColor }}>What this status means</div>
            <div className="text-[18px] text-[#0c1b33] mb-1">USCIS has the case</div>
            <div className="text-[12px] text-[#3a4f63] mb-4">This usually means the filing has entered the system and is in line for review. Most users do not need to take any action right now unless USCIS later issues an update, a request for evidence, or another notice.</div>
            <Button variant="outline" size="sm" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[12px] font-semibold text-[#0c1b33] mb-2" style={{
              borderColor: launchAccentColor,
              borderWidth: "1px"
            }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = isChapter1 ? "#6a6a9f" : isChapter2 ? "var(--rv-ch2)" : "#031020")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = launchAccentColor)} onClick={() => setShowProcessingModal(true)} type="button">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18" /><path d="M12 3v18" /></svg>
              Check processing-time context
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[12px] font-semibold text-[#0c1b33]" style={{
              borderColor: launchAccentColor,
              borderWidth: "1px"
            }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = isChapter1 ? "#6a6a9f" : isChapter2 ? "var(--rv-ch2)" : "#031020")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = launchAccentColor)} onClick={() => setShowMilestonesModal(true)} type="button">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              See common next milestones
            </Button>
          </div>
          {/* Right: Interactive Checklist */}
          <div className="flex flex-col gap-3">
            {tool.checklist && tool.checklist.map((c: any, i: number) => {
              const done = !!checklist[i];
              return (
                <div key={i} className="flex gap-3 items-start rounded-[14px] border p-4 cursor-pointer transition" style={{
                  backgroundColor: done ? "#e8f5ef" : "white",
                  borderColor: done ? "#a8d9be" : launchAccentColor
                }} onClick={() => toggleChecklist(i)} tabIndex={0} role="button" aria-pressed={done}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1.5 shrink-0 transition ${done ? "border-[#15744f] bg-[#64dca0]" : "border-[#b8d9f0] bg-white"}`}>
                    {done ? (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg className="w-3 h-3 text-[#a8d9be]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold mb-1 text-[13px] ${done ? "text-[#15744f]" : "text-[#0c1b33]"}`}>{c.title}</div>
                    <div className="text-[11px] text-[#3a4f63] leading-[1.6]">{c.copy}</div>
                  </div>
                </div>
              );
            })}
            <div className="muted-note text-[10px] text-[#6b8097] mt-2">These are practical ways to stay prepared while you wait.</div>
          </div>
        </div>
      </div>
      {/* Processing Time Modal */}
      <ProcessingTimeModal open={showProcessingModal} onClose={() => setShowProcessingModal(false)} />
      <MilestonesModal open={showMilestonesModal} onClose={() => setShowMilestonesModal(false)} />
        {tool.future_timeline && (
          <div className="mb-6 rounded-[18px] bg-white/80 shadow-[0_8px_24px_rgba(12,27,51,0.07)] p-6 md:p-8" style={{
            borderWidth: "1px",
            borderColor: launchAccentColor
          }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
              <div className="min-w-0">
                <h2 className="text-[28px] md:text-[32px] text-[#0c1b33] leading-tight mb-1">
                  What's Coming Next
                </h2>
                <div className="text-[15px] text-[#3a4f63] leading-[1.7] max-w-[560px]">
                  See the likely path ahead so you can prepare early without
                  feeling rushed into work that does not matter yet.
                </div>
              </div>
              <span className="ml-auto mt-2 md:mt-0 px-3 py-1 rounded-full text-[#2d4a6e] text-[11px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap flex-shrink-0" style={{
                backgroundColor: isChapter1 ? "#f0f1fb" : isChapter2 ? "#f4e6f3" : "#e8ecf3",
                borderWidth: "1px",
                borderColor: launchAccentColor
              }}>
                Coming Next
              </span>
            </div>
            {/* Timeline */}
            <div className="mt-6 flex flex-col gap-8 relative">
              {/* Vertical line for timeline */}
              <div
                  className="absolute left-[11px] top-[33px] bottom-0 w-px z-0" style={{ backgroundColor: launchAccentColor, height: `calc(100% - 33px)` }}
              />
              {tool.future_timeline?.map((item: any, idx: number) => {
                const isLast = idx === (tool.future_timeline?.length ?? 0) - 1;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 relative z-10"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center min-w-[24px]">
                      <span className="w-4 h-4 rounded-full border-4 bg-white block mt-1" style={{ borderColor: launchAccentColor }} />
                    </div>
                    {/* Step content */}
                    <div>
                      <div className="font-semibold text-[16px] text-[#0c1b33] mb-1 leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[14px] text-[#3a4f63] mb-2 leading-[1.6]">
                        {item.copy}
                      </div>
                      {item.pill && (
                        <span className="inline-block px-3 py-1 rounded-full text-[#6b8097] text-[12px] font-bold uppercase tracking-wide whitespace-nowrap" style={{
                          backgroundColor: isChapter1 ? "#f0f1fb" : isChapter2 ? "#f4e6f3" : "#e8ecf3",
                          borderWidth: "1px",
                          borderColor: launchAccentColor
                        }}>
                          {item.pill}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      {/* Useful Right Now Panel */}
      {tool.useful_now && (
        <div className="mb-6 rounded-[22px] bg-white/80 shadow-[0_8px_24px_rgba(12,27,51,0.07)] p-6 md:p-8" style={{
          borderWidth: "1px",
          borderColor: launchAccentColor
        }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <div>
              <h2 className="text-[28px] md:text-[32px] text-[#0c1b33] leading-tight mb-1">Useful Right Now</h2>
              <div className="text-[15px] text-[#3a4f63] leading-[1.7] max-w-[560px]">These are focused, case-relevant resources you can use while USCIS is still processing your petition.</div>
            </div>
            <span className="ml-auto mt-2 md:mt-0 px-4 py-2 rounded-full text-[var(--rv-navy)] text-[13px] font-bold uppercase tracking-wide shadow-sm" style={{
              backgroundColor: isChapter1 ? "var(--rv-purple-bg)" : isChapter2 ? "var(--rv-launch-note)" : "var(--rv-sky)",
              borderWidth: "1px",
              borderColor: launchAccentColor
            }}>Education + Updates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-4">
            {tool.useful_now.map((u: any, i: number) => {
              const iconColor = u.icon === "green" ? "bg-[#e8f5ef] text-[#15744f] border-[#a8d9be]" : u.icon === "purple" ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]" : u.icon === "amber" ? "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]" : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]";
              const Icon = u.icon === "green" ? CheckCircle : u.icon === "purple" ? BookOpen : u.icon === "amber" ? Scale : Info;
              return (
                <div key={i} className="flex flex-col h-full rounded-2xl bg-white shadow-[0_8px_24px_rgba(12,27,51,0.07)] p-6 transition hover:shadow-md" style={{
                  borderWidth: "1px",
                  borderColor: launchAccentColor
                }}>
                  <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-4 border ${iconColor}`}><Icon className="w-[20px] h-[20px]" /></div>
                  <div className="font-semibold text-[16px] text-[#0c1b33] mb-1 leading-tight">{u.title}</div>
                  <div className="text-[13.5px] text-[#3a4f63] mb-4 leading-[1.6] flex-1">{u.copy}</div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-[var(--rv-navy)] mt-auto" style={{
                    borderWidth: "1px",
                    borderColor: launchAccentColor,
                    backgroundColor: isChapter1 ? "var(--rv-purple-bg)" : isChapter2 ? "var(--rv-launch-note)" : "var(--rv-sky)"
                  }} onClick={() => {
                    if (u.action?.toLowerCase().includes("preview")) setShowAfterI130Modal(true);
                    else if (u.action?.toLowerCase().includes("evidence guide")) setShowRelationshipEvidenceModal(true);
                    else if (u.action?.toLowerCase().includes("see future prep")) setShowAffidavitSupportModal(true);
                  }}>{u.action}<ArrowRight className="w-4 h-4 ml-1" /></Button>
                  <AfterI130ApprovalModal open={showAfterI130Modal} onClose={() => setShowAfterI130Modal(false)} />
                  <RelationshipEvidenceModal open={showRelationshipEvidenceModal} onClose={() => setShowRelationshipEvidenceModal(false)} />
                  <AffidavitSupportModal open={showAffidavitSupportModal} onClose={() => setShowAffidavitSupportModal(false)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Relevant Updates Panel */}
      {tool.relevant_updates && (
        <div className="panel bg-white border-[1.5px] rounded-2xl p-6 mb-2 shadow-sm" style={{
          borderColor: launchAccentColor
        }}>
          <div className="panel-header flex justify-between gap-4 items-start mb-4">
            <div><div className="panel-title text-[24px] text-[#0c1b33]">Relevant Updates</div></div>
            <div className="panel-tag text-[11px] font-bold uppercase px-3 py-1 rounded-full text-[#2d4a6e] whitespace-nowrap" style={{
              backgroundColor: isChapter1 ? "#f0f1fb" : isChapter2 ? "#f4e6f3" : "#e8ecf3",
              borderWidth: "1px",
              borderColor: launchAccentColor
            }}>Updates</div>
          </div>
          <div className="update-list flex flex-col gap-3">
            {tool.relevant_updates.map((u: any, i: number) => (
              <div key={i} className="update-card p-4 rounded-lg" style={{ border: `1px solid var(--rv-line)`, backgroundColor: `var(--rv-sky)` }}>
                <div className="update-top flex justify-between gap-2 mb-1 items-start"><div className="update-title font-semibold text-[var(--rv-navy)]">{u.title}</div><div className="update-source text-[11px] font-bold uppercase text-[var(--rv-muted)]">{u.source}</div></div>
                <div className="update-copy text-[13px]" style={{ color: `var(--rv-soft)` }}>{u.copy}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Keep Building Your Case Panel */}
      {tool.build_case && (
          <div className="mb-6 rounded-[18px] bg-white/80 shadow-[0_8px_24px_rgba(12,27,51,0.07)] p-6 md:p-8" style={{
            borderWidth: "1px",
            borderColor: launchAccentColor
          }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <div>
              <h2 className="text-[24px] md:text-[28px] text-[var(--rv-navy)] leading-tight mb-1">Keep Building Your Case</h2>
              <div className="text-[15px]" style={{ color: 'var(--rv-soft)', lineHeight: '1.7', maxWidth: '620px', marginTop: '0.25rem' }}>Even while the case is pending, you can strengthen readiness by continuing to collect relationship evidence and organizing what may matter later.</div>
            </div>
            <span className="ml-auto mt-2 md:mt-0 px-4 py-1.5 rounded-full text-[var(--rv-navy)] text-[13px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap flex-shrink-0" style={{ backgroundColor: 'var(--rv-sky)', border: '1px solid var(--rv-line)' }}>Ongoing Prep</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {tool.build_case.map((b: any, i: number) => {
              const iconBg = i === 0 ? "bg-[#e8f5ef] border-[#a8d9be]" : "bg-[#fbeff3] border-[#f7b8d0]";
              const iconColor = i === 0 ? "#15744f" : "#d12b6a";
              const Icon = i === 0 ? (props: any) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-4.8-4-8-6.7-8-10.2C4 6.6 7.6 3 12 3s8 3.6 8 7.8c0 3.5-3.2 6.2-8 10.2z" /><circle cx="12" cy="10" r="3" /></svg>) : (props: any) => (<svg {...props} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="13" rx="2" /><circle cx="8.5" cy="14.5" r="2.5" /><path d="M19 8V6a2 2 0 0 0-2-2h-2.5" /><path d="M15 2v4" /></svg>);
              return (
                <div key={i} className="rounded-[14px] border border-[#d0e4f7] bg-white p-6 flex flex-col h-full transition">
                  <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-4 border ${iconBg}`}><Icon className="w-[22px] h-[22px]" /></div>
                  <div className="font-semibold text-[16px] text-[#0c1b33] mb-1 leading-tight">{b.title}</div>
                  <div className="text-[13.5px] text-[#3a4f63] mb-4 leading-[1.6] flex-1">{b.copy}</div>
                  <div className="flex gap-2 mt-auto flex-wrap">
                    {/* {b.buttons && b.buttons.map((btn: string, j: number) => (
                      <button
                        key={j}
                        type="button"
                        className="px-4 py-2 rounded-lg border border-[#d0e4f7] bg-[#f4f7fb] text-[14px] font-semibold text-[#0c1b33] hover:border-[#2f6fd4] focus:outline-none focus:ring-2 focus:ring-[#2f6fd4] transition shadow-sm"
                        onClick={() => {
                          if (btn.toLowerCase().includes("add note")) setShowAddEvidenceNoteModal(true);
                        }}
                      >
                        {btn}
                      </button>
                    ))} */}
                    <AddEvidenceNoteModal open={showAddEvidenceNoteModal} onClose={() => setShowAddEvidenceNoteModal(false)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Community & Proof Layer Panel */}
      {tool.community && (
        <div className="mb-6 rounded-[15px] border border-[#d0e4f7] bg-white/80 shadow-[0_8px_24px_rgba(12,27,51,0.07)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <div>
              <h2 className="text-[24px] md:text-[22px] text-[#0c1b33] leading-tight mb-1">Community & Proof Layer</h2>
              <div className="text-[12px] text-[#3a4f63] leading-[1.7] max-w-[620px] mt-1">See practical insights from similar journeys and common habits that help people stay organized during this stage.</div>
            </div>
            <span className="ml-auto mt-2 md:mt-0 px-4 py-1.5 rounded-full bg-[#f4f7fb] border border-[#d0e4f7] text-[#2d4a6e] text-[11px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap flex-shrink-0">Human Context</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {tool.community.map((c: any, i: number) => (
              <div key={i} className="rounded-[14px] border border-[#d0e4f7] bg-white p-6 flex flex-col h-full">
                <div className="italic text-[12px] text-[#0c1b33] mb-5 leading-[1.7]">{c.quote}</div>
                <div className="font-semibold text-[#0c1b33] text-[12px] mb-0.5">{c.meta}</div>
                <div className="text-[13px] text-[#6b8097] mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Footer Note */}
      {tool.footer_note && (<p className="footer-note text-[11.5px] text-[#6b8097] text-center pt-4">{tool.footer_note}</p>)}
    </div>
    </div>
  );
};

export default TrackCaseStatusStep;
