"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Clipboard, HelpCircle, ArrowRight, Sparkles } from "lucide-react";

interface InterviewOutcomeToolProps {
  tool: any;
  state: any;
  actions: any;
  guard?: () => boolean;
}

export const InterviewOutcomeTool: React.FC<InterviewOutcomeToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>(
    state.metadata?.interviewOutcome || "",
  );
  const [selectedSubtype, setSelectedSubtype] = useState<string>(
    state.metadata?.outcome221gSubtype || "",
  );
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const handleOutcomeSelect = (outcomeId: string) => {
    if (guard && !guard()) return;
    setSelectedOutcome(outcomeId);
    if (outcomeId !== "221g") {
      setSelectedSubtype("");
    }
    if (outcomeId !== "not_sure") {
      setShowRecommendation(false);
      setQuestionAnswers({});
      setCurrentQuestionIdx(0);
    }
    // Update metadata immediately if not 221g or not_sure
    if (outcomeId !== "not_sure" && outcomeId !== "221g") {
      actions.updateMetadata({ interviewOutcome: outcomeId, outcome221gSubtype: null });
    } else if (outcomeId === "221g") {
      actions.updateMetadata({ interviewOutcome: outcomeId });
    }
  };

  const handleSubtypeSelect = (subtypeId: string) => {
    if (guard && !guard()) return;
    setSelectedSubtype(subtypeId);
    actions.updateMetadata({ outcome221gSubtype: subtypeId });
  };

  const handleQuestionAnswer = (questionId: string, value: string) => {
    setQuestionAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < (tool.clarification_questions?.length || 0) - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setShowRecommendation(true);
    }
  };

  const prevQuestion = () => {
    setCurrentQuestionIdx((prev) => Math.max(0, prev - 1));
  };

  const getRecommendation = () => {
    const { received_letter, docs_asked, passport_kept, ceac_status } = questionAnswers;

    if (ceac_status === "issued") return { outcome: "approved", label: "Approved", description: "Your CEAC status shows 'Issued', which means your visa is approved and being printed." };
    if (received_letter === "yes" && docs_asked === "yes") return { outcome: "221g", subtype: "docs_requested", label: "221(g) - Documents Requested", description: "Since you received a letter and specific documents were requested, you are in the Document Submission phase of 221(g)." };
    if (received_letter === "yes" && docs_asked === "no") return { outcome: "221g", subtype: "further_review", label: "221(g) - Further Review", description: "You received a refusal sheet but no specific documents were requested. Your case is likely in Administrative Processing for further review." };
    if (ceac_status === "refused" && passport_kept === "returned") return { outcome: "221g", label: "Refusal / 221(g)", description: "CEAC shows 'Refused' and your passport was returned. This is the standard status for 221(g) cases while they are pending." };
    
    return { outcome: "221g", label: "221(g) / Administrative Processing", description: "Based on your answers, your case is most likely undergoing further review or 221(g) processing." };
  };

  useEffect(() => {
    if (selectedOutcome !== "approved") return;
    const end = Date.now() + 2200;
    const colors = ["#15744f", "#6aa8f0", "#f0d98a", "#a8d9be", "#ffffff"];
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [selectedOutcome]);

  const recommendation = getRecommendation();
  const currentQuestion = tool.clarification_questions?.[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / (tool.clarification_questions?.length || 1)) * 100;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[24px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4">
        <div className="text-[14px] font-bold text-[#0c1b33] mb-4">
          What was the result of your interview?
        </div>
        <div className="flex flex-col gap-3">
          {tool.outcomes?.map((outcome: any) => (
            <button
              key={outcome.id}
              onClick={() => handleOutcomeSelect(outcome.id)}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border-[1.5px] transition-all text-left ${
                selectedOutcome === outcome.id
                  ? outcome.id === "approved"
                    ? "bg-[#e8f5ef] border-[#a8d9be] shadow-[0_4px_12px_rgba(21,116,79,0.1)]"
                    : outcome.id === "221g"
                      ? "bg-[#fef8e8] border-[#f0d98a] shadow-[0_4px_12px_rgba(138,98,0,0.1)]"
                      : "bg-[#e8f1fb] border-[#d0e4f7] shadow-[0_4px_12px_rgba(47,111,212,0.1)]"
                  : "bg-white border-[#d0e4f7] hover:border-[#a0c5ea] hover:shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  outcome.id === "approved"
                    ? "bg-[#15744f]/10 text-[#15744f]"
                    : outcome.id === "221g"
                      ? "bg-[#8a6200]/10 text-[#8a6200]"
                      : "bg-[#2f6fd4]/10 text-[#2f6fd4]"
                }`}
              >
                {outcome.icon === "check-circle" && <CheckCircle2 size={20} />}
                {outcome.icon === "clipboard" && <Clipboard size={20} />}
                {outcome.icon === "help-circle" && <HelpCircle size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-bold text-[#0c1b33]">
                    {outcome.label}
                  </span>
                  {outcome.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        outcome.badgeType === "green"
                          ? "bg-[#e8f5ef] text-[#15744f]"
                          : outcome.badgeType === "amber"
                            ? "bg-[#fef8e8] text-[#8a6200]"
                            : "bg-[#e8f1fb] text-[#2f6fd4]"
                      }`}
                    >
                      {outcome.badge}
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                  {outcome.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedOutcome === "not_sure" && !showRecommendation && currentQuestion && (
        <div className="bg-[#e8f1fb] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[24px] shadow-[0_4px_24px_rgba(47,111,212,0.08)] mb-4 animate-in slide-in-from-top-2">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-[12px] font-bold text-[#2f6fd4] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#2f6fd4] text-white flex items-center justify-center text-[10px]">
                {currentQuestionIdx + 1}
              </span>
              Question {currentQuestionIdx + 1} of {tool.clarification_questions.length}
            </div>
            <div className="w-32 h-1.5 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2f6fd4] transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          {/* Question content */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="text-[15px] font-bold text-[#0c1b33] leading-tight">
                {currentQuestion.question}
              </div>
              <div className="flex flex-col gap-2">
                {currentQuestion.options.map((opt: any) => (
                  <button
                    key={opt.value}
                    onClick={() => handleQuestionAnswer(currentQuestion.id, opt.value)}
                    className={`p-4 rounded-xl text-[13.5px] font-bold border transition-all text-left flex items-center gap-3 ${
                      questionAnswers[currentQuestion.id] === opt.value
                        ? "bg-[#2f6fd4] text-white border-[#2f6fd4] shadow-md"
                        : "bg-white text-[#3a4f63] border-[#d0e4f7] hover:border-[#2f6fd4]/50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${
                      questionAnswers[currentQuestion.id] === opt.value ? "border-white" : "border-[#d0e4f7]"
                    }`}>
                      {questionAnswers[currentQuestion.id] === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/40">
            {currentQuestionIdx > 0 && (
              <button
                onClick={prevQuestion}
                className="flex-1 p-3.5 bg-white text-[#6b8097] border-[1.5px] border-[#d0e4f7] rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={nextQuestion}
              disabled={!questionAnswers[currentQuestion.id]}
              className={`p-3.5 bg-[#2f6fd4] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2f6fd4]/90 transition-all disabled:opacity-50 ${currentQuestionIdx === 0 ? 'w-full' : 'flex-1'}`}
            >
              <span>{currentQuestionIdx === (tool.clarification_questions?.length || 0) - 1 ? 'See Recommendation' : 'Next Question'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {selectedOutcome === "not_sure" && showRecommendation && (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[24px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] mb-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#e8f1fb] text-[#2f6fd4] rounded-full flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097]">Our Recommendation</div>
              <div className="text-[16px] font-bold text-[#0c1b33]">{recommendation.label}</div>
            </div>
          </div>
          <p className="text-[13px] text-[#3a4f63] leading-relaxed mb-6">
            {recommendation.description}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                handleOutcomeSelect(recommendation.outcome);
                if (recommendation.subtype) handleSubtypeSelect(recommendation.subtype);
                setShowRecommendation(false);
              }}
              className="w-full p-3.5 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Apply this outcome and continue
            </button>
            <button
              onClick={() => {
                setShowRecommendation(false);
                setQuestionAnswers({});
                setCurrentQuestionIdx(0);
              }}
              className="w-full p-3.5 bg-white text-[#6b8097] border-[1.5px] border-[#d0e4f7] rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Retake questions
            </button>
          </div>
        </div>
      )}

      {selectedOutcome === "221g" && tool.followup_221g && (
        <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-[24px] shadow-[0_4px_24px_rgba(138,98,0,0.08)] mb-4 animate-in slide-in-from-top-2">
          <div className="text-[14px] font-bold text-[#8a6200] mb-1">
            {tool.followup_221g.title}
          </div>
          <div className="text-[13px] text-[#8a6200]/80 mb-4">
            {tool.followup_221g.subtitle}
          </div>
          <div className="flex flex-col gap-2">
            {tool.followup_221g.options.map((opt: any) => (
              <button
                key={opt.id}
                onClick={() => handleSubtypeSelect(opt.id)}
                className={`p-3.5 rounded-xl border-[1.5px] transition-all text-left flex items-start gap-3 ${
                  selectedSubtype === opt.id
                    ? "bg-white border-[#8a6200] shadow-[0_2px_8px_rgba(138,98,0,0.15)]"
                    : "bg-white/60 border-[#f0d98a]/50 hover:bg-white hover:border-[#f0d98a]"
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center ${
                    selectedSubtype === opt.id
                      ? "border-[#8a6200] bg-[#8a6200]"
                      : "border-[#8a6200]/40"
                  }`}
                >
                  {selectedSubtype === opt.id && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-[#8a6200] mb-0.5 leading-tight">
                    {opt.label}
                  </div>
                  <div className="text-[12px] text-[#8a6200]/80 leading-relaxed">
                    {opt.sub}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedOutcome === "approved" && (
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#15744f] mb-1">
            Congratulations
          </div>
          <div className="text-[20px] font-bold text-[#0c1b33] leading-tight mb-2">
            Your visa has been approved!
          </div>
          <div className="text-[13px] text-[#15744f]/90 leading-relaxed">
            Your next steps have been unlocked. Head to the next step to track your passport delivery.
          </div>
        </div>
      )}

      {selectedOutcome && selectedOutcome !== "not_sure" && selectedOutcome !== "approved" && (
        <div className="bg-[#e8f5ef] border-[1.5px] border-[#a8d9be] rounded-[16px] p-5 flex items-center gap-4 animate-in fade-in duration-300">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#15744f] shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#15744f]">
              Outcome recorded
            </div>
            <div className="text-[13px] text-[#15744f]/80">
              Your next steps have been updated on your roadmap based on this result. You may now continue.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
