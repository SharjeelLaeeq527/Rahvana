import React, { useState, useEffect } from "react";

// Shared hook to lock body scroll when a modal is open
function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
}

export function AddEvidenceNoteModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave?: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#f8fafc] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d0e4f7] bg-[#e8f1fb] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="mb-1 pr-10 font-serif text-[1.6rem] text-[#0c1b33] md:text-[2rem]">
          Add new evidence entries
        </div>
        <div className="mb-4 text-[14px] text-[#6b8097] md:mb-6">
          A future-friendly evidence log.
        </div>
        <div className="mb-2 text-[12px] font-bold tracking-wide text-[#6b8097] uppercase">
          Quick Note
        </div>
        <textarea
          className="mb-2 min-h-[90px] w-full rounded-xl border border-[#d0e4f7] bg-white p-3 text-[14px] text-[#3a4f63] focus:border-[#2f6fd4] focus:outline-none"
          placeholder="Example: Saved travel itinerary from July visit, added new photos, and uploaded flight confirmation."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mb-4 text-[12px] text-[#6b8097] md:mb-6">
          This note stays in Rahvana so you can keep an organized record of new evidence while the
          case is pending.
        </div>
        <button
          className="w-full rounded-xl bg-[#2f6fd4] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#174ea6] sm:w-auto"
          onClick={() => {
            if (onSave) onSave(note);
            setNote("");
            onClose();
          }}
        >
          Save note
        </button>
      </div>
    </div>
  );
}
export function AfterI130ApprovalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#f8fafc] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d0e4f7] bg-[#e8f1fb] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="mb-1 pr-10 font-serif text-[1.4rem] text-[#0c1b33] md:text-[1.5rem]">
          After I-130 approval
        </div>
        <div className="mb-3 text-[12px] text-[#6b8097] md:text-[13px]">
          A focused preview of what often comes after USCIS approval.
        </div>
        <div className="text-[13px] leading-[1.7] text-[#3a4f63] md:text-[14px]">
          After USCIS approval, the case generally shifts toward the National Visa Center. That
          means new fees, DS-260, affidavit-of-support planning, and civil-document workflow. This
          preview helps you understand what often comes next so the transition feels less sudden.
        </div>
      </div>
    </div>
  );
}

export function RelationshipEvidenceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#f8fafc] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d0e4f7] bg-[#e8f1fb] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="mb-1 pr-10 font-serif text-[1.4rem] text-[#0c1b33] md:text-[1.5rem]">
          Relationship evidence builder
        </div>
        <div className="mb-3 text-[12px] text-[#6b8097] md:text-[13px]">
          Use the waiting period to keep your records current.
        </div>
        <div className="text-[13px] leading-[1.7] text-[#3a4f63] md:text-[14px]">
          Save ongoing photos, travel records, chat logs, call summaries, visit notes, and other
          proof that shows the relationship continuing naturally over time.
        </div>
      </div>
    </div>
  );
}

export function AffidavitSupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#f8fafc] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d0e4f7] bg-[#e8f1fb] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="mb-1 pr-10 font-serif text-[1.4rem] text-[#0c1b33] md:text-[1.5rem]">
          Affidavit-of-support preview
        </div>
        <div className="mb-3 text-[12px] text-[#6b8097] md:text-[13px]">
          Prepare early without overwhelming yourself.
        </div>
        <div className="text-[13px] leading-[1.7] text-[#3a4f63] md:text-[14px]">
          While this is not the stage to file the I-864, it is smart to use the quiet time to
          understand sponsor strategy, household size, income questions, and what documentation may
          later be needed.
        </div>
        <div className="mt-5 flex flex-col items-stretch justify-between gap-3 border-t border-[#e2e8f0] pt-4 sm:flex-row sm:items-center">
          <div className="text-[12px] text-[#6b8097]">
            Check whether you meet income guidelines or need a joint sponsor.
          </div>
          <a
            href="/affidavit-support-calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/80 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap text-white shadow-sm transition"
          >
            Open Sponsorship Calculator
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export function ProcessingTimeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#f8fafc] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d0e4f7] bg-[#e8f1fb] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="mb-1 pr-10 font-serif text-[1.4rem] text-[#0c1b33] md:text-[1.5rem]">
          Processing-time context
        </div>
        <div className="mb-3 text-[12px] text-[#6b8097]">
          Use this to keep expectations grounded.
        </div>
        <div className="text-[13px] leading-[1.7] text-[#3a4f63]">
          USCIS processing-time tools can help you see whether your case still appears to be within
          normal timing for this form and office. A quiet case is common, so use this as context
          rather than a reason to panic.
        </div>
      </div>
    </div>
  );
}

export function MilestonesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fadeIn relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#f8fafc] p-5 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d0e4f7] bg-[#e8f1fb] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="mb-1 pr-10 font-serif text-[1.4rem] text-[#0c1b33] md:text-[1.5rem]">
          Common next milestones
        </div>
        <div className="mb-3 text-[13px] text-[#6b8097] md:text-[14px]">
          These are the most common next milestones.
        </div>
        <div className="relative mt-2 flex flex-col gap-6">
          {/* Timeline items */}
          <div className="relative z-10 flex items-start gap-4">
            <div className="mt-1.5">
              <span className="block h-4 w-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="mb-0.5 text-[13px] font-semibold text-[#0c1b33]">
                USCIS continues review
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                The case remains pending while USCIS reviews the filing and supporting evidence.
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="mt-1.5">
              <span className="block h-4 w-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="mb-0.5 text-[13px] font-semibold text-[#0c1b33]">
                Possible Request for Evidence
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                If USCIS needs more material, it may issue an RFE asking for specific evidence or
                clarification.
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="mt-1.5">
              <span className="block h-4 w-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="mb-0.5 text-[13px] font-semibold text-[#0c1b33]">
                Petition approval
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                If approved, the I-130 stage closes and the case moves toward the National Visa
                Center.
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="mt-1.5">
              <span className="block h-4 w-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="mb-0.5 text-[13px] font-semibold text-[#0c1b33]">
                NVC case creation
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                After approval, the State Department side begins and new fees, forms, and
                civil-document steps come into play.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
