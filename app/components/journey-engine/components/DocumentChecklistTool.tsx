"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Info,
  ShieldAlert,
  Upload,
  X,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { GroupedDocuments, DocumentChecklistItem } from "@/lib/journey/document-checklist/types";
import { getStepIcon } from "../StepIcon";
import { DocumentUploadModal } from "../../document-vault/DocumentUploadModal";
import type { DocumentDefinition, DocumentRole, ProcessStage } from "@/lib/document-vault/types";
import { ExpandableTooltip } from "../../shared/ExpandableTooltip";
import { exportChecklistToPdf } from "@/lib/journey/document-checklist/exportChecklistPDF";

interface DocumentChecklistToolProps {
  journeyId: string;
  journeyType: string;
}

const getDocumentRoles = (documentKey: string): DocumentRole[] => {
  switch (documentKey) {
    case "passport-beneficiary":
    case "birth-cert-beneficiary":
    case "police-certificate-pakistan":
    case "ds-260":
    case "nvc-interview-letter":
    case "passport-photos":
    case "polio-vaccine-cert":
      return ["BENEFICIARY"];

    case "birth-cert-petitioner":
    case "i864-affidavit-support":
    case "tax-transcripts-petitioner":
    case "w2-forms-petitioner":
    case "citizenship-proof-petitioner":
      return ["PETITIONER"];

    case "marriage-cert":
      return ["BENEFICIARY", "PETITIONER"];

    default:
      return ["BENEFICIARY"];
  }
};

const getDocumentStages = (documentKey: string): ProcessStage[] => {
  switch (documentKey) {
    case "passport-beneficiary":
    case "birth-cert-beneficiary":
    case "birth-cert-petitioner":
    case "police-certificate-pakistan":
    case "i864-affidavit-support":
    case "tax-transcripts-petitioner":
    case "w2-forms-petitioner":
    case "citizenship-proof-petitioner":
    case "marriage-cert":
      return ["NVC", "INTERVIEW"];

    case "ds-260":
      return ["DS260_SUBMISSION", "INTERVIEW"];

    case "nvc-interview-letter":
    case "passport-photos":
    case "polio-vaccine-cert":
      return ["INTERVIEW"];

    default:
      return ["INTERVIEW"];
  }
};

const getUploadDocumentDefinition = (item: DocumentChecklistItem): DocumentDefinition => {
  return {
    id: item.document_key,
    key: item.document_key,
    name: item.title,
    description: item.subtitle || item.title,

    category: "MISC",

    roles: getDocumentRoles(item.document_key),
    stages: getDocumentStages(item.document_key),

    required: item.is_required,
    multipleFilesAllowed: false,

    validityType: item.is_expirable ? "policy_variable" : "none",
  };
};

type SectionKey = "post_appointment" | "needs_attention" | "ceac_required";

type ModalType = "section" | "upload" | null;

type SectionConfig = {
  key: SectionKey;
  title: string;
  description: string;
  tooltipTitle: string;
  tooltipMessage: string;
  icon: React.ReactNode;
  tone: "default" | "attention" | "success";
};

const SECTION_CONFIGS: SectionConfig[] = [
  {
    key: "post_appointment",
    title: "Documents to Prepare After Receiving Interview Letter",
    description: "Prepare the documents you will need to take with you to your visa interview.",
    tooltipTitle: "When to prepare these documents",
    tooltipMessage:
      "These documents should be prepared after you receive your NVC interview appointment letter. Bring them with you to your visa interview. You do not need to upload them to CEAC.",
    icon: <CalendarDays size={19} strokeWidth={2} />,
    tone: "default",
  },
  {
    key: "needs_attention",
    title: "Documents Needing Attention",
    description: "Review expired or soon-to-expire documents before your interview.",
    tooltipTitle: "Why these documents need attention",
    tooltipMessage:
      "These documents are expired, expiring soon, or otherwise require action. Review each item and replace or update it before your interview.",
    icon: <AlertTriangle size={19} strokeWidth={2} />,
    tone: "attention",
  },
  {
    key: "ceac_required",
    title: "CEAC Document Checklist",
    description: "Core civil and financial sponsorship documentation submitted in CEAC.",
    tooltipTitle: "Before you upload",
    tooltipMessage:
      "Uploading a document to Rahvana does not automatically confirm CEAC submission. Review each required document and make sure it is current and submitted in CEAC portal.",
    icon: <FileCheck size={19} strokeWidth={2} />,
    tone: "success",
  },
];

