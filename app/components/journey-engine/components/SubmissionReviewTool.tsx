import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  ChevronRight,
  Check,
  AlertTriangle,
  Send,
  Calendar,
  Save,
  X,
  Lock,
} from "lucide-react";

interface SubmissionReviewToolProps {
  tool: any;
  submissionChecklistStatus: Record<number, boolean>;
  setSubmissionChecklistStatus: (status: Record<number, boolean>) => void;
  setSubmissionGuideIdx: (idx: number) => void;
  setIsSubmissionGuideOpen: (open: boolean) => void;
  submissionSaved: boolean;
  submissionDate: string;
  onSave: (data: { saved: boolean; date: string }) => void;
  guard?: () => boolean;
  isStatusLocked?: boolean;
  onLockedClick?: () => void;
}

export const SubmissionReviewTool: React.FC<SubmissionReviewToolProps> = ({
  tool,
  submissionChecklistStatus,
  setSubmissionChecklistStatus,
  setSubmissionGuideIdx,
  setIsSubmissionGuideOpen,
  submissionSaved,
  submissionDate,
  onSave,
  guard,
  isStatusLocked = false,
  onLockedClick,
}) => {
  const [localIsSubmitted, setLocalIsSubmitted] = useState<boolean | null>(
    submissionSaved ? true : null
  );
  const [localDate, setLocalDate] = useState(submissionDate);
  const [justSaved, setJustSaved] = useState(false);

  const handleToggleSubmissionCheck = (index: number) => {
    setSubmissionChecklistStatus({
      ...submissionChecklistStatus,
      [index]: !submissionChecklistStatus[index],
    });
  };

  const handleSave = () => {
    if (guard && !guard()) return;
    onSave({
      saved: localIsSubmitted === true,
      date: localDate,
    });
    setJustSaved(true);
  };

  return (
    <div className="flex flex-col mt-4">
      {/* Launcher Card (Large) */}
      <div className="relative bg-[var(--rv-ch2-module-bg)] border border-[var(--rv-ch2)]/30 rounded-[16px] overflow-hidden mb-[28px] shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[var(--rv-ch2)] via-[var(--rv-ch2-dark)] to-transparent opacity-70" />
        <div className="p-[30px_32px_26px]">
          <div className="flex items-start gap-[16px] mb-[20px]">
            <div className="w-[44px] h-[44px] rounded-[10px] bg-[var(--rv-ch2)] border border-[var(--rv-ch2)]/50 flex items-center justify-center shrink-0">
              <ExternalLink size={21} className="text-white" />
            </div>
            <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#9C8E9C] mb-[4px]">
                {tool.launch_module.eyebrow}
              </div>
              <div className="text-[clamp(18px,2.6vw,22px)] text-[#F4E6F3] leading-[1.25]">
                {tool.launch_module.heading}
              </div>
            </div>
          </div>
          <div className="h-px bg-[var(--rv-ch2)]/30 mb-[18px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px] mb-[22px]">
            {tool.launch_module.features.map((feat: string, i: number) => (
              <div
                key={i}
                className="bg-[var(--rv-ch2-feature-bg)] border border-[var(--rv-ch2)]/30 rounded-[10px] p-[10px_12px] flex items-start gap-[8px]"
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[var(--rv-ch2)] shrink-0 mt-[5px]" />
                <div className="text-[13px] text-[var(--rv-ch2-text)] leading-[1.4]">{feat}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (guard && !guard()) return;
              setSubmissionGuideIdx(0);
              setIsSubmissionGuideOpen(true);
            }}
            className="inline-flex items-center justify-center gap-[10px] w-full p-[16px_28px] bg-[var(--rv-ch2)] text-white border-none rounded-[12px] font-sans text-[15px] font-semibold cursor-pointer transition-all shadow-[0_4px_20px_rgba(82,10,80,0.25)] hover:bg-[var(--rv-ch2-dark)] hover:text-white hover:shadow-[0_8px_32px_rgba(82,10,80,0.35)]"
          >
            <span>Start Submission Guide</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Checklist and Pitfalls Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[18px]">
        {/* Final Review Checklist */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px]">
          <div className="text-[13px] font-bold tracking-wide uppercase text-[#6b8097] mb-[14px] flex items-center gap-[8px]">
            <span className="w-[8px] h-[8px] rounded-full bg-primary" />
            Final Review Checklist
          </div>
          <div className="flex flex-col gap-[8px]">
            {[
              "All required files uploaded to CEAC",
              "Correct person selected for each document",
              "Correct document type assigned to each file",
              "Certified English translations paired with originals",
              "No cropped, blurry, or unreadable scans",
              "Comments added only where genuinely needed",
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => handleToggleSubmissionCheck(i)}
                className={`flex items-start gap-[10px] p-[9px_12px] rounded-[10px] cursor-pointer transition-all border-[1.5px] ${
                  submissionChecklistStatus[i]
                    ? "bg-primary/10 border-primary/40"
                    : "border-transparent hover:bg-[#eef3fa]"
                }`}
              >
                <div
                  className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 mt-[1px] ${
                    submissionChecklistStatus[i]
                      ? "bg-primary border-primary"
                      : "bg-white border-[#d0e4f7]"
                  }`}
                >
                  {submissionChecklistStatus[i] && <Check size={10} className="text-white" />}
                </div>
                <span
                  className={`text-[13px] leading-[1.45] ${
                    submissionChecklistStatus[i] ? "text-primary" : "text-[#3a4f63]"
                  }`}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Pitfalls to Avoid */}
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px]">
          <div className="text-[13px] font-bold tracking-wide uppercase text-[#6b8097] mb-[14px] flex items-center gap-[8px]">
            <span className="w-[8px] h-[8px] rounded-full bg-[#b91c1c]" />
            Common Pitfalls to Avoid
          </div>
          <div className="flex flex-col gap-[8px]">
            {[
              "Wrong person selected, file under beneficiary vs petitioner",
              "Wrong document category, civil doc filed as financial",
              "Missing translation, uploaded original without translation",
              "Incomplete scan, page cut off or text obscured",
              "Missing financial/civil pairings, both required",
              "Unnecessary comments, clutter without purpose",
            ].map((pitfall, i) => (
              <div
                key={i}
                className="flex items-start gap-[10px] p-[9px_12px] rounded-[10px] border-[1.5px] border-[#fecaca] bg-[#fef2f2]"
              >
                <span className="text-[14px] shrink-0 mt-[1px]">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </span>
                <span className="text-[13px] leading-[1.45] text-[#3a4f63]">{pitfall}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission Status Section */}
      <div
        onClick={isStatusLocked ? onLockedClick : undefined}
        className={`relative bg-white border-[1.5px] rounded-[16px] p-[24px_22px] shadow-[0_4px_16px_rgba(15,31,56,0.04)] transition-all ${
          isStatusLocked
            ? "border-[#d0e4f7] cursor-pointer hover:border-[#f0c878] hover:shadow-[0_4px_20px_rgba(160,96,0,0.08)]"
            : "border-[#d0e4f7]"
        }`}
      >
        {/* Tier lock badge */}
        {isStatusLocked && (
          <div className={`plan-icon-badge plan-icon-badge--premium plan-icon-badge--md`}>
            <span className={`plan-icon plan-icon--premium`} />
          </div>
        )}

        <div className="flex items-center gap-[12px] mb-[20px]">
          <div
            className={`w-[40px] h-[40px] rounded-[10px] border flex items-center justify-center shrink-0 transition-opacity ${
              isStatusLocked
                ? "bg-[#e8f1fb] border-[#d0e4f7] opacity-50"
                : "bg-[#e8f1fb] border-[#d0e4f7]"
            }`}
          >
            <Send size={20} className={isStatusLocked ? "text-[#6b8097]" : "text-primary"} />
          </div>
          <div>
            <div
              className={`text-[15px] font-bold ${isStatusLocked ? "text-[#6b8097]" : "text-[#0c1b33]"}`}
            >
              Document Submission Status
            </div>
            <div className={`text-[12px] ${isStatusLocked ? "text-[#9aabb8]" : "text-[#6b8097]"}`}>
              Have you officially submitted your documents on the CEAC portal?
            </div>
          </div>
        </div>

        {/* Locked overlay — amber CTA */}
        {isStatusLocked ? (
          <div className="flex items-center gap-1 text-[12px] font-semibold text-[#a06000]">
            <Lock size={11} strokeWidth={2.2} />
            <span>Unlock to record submission status</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[18px]">
            <div className="grid grid-cols-2 gap-[10px]">
              <button
                onClick={() => {
                  setLocalIsSubmitted(true);
                  setJustSaved(false);
                }}
                className={`flex items-center justify-center gap-[8px] p-[12px] rounded-[12px] border-[1.5px] font-sans text-[14px] font-semibold transition-all ${
                  localIsSubmitted === true
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:bg-[#f8fafc]"
                }`}
              >
                <Check size={16} />
                Yes, Submitted
              </button>
              <button
                onClick={() => {
                  setLocalIsSubmitted(false);
                  setLocalDate("");
                  setJustSaved(false);
                }}
                className={`flex items-center justify-center gap-[8px] p-[12px] rounded-[12px] border-[1.5px] font-sans text-[14px] font-semibold transition-all ${
                  localIsSubmitted === false
                    ? "bg-[#fef2f2] border-[#b91c1c] text-[#b91c1c]"
                    : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:bg-[#f8fafc]"
                }`}
              >
                <X className="h-4 w-4" />
                Not Yet
              </button>
            </div>

            {localIsSubmitted === true && (
              <div className="flex flex-col gap-[10px] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[13px] font-semibold text-[#3a4f63] flex items-center gap-2">
                  <Calendar size={14} />
                  When did you submit?
                </div>
                <input
                  type="date"
                  value={localDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setLocalDate(e.target.value)}
                  className="w-full p-[12px] border-[1.5px] border-[#d0e4f7] rounded-[10px] text-[14px] outline-none focus:border-primary transition-all bg-white text-[#0c1b33]"
                />
              </div>
            )}

            <div className="mt-[6px]">
              <button
                onClick={handleSave}
                disabled={localIsSubmitted === null || (localIsSubmitted === true && !localDate)}
                className={`w-full p-[14px] rounded-[12px] font-sans text-[15px] font-semibold flex items-center justify-center gap-[9px] transition-all ${
                  localIsSubmitted === null || (localIsSubmitted === true && !localDate)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border-transparent"
                    : "bg-primary text-white cursor-pointer hover:bg-primary/90 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(47,111,212,0.2)]"
                }`}
              >
                <Save size={18} />
                {submissionSaved ? "Update Submission Info" : "Save Submission Status"}
              </button>
            </div>

            {justSaved && (
              <div className="text-center text-[11px] text-primary font-medium bg-primary/10 py-1.5 rounded-full border border-primary/30">
                Status saved successfully
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
