import React, { useEffect } from "react";
import { X } from "lucide-react";
import { SafeHtml } from "../shared/SafeHTML";

export interface SubmissionStep {
  label: string;
  heading: string;
  instruction: string;
  vlabel: string;
  visual: string;
  note: string | null;
}

export const SUBMISSION_TUTORIAL_STEPS: SubmissionStep[] = [
  {
    label: "Step 1 of 8",
    heading: "Open the CEAC document area",
    instruction:
      "Sign in to CEAC and navigate to the Documents section of your case. This is where your uploaded files are organized by person and document type.",
    vlabel: "CEAC Documents",
    visual:
      '<div class="mock-card"><div class="mock-title">CEAC, Documents</div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Beneficiary Documents <span class="mock-badge-amber px-2.5 py-1 bg-[#fef8e8] text-[#8a6200] border border-[#f0d98a] rounded-full text-[11px] font-bold uppercase tracking-wider">Review</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Petitioner Documents <span class="mock-badge-amber px-2.5 py-1 bg-[#fef8e8] text-[#8a6200] border border-[#f0d98a] rounded-full text-[11px] font-bold uppercase tracking-wider">Review</span></div><div class="mock-row flex justify-between items-center py-2 text-[13px] text-[#3a4f63]">Sponsor / Financial <span class="mock-badge-amber px-2.5 py-1 bg-[#fef8e8] text-[#8a6200] border border-[#f0d98a] rounded-full text-[11px] font-bold uppercase tracking-wider">Review</span></div></div>',
    note: null,
  },
  {
    label: "Step 2 of 8",
    heading: "Review each file under the correct person",
    instruction:
      "Open each person's section. Verify that every file belongs to the right person. A beneficiary document accidentally filed under the petitioner will need to be corrected.",
    vlabel: "Person Assignment",
    visual:
      '<div class="mock-card"><div class="mock-title">Beneficiary, Uploaded Files</div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Passport Biographic Page <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Correct</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Birth Certificate <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Correct</span></div><div class="mock-row flex justify-between items-center py-2 text-[13px] text-[#3a4f63]">Police Certificate <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Correct</span></div></div>',
    note: "If a file is under the wrong person, remove and re-upload under the correct assignment before continuing.",
  },
  {
    label: "Step 3 of 8",
    heading: "Check each file against the correct document type",
    instruction:
      'Verify that each uploaded file is assigned to the matching document type/category. A Nikah Nama filed under "Police Certificate" will cause a checklist error at NVC.',
    vlabel: "Document Type Check",
    visual:
      '<div class="mock-card"><div class="mock-title">Document Type Verification</div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Marriage Certificate → Nikah Nama <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Match</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Police Certificate → PCC <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Match</span></div><div class="mt-2 text-[13px] font-semibold text-[#2f6fd4] p-3 bg-[#e8f1fb]/50 border border-[#d0e4f7] rounded-lg">Each slot must match its content exactly</div></div>',
    note: null,
  },
  {
    label: "Step 4 of 8",
    heading: "Verify readability and translation pairing",
    instruction:
      "Open each file and visually confirm it is fully legible, no cropping, no rotation, no blur. For every non-English document, confirm the certified English translation is uploaded alongside it.",
    vlabel: "Readability & Translations",
    visual:
      '<div class="mock-card"><div class="mock-title">Translation Pairing Check</div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Nikah Nama (Urdu original) <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Present</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Nikah Nama (English translation) <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Present</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Birth Certificate (Urdu) <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Present</span></div><div class="mock-row flex justify-between items-center py-2 text-[13px] text-[#3a4f63]">Birth Certificate (English) <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Present</span></div></div>',
    note: null,
  },
  {
    label: "Step 5 of 8",
    heading: "Add comments only where genuinely needed",
    instruction:
      "CEAC allows comments per document. Use them sparingly, only when a brief factual clarification helps NVC understand an unusual document. Avoid unnecessary commentary that adds noise without value.",
    vlabel: "Comments Review",
    visual:
      '<div class="mock-card"><div class="mock-title">When to add a comment</div><div style="font-size:13px;color:#3a4f63;line-height:1.6;margin-top:6px">✓ "Original NADRA MRC, bilingual document, no separate translation required"<br><br>✗ "This is my marriage certificate which shows I am married to my wife"</div></div>',
    note: "Comments are not required in most cases. Only add them when they help clarify something non-obvious.",
  },
  {
    label: "Step 6 of 8",
    heading: "Run through common mistakes before submitting",
    instruction:
      "Before finalizing, do one last check for the most common errors that cause NVC to return a case: wrong person, wrong type, missing translation, incomplete scan.",
    vlabel: "Final Catch List",
    visual:
      '<div class="mock-card"><div class="mock-title">Common Mistake Check</div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Wrong person assigned <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Checked</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Wrong document type <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Checked</span></div><div class="mock-row flex justify-between items-center py-2 border-b border-[#d0e4f7] text-[13px] text-[#3a4f63]">Missing translation <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Checked</span></div><div class="mock-row flex justify-between items-center py-2 text-[13px] text-[#3a4f63]">Unreadable scan <span class="mock-badge-green px-2.5 py-1 bg-[#e8f5ef] text-[#15744f] border border-[#a8d9be] rounded-full text-[11px] font-bold uppercase tracking-wider">Checked</span></div></div>',
    note: null,
  },
  {
    label: "Step 7 of 8",
    heading: "Submit documents to NVC",
    instruction:
      "When every file is verified, proceed to the CEAC submission action. Confirm the submission, do not close the browser tab until you receive a confirmation message.",
    vlabel: "Submit to NVC",
    visual:
      '<div class="mock-card"><div class="mock-title">Submission</div><div style="font-size:13px;color:#3a4f63;line-height:1.6;margin-top:4px;margin-bottom:12px">Confirm all documents are ready to submit to NVC for review.</div><div style="width:100%;padding:14px;background:#15744f;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;text-align:center">Submit Documents to NVC</div></div>',
    note: "Submission is not instant. Wait for the CEAC confirmation message before navigating away.",
  },
  {
    label: "Step 8 of 8",
    heading: "Return to Rahvana and mark complete",
    instruction:
      "After CEAC confirms submission, return here and use the checklist above to mark all items reviewed. Your case is now in NVC's queue for documentary review.",
    vlabel: "Complete",
    visual:
      '<div style="background:#e8f5ef;border:1px solid #a8d9be;border-radius:12px;padding:16px 18px;display:flex;align-items:flex-start;gap:12px"><div style="width:30px;height:30px;border-radius:50%;background:#15744f;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div><div><div style="font-size:13px;font-weight:600;color:#15744f;margin-bottom:3px">Documents submitted to NVC</div><div style="font-size:12px;color:#3a4f63;line-height:1.5">NVC will review your documents. Return here and proceed to the next step.</div></div></div>',
    note: null,
  },
];

