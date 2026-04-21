"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ClipboardList,
} from "lucide-react";

import type {
  QuestionnaireConfig,
  QuestionnaireAnswers,
  QuestionnaireResult,
  ConditionalDocument,
} from "@/lib/questionnaire/types";
import {
  getVisibleQuestions,
  isQuestionnaireComplete,
  buildQuestionnaireResult,
  computeDocumentList,
} from "@/lib/questionnaire/engine";

// ────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────
interface DocumentQuestionnaireProps {
  /** The questionnaire configuration (questions, rules, base docs) */
  config: QuestionnaireConfig;
  /** Pre-populated answers derived from earlier steps (e.g. Step 1 eligibility quest) */
  initialAnswers?: QuestionnaireAnswers;
  /** Called when user finishes the questionnaire */
  onComplete: (result: QuestionnaireResult) => void;
  /** Called when user dismisses (X button). Optional. */
  onDismiss?: () => void;
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────
export function DocumentQuestionnaire({
  config,
  initialAnswers,
  onComplete,
  onDismiss,
}: DocumentQuestionnaireProps) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(
    () => initialAnswers ? { ...initialAnswers } : {},
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Visible questions based on current answers
  const visibleQuestions = useMemo(
    () => getVisibleQuestions(config, answers),
    [config, answers],
  );

  const currentQuestion = visibleQuestions[currentIdx] ?? null;
  const selectedValue = currentQuestion ? answers[currentQuestion.id] : null;
  const totalVisible = visibleQuestions.length;
  const isComplete = isQuestionnaireComplete(config, answers);

  // Computed document list for the summary screen
  const finalDocuments = useMemo(
    () => (showSummary ? computeDocumentList(config, answers) : []),
    [config, answers, showSummary],
  );

  // Progress bar width
  const progressWidth = showSummary
    ? 100
    : totalVisible > 0
      ? Math.round(((currentIdx + 1) / totalVisible) * 100)
      : 0;

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Lock body scroll when questionnaire is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Scroll content to top on question change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIdx, showSummary]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSelectOption = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion],
  );

  const handleContinue = useCallback(() => {
    if (!selectedValue) return;

    // Recalculate visible questions after this answer (branching may change)
    const updatedVisible = getVisibleQuestions(config, answers);
    const nextIdx = currentIdx + 1;

    if (nextIdx < updatedVisible.length) {
      setDirection("forward");
      setCurrentIdx(nextIdx);
    } else {
      // All visible questions answered → show summary
      setDirection("forward");
      setShowSummary(true);
    }
  }, [selectedValue, config, answers, currentIdx]);

  const handleBack = useCallback(() => {
    if (showSummary) {
      setShowSummary(false);
      setDirection("backward");
      return;
    }
    if (currentIdx > 0) {
      setDirection("backward");
      setCurrentIdx(currentIdx - 1);
    }
  }, [showSummary, currentIdx]);

  const handleConfirm = useCallback(() => {
    const result = buildQuestionnaireResult(config, answers);
    onComplete(result);
  }, [config, answers, onComplete]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[110] bg-[#fafcff] flex flex-col font-sans overflow-hidden overscroll-none animate-in slide-in-from-bottom-[20px] fade-in duration-[0.28s] ease-[cubic-bezier(0.4,0,0.2,1)]">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="h-[64px] border-b border-[#e1eefc] bg-white flex items-center px-[24px] shrink-0 gap-[32px]">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-slate-50 text-slate-400 hover:text-slate-600"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}

        <div className="flex-1">
          <div className="h-[4px] w-full bg-primary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="text-[12px] font-bold text-slate-400 whitespace-nowrap shrink-0">
          {showSummary ? "Summary" : `${currentIdx + 1} / ${totalVisible}`}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto flex flex-col items-center bg-[#fafcff] p-[48px_24px_32px]"
      >
        <div className="w-full max-w-[560px] flex flex-col items-center">
          {!showSummary && currentQuestion ? (
            /* ── Question Screen ─────────────────────────────── */
            <div
              key={currentQuestion.id}
              className={`w-full ${
                direction === "forward"
                  ? "animate-in fade-in slide-in-from-right-[10px] duration-[0.22s] ease-out"
                  : "animate-in fade-in slide-in-from-left-[10px] duration-[0.22s] ease-out"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-[14px]">
                Document Checklist · Personalization
              </div>

              <h2 className="text-[clamp(20px,3.5vw,26px)] text-[#0f1f38] mb-[10px] leading-[1.35] font-bold">
                {currentQuestion.question}
              </h2>

              <p className="text-[#3a4f63] text-[14px] leading-[1.6] mb-[28px]">
                {currentQuestion.helper}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-[10px] mb-[24px]">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full p-[16px_20px] rounded-[14px] border-[1.5px] text-left transition-all duration-200 flex items-start gap-[14px] select-none
                      ${
                        selectedValue === opt.value
                          ? "border-primary bg-[rgba(59,125,216,0.15)] shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"
                          : "border-[#d0e4f7] bg-[#fafcff] hover:border-primary hover:bg-[rgba(59,125,216,0.05)]"
                      }`}
                  >
                    <div
                      className={`w-[20px] h-[20px] mt-px rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-[0.22s] ${
                        selectedValue === opt.value
                          ? "border-primary bg-primary"
                          : "border-[#d0e4f7]"
                      }`}
                    >
                      {selectedValue === opt.value && (
                        <div className="w-[8px] h-[8px] rounded-full bg-white animate-in zoom-in duration-150" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-[15px] font-medium text-[#1c2b3a] leading-[1.4]">
                        {opt.label}
                      </span>
                      {opt.helper && (
                        <p className="text-[12px] text-[#6b8097] mt-[4px] leading-[1.5]">
                          {opt.helper}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-[12px]">
                {currentIdx > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center gap-[6px] px-[24px] py-[14px] rounded-[14px] border-[1.5px] border-[#d0e4f7] text-[#3a4f63] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#1c2b3a] transition-all"
                  >
                    <ArrowLeft size={16} strokeWidth={2} />
                    Back
                  </button>
                )}

                <button
                  disabled={!selectedValue}
                  onClick={handleContinue}
                  className={`flex-1 p-[16px] rounded-[14px] font-semibold text-[15px] transition-all duration-[0.2s] flex items-center justify-center gap-[8px] ${
                    selectedValue
                      ? "bg-primary text-white hover:bg-primary/80 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(59,125,216,0.28)]"
                      : "bg-primary/30 text-[#6b8097] cursor-not-allowed opacity-50"
                  }`}
                >
                  Continue
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          ) : showSummary ? (
            /* ── Summary Screen ──────────────────────────────── */
            <div className="w-full animate-in fade-in slide-in-from-right-[10px] duration-[0.22s] ease-out">
              {/* Success Icon */}
              <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center mx-auto mb-[22px] border-[2px] bg-[#f0faf6] border-[#8ecdb8] text-[#0e5c42]">
                <CheckCircle2 size={28} strokeWidth={2} />
              </div>

              <h2 className="text-[clamp(22px,3.5vw,28px)] text-[#0f1f38] mb-[10px] leading-[1.3] text-center w-full font-bold">
                Your document checklist is ready
              </h2>

              <p className="text-[14px] text-[#3a4f63] mt-2 mb-[28px] text-center max-w-[460px] mx-auto leading-[1.7]">
                Based on your answers, we&apos;ve built a personalized checklist
                of {finalDocuments.length} documents for your IR-1 petition.
              </p>

              {/* Document Summary */}
              <div className="bg-[#f5f7fa] border border-[#d0e4f7] rounded-[14px] p-[18px_20px] mb-[28px]">
                <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6b8097] mb-[12px]">
                  Your Personalized Document List
                </div>

                {/* Group documents */}
                {[
                  "Required Now",
                  "Required if Applicable",
                  "Gather Now for Later",
                ].map((groupName) => {
                  const groupDocs = finalDocuments.filter(
                    (d) => d.group === groupName,
                  );
                  if (groupDocs.length === 0) return null;

                  return (
                    <div key={groupName} className="mb-[16px] last:mb-0">
                      <div className="flex items-center gap-[8px] mb-[8px]">
                        <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#6b8097]">
                          {groupName}
                        </span>
                        <div className="h-px flex-1 bg-[#d0e4f7]" />
                      </div>
                      <div className="flex flex-col">
                        {groupDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-start gap-[10px] py-[8px] border-b border-[#e8f0f8] last:border-b-0"
                          >
                            <div className="mt-[12px] w-[5px] h-[5px] shrink-0 rounded-full bg-[#3a4f63]" />
                            <div className="flex-1">
                              <span className="text-[14px] text-[#1c2b3a] font-medium leading-normal">
                                {doc.name}
                              </span>
                              {!doc.required && (
                                <span className="ml-[8px] text-[11px] text-[#d97706] font-medium">
                                  Optional
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-[0.04em] px-[8px] py-[2px] rounded-full ${
                                doc.tag === "petitioner"
                                  ? "bg-[#e8f1fb] text-primary/80"
                                  : doc.tag === "beneficiary"
                                    ? "bg-[#eaf7f2] text-[#1a7a5e]"
                                    : doc.tag === "joint_sponsor"
                                      ? "bg-[#fef8e8] text-[#8a6200]"
                                      : "bg-[#f3f0fb] text-[#4a2d80]"
                              }`}
                            >
                              {doc.tag === "third party"
                                ? "3rd Party"
                                : doc.tag === "joint_sponsor"
                                  ? "Joint Sponsor"
                                  : doc.tag.charAt(0).toUpperCase() +
                                    doc.tag.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-[12px]">
                <button
                  onClick={handleConfirm}
                  className="w-full p-[16px] rounded-[14px] font-semibold text-[15px] bg-primary text-white hover:bg-primary/80 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(59,125,216,0.28)] transition-all duration-[0.2s] flex items-center justify-center gap-[8px]"
                >
                  <ClipboardList size={18} strokeWidth={2} />
                  Confirm &amp; Start Gathering Documents
                </button>

                <button
                  onClick={handleBack}
                  className="w-full py-[14px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[14px] font-medium text-[14px] hover:border-[#3a4f63] hover:text-[#1c2b3a] transition-all flex items-center justify-center gap-[6px]"
                >
                  <ArrowLeft size={14} strokeWidth={2} />
                  Review my answers
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-[#6b8097] leading-[1.6] text-center mt-[20px]">
                Rahvana provides structured guidance only. This is not legal
                advice. Consult a licensed immigration attorney for
                case-specific decisions.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
