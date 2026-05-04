"use client";
 
import React, { useRef, useState } from "react";
import { X, Info, Check, RefreshCw, Upload, Lock } from "lucide-react";
import { APPROVAL_NOTICE_DATA as data } from "./ApprovalNoticeData";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
 
interface ApprovalNoticeToolProps {
  state: any;
  actions: any;
  approvalState: {
    isApprovalModalOpen: boolean;
    setIsApprovalModalOpen: (open: boolean) => void;
    isApprovalGuideOpen: boolean;
    setIsApprovalGuideOpen: (open: boolean) => void;
    approvalGuideStep: number;
    setApprovalGuideStep: (step: number | ((prev: number) => number)) => void;
    approvalDetails: any;
    setApprovalDetails: (details: any) => void;
    isApprovalSaved: boolean;
    setIsApprovalSaved: (saved: boolean) => void;
  };
  guard?: () => boolean;
}
 
export const ApprovalNoticeTool: React.FC<ApprovalNoticeToolProps> = ({
  state,
  actions,
  approvalState,
  guard,
}) => {
  const {
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    isApprovalGuideOpen,
    setIsApprovalGuideOpen,
    approvalGuideStep,
    setApprovalGuideStep,
    approvalDetails,
    setApprovalDetails,
    isApprovalSaved,
    setIsApprovalSaved,
  } = approvalState;
 
  const { openUploadModal, uploadedDocuments } = useDocumentVaultStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plan = usePlan();
 
  // Basic tier cannot upload — manual entry only
  const isBasic = plan.tier === "basic";
 
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
 
  const approvalDoc = (uploadedDocuments || []).find(
    (d) => d.documentDefId === "i797-approval-notice",
  );
 
  const [receiptError, setReceiptError] = useState("");
 
  const validateReceiptNumber = (value: string) => {
    const regex = /^[A-Z]{3}[0-9]{10}$/;
    return regex.test(value);
  };
 
  const saveDetails = () => {
    if (!approvalDetails.approvalDate || !approvalDetails.receiptNumber) {
      toast.error("Please fill in the required fields.");
      return;
    }
 
    if (!validateReceiptNumber(approvalDetails.receiptNumber)) {
      setReceiptError(
        "Invalid format. Use 3 letters followed by 10 digits (e.g., IOE1234567890).",
      );
      toast.error("Invalid receipt number format.");
      return;
    }
 
    setReceiptError("");
    setIsApprovalSaved(true);
    actions.updateMetadata({
      approvalDetails,
      approvalSaved: "true",
    });
    setIsApprovalModalOpen(false);
    toast.success("Approval notice details saved!");
  };
 
  const handleReceivedBtn = () => {
    const el = document.getElementById("save-panel");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
 
  /** Upload button click — locked for Basic */
  const handleUploadClick = () => {
    if (isBasic) {
      setUpgradeModalFeature("approval_notice_upload");
      return;
    }
    if (guard && !guard()) return;
    openUploadModal("i797-approval-notice");
  };
const UploadButton = ({ replace = false }: { replace?: boolean }) => (
    <div className="relative inline-block">
      <button
        onClick={handleUploadClick}
        className={`inline-flex items-center justify-center gap-[8px] p-[12px_14px] rounded-[10px] border-[1.5px] transition-all hover:-translate-y-[1px] text-[13px] font-bold ${
          approvalDoc && !isBasic
            ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f] hover:border-[#15744f]"
            : isBasic
              ? "bg-[#fbeaec] border-[rgba(130,132,191,0.4)] text-[#8284bf]"
              : "bg-white border-[#d0e4f7] text-[#0c1b33] hover:border-[#2f6fd4] hover:text-[#2f6fd4]"
        }`}
      >
        {isBasic ? (
          <Lock size={14} className="stroke-[2.5px]" />
        ) : approvalDoc ? (
          <RefreshCw size={15} className="stroke-[2.5px]" />
        ) : (
          <Upload size={15} className="stroke-[2.5px]" />
        )}
        {isBasic
          ? replace ? "Replace approval notice" : "Upload approval notice"
          : approvalDoc
            ? "Replace approval notice"
            : "Upload approval notice"}
        {isBasic && (
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(130,132,191,0.15)", color: "#8284bf" }}>
            Premium
          </span>
        )}
      </button>
    </div>
  );
 const UploadLockedNote = () => (
    <div className="mt-2 flex items-start gap-2 rounded-xl p-3"
      style={{ background: "#fbeaec", border: "1px solid rgba(130,132,191,0.3)" }}>
      <span className="plan-icon plan-icon--premium scale-110 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-[12px] leading-[1.6]" style={{ color: "#5a3040" }}>
        Uploading your approval notice automatically saves it to the document vault and extracts key information — approval date, receipt number, and more. This feature is available on <strong>Premium and above</strong>.{" "}
        <button onClick={() => setUpgradeModalFeature("approval_notice_upload")}
          className="underline font-bold" style={{ color: "#8284bf" }}>
          Upgrade to unlock
        </button>
      </p>
    </div>
  );

  return (
    <div className={`flex flex-col gap-[22px] animate-in fade-in slide-in-from-bottom-2 duration-360 w-full text-[#1c2b3a] min-h-screen`}>
 
      {/* LAUNCH MODULE */}
      <section className="bg-[#251f32] rounded-[16px] border border-white/10 shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#4b85e7] via-[#82b8ff] to-transparent opacity-80" />
        <div className="p-[30px_32px_28px]">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start mb-[18px]">
            <div className="flex gap-[16px] items-start">
              <div className="w-[48px] h-[48px] rounded-[12px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-white/80 fill-none stroke-[1.75px] stroke-linecap-round stroke-linejoin-round">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#8284bf] mb-[4px]">
                  {data.launchModule.eyebrow}
                </div>
                <h2 className="text-[clamp(22px,3vw,27px)] leading-[1.18] text-white/95 mb-[7px]">
                  {data.launchModule.heading}
                </h2>
                <p className="text-[13.5px] leading-[1.66] text-white/60 max-w-[500px]">
                  {data.launchModule.copy}
                </p>
              </div>
            </div>
            <div className="px-3 py-2 rounded-full bg-[#a8d9be1f] border border-[#a8d9be4d] text-[#8284bf] text-[11px] font-bold tracking-[0.08em] uppercase whitespace-nowrap">
              {data.launchModule.badge}
            </div>
          </div>
          <div className="h-[1px] bg-white/10 my-[18px] sm:my-[16px]" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-[16px]">
            {data.metrics.map((m, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] p-[13px_14px]">
                <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-white/40 mb-[6px]">{m.label}</div>
                <div className="text-[14px] font-semibold text-white/95 leading-[1.35]">{m.value}</div>
                <div className="text-[11px] text-white/60 mt-[4px] leading-[1.4]">{m.sub}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <button
              onClick={handleReceivedBtn}
              className="flex items-center justify-center gap-[10px] p-[15px_18px] rounded-[12px] text-[14px] font-semibold bg-[#8284bf] hover:bg-[#6d5fb0] hover:text-[#fff] shadow-[0_4px_20px_rgba(47,111,212,0.35)] transition-all hover:-translate-y-[1px]"
            >
              <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] stroke-white fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              I received my approval notice
            </button>
            <button
              onClick={() => {
                if (guard && !guard()) return;
                setApprovalGuideStep(0);
                setIsApprovalGuideOpen(true);
              }}
              className="flex items-center justify-center gap-[10px] p-[15px_18px] rounded-[12px] text-[14px] font-semibold border border-white/10 bg-white/5 text-white/95 hover:bg-white/10 transition-all hover:-translate-y-[1px]"
            >
              <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] stroke-white fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              What does this notice mean?
            </button>
          </div>
        </div>
      </section>
 
      {/* SAVE PANEL */}
      <section id="save-panel" className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px] shadow-[0_8px_24px_rgba(12,27,51,0.07)]">
        <div className="flex justify-between gap-[16px] items-start mb-[16px]">
          <div>
            <h3 className="text-[24px] text-[#0c1b33] leading-[1.2]">{data.savePanel.title}</h3>
            <p className="text-[14px] leading-[1.68] text-[#3a4f63] max-w-[560px]">{data.savePanel.copy}</p>
          </div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase p-[7px_11px] rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#2d4a6e] whitespace-nowrap">
            {data.savePanel.tag}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-[14px]">
          <div className="border-[1.5px] border-dashed border-[#b8d4f0] rounded-[14px] bg-linear-to-b from-[#fbfdff] to-[#f6faff] p-[18px]">
            {isApprovalSaved ? (
              <>
                <div className="text-[16px] font-bold text-[#0c1b33] mb-[8px]">{data.savePanel.uploadHead}</div>
                <p className="text-[13px] text-[#3a4f63] leading-[1.65] mb-[14px]">{data.savePanel.uploadCopy}</p>
                <div className="flex gap-[10px] flex-wrap">
                  <UploadButton replace />
                </div>
                {isBasic && <UploadLockedNote />}
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[14px] p-[16px_18px] animate-in zoom-in-95 duration-200 mt-4">
                  <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#15744f] mb-[10px]">
                    {data.savePanel.savedState.title}
                  </div>
                  <div className="flex justify-between gap-[12px] py-[7px] border-b border-[#a8d9be]">
                    <span className="text-[12px] text-[#3a4f63]">File</span>
                    <span className="text-[12px] text-[#1c2b3a] font-bold truncate max-w-[200px]"
                      title={approvalDoc?.originalFilename || (isBasic ? "Upload locked" : "Not saved")}>
                      {approvalDoc?.originalFilename || (isBasic ? "—" : "Not saved")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-[12px] py-[7px] border-b border-[#a8d9be]">
                    <span className="text-[12px] text-[#3a4f63]">Approval date</span>
                    <span className="text-[12px] text-[#1c2b3a] font-bold">{approvalDetails.approvalDate || "Not entered"}</span>
                  </div>
                  <div className="flex justify-between gap-[12px] py-[7px]">
                    <span className="text-[12px] text-[#3a4f63]">Receipt number</span>
                    <span className="text-[12px] text-[#1c2b3a] font-bold">{approvalDetails.receiptNumber || "Not entered"}</span>
                  </div>
                  <button
                    onClick={() => { if (guard && !guard()) return; setIsApprovalModalOpen(true); }}
                    className="mt-3 text-[11px] font-bold text-[#2f6fd4] hover:underline flex items-center gap-1"
                  >
                    <svg viewBox="0 0 24 24" className="w-[12px] h-[12px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    Edit recorded details
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-[10px] flex-wrap mb-3">
                  <UploadButton />
                </div>
                {isBasic && <UploadLockedNote />}
                <button
                  onClick={() => { if (guard && !guard()) return; setIsApprovalModalOpen(true); }}
                  className="inline-flex items-center justify-center gap-[8px] p-[12px_14px] rounded-[10px] border-[1.5px] border-[#d0e4f7] bg-white text-[#0c1b33] text-[13px] font-bold hover:border-[#2f6fd4] hover:text-[#2f6fd4] hover:-translate-y-[1px] transition-all mt-3"
                >
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Enter notice details manually
                </button>
              </>
            )}
          </div>
          <div className="flex flex-col gap-[12px]">
            {data.savePanel.safeItems.map((item, i) => (
              <div key={i} className="flex gap-[12px] items-start p-[12px_14px] rounded-[12px] border-[1.5px] border-[#d0e4f7] bg-white">
                <div className="w-[24px] h-[24px] rounded-full bg-[#e8f5ef] border border-[#a8d9be] text-[#15744f] flex items-center justify-center shrink-0">
                  {item.icon === "check" && (
                    <svg viewBox="0 0 24 24" className="w-[12px] h-[12px] stroke-current fill-none stroke-[2px]"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                  {item.icon === "file" && (
                    <svg viewBox="0 0 24 24" className="w-[12px] h-[12px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                      <path d="M8 17h8" /><path d="M8 13h8" /><path d="M8 9h5" /><path d="M4 4h16v16H4z" />
                    </svg>
                  )}
                  {item.icon === "calendar" && (
                    <svg viewBox="0 0 24 24" className="w-[12px] h-[12px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                      <path d="M3 6h18" /><path d="M7 3v6" /><path d="M17 3v6" /><rect x="3" y="4" width="18" height="17" rx="2" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <strong className="block text-[13px] text-[#0c1b33] mb-[4px]">{item.title}</strong>
                  <span className="text-[12.5px] text-[#3a4f63] leading-[1.55]">{item.copy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* TIMELINE PHASE */}
      <section className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px] shadow-[0_8px_24px_rgba(12,27,51,0.07)]">
        <div className="flex justify-between gap-[16px] items-start mb-[16px]">
          <div>
            <h3 className="text-[24px] text-[#0c1b33] leading-[1.2]">{data.timeline.title}</h3>
            <p className="text-[14px] leading-[1.68] text-[#3a4f63] max-w-[560px]">{data.timeline.copy}</p>
          </div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase p-[7px_11px] rounded-full bg-[#f3f0fb] border border-[#c9bef2] text-[#4a2d8a] whitespace-nowrap">
            {data.timeline.tag}
          </div>
        </div>
        <div className="flex flex-col gap-[12px]">
          {data.timeline.items.map((item, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr] gap-[12px] items-start p-[14px_16px] border-[1.5px] border-[#d0e4f7] rounded-[14px] bg-white">
              <div className="w-[12px] h-[12px] rounded-full bg-[#2f6fd4] mt-[5px] shadow-[0_0_0_5px_rgba(47,111,212,0.12)] shrink-0" />
              <div>
                <div className="text-[14px] font-bold text-[#0c1b33] mb-[4px]">{item.title}</div>
                <div className="text-[13px] text-[#3a4f63] leading-[1.65]">{item.copy}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[14px] flex gap-[10px] align-start p-[14px_16px] rounded-[12px] bg-[#fef8e8] border border-[#f0d98a] text-[13px] text-[#8a6200] leading-[1.6]">
          <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] stroke-current fill-none stroke-[2px] shrink-0 mt-[1px]">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{data.timeline.infoStrip}</span>
        </div>
      </section>
 
      {/* PREP SECTION */}
      <section className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px] shadow-[0_8px_24px_rgba(12,27,51,0.07)]">
        <div className="flex justify-between gap-[16px] items-start mb-[16px]">
          <div>
            <h3 className="text-[24px] text-[#0c1b33] leading-[1.2]">{data.prepCards.title}</h3>
            <p className="text-[14px] leading-[1.68] text-[#3a4f63] max-w-[560px]">{data.prepCards.copy}</p>
          </div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase p-[7px_11px] rounded-full bg-[#fef8e8] border border-[#f0d98a] text-[#8a6200] whitespace-nowrap">
            {data.prepCards.tag}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {data.prepCards.cards.map((card, i) => (
            <div key={i} className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px]">
              <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-[12px] ${
                card.type === "green" ? "bg-[#e8f5ef] border border-[#a8d9be] text-[#15744f]"
                : card.type === "purple" ? "bg-[#f3f0fb] border border-[#c9bef2] text-[#4a2d8a]"
                : "bg-[#fef8e8] border border-[#f0d98a] text-[#8a6200]"
              }`}>
                {card.icon === "book" && (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                )}
                {card.icon === "dollar" && (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round">
                    <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
                {card.icon === "mail" && (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                  </svg>
                )}
              </div>
              <div className="text-[15px] font-bold text-[#0c1b33] mb-[6px]">{card.title}</div>
              <div className="text-[13px] text-[#3a4f63] leading-[1.6]">{card.copy}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-[10px] flex-wrap mt-[16px]">
          {data.prepCards.actions.map((act, i) => (
            <Link key={i} target="_blank" rel="noopener noreferrer"
              href="https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-1-submit-a-petition/step-2-begin-nvc-processing.html">
              <button className="inline-flex items-center justify-center gap-[8px] p-[10px_13px] rounded-[10px] border-[1.5px] border-[#d0e4f7] bg-[#f4f7fb] text-[12px] font-semibold text-[#0c1b33] hover:border-[#2f6fd4] hover:text-[#2f6fd4] hover:-translate-y-[1px] transition-all cursor-pointer">
                {act.type === "info" ? (
                  <Info size={15} className="stroke-current" strokeWidth={2} />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
                {act.label}
              </button>
            </Link>
          ))}
        </div>
      </section>
 
      {/* MODAL: ENTER NOTICE DETAILS */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[560px] w-[calc(100%-40px)]">
          <div className="bg-white rounded-[18px] shadow-[0_24px_80px_rgba(12,27,51,0.24),0_4px_20px_rgba(12,27,51,0.14)] max-h-[88vh] overflow-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between gap-[16px] items-start p-[24px_24px_0]">
              <div>
                <h2 className="text-[24px] text-[#0c1b33]">{data.modal.title}</h2>
                <div className="text-[13px] text-[#6b8097] mt-[4px] leading-[1.6]">{data.modal.sub}</div>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)}
                className="w-[34px] h-[34px] rounded-full bg-[#eef3fa] hover:bg-[#d0e4f7] flex items-center justify-center transition-colors">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
 
            <div className="p-[20px_24px_24px]">
              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6b8097]" htmlFor="approvalDate">
                  Approval date
                </label>
                <input id="approvalDate" type="date" value={approvalDetails.approvalDate}
                  onChange={(e) => setApprovalDetails({ ...approvalDetails, approvalDate: e.target.value })}
                  className="p-[11px_13px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all" />
              </div>
 
              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6b8097]" htmlFor="receiptNumber">
                  Receipt number
                </label>
                <input id="receiptNumber" type="text" value={approvalDetails.receiptNumber} maxLength={13}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    setApprovalDetails({ ...approvalDetails, receiptNumber: val });
                    if (receiptError) setReceiptError("");
                  }}
                  placeholder="IOE1234567890"
                  className={`p-[11px_13px] border-[1.5px] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all ${
                    receiptError ? "border-red-500 focus:border-red-500" : "border-[#d0e4f7] focus:border-[#2f6fd4]"
                  }`} />
                {receiptError && (
                  <div className="text-[11px] font-medium text-red-600 mt-1 animate-in fade-in slide-in-from-top-1">
                    {receiptError}
                  </div>
                )}
              </div>
 
              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6b8097]" htmlFor="priorityDate">
                  Priority date (optional)
                </label>
                <input id="priorityDate" type="date" value={approvalDetails.priorityDate}
                  onChange={(e) => setApprovalDetails({ ...approvalDetails, priorityDate: e.target.value })}
                  className="p-[11px_13px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all" />
              </div>
 
              <div className="text-[12px] text-[#6b8097] leading-[1.5] mb-4">{data.modal.helper}</div>
 
              <div className="flex gap-[10px] mt-[8px]">
                <button onClick={() => setIsApprovalModalOpen(false)}
                  className="flex-1 p-[13px_16px] rounded-[11px] font-bold text-[14px] border-[1.5px] border-[#d0e4f7] bg-[#f4f7fb] text-[#0c1b33] hover:border-[#2f6fd4] hover:text-[#2f6fd4] transition-all">
                  Cancel
                </button>
                <button onClick={saveDetails}
                  className="flex-1 p-[13px_16px] rounded-[11px] font-bold text-[14px] border-none bg-primary hover:bg-primary/90 text-white transition-all shadow-[0_4px_20px_rgba(47,111,212,0.25)]">
                  Save details
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
 
      {/* OVERLAY: GUIDE TUTORIAL */}
      <Dialog open={isApprovalGuideOpen} onOpenChange={setIsApprovalGuideOpen}>
        <DialogContent className="max-w-[760px] p-0 border-none bg-transparent shadow-none w-[calc(100%-40px)]">
          <div className="relative bg-white rounded-[18px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_24px_80px_rgba(12,27,51,0.24),0_4px_20px_rgba(12,27,51,0.14)] animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            <div className="flex items-center p-[18px_20px] border-b border-[#d0e4f7] gap-[14px]">
              <button onClick={() => setIsApprovalGuideOpen(false)}
                className="w-[36px] h-[36px] rounded-full bg-[#f4f7fb] hover:bg-[#e8f1fb] flex items-center justify-center transition-colors shrink-0">
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] stroke-[#3a4f63] fill-none stroke-[2px]">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="flex-1 h-[5px] bg-primary/30 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-300 ease-out"
                  style={{ width: `${((approvalGuideStep + 1) / data.guideSteps.length) * 100}%` }} />
              </div>
              <div className="text-[12px] font-semibold text-[#6b8097] whitespace-nowrap">
                {approvalGuideStep + 1} / {data.guideSteps.length}
              </div>
            </div>
 
            <div className="p-[28px_24px_24px] overflow-auto custom-scrollbar">
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#2f6fd4] mb-[12px]">
                {data.guideSteps[approvalGuideStep].label}
              </div>
              <h3 className="text-[28px] leading-[1.15] text-[#0c1b33] mb-[8px]">
                {data.guideSteps[approvalGuideStep].title}
              </h3>
              <p className="text-[14px] leading-[1.72] text-[#3a4f63] mb-[18px]">
                {data.guideSteps[approvalGuideStep].copy}
              </p>
 
              <div className="border-[1.5px] border-[#d0e4f7] rounded-[14px] overflow-hidden bg-linear-to-b from-white to-[#f7fbff] mb-[16px]">
                <div className="h-[34px] bg-[#e8f1fb] flex items-center gap-[7px] px-[12px]">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                  <div className="ml-[8px] bg-white rounded-[6px] p-[5px_10px] text-[10px] text-[#6b8097] font-mono flex-1">
                    uscis.gov / approval notice / next stage
                  </div>
                </div>
                <div className="p-[22px_20px]">
                  <div className="text-[10px] font-bold tracking-[0.09em] uppercase text-[#2f6fd4] mb-[10px]">USCIS approval milestone</div>
                  <div className="text-[20px] font-bold text-[#0c1b33] mb-[8px]">{data.guideSteps[approvalGuideStep].head}</div>
                  <div className="text-[12.8px] leading-[1.62] text-[#3a4f63] mb-[14px] max-w-[500px]">{data.guideSteps[approvalGuideStep].body}</div>
                  <div className="flex gap-[8px] flex-wrap">
                    {data.guideSteps[approvalGuideStep].pills.map((p, i) => (
                      <span key={i} className="p-[7px_10px] rounded-full bg-[#f4f7fb] border border-[#d0e4f7] text-[11px] font-bold text-[#2d4a6e]">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
 
              <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[12px] p-[12px_14px] text-[12.5px] text-[#8a6200] leading-[1.58] mb-[18px]">
                {data.guideSteps[approvalGuideStep].note}
              </div>
 
              <div className="flex gap-[10px]">
                {approvalGuideStep > 0 && (
                  <button onClick={() => setApprovalGuideStep((prev) => prev - 1)}
                    className="p-[13px_18px] rounded-[11px] font-bold text-[14px] border-[1.5px] border-[#d0e4f7] text-[#3a4f63] transition-all">
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (approvalGuideStep < data.guideSteps.length - 1) {
                      setApprovalGuideStep((prev) => prev + 1);
                    } else {
                      setIsApprovalGuideOpen(false);
                    }
                  }}
                  className="flex-1 p-[13px_18px] rounded-[11px] font-bold text-[14px] border-none text-white transition-all bg-primary hover:bg-primary/90"
                >
                  {approvalGuideStep === data.guideSteps.length - 1 ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
 
      {/* Upgrade modal */}
      {upgradeModalFeature && (
        <UpgradeModal
          feature={upgradeModalFeature}
          onClose={() => setUpgradeModalFeature(null)}
          onConfirm={(action, target) => {
            console.log("upgrade", action, target);
          }}
        />
      )}
    </div>
  );
};