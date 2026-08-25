import React, { useState, useEffect } from "react";

// Shared hook to lock body scroll when a modal is open
function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#f8fafc] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-5 md:p-8 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-serif text-[1.6rem] md:text-[2rem] text-[#0c1b33] mb-1 pr-10">Add new evidence entries</div>
        <div className="text-[14px] text-[#6b8097] mb-4 md:mb-6">A future-friendly evidence log.</div>
        <div className="font-bold text-[12px] text-[#6b8097] mb-2 uppercase tracking-wide">
          Quick Note
        </div>
        <textarea
          className="w-full min-h-[90px] rounded-xl border border-[#d0e4f7] bg-white text-[14px] text-[#3a4f63] p-3 mb-2 focus:outline-none focus:border-[#2f6fd4]"
          placeholder="Example: Saved travel itinerary from July visit, added new photos, and uploaded flight confirmation."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="text-[12px] text-[#6b8097] mb-4 md:mb-6">
          This note stays in Rahvana so you can keep an organized record of new evidence while the
          case is pending.
        </div>
        <button
          className="w-full sm:w-auto bg-[#2f6fd4] hover:bg-[#174ea6] text-white font-semibold rounded-xl px-6 py-3 text-[15px]"
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
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#f8fafc] rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-5 md:p-8 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-serif text-[1.4rem] md:text-[1.5rem] text-[#0c1b33] mb-1 pr-10">After I-130 approval</div>
        <div className="text-[12px] md:text-[13px] text-[#6b8097] mb-3">
          A focused preview of what often comes after USCIS approval.
        </div>
        <div className="text-[13px] md:text-[14px] text-[#3a4f63] leading-[1.7]">
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
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#f8fafc] rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-5 md:p-8 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-serif text-[1.4rem] md:text-[1.5rem] text-[#0c1b33] mb-1 pr-10">
          Relationship evidence builder
        </div>
        <div className="text-[12px] md:text-[13px] text-[#6b8097] mb-3">
          Use the waiting period to keep your records current.
        </div>
        <div className="text-[13px] md:text-[14px] text-[#3a4f63] leading-[1.7]">
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
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#f8fafc] rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-5 md:p-8 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-serif text-[1.4rem] md:text-[1.5rem] text-[#0c1b33] mb-1 pr-10">
          Affidavit-of-support preview
        </div>
        <div className="text-[12px] md:text-[13px] text-[#6b8097] mb-3">
          Prepare early without overwhelming yourself.
        </div>
        <div className="text-[13px] md:text-[14px] text-[#3a4f63] leading-[1.7]">
          While this is not the stage to file the I-864, it is smart to use the quiet time to
          understand sponsor strategy, household size, income questions, and what documentation may
          later be needed.
        </div>
      </div>
    </div>
  );
}

export function ProcessingTimeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#f8fafc] rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-5 md:p-8 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-serif text-[1.4rem] md:text-[1.5rem] text-[#0c1b33] mb-1 pr-10">Processing-time context</div>
        <div className="text-[12px] text-[#6b8097] mb-3">
          Use this to keep expectations grounded.
        </div>
        <div className="text-[13px] text-[#3a4f63] leading-[1.7]">
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
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#f8fafc] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-5 md:p-8 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#e8f1fb] border border-[#d0e4f7] text-[#3a4f63] hover:bg-[#d0e4f7]"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="font-serif text-[1.4rem] md:text-[1.5rem] text-[#0c1b33] mb-1 pr-10">Common next milestones</div>
        <div className="text-[13px] md:text-[14px] text-[#6b8097] mb-3">
          These are the most common next milestones.
        </div>
        <div className="relative flex flex-col gap-6 mt-2">
          {/* Timeline items */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="mt-1.5">
              <span className="block w-4 h-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#0c1b33] mb-0.5">
                USCIS continues review
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                The case remains pending while USCIS reviews the filing and supporting evidence.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="mt-1.5">
              <span className="block w-4 h-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#0c1b33] mb-0.5">
                Possible Request for Evidence
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                If USCIS needs more material, it may issue an RFE asking for specific evidence or
                clarification.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="mt-1.5">
              <span className="block w-4 h-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#0c1b33] mb-0.5">
                Petition approval
              </div>
              <div className="text-[12px] text-[#3a4f63]">
                If approved, the I-130 stage closes and the case moves toward the National Visa
                Center.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="mt-1.5">
              <span className="block w-4 h-4 rounded-full border-4 border-[#2f6fd4] bg-white" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#0c1b33] mb-0.5">
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
