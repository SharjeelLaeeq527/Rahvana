"use client";

import React, { useRef, useState } from "react";
import { X, Info, RefreshCw, Upload, Lock, Eye } from "lucide-react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePlan } from "@/app/context/PlanContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { DocumentPreviewModal } from "@/app/components/document-vault/DocumentPreviewModal";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import type { DocumentDefinition } from "@/lib/document-vault/types";
import { E, msg } from "@/lib/errors";
import { ZoomableGuideImage } from "@/app/components/shared/ZoomableGuideImage";

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
  onBack?: () => void;
  onSelectChapter?: (chapterIdx: number) => void;
  onSelectStep?: (chapterIdx: number, stepIdx: number) => void;
}

const getPillStyle = (pill: string): React.CSSProperties => {
  const p = pill.toLowerCase();
  // Amber: dates, contacts, alerts
  if (p.includes("date") || p.includes("contact") || p.includes("alert") || p.includes("expire")) {
    return { backgroundColor: "#fef8e8", borderColor: "#f0d98a", color: "#8a6200" };
  }
  // Purple: documents, receipts, numbers, IDs
  if (p.includes("receipt") || p.includes("number") || p.includes("document") || p.includes("notice") || p.includes("id")) {
    return { backgroundColor: "#f3f0fb", borderColor: "#c9bef2", color: "#4a2d8a" };
  }
  // Green: approval, saved, safe, petitioner, USCIS
  if (
    p.includes("save") || p.includes("original") || p.includes("digital") || p.includes("safe") ||
    p.includes("approved") || p.includes("approval") || p.includes("petitioner") || p.includes("uscis")
  ) {
    return { backgroundColor: "#e8f5ef", borderColor: "#a8d9be", color: "#15744f" };
  }
  // Blue: prep, financial, mail, online, account, portal
  if (
    p.includes("prep") || p.includes("financial") ||
    p.includes("mail") || p.includes("online") || p.includes("account") || p.includes("portal")
  ) {
    return { backgroundColor: "#e8f1fb", borderColor: "#d0e4f7", color: "#2d4a6e" };
  }
  return { backgroundColor: "#f4f7fb", borderColor: "#d0e4f7", color: "#2d4a6e" }; // Default
};


