"use client";

import React, { useEffect } from "react";
import { X, Check } from "lucide-react";
import { HOUSEHOLD_GUIDE_CONTENT } from "./HouseholdTutorialData";
import { SafeHtml } from "../shared/SafeHTML";

interface DocumentGuideProps {
  isOpen: boolean;
  onClose: () => void;
  doc: any;
  status: string;
  onMarkReviewed: () => void;
}

export const CivilDocGuideOverlay: React.FC<DocumentGuideProps> = ({
  isOpen,
  onClose,
  doc,
  status,
  onMarkReviewed,
}) => {
  const isReviewed = status === "reviewed";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      <div className="flex items-center h-[54px] sm:h-[72px] border-b border-[#d0e4f7] px-3.5 sm:px-6 gap-3 sm:gap-4 shrink-0 bg-[#fafcff]">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#3b7dd8]/10 transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div className="h-full bg-[#3b7dd8] w-full" />
        </div>
        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          Document Guide
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[#3b7dd8] mb-4">
            Step 4 · Prepare Civil Documents
          </div>
          <div className="inline-flex items-center gap-[5px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] w-fit mb-6">
            <div className="w-[6px] h-[6px] rounded-full bg-[#3b7dd8]" />
            <span className="text-[11px] font-medium text-[#3a4f63]">
              NVC / CEAC Civil Document
            </span>
          </div>

          <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-[6px] leading-[1.25]">
            {doc.title}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-[28px]">{doc.sub}</p>

          <div className="flex flex-col gap-4">
            {doc.sections?.map((section: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-[20px_22px]"
              >
                <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[10px]">
                  {section.t || section.title}
                </h3>
                <SafeHtml
  className="text-sm text-[#3a4f63] leading-[1.7]"
  html={section.c || section.htmlContent}
/>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-[10px] mt-[28px] mb-[40px]">
            <button
              onClick={() => {
                onMarkReviewed();
                onClose();
              }}
              className={`w-full p-[15px_24px] rounded-[16px] font-bold text-[15px] transition-all flex items-center justify-center gap-2
                ${
                  isReviewed
                    ? "bg-[#d0e4f7] text-[#6b8097] cursor-not-allowed opacity-80"
                    : "bg-[#15744f] text-white hover:bg-[#0e5c3c] hover:-translate-y-px"
                }
              `}
              disabled={isReviewed}
            >
              {isReviewed ? <Check size={18} strokeWidth={3} /> : null}
              {isReviewed ? "✓ Marked as reviewed" : "Mark as reviewed"}
            </button>
            <button
              onClick={onClose}
              className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[16px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#0c1b33] transition-all text-center"
            >
              ← Back to document list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FinancialDocGuideOverlay: React.FC<DocumentGuideProps> = ({
  isOpen,
  onClose,
  doc,
  status,
  onMarkReviewed,
}) => {
  const isReviewed = status === "reviewed";

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[120] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      <div className="flex items-center h-[54px] sm:h-[72px] border-b border-[#d0e4f7] px-3.5 sm:px-6 gap-3 sm:gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#e8f1fb] transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 text-[13px] font-semibold text-[#0c1b33]">
          Step 6 · Gather Financial Support Documents
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[#3b7dd8] mb-4">
            Step 6 · Financial Support Documents
          </div>
          <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-[6px] leading-[1.25]">
            {doc.title}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-[28px]">{doc.sub}</p>

          <div className="flex flex-col gap-4">
            <div className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px]">
              <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                What this is
              </h3>
              <p className="text-sm text-[#3a4f63] leading-[1.7]">{doc.guide?.intro}</p>
            </div>
            {doc.guide?.sections?.map((section: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px]"
              >
                <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                  {section.title}
                </h3>
                <SafeHtml
  as="p"
  className="text-sm text-[#3a4f63] leading-[1.7]"
  html={section.body}
/>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-[10px] mt-[28px]">
            <button
              onClick={onMarkReviewed}
              className={`w-full p-[15px_24px] bg-[#15744f] text-white rounded-[10px] font-semibold text-[15px] transition-all hover:bg-[#0e5c3c] hover:-translate-y-px disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed`}
              disabled={isReviewed}
            >
              {isReviewed ? "✓ Marked as reviewed" : "Mark as reviewed"}
            </button>
            <button
              onClick={onClose}
              className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] transition-all text-center"
            >
              ← Back to document list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HouseholdDocGuideOverlay: React.FC<DocumentGuideProps> = ({
  isOpen,
  onClose,
  doc,
  status,
  onMarkReviewed,
}) => {
  const isReviewed = status === "reviewed";

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const guide = HOUSEHOLD_GUIDE_CONTENT[doc.guideKey] || {
    intro: "Preparing proper relationship proof is essential for CEAC acceptance.",
    sections: [
      {
        title: "Requirement Summary",
        body: "Ensure the document is a clear scan of the original. Translations required if not in English.",
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-white z-[120] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans">
      <div className="flex items-center h-[54px] sm:h-[72px] border-b border-[#d0e4f7] px-3.5 sm:px-6 gap-3 sm:gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#e8f1fb] transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 text-[13px] font-semibold text-[#0c1b33]">
          Step 7 · Household Member Relationship Proof
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-[48px_24px_40px] flex flex-col items-center">
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[#4a2d8a] mb-4">
            Step 7 · Relationship Documentation
          </div>
          <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-[6px] leading-[1.25]">
            {doc.title}
          </h2>
          <p className="text-[14px] text-[#3a4f63] leading-[1.6] mb-[28px]">{doc.sub}</p>

          <div className="flex flex-col gap-4">
            <div className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px]">
              <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                What this is
              </h3>
              <p className="text-sm text-[#3a4f63] leading-[1.7]">{guide.intro}</p>
            </div>
            {guide.sections?.map((section: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[10px] p-[22px_24px]"
              >
                <h3 className="text-[13px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[12px]">
                  {section.title}
                </h3>
                <SafeHtml className="text-sm text-[#3a4f63] leading-[1.7]" html={section.body} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-[10px] mt-[28px]">
            <button
              onClick={onMarkReviewed}
              className={`w-full p-[15px_24px] bg-[#15744f] text-white rounded-[10px] font-semibold text-[15px] transition-all hover:bg-[#0e5c3c] disabled:bg-[#d0e4f7] disabled:text-[#6b8097] disabled:cursor-not-allowed`}
              disabled={isReviewed}
            >
              {isReviewed ? "✓ Marked as reviewed" : "Mark as reviewed"}
            </button>
            <button
              onClick={onClose}
              className="w-full p-[14px_24px] bg-transparent border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] transition-all text-center"
            >
              ← Back to document list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
