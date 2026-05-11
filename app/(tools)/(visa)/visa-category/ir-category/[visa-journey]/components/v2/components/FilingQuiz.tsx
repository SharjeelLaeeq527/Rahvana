import React from "react";
import { Info, Check, XCircle, HelpCircle, ArrowRight, User, ClipboardList, MessageSquare } from "lucide-react";
import { FilingQuizResult } from "../hooks/useFilingQuiz";

interface FilingQuizProps {
  showQuiz: boolean;
  quizScreenIdx: number;
  quizAnswers: Record<string, { value: string; signal: string }>;
  quizResult: FilingQuizResult | null;
  setQuizAnswers: (val: any) => void;
  onNext: () => void;
  onConfirm: (methodId: string) => void;
  onClose: () => void;
  currentStep: any;
}

export const FilingQuiz: React.FC<FilingQuizProps> = ({
  showQuiz,
  quizScreenIdx,
  quizAnswers,
  quizResult,
  setQuizAnswers,
  onNext,
  onConfirm,
  onClose,
  currentStep,
}) => {
  if (!showQuiz) return null;

  const quiz = currentStep.filing_data?.quiz;
  if (!quiz) return null;
  const screen = quiz.screens[quizScreenIdx];

  return (
    <div className="fixed inset-0 z-100 bg-[#fafcff] flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center px-4 md:px-8 py-5 border-b border-[#d0e4f7] gap-4 shrink-0 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] flex items-center justify-center transition-colors hover:bg-slate-200"
        >
          <XCircle size={18} className="text-[#3a4f63]" />
        </button>
        <div className="flex-1 h-1.5 bg-[#d0e4f7] rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
            style={{
              width: quizResult
                ? "100%"
                : `${((quizScreenIdx + 1) / quiz.screens.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center p-12">
        <div className="w-full max-w-[540px]">
          {quizResult ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
                Our Recommendation
              </div>
              <h2 className="text-3xl font-black text-[#0c1b33] mb-3 leading-tight">
                {quizResult.headline}
              </h2>
              <p className="text-[15px] text-[#3a4f63] leading-relaxed mb-8">
                {quizResult.body}
              </p>

              <div className="flex flex-col gap-3 mb-10">
                {quizResult.factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-white border border-[#d0e4f7] rounded-xl p-4 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#e8f1fb] flex items-center justify-center shrink-0 mt-0.5">
                      {f.icon === "Check" ? (
                        <Check size={12} className="text-primary" />
                      ) : f.icon === "User" ? (
                        <User size={12} className="text-primary" />
                      ) : f.icon === "ClipboardList" ? (
                        <ClipboardList size={12} className="text-primary" />
                      ) : f.icon === "MessageSquare" ? (
                        <MessageSquare size={12} className="text-primary" />
                      ) : f.icon === "XCircle" ? (
                        <XCircle size={12} className="text-red-500" />
                      ) : (
                        <HelpCircle size={12} className="text-[#6b8097]" />
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#3a4f63]">
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onConfirm("online")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 ${
                    quizResult.emphasize === "online"
                      ? "border-primary bg-[#e8f1fb] shadow-lg"
                      : "border-[#d0e4f7] bg-white hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-[#0c1b33]">File Online</h4>
                    {quizResult.emphasize === "online" && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-white px-2 py-1 rounded-full border border-primary/20">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b8097] leading-relaxed">
                    Saves $50 instantly. Receive your receipt notice immediately.
                  </p>
                </button>
                <button
                  onClick={() => onConfirm("paper")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 ${
                    quizResult.emphasize === "paper"
                      ? "border-primary bg-[#e8f1fb] shadow-lg"
                      : "border-[#d0e4f7] bg-white hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-[#0c1b33]">File by Mail</h4>
                    {quizResult.emphasize === "paper" && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-white px-2 py-1 rounded-full border border-primary/20">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b8097] leading-relaxed">
                    The traditional method. Mail your physical packet to a USCIS Lockbox.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
                {screen.label}
              </div>
              <h2 className="text-3xl font-black text-[#0c1b33] mb-3 leading-tight">
                {screen.heading}
              </h2>
              <p className="text-[15px] text-[#3a4f63] leading-relaxed mb-10">
                {screen.instruction}
              </p>

              <div className="flex flex-col gap-3">
                {screen.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setQuizAnswers({
                        ...quizAnswers,
                        [screen.id]: { value: opt.id, signal: opt.signal },
                      });
                      onNext();
                    }}
                    className="w-full p-5 bg-white border border-[#d0e4f7] rounded-2xl text-left font-semibold text-[#3a4f63] transition-all hover:border-primary hover:bg-[#e8f1fb] hover:-translate-y-0.5 group flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    <ArrowRight
                      size={18}
                      className="text-primary opacity-0 group-hover:opacity-100 transition-all"
                    />
                  </button>
                ))}
              </div>

              {screen.note && (
                <div className="mt-8 flex gap-3 bg-[#fef8e8] border border-[#f0d98a] rounded-xl p-4">
                  <Info size={18} className="text-[#8a6200] shrink-0" />
                  <p className="text-xs text-[#8a6200] leading-relaxed">
                    {screen.note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