export function SubmissionTutorialOverlay({
  isOpen,
  onClose,
  currentIdx,
  steps,
  onSetIdx,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentIdx: number;
  steps: SubmissionStep[];
  onSetIdx: (idx: number) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[currentIdx];

  return (
    <div className="fixed inset-0 bg-[#fafcff] z-[200] flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans bg-white">
      {/* Topbar */}
      <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-[#d0e4f7] transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-[0.4s] ease-out"
            style={{
              width: `${(currentIdx / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {currentIdx + 1} / {steps.length}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center bg-white">
        <div className="w-full max-w-[580px] flex flex-col">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-primary mb-3.5">
            Submission Guide · {currentStep.label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
            {currentStep.heading}
          </h2>
          <SafeHtml
  className="text-[14px] text-[#3a4f63] leading-[1.7] mb-[18px]"
  html={currentStep.instruction}
/>

          {/* Screenshot / Visual Mockup */}
          <div className="w-full bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
            <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-[6px]">
              <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
              <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
              <div className="ml-auto text-[10px] font-bold text-[#6b8097] tracking-wider uppercase">
                {currentStep.vlabel}
              </div>
            </div>
            <SafeHtml
  className="p-[18px] bg-white transition-all min-h-[140px] flex flex-col justify-center"
  html={currentStep.visual}
/>
          </div>

          {/* Note Block */}
          {currentStep.note && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] mb-5">
              <div className="text-[13px] text-[#8a6200] leading-[1.55]">
                <strong className="font-bold">Important:</strong> {currentStep.note}
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="flex gap-[10px] items-center mt-auto">
            {currentIdx > 0 && (
              <button
                onClick={() => onSetIdx(currentIdx - 1)}
                className="p-[12px_20px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#0c1b33] flex items-center gap-2"
              >
                ← Back
              </button>
            )}
            {currentIdx < steps.length - 1 ? (
              <button
                onClick={() => onSetIdx(currentIdx + 1)}
                className="flex-1 p-[12px_20px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-bold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px text-center flex items-center justify-center gap-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 p-[12px_20px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-bold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center flex items-center justify-center gap-2"
              >
                Done, return to step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