export function DocumentChecklistTool({ journeyId, journeyType }: DocumentChecklistToolProps) {
  const [documents, setDocuments] = useState<GroupedDocuments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);

  const [selectedDocument, setSelectedDocument] = useState<DocumentChecklistItem | null>(null);

  const [modalType, setModalType] = useState<ModalType>(null);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/journeys/${journeyId}/document-checklist`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load document checklist");
      }

      const result = await response.json();

      setDocuments(result.success ? result.data : null);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [journeyId, journeyType]);

  useEffect(() => {
    if (!modalType) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [modalType]);

  const openSection = (sectionKey: SectionKey) => {
    setSelectedSection(sectionKey);
    setSelectedDocument(null);
    setModalType("section");
  };

  const handleUploadClick = (event: React.MouseEvent, item: DocumentChecklistItem) => {
    event.stopPropagation();

    setSelectedDocument(item);
    setModalType("upload");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedDocument(null);
    setSelectedSection(null);
  };

  const handleUploadSuccess = async () => {
    await loadDocuments();
    returnToSection();
  };

  const returnToSection = () => {
    setSelectedDocument(null);
    setModalType(selectedSection ? "section" : null);
  };

  const getExpirationLabel = (item: DocumentChecklistItem) => {
    if (!item.expiration_status || !item.expiry_date) {
      return null;
    }

    if (item.expiration_status === "expired") {
      return "Expired";
    }

    if (item.expiration_status === "expiring_soon" && item.days_until_expiry !== undefined) {
      if (item.days_until_expiry === 0) {
        return "Expires today";
      }

      if (item.days_until_expiry === 1) {
        return "Expires tomorrow";
      }

      return `${item.days_until_expiry} days left`;
    }

    return "Valid";
  };

  const renderExpirationBadge = (item: DocumentChecklistItem) => {
    if (!item.is_expirable || !item.expiry_date) {
      return null;
    }

    const expired = item.expiration_status === "expired";
    const soon = item.expiration_status === "expiring_soon";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${
          expired
            ? "bg-[#FDEBEC] text-[#B4232D]"
            : soon
              ? "bg-[#FFF1E8] text-[#9A5700]"
              : "bg-[#E7F6F0] text-[#167056]"
        }`}
      >
        {expired || soon ? <Clock size={10} /> : <CheckCircle2 size={10} />}

        {getExpirationLabel(item)}
      </span>
    );
  };

  const getSectionItems = (key: SectionKey) => documents?.[key] || [];

  const getSectionStatus = (config: SectionConfig) => {
    const items = getSectionItems(config.key);

    const uploaded = items.filter((item) => item.is_uploaded).length;

    if (config.key === "needs_attention") {
      return {
        label: `${items.length} ${
          items.length === 1 ? "Item Requiring" : "Items Requiring"
        } Action`,
        className: "bg-[#FDE3E5] text-[#A92E3B]",
      };
    }

    if (config.key === "post_appointment") {
      return {
        label: `${items.length} ${items.length === 1 ? "item" : "items"} to prepare`,
        className: "bg-[#E9F3FA] text-[#315C76]",
      };
    }

    return {
      label: `${items.length} items (${uploaded} completed, ${Math.max(
        items.length - uploaded,
        0
      )} remaining)`,
      className: "bg-[#DDF7F6] text-[#0D7377]",
    };
  };

  const renderSummaryCard = (config: SectionConfig) => {
    const items = getSectionItems(config.key);

    if (!items.length && config.key !== "needs_attention") {
      return null;
    }

    const status = getSectionStatus(config);
    const attention = config.tone === "attention";

    return (
      <motion.button
        type="button"
        key={config.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        onClick={() => openSection(config.key)}
        className="group ml-0 w-full rounded-[12px] border border-[#E3EAF1] bg-white p-4 text-left shadow-[0_6px_22px_rgba(23,45,65,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#AFDBDB] hover:shadow-[0_12px_30px_rgba(13,115,119,0.09)] focus-visible:ring-2 focus-visible:ring-[#0D7377]/25 focus-visible:outline-none sm:p-5 md:-ml-7"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${
              attention ? "bg-[#FDEBEC] text-[#C43E4B]" : "bg-[#E8F1FC] text-[#0D7377]"
            }`}
          >
            {config.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] leading-tight font-bold text-[#10233C] sm:text-[15px]">
                {config.title}
              </h3>

              <span
                className={`rounded-full px-2 py-1 text-[9px] leading-none font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <p
              className={`mt-1 text-[11px] leading-[1.55] sm:text-[12px] ${
                attention ? "text-[#B4232D]" : "text-[#526579]"
              }`}
            >
              {config.description}
            </p>
          </div>

          <div
            className={`hidden h-9 shrink-0 items-center gap-2 rounded-[8px] px-3.5 text-[11px] font-semibold transition-colors sm:flex ${
              attention
                ? "bg-[#0D7377] text-white group-hover:bg-[#096468]"
                : "bg-[#EEF4FD] text-[#0D6370] group-hover:bg-[#E3EDF9]"
            }`}
          >
            {attention
              ? `Review ${items.length} ${items.length === 1 ? "Item" : "Items"}`
              : "View Documents"}

            <ChevronRight size={14} />
          </div>

          <ChevronRight size={18} className="shrink-0 text-[#7890A3] sm:hidden" />
        </div>
      </motion.button>
    );
  };

  const renderGuidanceTooltip = (item: DocumentChecklistItem) => {
    if (!item.notes) {
      return null;
    }

    return (
      <div className="group/guidance relative shrink-0">
        <button
          type="button"
          aria-label={`Guidance for ${item.title}`}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#7A8FA2] transition-colors hover:bg-[#EAF4F5] hover:text-[#0D7377] focus-visible:bg-[#EAF4F5] focus-visible:text-[#0D7377] focus-visible:outline-none"
        >
          <Info size={14} strokeWidth={2} />
        </button>

        <div className="pointer-events-none absolute top-full right-0 z-[100] mt-2 max-h-[180px] w-[min(280px,calc(100vw-48px))] overflow-y-auto rounded-[10px] border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-3 text-white opacity-0 shadow-[0_14px_35px_rgba(17,34,52,0.25)] transition-all duration-150 group-focus-within/guidance:pointer-events-auto group-focus-within/guidance:translate-y-0 group-focus-within/guidance:opacity-100 group-hover/guidance:pointer-events-auto group-hover/guidance:translate-y-0 group-hover/guidance:opacity-100">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Info size={12} className="shrink-0 text-[#AFDBDB]" />

            <span className="text-[10px] font-bold text-white">Guidance</span>
          </div>

          <p className="text-[10px] leading-[1.55] text-gray-200">{item.notes}</p>

          <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-t border-l border-gray-700 bg-gray-900" />
        </div>
      </div>
    );
  };

  const renderDocumentCard = (item: DocumentChecklistItem) => {
    const isUploaded = item.is_uploaded;

    return (
      <motion.article
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex min-h-[190px] w-full flex-col rounded-[11px] border p-3.5 shadow-[0_3px_12px_rgba(22,45,65,0.035)] transition-colors ${
          isUploaded ? "border-[#CFE8DC] bg-[#F8FCFA]" : "border-[#DCE7EF] bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-[7px] ${
              item.needs_attention
                ? "bg-[#FDEBEC] text-[#BE3542]"
                : isUploaded
                  ? "bg-[#E5F5EE] text-[#15704F]"
                  : "bg-[#E7F2F7] text-[#0D7377]"
            }`}
          >
            {getStepIcon(item.icon || "file-text", 15)}
          </div>

          <div className="flex flex-wrap justify-end gap-1">
            {item.is_required && (
              <span className="rounded-full bg-[#FDEBEC] px-2 py-1 text-[8px] font-semibold text-[#B4232D]">
                Required
              </span>
            )}

            {renderExpirationBadge(item)}
          </div>
        </div>

        <div className="relative mt-3 flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[12px] leading-[1.35] font-bold text-[#10233C]">
            {item.title}
          </h3>

          {renderGuidanceTooltip(item)}
        </div>

        {item.subtitle && (
          <p className="mt-1.5 line-clamp-3 text-[10px] leading-[1.45] text-[#536779]">
            {item.subtitle}
          </p>
        )}

        <div className="mt-auto border-t border-[#EBF0F4] pt-2.5">
          <div className="mb-2 flex items-center justify-between gap-2 text-[9px]">
            <span className="font-medium text-[#526579]">Status</span>

            {isUploaded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E5F5EE] px-2 py-1 font-semibold text-[#15704F]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#36A269]" />
                Uploaded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-1 font-semibold text-[#A15C00]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E09A2D]" />
                Not Uploaded
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(event) => handleUploadClick(event, item)}
            className={`flex h-9 w-full items-center justify-center gap-2 rounded-[7px] px-3 text-[10px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#0D7377]/30 focus-visible:outline-none ${
              isUploaded
                ? "border border-[#BFDCCD] bg-white text-[#15704F] hover:border-[#8FC6AA] hover:bg-[#F1FAF5]"
                : "bg-[#006B6E] text-white hover:bg-[#075A5E]"
            }`}
          >
            {isUploaded ? (
              <>
                <Upload size={13} />
                Replace Document
              </>
            ) : (
              <>
                <Upload size={13} />
                Upload Document
              </>
            )}
          </button>
        </div>
      </motion.article>
    );
  };

  const renderMobileDocumentTile = (item: DocumentChecklistItem) => {
    const isUploaded = item.is_uploaded;
    const isRequired = item.is_required;
    const isExpired = item.expiration_status === "expired";
    const isExpiringSoon = item.expiration_status === "expiring_soon";
  
    let borderClass = "border-[#D5E0E7] bg-white";
    let iconClass = "bg-[#E7F2F7] text-[#0D7377]";
    let statusClass = "text-[#7890A3]";
    let statusLabel = "Optional";
    let statusIndicator = "bg-[#A8B8C4]";
  
    if (isExpired) {
      borderClass = "border-[#D98B94] bg-[#FFF7F8]";
      iconClass = "bg-[#FDEBEC] text-[#B4232D]";
      statusClass = "text-[#B4232D]";
      statusLabel = "Expired";
      statusIndicator = "bg-[#B4232D]";
    } else if (isExpiringSoon) {
      borderClass = "border-[#E7C27A] bg-[#FFFBF2]";
      iconClass = "bg-[#FFF1D8] text-[#A15C00]";
      statusClass = "text-[#A15C00]";
  
      if (item.days_until_expiry === 0) {
        statusLabel = "Expires today";
      } else if (item.days_until_expiry === 1) {
        statusLabel = "Expires tomorrow";
      } else if (item.days_until_expiry !== undefined) {
        statusLabel = `${item.days_until_expiry} days left`;
      } else {
        statusLabel = "Expiring Soon";
      }
  
      statusIndicator = "bg-[#E09A2D]";
    } else if (isUploaded) {
      borderClass = "border-[#A8D8BE] bg-[#F7FCF9]";
      iconClass = "bg-[#E5F5EE] text-[#15704F]";
      statusClass = "text-[#15704F]";
      statusLabel = "Uploaded";
      statusIndicator = "bg-[#36A269]";
    } else if (isRequired) {
      borderClass = "border-[#E0A3A8] bg-[#FFF9F9]";
      iconClass = "bg-[#FDEBEC] text-[#BE3542]";
      statusClass = "text-[#B4232D]";
      statusLabel = "Required";
      statusIndicator = "bg-[#C43E4B]";
    }
  
    return (
      <motion.button
        key={item.id}
        type="button"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        onClick={() => {
          setSelectedDocument(item);
          setModalType("upload");
        }}
        className={`relative flex min-h-[108px] w-full flex-col items-center justify-center rounded-[12px] border-2 px-2 py-3 text-center shadow-[0_2px_8px_rgba(22,45,65,0.035)] transition-all active:scale-[0.98] ${borderClass}`}
      >
        {/* Status indicator */}
        <span
          className={`absolute right-2 top-2 h-2 w-2 rounded-full ${statusIndicator}`}
        />
  
        {/* Document icon */}
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${iconClass}`}
        >
          {getStepIcon(item.icon || "file-text", 17)}
        </div>
  
        {/* Document name */}
        <span className="mt-2 line-clamp-2 w-full text-[10px] font-semibold leading-[1.3] text-[#10233C]">
          {item.title}
        </span>
  
        {/* Document status */}
        <span className={`mt-1 text-[8px] font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </motion.button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#AFDBDB] border-t-[#0D7377]" />

        <p className="mt-3 text-[12px] font-medium text-[#526579]">
          Preparing your document checklist…
        </p>
      </div>
    );
  }

  if (!documents) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8D7D9] bg-[#FFF7F8] text-[#B4232D]">
          <AlertTriangle size={20} strokeWidth={1.9} />
        </div>

        <h3 className="mt-4 text-[13px] font-bold text-[#10233C]">
          We couldn’t load your document checklist
        </h3>

        <p className="mt-1.5 max-w-[420px] text-[11px] leading-[1.6] text-[#607487]">
          Something went wrong while retrieving your document information. Please try again in a
          moment.
        </p>

        <button
          type="button"
          onClick={loadDocuments}
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-[8px] bg-[#0D7377] px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#096468] focus-visible:ring-2 focus-visible:ring-[#0D7377]/30 focus-visible:outline-none"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activeConfig = SECTION_CONFIGS.find((config) => config.key === selectedSection);

  const activeItems = selectedSection ? getSectionItems(selectedSection) : [];

  const handleExport = async () => {
    if (!activeConfig || !activeItems.length || isExporting) {
      return;
    }

    try {
      setIsExporting(true);

      /*
       * Allow the browser to update the button state
       * before the PDF generation starts.
       */
      await new Promise((resolve) => setTimeout(resolve, 0));

      exportChecklistToPdf({
        journeyType,
        sectionTitle: activeConfig.title,
        sectionDescription: activeConfig.description,
        documents: activeItems,
      });
    } catch (error) {
      console.error("Failed to export document checklist:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <section className="rounded-[16px] bg-[#F5F7FC] px-4 py-1 sm:px-6">
        <div className="flex flex-col gap-3">{SECTION_CONFIGS.map(renderSummaryCard)}</div>
      </section>

      <AnimatePresence>
        {modalType === "section" && activeConfig && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#122033]/40 p-3 backdrop-blur-[2px] sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="document-section-title"
              initial={{
                opacity: 0,
                y: 22,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.99,
              }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex max-h-[calc(100vh-24px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[15px] border border-[#DCE5ED] bg-white shadow-[0_24px_80px_rgba(17,34,52,0.24)] sm:max-h-[calc(100vh-48px)]"
            >
              <header className="shrink-0 border-b border-[#E8EEF3] px-4 py-4 sm:px-7 sm:py-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${
                      activeConfig.tone === "attention"
                        ? "bg-[#FDEBEC] text-[#BE3542]"
                        : "bg-[#E8F2FA] text-[#0D7377]"
                    }`}
                  >
                    {activeConfig.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="document-section-title"
                        className="text-[16px] font-bold text-[#10233C] sm:text-[18px]"
                      >
                        {activeConfig.title}
                      </h2>

                      <span className="rounded-full bg-[#E7F3F7] px-2 py-1 text-[9px] font-semibold text-[#315C76]">
                        {activeItems.length} {activeItems.length === 1 ? "Document" : "Documents"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting || !activeItems.length}
                      aria-label="Export document checklist"
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] border border-[#C8D7DF] bg-white px-3 text-[10px] font-semibold text-[#315C76] transition-colors hover:border-[#AFDBDB] hover:bg-[#F1F8F8] hover:text-[#0D7377] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#AFDBDB] border-t-[#0D7377]" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          <span className="hidden md:block">Export</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={closeModal}
                      aria-label="Close document list"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[#526579] transition-colors hover:bg-[#F0F4F7] hover:text-[#10233C]"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <ExpandableTooltip
                    icon={<Info size={12} />}
                    title={activeConfig.tooltipTitle}
                    message={activeConfig.tooltipMessage}
                    defaultOpen={true}
                  />
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#FBFCFE] px-4 py-5 sm:px-7 sm:py-7">
                {activeItems.length ? (
                  <>
                    {/* Desktop / tablet document grid */}
                    <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                      {activeItems.map(renderDocumentCard)}
                    </div>

                    {/* Mobile compact document grid */}
                    <div className="sm:hidden">
                      <div className="grid grid-cols-3 gap-2.5">
                        {activeItems.map(renderMobileDocumentTile)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F6F0] text-[#167056]">
                      <CheckCircle2 size={22} />
                    </div>

                    {selectedSection === "needs_attention" ? (
                      <>
                        <p className="mt-3 text-[13px] font-bold text-[#10233C]">
                          All documents are up to date
                        </p>

                        <p className="mt-1 max-w-[360px] text-[11px] leading-[1.5] text-[#607487]">
                          There are currently no expired or soon-to-expire documents requiring
                          action.
                        </p>
                      </>
                    ) : selectedSection === "post_appointment" ? (
                      <>
                        <p className="mt-3 text-[13px] font-bold text-[#10233C]">
                          No documents to prepare yet
                        </p>

                        <p className="mt-1 max-w-[360px] text-[11px] leading-[1.5] text-[#607487]">
                          Your post-appointment interview documents will appear here when
                          applicable.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-[13px] font-bold text-[#10233C]">
                          No CEAC documents found
                        </p>

                        <p className="mt-1 max-w-[360px] text-[11px] leading-[1.5] text-[#607487]">
                          There are currently no CEAC documents in this checklist.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 flex-col gap-3 border-t border-[#E8EEF3] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-2 text-[9px] font-medium tracking-[0.04em] text-[#526579]">
                  <ShieldAlert size={13} className="text-[#0D7377]" />
                  256-bit encrypted document vault
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 rounded-[7px] border border-[#BFCBD5] bg-white px-5 text-[10px] font-semibold text-[#354B5F] transition-colors hover:bg-[#F1F5F8]"
                >
                  Close
                </button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {modalType === "upload" && selectedDocument && (
        <DocumentUploadModal
          open={true}
          onClose={returnToSection}
          documentDef={getUploadDocumentDefinition(selectedDocument)}
          activeJourneyId={journeyId}
          onUploadComplete={handleUploadSuccess}
        />
      )}
    </>
  );
}