export const ApprovalNoticeTool: React.FC<ApprovalNoticeToolProps> = ({
  state,
  actions,
  approvalState,
  guard,
  onBack,
  onSelectChapter,
  onSelectStep,
  tool,
}) => {
  const data = tool || {};
  const { showToast } = useToast();
  const { t, isUrdu } = useLanguage();
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

  React.useEffect(() => {
    if (isApprovalGuideOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isApprovalGuideOpen]);

  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  const approvalDoc = (uploadedDocuments || []).find(
    (d) => d.documentDefId === "i797-approval-notice"
  );

  // Preview of the uploaded I-797 — reuses the shared DocumentPreviewModal (same
  // component the Document Vault and every step doc-list use). Resolve the catalog
  // definition for the display title; synthesize a minimal one if it's ever absent.
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const approvalDocDef: DocumentDefinition =
    ALL_DOCUMENTS.find((d) => d.id === "i797-approval-notice") ||
    ({
      id: "i797-approval-notice",
      name: "Notice of Approval (I-797)",
      description: "",
    } as DocumentDefinition);

  const [receiptError, setReceiptError] = useState("");
  const currentGuideStep = data.guideSteps[approvalGuideStep];
  const currentGuideStepBody =
    "body" in currentGuideStep
      ? ((currentGuideStep as { body?: string }).body ?? undefined)
      : undefined;

  const validateReceiptNumber = (value: string) => {
    const regex = /^[A-Z]{3}[0-9]{10}$/;
    return regex.test(value);
  };

  const saveDetails = () => {
    if (!approvalDetails.approvalDate || !approvalDetails.receiptNumber) {
      showToast(msg(E.TOOL_APPROVAL_FIELDS_REQUIRED), "error");
      return;
    }

    if (!validateReceiptNumber(approvalDetails.receiptNumber)) {
      setReceiptError(msg(E.TOOL_APPROVAL_RECEIPT_FORMAT_FAILED));
      showToast(msg(E.TOOL_APPROVAL_RECEIPT_FORMAT_FAILED), "error");
      return;
    }

    setReceiptError("");
    setIsApprovalSaved(true);
    actions.updateMetadata({
      approvalDetails,
      approvalSaved: "true",
    });
    setIsApprovalModalOpen(false);
    showToast("Approval notice details saved!", "success");
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
  const UploadButton = ({
    replace = false,
    fullWidth = false,
  }: {
    replace?: boolean;
    fullWidth?: boolean;
  }) => (
    <div className={`relative w-full`}>
      <button
        onClick={handleUploadClick}
        className={`inline-flex w-full items-center justify-center gap-[8px] p-[14px_16px] sm:p-[12px_14px] rounded-[10px] border-[1.5px] transition-all hover:-translate-y-[1px] text-[14.5px] font-semibold tracking-tight min-h-[48px] ${
          fullWidth
            ? "bg-[var(--rv-ch1)] text-white hover:bg-[var(--rv-ch1-dark)] border-[var(--rv-ch1)] shadow-[0_6px_20px_rgba(130,132,191,0.3)]"
            : approvalDoc && !isBasic
              ? "bg-[var(--rv-green-bg)] border-[#a8d9be] text-[var(--rv-green)] hover:border-[var(--rv-green)]"
              : isBasic
                ? "bg-[var(--rv-rose-bg)] border-[rgba(130,132,191,0.4)] text-[var(--rv-ch1)]"
                : "bg-white border-[var(--rv-line)] text-[var(--rv-navy)] hover:border-[var(--rv-blue)] hover:text-[var(--rv-blue)]"
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
          ? replace
            ? "Replace Approval Notice"
            : "Upload Approval Notice"
          : approvalDoc
            ? "Replace Approval Notice"
            : "Upload Approval Notice"}
        {isBasic && (
          <span
            className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(130,132,191,0.15)",
              color: "var(--rv-ch1)",
            }}
          >
            Premium
          </span>
        )}
      </button>
    </div>
  );
  /** Preview the uploaded approval notice — only shown once a doc exists. */
  const PreviewButton = () =>
    approvalDoc ? (
      <button
        onClick={() => {
          if (guard && !guard()) return;
          setIsPreviewOpen(true);
        }}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-[8px] p-[14px_16px] sm:p-[12px_14px] rounded-[10px] border-[1.5px] transition-all hover:-translate-y-[1px] text-[14.5px] font-semibold tracking-tight bg-white border-[var(--rv-line)] text-[var(--rv-navy)] hover:border-[var(--rv-blue)] hover:text-[var(--rv-blue)] min-h-[48px]"
      >
        <Eye size={15} className="stroke-[2.5px]" />
        Preview
      </button>
    ) : null;
  const UploadLockedNote = () => (
    <div
      className="mt-2 flex items-start gap-2 rounded-xl p-3"
      style={{
        background: "var(--rv-rose-bg)",
        border: "1px solid rgba(130,132,191,0.3)",
      }}
    >
      <span
        className="w-7 h-7 rounded-full border border-[#c5b9ff] bg-[#f0ebff] flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
        aria-hidden="true"
      >
        <span className="plan-icon plan-icon--premium scale-110" aria-hidden="true" />
      </span>
      <p className="text-[12px] leading-[1.6]" style={{ color: "#5a3040" }}>
        Uploading your approval notice automatically saves it to the document vault and extracts key
        information, approval date, receipt number, and more. This feature is available on{" "}
        <strong>Premium and above</strong>.{" "}
        <button
          onClick={() => setUpgradeModalFeature("approval_notice_upload")}
          className="underline font-bold"
          style={{ color: "var(--rv-ch1)" }}
        >
          Upgrade to unlock
        </button>
      </p>
    </div>
  );

  return (
    <div
      className={`flex flex-col gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-360 w-full text-[var(--rv-ink)] min-h-screen`}
    >
      {/* LAUNCH MODULE */}
      <section
        className="rounded-[16px] border shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] overflow-hidden relative"
        style={{
          backgroundColor: "var(--rv-ch1-module-bg)",
          borderColor: "var(--rv-ch1)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
          style={{
            background: "linear-gradient(90deg, var(--rv-ch1) 0%, var(--rv-ch1-module-bg) 100%)",
          }}
        />
        <div className="p-[20px_16px_22px] sm:p-[30px_24px_28px]">
          {/* ── Header row with icon, eyebrow next to it, and badge on the right ── */}
          <div className="flex items-center justify-between gap-3 mb-[20px]">
            <div className="flex items-center gap-[12px] sm:gap-[16px]">
              {/* Icon */}
              <div
                className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-[12px] flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: "var(--rv-ch1)",
                  borderColor: "var(--rv-ch1)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] stroke-white/80 fill-none stroke-[1.75px] stroke-linecap-round stroke-linejoin-round"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              {/* Eyebrow */}
              <div
                className="text-[10px] sm:text-[10.5px] font-bold tracking-[0.12em] uppercase leading-[1.4] text-left"
                style={{ color: "var(--rv-ch1)" }}
              >
                {String(data.launchModule.eyebrow)
                  .split(/[·•\-–—|]/)
                  .map((part, idx, arr) => (
                    <span key={idx}>
                      {part.trim()}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
              </div>
            </div>
            {/* Badge */}
            <div
              className="px-2.5 py-1 sm:px-3 sm:py-2 rounded-full border text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase whitespace-nowrap shrink-0"
              style={{
                backgroundColor: "rgba(130,132,191,0.12)",
                borderColor: "rgba(130,132,191,0.28)",
                color: "var(--rv-ch1)",
              }}
            >
              {data.launchModule.badge}
            </div>
          </div>

          {/* ── Heading / Copy starting on the line below ── */}
          <div className="mb-[18px]">
            <h2 className="text-[clamp(19px,4vw,27px)] leading-[1.2] text-white/95 mb-[10px] font-bold">
              {data.launchModule.heading}
            </h2>
            <p className="text-[13px] sm:text-[13.5px] leading-[1.7] text-white/60 max-w-[520px]">
              {data.launchModule.copy}
            </p>
          </div>
          <div className="h-[1px] bg-white/10 my-[18px] sm:my-[16px]" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-[16px]">
            {data.metrics.map((m, i) => (
              <div
                key={i}
                className="rounded-[12px] p-[13px_14px] border"
                style={{
                  backgroundColor: "var(--rv-ch1-feature-bg)",
                  borderColor: "rgba(130,132,191,0.22)",
                }}
              >
                <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-white/40 mb-[6px]">
                  {m.label}
                </div>
                <div className="text-[14px] font-semibold text-white/95 leading-[1.35]">
                  {m.value}
                </div>
                <div className="text-[11px] text-white/60 mt-[4px] leading-[1.4]">{m.sub}</div>
              </div>
            ))}
            ==
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <button
              onClick={handleReceivedBtn}
              className="flex items-center justify-center gap-[10px] p-[14px_16px] sm:p-[13px_18px] rounded-[12px] text-[14px] font-semibold bg-[var(--rv-ch1)] hover:bg-[var(--rv-ch1-dark)] hover:text-[#fff] shadow-[0_4px_20px_rgba(47,111,212,0.35)] transition-all hover:-translate-y-[1px] min-h-[48px]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[15px] h-[15px] stroke-white fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round"
              >
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
              className="flex items-center justify-center gap-[10px] p-[14px_16px] sm:p-[13px_18px] rounded-[12px] text-[14px] font-semibold border border-white/10 bg-white/5 text-white/95 hover:bg-white/10 transition-all hover:-translate-y-[1px] min-h-[48px]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[15px] h-[15px] stroke-white fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round"
              >
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
      <section
        id="save-panel"
        className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_16px_22px] sm:p-[22px] shadow-[0_8px_24px_rgba(12,27,51,0.07)]"
      >
        <div className="flex items-start justify-between gap-[10px] mb-[14px]">
          <h3 className="text-[19px] sm:text-[23px] text-[#0c1b33] leading-[1.2] font-bold flex-1 min-w-0">{data.savePanel.title}</h3>
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase p-[6px_10px] sm:p-[7px_11px] rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#2d4a6e] whitespace-nowrap shrink-0 mt-[2px]">
            {data.savePanel.tag}
          </div>
        </div>
        <p className="text-[13px] sm:text-[14px] leading-[1.68] text-[#3a4f63] max-w-[560px] mb-[14px]">
          {data.savePanel.copy}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-[#0c1b33] font-semibold mb-[16px]">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className={isUrdu ? "font-urdu-body" : ""}>
            {t("documentVaultPage.components.uploadModal.securityNotice")}
          </span>
        </div>
        <div className="border-[1.5px] border-dashed border-[#b8d4f0] rounded-[14px] bg-linear-to-b from-[#fbfdff] to-[#f6faff] p-[18px] flex flex-col gap-[16px]">
          <div>
            {isApprovalSaved ? (
              <>
                <div className="text-[16px] font-bold text-[#0c1b33] mb-[8px]">
                  {data.savePanel.uploadHead}
                </div>
                <p className="text-[13px] text-[#3a4f63] leading-[1.65] mb-[14px]">
                  {data.savePanel.uploadCopy}
                </p>
                <div className="flex flex-col sm:flex-row gap-[10px] w-full">
                  <UploadButton replace />
                  <PreviewButton />
                </div>
                {isBasic && <UploadLockedNote />}
                <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[14px] p-[16px_18px] animate-in zoom-in-95 duration-200 mt-4">
                  <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#15744f] mb-[10px]">
                    {data.savePanel.savedState.title}
                  </div>
                  <div className="flex justify-between gap-[12px] py-[7px] border-b border-[#a8d9be]">
                    <span className="text-[12px] text-[#3a4f63]">File</span>
                    <span
                      className="text-[12px] text-[#1c2b3a] font-bold truncate max-w-[200px]"
                      title={
                        approvalDoc?.originalFilename || (isBasic ? "Upload locked" : "Not saved")
                      }
                    >
                      {approvalDoc?.originalFilename || (isBasic ? "" : "Not saved")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-[12px] py-[7px] border-b border-[#a8d9be]">
                    <span className="text-[12px] text-[#3a4f63]">Approval date</span>
                    <span className="text-[12px] text-[#1c2b3a] font-bold">
                      {approvalDetails.approvalDate || "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-[12px] py-[7px]">
                    <span className="text-[12px] text-[#3a4f63]">Receipt number</span>
                    <span className="text-[12px] text-[#1c2b3a] font-bold">
                      {approvalDetails.receiptNumber || "Not entered"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (guard && !guard()) return;
                      setIsApprovalModalOpen(true);
                    }}
                    className="mt-3 text-[11px] font-bold text-[#2f6fd4] hover:underline flex items-center gap-1 min-h-[30px]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[12px] h-[12px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    Edit recorded details
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-3 w-full">
                  <UploadButton fullWidth />
                  <button
                    onClick={() => {
                      if (guard && !guard()) return;
                      setIsApprovalModalOpen(true);
                    }}
                    className="inline-flex w-full items-center justify-center gap-[8px] p-[14px_16px] sm:p-[12px_14px] rounded-[10px] border-[1.5px] transition-all hover:-translate-y-[1px] text-[14.5px] font-semibold tracking-tight bg-white border-[var(--rv-ch1)] text-[var(--rv-ch1)] hover:bg-[var(--rv-ch1)]/5 shadow-md min-h-[48px]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[15px] h-[15px] stroke-current fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    Enter Notice Details Manually
                  </button>
                  <PreviewButton />
                </div>
                {isBasic && <UploadLockedNote />}
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
            {data.savePanel.safeItems.map((item, i) => {
              const words = item.title.split(" ");
              const mid = Math.ceil(words.length / 2);
              const line1 = words.slice(0, mid).join(" ");
              const line2 = words.slice(mid).join(" ");
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (item.icon !== "book") return;
                    if (guard && !guard()) return;
                    onSelectChapter?.(1);
                  }}
                  className={`text-left bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px] ${
                    item.icon === "book"
                      ? "cursor-pointer transition-all hover:-translate-y-[1px] hover:border-[#2f6fd4]"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex md:block items-center gap-[12px] md:gap-0 mb-[12px] md:mb-0">
                    <div
                      className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 mb-0 md:mb-[12px] ${
                        item.icon === "check"
                          ? "bg-[#e8f5ef] border border-[#a8d9be] text-[#15744f]"
                          : item.icon === "file"
                            ? "bg-[#f3f0fb] border border-[#c9bef2] text-[#4a2d8a]"
                            : "bg-[#fef8e8] border border-[#f0d98a] text-[#8a6200]"
                      }`}
                    >
                      {item.icon === "check" && (
                        <svg
                          viewBox="0 0 24 24"
                          className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px]"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {item.icon === "file" && (
                        <svg
                          viewBox="0 0 24 24"
                          className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round"
                        >
                          <path d="M8 17h8" />
                          <path d="M8 13h8" />
                          <path d="M8 9h5" />
                          <path d="M4 4h16v16H4z" />
                        </svg>
                      )}
                      {item.icon === "calendar" && (
                        <svg
                          viewBox="0 0 24 24"
                          className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round"
                        >
                          <path d="M3 6h18" />
                          <path d="M7 3v6" />
                          <path d="M17 3v6" />
                          <rect x="3" y="4" width="18" height="17" rx="2" />
                        </svg>
                      )}
                    </div>
                    {/* Mobile Title: Beside icon, split into 2 lines */}
                    <div className="md:hidden text-[15px] font-semibold text-[#0c1b33] leading-[1.25]">
                      <div>{line1}</div>
                      <div>{line2}</div>
                    </div>
                    {/* Desktop Title: Original layout below icon, font-bold */}
                    <div className="hidden md:block text-[15px] font-bold text-[#0c1b33] mb-[6px]">
                      {item.title}
                    </div>
                  </div>
                  <div className="text-[13px] text-[#3a4f63] leading-[1.6]">{item.copy}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIMELINE PHASE
      <section className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_4px] sm:p-[22px] shadow-[0_8px_24px_rgba(12,27,51,0.07)]">
        <div className="flex justify-between gap-[16px] items-start mb-[16px]">
          <div>
            <h3 className="text-[24px] text-[#0c1b33] leading-[1.2]">{data.timeline.title}</h3>
            <p className="text-[14px] leading-[1.68] text-[#3a4f63] max-w-[560px]">
              {data.timeline.copy}
            </p>
          </div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase p-[7px_11px] rounded-full bg-[#f3f0fb] border border-[#c9bef2] text-[#4a2d8a] whitespace-nowrap">
            {data.timeline.tag}
          </div>
        </div>
        <div className="flex flex-col gap-[12px]">
          {data.timeline.items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr] gap-[12px] items-start p-[14px_16px] border-[1.5px] border-[#d0e4f7] rounded-[14px] bg-white"
            >
              <div className="w-[12px] h-[12px] rounded-full bg-[#2f6fd4] mt-[5px] shadow-[0_0_0_5px_rgba(47,111,212,0.12)] shrink-0" />
              <div>
                <div className="text-[14px] font-bold text-[#0c1b33] mb-[4px]">{item.title}</div>
                <div className="text-[13px] text-[#3a4f63] leading-[1.65]">{item.copy}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[14px] flex gap-[10px] align-start p-[14px_16px] rounded-[12px] bg-[#fef8e8] border border-[#f0d98a] text-[13px] text-[#8a6200] leading-[1.6]">
          <svg
            viewBox="0 0 24 24"
            className="w-[16px] h-[16px] stroke-current fill-none stroke-[2px] shrink-0 mt-[1px]"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{data.timeline.infoStrip}</span>
        </div>
      </section> */}

      {/* PREP SECTION */}
      <section className="bg-[#fafcff] border-[1.5px] border-[#e2e0f2] rounded-[16px] p-[20px_16px_22px] sm:p-[22px] shadow-sm">
        <div className="flex items-start justify-between gap-[10px] mb-[10px]">
          <h3 className="text-[19px] sm:text-[23px] leading-[1.2] text-[#0c1b33] font-bold flex-1 min-w-0">{data.prepCards.title}</h3>
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase p-[6px_10px] sm:p-[7px_11px] rounded-full bg-white border border-[#e2e0f2] text-[#4e518c] whitespace-nowrap shrink-0 mt-[2px]">
            {data.prepCards.tag}
          </div>
        </div>
        <p className="text-[13px] sm:text-[14px] leading-[1.68] max-w-[560px] text-[#3a4f63] mb-[16px]">
          {data.prepCards.copy}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {data.prepCards.cards.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (guard && !guard()) return;
                if (card.icon === "book") {
                  onSelectChapter?.(1);
                }
                if (card.icon === "dollar") {
                  onSelectStep?.(1, 4);
                }
              }}
              className={`text-left border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px] ${
                card.type === "green"
                  ? "bg-[#e8f5ef]"
                  : card.type === "purple"
                    ? "bg-[#f3f0fb]"
                    : "bg-[#fef8e8]"
              } ${
                card.icon === "book" || card.icon === "dollar"
                  ? "cursor-pointer transition-all hover:-translate-y-[1px] hover:border-[#2f6fd4]"
                  : "cursor-default"
              }`}
            >
              <div
                className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-[12px] border shadow-xs bg-white ${
                  card.type === "green"
                    ? "border-[#a8d9be] text-[#15744f]"
                    : card.type === "purple"
                      ? "border-[#c9bef2] text-[#4a2d8a]"
                      : "border-[#f0d98a] text-[#8a6200]"
                }`}
              >
                {card.icon === "book" && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                )}
                {card.icon === "dollar" && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round"
                  >
                    <path d="M12 1v22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
                {card.icon === "mail" && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8px] stroke-linecap-round stroke-linejoin-round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                )}
              </div>
              <div className="text-[15px] font-bold text-[#0c1b33] mb-[6px]">{card.title}</div>
              <div className="text-[13px] text-[#3a4f63] leading-[1.6]">{card.copy}</div>
            </button>
          ))}
        </div>
      </section>

      {/* MODAL: ENTER NOTICE DETAILS */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[560px] w-[calc(100%-24px)] sm:w-[calc(100%-40px)]">
          <div className="bg-white rounded-[18px] shadow-[0_24px_80px_rgba(12,27,51,0.24),0_4px_20px_rgba(12,27,51,0.14)] max-h-[88vh] overflow-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between gap-[16px] items-start p-[24px_24px_0]">
              <div>
                <h2 className="text-[24px] text-[#0c1b33]">{data.modal.title}</h2>
                <div className="text-[13px] text-[#6b8097] mt-[4px] leading-[1.6]">
                  {data.modal.sub}
                </div>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="w-[34px] h-[34px] rounded-full bg-[#eef3fa] hover:bg-[#d0e4f7] flex items-center justify-center transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="p-[20px_24px_24px]">
              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label
                  className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6b8097]"
                  htmlFor="approvalDate"
                >
                  Approval date
                </label>
                <input
                  id="approvalDate"
                  type="date"
                  value={approvalDetails.approvalDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setApprovalDetails({
                      ...approvalDetails,
                      approvalDate: e.target.value,
                    })
                  }
                  className="p-[11px_13px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                />
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label
                  className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6b8097]"
                  htmlFor="receiptNumber"
                >
                  Receipt number
                </label>
                <input
                  id="receiptNumber"
                  type="text"
                  value={approvalDetails.receiptNumber}
                  maxLength={13}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    setApprovalDetails({
                      ...approvalDetails,
                      receiptNumber: val,
                    });
                    if (receiptError) setReceiptError("");
                  }}
                  placeholder="IOE1234567890"
                  className={`p-[11px_13px] border-[1.5px] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all ${
                    receiptError
                      ? "border-red-500 focus:border-red-500"
                      : "border-[#d0e4f7] focus:border-[#2f6fd4]"
                  }`}
                />
                {receiptError && (
                  <div className="text-[11px] font-medium text-red-600 mt-1 animate-in fade-in slide-in-from-top-1">
                    {receiptError}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-[6px] mb-[14px]">
                <label
                  className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6b8097]"
                  htmlFor="priorityDate"
                >
                  Priority date (optional)
                </label>
                <input
                  id="priorityDate"
                  type="date"
                  value={approvalDetails.priorityDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setApprovalDetails({
                      ...approvalDetails,
                      priorityDate: e.target.value,
                    })
                  }
                  className="p-[11px_13px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] text-[#1c2b3a] bg-white outline-none focus:border-[#2f6fd4] focus:shadow-[0_0_0_3px_rgba(47,111,212,0.12)] transition-all"
                />
              </div>

              <div className="text-[12px] text-[#6b8097] leading-[1.5] mb-4">
                {data.modal.helper}
              </div>

              <div className="flex gap-[10px] mt-[8px]">
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="flex-1 p-[14px_16px] sm:p-[13px_16px] rounded-[11px] font-bold text-[14px] border-[1.5px] border-[#d0e4f7] bg-[#f4f7fb] text-[#0c1b33] hover:border-[#2f6fd4] hover:text-[#2f6fd4] transition-all min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDetails}
                  className="flex-1 p-[14px_16px] sm:p-[13px_16px] rounded-[11px] font-bold text-[14px] border-none bg-primary hover:bg-primary/90 text-white transition-all shadow-[0_4px_20px_rgba(47,111,212,0.25)] min-h-[48px]"
                >
                  Save details
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OVERLAY: GUIDE TUTORIAL */}
      {isApprovalGuideOpen && (
        <div className="fixed inset-0 z-500 flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans bg-white text-[#0c1b33]">
          {/* ── Progress bar header ── */}
          <div className="flex items-center px-5 sm:px-8 py-4 sm:py-5 border-b border-[#d0e4f7] gap-4 shrink-0 bg-white">
            <button
              onClick={() => setIsApprovalGuideOpen(false)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f4f7fb] transition-colors"
            >
              <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
            </button>
            <div className="flex-1 h-[6px] bg-[#d0e4f7] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-450 ease-in-out rounded-full"
                style={{
                  width: `${((approvalGuideStep + 1) / data.guideSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-[13px] font-semibold text-[#6b8097] whitespace-nowrap shrink-0">
              {approvalGuideStep + 1} / {data.guideSteps.length}
            </div>
          </div>

          {/* ── Scrollable content + nav ── */}
          <div
            className="flex-1 overflow-y-auto flex flex-col items-center px-5 sm:px-8 md:px-10 py-7 sm:py-10 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="w-full max-w-full sm:max-w-[600px] md:max-w-[650px] flex flex-col">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3">
                {currentGuideStep.label}
              </div>
              <h2 className="text-[clamp(18px,3.2vw,26px)] text-[#0c1b33] font-bold leading-tight mb-2">
                {currentGuideStep.title}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#3a4f63] leading-relaxed mb-4 sm:mb-[18px]">
                {currentGuideStep.copy}
              </p>

              <div
                className={
                  approvalGuideStep === 1
                    ? "border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden bg-linear-to-b from-white to-[#f7fbff] mb-4 sm:mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]"
                    : "border-[1.5px] border-[#d0e4f7] rounded-[10px] bg-white p-[14px] sm:p-[18px] mb-4 sm:mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]"
                }
              >
                {approvalGuideStep === 1 && (
                  <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[8px_10px] sm:p-[10px_14px] flex items-center gap-1.5 min-w-0">
                    <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
                    <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
                    <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
                    <div className="text-[9px] sm:text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto truncate min-w-0">
                      Rahvana/visa-category/ir1-journey
                    </div>
                  </div>
                )}
                <div className={approvalGuideStep === 1 ? "p-[14px] sm:p-[18px]" : ""}>
                  <div className="text-[10px] font-bold uppercase text-[#2f6fd4] mb-1">
                    USCIS approval milestone
                  </div>
                  <div className="text-[14px] sm:text-[15px] font-bold text-[#0c1b33] mb-2">
                    {currentGuideStep.head}
                  </div>
                  {currentGuideStep.media ? (
                    currentGuideStep.media.frame === false ? (
                      <div className="mb-[14px] w-full relative rounded-[12px] overflow-hidden border border-[#d0e4f7]" style={{ aspectRatio: "4/3" }}>
                        <ZoomableGuideImage
                          src={currentGuideStep.media.src}
                          alt={currentGuideStep.media.alt || currentGuideStep.head}
                          isStandardImg
                        />
                      </div>
                    ) : (
                      <div className="mb-[14px] overflow-hidden rounded-[12px] border border-[#d0e4f7] bg-white">
                        {currentGuideStep.media.type === "video" ? (
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            className="block w-full bg-black"
                          >
                            <source src={currentGuideStep.media.src} type="video/mp4" />
                          </video>
                        ) : (
                          <div className="w-full relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                            <ZoomableGuideImage
                              src={currentGuideStep.media.src}
                              alt={currentGuideStep.media.alt || currentGuideStep.head}
                              isStandardImg
                            />
                          </div>
                        )}
                      </div>
                    )
                  ) : currentGuideStepBody ? (
                    <div className="text-[12px] sm:text-[13px] text-[#3a4f63] mb-2">
                      {currentGuideStepBody}
                    </div>
                  ) : null}
                  <div className="flex gap-[8px] flex-wrap mt-2">
                    {currentGuideStep.pills.map((p, i) => (
                      <span
                        key={i}
                        className="inline-block px-2.5 py-1 rounded-full border text-[10px] sm:text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                        style={getPillStyle(p)}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {currentGuideStep.note && (
                <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] px-3 py-2 sm:px-[14px] sm:py-[11px] text-[12px] sm:text-[13px] text-[#8a6200] leading-relaxed mb-5 sm:mb-[24px]">
                  {currentGuideStep.note}
                </div>
              )}

              <div className="mt-4 mb-2 flex flex-row gap-3">
                {approvalGuideStep > 0 && (
                  <button
                    onClick={() => setApprovalGuideStep((prev) => prev - 1)}
                    className="shrink-0 px-6 py-3.5 bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a] min-h-[48px]"
                  >
                    ← Back
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
                  className={`flex-1 py-3.5 text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:-translate-y-px text-center min-h-[48px] ${
                    approvalGuideStep === data.guideSteps.length - 1
                      ? "bg-[#15744f] hover:bg-[#0e5c3c]"
                      : "bg-primary hover:bg-primary/80"
                  }`}
                >
                  {approvalGuideStep === data.guideSteps.length - 1 ? "Done, return to step" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview uploaded approval notice (shared component) */}
      {isPreviewOpen && approvalDoc && (
        <DocumentPreviewModal
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          documentDef={approvalDocDef}
          uploadedDoc={approvalDoc}
        />
      )}

      {/* Upgrade modal */}
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature!} onClose={() => setUpgradeModalFeature(null)} />
      )}
    </div>
  );
};
