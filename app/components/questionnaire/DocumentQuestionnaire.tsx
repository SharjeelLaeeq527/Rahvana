"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2, FileText, ClipboardList } from "lucide-react";

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
  getNextUnansweredIndex,
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
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() =>
    initialAnswers ? { ...initialAnswers } : {}
  );
  const [currentIdx, setCurrentIdx] = useState(() => {
    const idx = getNextUnansweredIndex(config, initialAnswers || {});
    return idx === -1 ? 0 : idx;
  });
  const [showSummary, setShowSummary] = useState(() => {
    return initialAnswers ? isQuestionnaireComplete(config, initialAnswers) : false;
  });
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Visible questions based on current answers
  const visibleQuestions = useMemo(() => getVisibleQuestions(config, answers), [config, answers]);

  const currentQuestion = visibleQuestions[currentIdx] ?? null;
  const selectedValue = currentQuestion ? answers[currentQuestion.id] : null;
  const totalVisible = visibleQuestions.length;
  const isComplete = isQuestionnaireComplete(config, answers);

  // Computed document list for the summary screen
  const finalDocuments = useMemo(
    () => (showSummary ? computeDocumentList(config, answers) : []),
    [config, answers, showSummary]
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
    [currentQuestion]
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
    <div className="animate-in slide-in-from-bottom-[20px] fade-in fixed inset-0 z-[110] flex flex-col overflow-hidden overscroll-none bg-[#fafcff] font-sans duration-[0.28s] ease-[cubic-bezier(0.4,0,0.2,1)]">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex h-[64px] shrink-0 items-center gap-[32px] border-b border-[#e1eefc] bg-white px-[24px]">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}

        <div className="flex-1">
          <div className="bg-primary/30 h-[4px] w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="shrink-0 text-[12px] font-bold whitespace-nowrap text-slate-400">
          {showSummary ? "Summary" : `${currentIdx + 1} / ${totalVisible}`}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 flex-col items-center overflow-y-auto bg-[#fafcff] p-[48px_24px_32px]"
      >
        <div className="flex w-full max-w-[560px] flex-col items-center">
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
              <div className="text-primary mb-[14px] text-[10px] font-black tracking-widest uppercase">
                Document Checklist · Personalization
              </div>

              <h2 className="mb-[10px] text-[clamp(20px,3.5vw,26px)] leading-[1.35] font-bold text-[#0f1f38]">
                {currentQuestion.question}
              </h2>

              <p className="mb-[28px] text-[14px] leading-[1.6] text-[#3a4f63]">
                {currentQuestion.helper}
              </p>

              {/* Options */}
              <div className="mb-[24px] flex flex-col gap-[10px]">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`flex w-full items-start gap-[14px] rounded-[14px] border-[1.5px] p-[16px_20px] text-left transition-all duration-200 select-none ${
                      selectedValue === opt.value
                        ? "border-primary bg-[rgba(59,125,216,0.15)] shadow-[0_0_0_3px_rgba(59,125,216,0.12)]"
                        : "hover:border-primary border-[#d0e4f7] bg-[#fafcff] hover:bg-[rgba(59,125,216,0.05)]"
                    }`}
                  >
                    <div
                      className={`mt-px flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-[0.22s] ${
                        selectedValue === opt.value
                          ? "border-primary bg-primary"
                          : "border-[#d0e4f7]"
                      }`}
                    >
                      {selectedValue === opt.value && (
                        <div className="animate-in zoom-in h-[8px] w-[8px] rounded-full bg-white duration-150" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-[15px] leading-[1.4] font-medium text-[#1c2b3a]">
                        {opt.label}
                      </span>
                      {opt.helper && (
                        <p className="mt-[4px] text-[12px] leading-[1.5] text-[#6b8097]">
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
                    className="flex items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-[#d0e4f7] px-[24px] py-[14px] text-[14px] font-medium text-[#3a4f63] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
                  >
                    <ArrowLeft size={16} strokeWidth={2} />
                    Back
                  </button>
                )}

                <button
                  disabled={!selectedValue}
                  onClick={handleContinue}
                  className={`flex flex-1 items-center justify-center gap-[8px] rounded-[14px] p-[16px] text-[15px] font-semibold transition-all duration-[0.2s] ${
                    selectedValue
                      ? "bg-primary hover:bg-primary/80 text-white hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(59,125,216,0.28)]"
                      : "bg-primary/30 cursor-not-allowed text-[#6b8097] opacity-50"
                  }`}
                >
                  Continue
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          ) : showSummary ? (
            /* ── Summary Screen ──────────────────────────────── */
            <div className="animate-in fade-in slide-in-from-right-[10px] w-full duration-[0.22s] ease-out">
              {/* Success Icon */}
              <div className="mx-auto mb-[22px] flex h-[68px] w-[68px] items-center justify-center rounded-full border-[2px] border-[#8ecdb8] bg-[#f0faf6] text-[#0e5c42]">
                <CheckCircle2 size={28} strokeWidth={2} />
              </div>

              <h2 className="mb-[10px] w-full text-center text-[clamp(22px,3.5vw,28px)] leading-[1.3] font-bold text-[#0f1f38]">
                Your document checklist is ready
              </h2>

              <p className="mx-auto mt-2 mb-[28px] max-w-[460px] text-center text-[14px] leading-[1.7] text-[#3a4f63]">
                Based on your answers, we&apos;ve built a personalized checklist of{" "}
                {finalDocuments.length} documents for your {config.title} application.
              </p>

              {/* Document Summary */}
              <div className="mb-[28px] rounded-[14px] border border-[#d0e4f7] bg-[#f5f7fa] p-[18px_20px]">
                <div className="mb-[12px] text-[11px] font-semibold tracking-[0.08em] text-[#6b8097] uppercase">
                  Your Personalized Document List
                </div>

                {/* Group documents */}
                {["Required Now", "Required if Applicable", "Gather Now for Later"].map(
                  (groupName) => {
                    const groupDocs = finalDocuments.filter((d) => d.group === groupName);
                    if (groupDocs.length === 0) return null;

                    return (
                      <div key={groupName} className="mb-[16px] last:mb-0">
                        <div className="mb-[8px] flex items-center gap-[8px]">
                          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#6b8097] uppercase">
                            {groupName}
                          </span>
                          <div className="h-px flex-1 bg-[#d0e4f7]" />
                        </div>
                        <div className="flex flex-col">
                          {groupDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-[10px] border-b border-[#e8f0f8] py-[10px] last:border-b-0"
                            >
                              <div className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#3a4f63]" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[14px] leading-normal font-medium text-[#1c2b3a]">
                                  {doc.name}
                                </span>
                                {!doc.required && (
                                  <span className="ml-[8px] text-[11px] font-medium whitespace-nowrap text-[#d97706]">
                                    (Optional)
                                  </span>
                                )}
                              </div>
                              <span
                                className={`shrink-0 self-center rounded-full px-[8px] py-[2px] text-[10px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase ${
                                  doc.tag === "petitioner"
                                    ? "text-primary/80 bg-[#e8f1fb]"
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
                                    : doc.tag.charAt(0).toUpperCase() + doc.tag.slice(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-[10px] sm:gap-[12px]">
                <button
                  onClick={handleConfirm}
                  className="bg-primary hover:bg-primary/80 active:scale-[0.99] flex w-full items-center justify-center gap-[6px] sm:gap-[8px] rounded-[14px] px-[12px] py-[13px] sm:p-[16px] text-[13.5px] sm:text-[15px] font-semibold leading-tight text-white transition-all duration-[0.2s] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(59,125,216,0.28)]"
                >
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" strokeWidth={2} />
                  <span>Confirm &amp; Start Gathering Documents</span>
                </button>

                <button
                  onClick={handleBack}
                  className="flex w-full items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-[#d0e4f7] bg-transparent py-[12px] sm:py-[14px] text-[13px] sm:text-[14px] font-medium text-[#3a4f63] transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
                >
                  <ArrowLeft size={14} strokeWidth={2} className="shrink-0" />
                  Review my answers
                </button>
              </div>

              {/* Disclaimer */}
              <p className="mt-[20px] text-center text-[11px] leading-[1.6] text-[#6b8097]">
                Rahvana provides structured guidance only. This is not legal advice. Consult a
                licensed immigration attorney for case-specific decisions.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
