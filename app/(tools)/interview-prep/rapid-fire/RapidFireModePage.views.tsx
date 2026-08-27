"use client";

import type { Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import type {
  GeneratedQuestion,
  InterviewPrepQuestionResponse,
  InterviewPrepRoundSummary,
  InterviewPrepProgressScreen,
} from "@/lib/interview-prep";

interface RapidFireLoadingStateProps {
  message?: string;
}

interface RapidFireNoQuestionsStateProps {
  onSwitchToPrep: () => void;
  onExit: () => void;
}

interface RapidFireRestoringOverlayProps {
  title?: string;
  description?: string;
}

interface RapidFireResultsViewProps {
  isFreeTier: boolean;
  screen: InterviewPrepProgressScreen;
  currentRound: number;
  roundScore: number | null;
  totalScore: number | null;
  roundSummary: InterviewPrepRoundSummary | null;
  score: number;
  shuffledQuestions: GeneratedQuestion[];
  skippedQuestions: number;
  questionResponses: InterviewPrepQuestionResponse[];
  reviewQuestion: GeneratedQuestion | null;
  isReviewFlipped: boolean;
  savedAnswers: Record<string, string>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: Dispatch<SetStateAction<boolean>>;
  setReviewQuestion: Dispatch<SetStateAction<GeneratedQuestion | null>>;
  handleReviewQuestionClick: (question: GeneratedQuestion) => void;
  handleReviewCardClick: () => void;
  onExit: () => void;
  startNextRound: () => void;
}

interface RapidFireTrainingViewProps {
  currentRound: number;
  currentQuestionIndex: number;
  roundQuestionCount: number;
  score: number;
  progress: number;
  currentQuestion: GeneratedQuestion;
  timeLeft: number;
  showAnswer: boolean;
  isFlipped: boolean;
  userResponse: "covered" | "partial" | "missed" | "skipped" | null;
  savedAnswers: Record<string, string>;
  onHandleResponse: (response: "covered" | "partial" | "missed") => void;
  onSkipQuestion: () => void;
  onNextQuestion: () => void;
  getProgressGradient: (percent: number) => { background: string };
}

export const RapidFireLoadingState = ({
  message = "Restoring session...",
}: RapidFireLoadingStateProps) => (
  <div className="my-48 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-slate-600">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);

export const RapidFireNoQuestionsState = ({
  onSwitchToPrep,
  onExit,
}: RapidFireNoQuestionsStateProps) => (
  <div className="site-main-py site-main-px bg-linear-to-br from-slate-50 to-teal-50">
    <div className="">
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h3 className="mb-4 text-xl font-bold">No Questions Available</h3>
        <p className="mb-6 text-slate-600">No applicable questions found for rapid fire mode.</p>
        <div className="flex justify-center gap-3">
          <Button onClick={onSwitchToPrep} className="bg-teal-600 hover:bg-teal-700">
            Switch to Prep Mode
          </Button>
          <Button onClick={onExit} variant="outline">
            Exit
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export const RapidFireRestoringOverlay = ({
  title = "Restoring Rapid Fire",
  description = "Resuming your last round and restoring timer state.",
}: RapidFireRestoringOverlayProps) => (
  <div className="fixed inset-0 z-9999 flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
    />
    <motion.div
      initial={{ scale: 0.94, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]"
    >
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0d7377]/10 text-[#0d7377]">
        <Zap className="h-8 w-8" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-slate-900">{title}</h3>
      <p className="leading-relaxed text-slate-500">{description}</p>
    </motion.div>
  </div>
);

export const RapidFireResultsView = ({
  isFreeTier,
  screen,
  currentRound,
  roundScore,
  totalScore,
  roundSummary,
  score,
  shuffledQuestions,
  skippedQuestions,
  questionResponses,
  reviewQuestion,
  isReviewFlipped,
  savedAnswers,
  showUpgradeModal,
  setShowUpgradeModal,
  setReviewQuestion,
  handleReviewQuestionClick,
  handleReviewCardClick,
  onExit,
  startNextRound,
}: RapidFireResultsViewProps) => {
  const readinessScore = roundScore ?? totalScore ?? 0;

  return (
    <div className="site-main-py site-main-px bg-linear-to-br from-slate-50 to-teal-50">
      <div className="">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            {screen === "completed" ? "Training Complete!" : "Round Complete"}
          </h1>
          <p className="text-slate-600">
            {screen === "completed"
              ? "Your final readiness assessment"
              : `Round ${currentRound} performance summary`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="relative mb-6 inline-block">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-teal-200 bg-linear-to-br from-teal-50 to-teal-100">
                <div className="text-center">
                  <span className="text-4xl font-bold text-teal-700">{readinessScore}%</span>
                  <div className="mt-1 text-sm font-medium text-teal-600">Readiness Score</div>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    readinessScore >= 80
                      ? "bg-green-100 text-green-800"
                      : readinessScore >= 60
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {readinessScore >= 80
                    ? "Excellent"
                    : readinessScore >= 60
                      ? "Good"
                      : "Needs Practice"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-lg font-medium text-slate-700">
                {readinessScore >= 80
                  ? "Outstanding interview preparation!"
                  : readinessScore >= 60
                    ? "Solid foundation established!"
                    : "Keep practicing to build confidence"}
              </p>
              <p className="text-slate-500">
                You scored{" "}
                <span className="font-semibold text-teal-600">
                  {roundSummary?.earnedPoints ?? score}
                </span>{" "}
                points out of{" "}
                <span className="font-semibold">
                  {roundSummary?.possiblePoints ??
                    (shuffledQuestions.length - skippedQuestions) * 10}
                </span>{" "}
                possible
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  Questions: {shuffledQuestions.length}
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  Time: {shuffledQuestions.length * 10}s
                </div>
              </div>
            </div>
          </div>

          {!isFreeTier && (
            <>
              <div className="mb-8 grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {roundSummary?.coveredCount ??
                      questionResponses.filter((r) => r.response === "covered").length}
                  </div>
                  <div className="text-sm text-emerald-700">Covered Well</div>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {roundSummary?.partialCount ??
                      questionResponses.filter((r) => r.response === "partial").length}
                  </div>
                  <div className="text-sm text-amber-700">Partial Coverage</div>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-center">
                  <div className="text-2xl font-bold text-rose-600">
                    {roundSummary?.missedCount ??
                      questionResponses.filter((r) => r.response === "missed").length}
                  </div>
                  <div className="text-sm text-rose-700">Missed</div>
                </div>
              </div>

              {skippedQuestions > 0 && (
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <span className="text-slate-600">Questions skipped:</span>
                    <span className="font-bold text-slate-800">{skippedQuestions}</span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Performance Review</h3>
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> Click on any of the color-coded tabs
                    to review the Q&A.
                  </p>
                </div>
                <div className="mt-2 mb-4 flex gap-1">
                  {shuffledQuestions.map((_, index) => {
                    const response = questionResponses.find((r) => r.index === index);
                    let bgColor = "bg-gray-300";

                    if (response) {
                      switch (response.response) {
                        case "covered":
                          bgColor = "bg-green-500";
                          break;
                        case "partial":
                          bgColor = "bg-amber-500";
                          break;
                        case "missed":
                          bgColor = "bg-red-500";
                          break;
                        case "skipped":
                          bgColor = "bg-gray-400";
                          break;
                      }
                    }

                    return (
                      <div
                        key={index}
                        className={`h-3 flex-1 cursor-pointer rounded-sm transition-all hover:opacity-80 ${bgColor}`}
                        onClick={() => {
                          const questionResp = questionResponses.find((r) => r.index === index);
                          if (questionResp) {
                            handleReviewQuestionClick(questionResp.question);
                          }
                        }}
                        title={`Question ${index + 1}: ${response?.response || "Unanswered"}`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3 max-w-3xl mx-auto text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm bg-green-500" />
                    <span>Covered Well</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm bg-amber-500" />
                    <span>Partial Coverage</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm bg-red-500" />
                    <span>Missed</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm bg-gray-400" />
                    <span>Skipped</span>
                  </div>
                </div>
              </div>

              {reviewQuestion && (
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">Question Review</h4>
                    <Button variant="ghost" size="sm" onClick={() => setReviewQuestion(null)}>
                      Close
                    </Button>
                  </div>
                  <div
                    className={`ease-out-cubic relative h-72 w-full cursor-pointer transition-transform duration-700 ${
                      isReviewFlipped ? "rotate-y-180 transform" : ""
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "1000px",
                    }}
                    onClick={handleReviewCardClick}
                  >
                    <div className="absolute inset-0 flex flex-col justify-between rounded-xl border border-teal-400/30 bg-linear-to-br from-teal-500 to-teal-700 p-6 text-white shadow-lg backface-hidden">
                      <div>
                        <div className="mb-4 flex items-start justify-between">
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-medium backdrop-blur-sm">
                            {reviewQuestion.category}
                          </span>
                          <span className="hidden rounded-full bg-white/10 px-2 py-1 text-xs text-teal-200">
                            Review Mode
                          </span>
                        </div>
                        <h3 className="text-lg leading-tight font-bold">
                          {reviewQuestion.selectedQuestion || reviewQuestion.question}
                        </h3>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-teal-100">Click to see answer and guidance</p>
                        <div className="mt-2 flex justify-center">
                          <div className="flex h-6 w-6 animate-bounce items-center justify-center rounded-full border-2 border-white/50">
                            <div className="h-1.5 w-1.5 rounded-full bg-white/80"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex rotate-y-180 flex-col rounded-xl border border-teal-500/30 bg-linear-to-br from-teal-600 to-teal-800 p-6 text-white shadow-lg backface-hidden">
                      <div className="mb-4 flex items-start justify-between">
                        <span className="rounded bg-white/20 px-2 py-1 text-xs font-medium">
                          Answer & Guidance
                        </span>
                      </div>

                      <div className="scrollbar-premium flex-1 space-y-4 overflow-y-auto pr-2">
                        {savedAnswers[reviewQuestion.id] && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-200">
                              <span className="h-2 w-2 rounded-full bg-emerald-200"></span>
                              Your Saved Answer
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-100">
                              {savedAnswers[reviewQuestion.id]}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-200">
                            <span className="h-2 w-2 rounded-full bg-teal-200"></span>
                            Sample Answer
                          </h4>
                          <p className="text-sm leading-relaxed text-slate-100">
                            {reviewQuestion.sampleAnswer}
                          </p>
                        </div>

                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-200">
                            <span className="h-2 w-2 rounded-full bg-blue-200"></span>
                            Guidance
                          </h4>
                          <p className="text-sm leading-relaxed text-slate-200">
                            {reviewQuestion.guidance}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-xs text-slate-300">Click to flip back</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-center gap-3">
            <Button onClick={onExit} className="cursor-pointer bg-teal-600 hover:bg-teal-700">
              Continue Training Later
            </Button>
            <Button
              onClick={startNextRound}
              className="cursor-pointer bg-orange-600 hover:bg-orange-700"
              disabled={screen === "completed"}
            >
              Start Next Round
            </Button>
          </div>
        </div>
      </div>

      {isFreeTier && showUpgradeModal && (
        <UpgradeModal
          feature="rapid_fire"
          interviewMode="rapid"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

export const RapidFireTrainingView = ({
  currentRound,
  currentQuestionIndex,
  roundQuestionCount,
  score,
  progress,
  currentQuestion,
  timeLeft,
  showAnswer,
  isFlipped,
  userResponse,
  savedAnswers,
  onHandleResponse,
  onSkipQuestion,
  onNextQuestion,
  getProgressGradient,
}: RapidFireTrainingViewProps) => {
  return (
    <div className="interview-dots-bg relative min-h-screen w-full overflow-hidden bg-linear-to-br from-[#e8f6f6] via-white to-slate-50">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute top-20 -left-32 h-96 w-96 rounded-full bg-[#afdbdb]/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-32 h-80 w-80 rounded-full bg-[#cdadcc]/10 blur-3xl" />
      <div className="site-main-px relative z-10 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Zap className="h-6 w-6 text-[#0d7377]" />
              Rapid Fire Mode
            </h1>
            <p className="text-[#89a4a0]">
              Round {currentRound} • Question {currentQuestionIndex + 1} of {roundQuestionCount}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-2 text-right">
              <div className="font-semibold text-[#89a4a0]">Score</div>
              <div className="text-lg font-bold text-[#0d7377]">{score} pts</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-[#89a4a0]">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#afdbdb]/30">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                background: `linear-gradient(to right, #0d7377 ${progress}%, #afdbdb ${progress}%)`,
              }}
            />
          </div>
        </div>

        <div className="mb-8 h-87.5 overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white/90 shadow-[0_8px_30px_rgba(13,115,119,0.1)] backdrop-blur-sm sm:h-100 lg:h-112.5">
          <div className="flex h-full w-full items-center justify-center p-3 sm:p-4 lg:p-6">
            <div
              className={`ease-out-cubic relative h-full w-full cursor-pointer transition-transform duration-700 ${
                isFlipped ? "rotate-y-180 transform" : ""
              }`}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              {/* Question Side */}
              <div
                className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-3 text-slate-900 shadow-[0_8px_30px_rgba(13,115,119,0.1)] backface-hidden sm:p-4 lg:p-6 ${
                  !showAnswer
                    ? timeLeft <= 3
                      ? "animate-pulse border-2 border-[#db8090]"
                      : "border-2 border-[#afdbdb]"
                    : "border border-[rgba(13,115,119,0.08)]"
                }`}
                style={{
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #fdfbf8 35%, #faf6f0 70%, #f7f1e8 100%)",
                }}
              >
                {/* Soft radial glow */}
                <div
                  className={`pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl transition-colors duration-500 ${
                    !showAnswer && timeLeft <= 3 ? "bg-[#db8090]/12" : "bg-[#afdbdb]/15"
                  }`}
                />
                {/* Decorative watermark */}
                <div className="pointer-events-none absolute right-6 bottom-6 opacity-[0.035]">
                  <Zap className="h-28 w-28 text-[#0d7377]" strokeWidth={1} />
                </div>
                <div>
                  <div className="mb-3 flex items-start justify-between sm:mb-4">
                    <span className="rounded-full bg-[#f3ede7] px-2 py-0.5 text-xs font-semibold text-[#9c6f38] sm:px-3 sm:py-1 sm:text-sm">
                      {currentQuestion.category}
                    </span>
                  </div>
                  <h2 className="mb-4 line-clamp-5 text-lg leading-snug font-bold text-slate-800 sm:mb-6 sm:line-clamp-4 sm:text-xl lg:text-2xl">
                    {currentQuestion.selectedQuestion || currentQuestion.question}
                  </h2>

                  {!showAnswer && (
                    <div className="mt-2 flex justify-center sm:mt-4">
                      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
                        <div
                          className={`absolute inset-0 rounded-full ${timeLeft <= 3 ? "ring-2 ring-[#db8090]/30" : "ring-2 ring-[#afdbdb]/40"} opacity-50`}
                        />

                        <svg className="h-full w-full drop-shadow-sm" viewBox="0 0 176 176">
                          <circle
                            cx="88"
                            cy="88"
                            r="76"
                            fill="none"
                            stroke="url(#timerBg)"
                            strokeWidth="6"
                          />
                          <circle
                            cx="88"
                            cy="88"
                            r="76"
                            fill="none"
                            stroke={timeLeft <= 3 ? "url(#timerDanger)" : "url(#timerSuccess)"}
                            strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 76}`}
                            strokeDashoffset={`${2 * Math.PI * 76 * (1 - timeLeft / 10)}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                            transform="rotate(-90 88 88)"
                          />
                          <defs>
                            <linearGradient id="timerBg" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f1f5f9" />
                              <stop offset="100%" stopColor="#e2e8f0" />
                            </linearGradient>
                            <linearGradient id="timerSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0d7377" />
                              <stop offset="100%" stopColor="#afdbdb" />
                            </linearGradient>
                            <linearGradient id="timerDanger" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#db8090" />
                              <stop offset="100%" stopColor="#cdadcc" />
                            </linearGradient>
                          </defs>
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="rounded-xl px-2 py-1 text-center backdrop-blur-sm sm:px-4 sm:py-2">
                            <div
                              className={`text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${timeLeft <= 3 ? "text-[#db8090]" : "text-[#0d7377]"} transition-all duration-500 ${timeLeft <= 3 ? "scale-105" : ""}`}
                            >
                              {timeLeft}
                            </div>
                            <div className="mt-0.5 text-xs font-medium tracking-widest text-[#89a4a0] uppercase sm:mt-1">
                              sec
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  {!showAnswer ? (
                    <div className="inline-flex items-center gap-2 text-xs text-[#89a4a0] sm:text-sm">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-[#0d7377]" />
                      <span>Preparing response...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-[#89a4a0] sm:text-sm">Click to see answer</p>
                  )}
                </div>
              </div>

              <div className="absolute inset-0 flex rotate-y-180 flex-col rounded-2xl border border-teal-500/40 bg-linear-to-br from-teal-600 to-teal-800 p-3 text-white shadow-2xl backface-hidden sm:p-4 lg:p-6">
                <div className="mb-2 flex items-start justify-between border-b border-white/10 pb-2 sm:mb-3">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1">
                    Answer & Guidance
                  </span>
                </div>

                <div className="scrollbar-premium flex-1 overflow-y-auto pr-2 sm:pr-3">
                  <div className="space-y-3 sm:space-y-4">
                    {savedAnswers[currentQuestion.id] && (
                      <div>
                        <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-200 sm:text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                          Your Saved Answer
                        </h4>
                        <p className="line-clamp-3 text-xs leading-relaxed text-slate-100 sm:text-sm">
                          {savedAnswers[currentQuestion.id]}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-teal-200 sm:text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-200" />
                        Sample
                      </h4>
                      <p className="line-clamp-3 text-xs leading-snug text-slate-100 sm:text-sm">
                        {currentQuestion.sampleAnswer}
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-blue-200 sm:text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                        Guidance
                      </h4>
                      <p className="line-clamp-3 text-xs leading-snug text-slate-200 sm:text-sm">
                        {currentQuestion.guidance}
                      </p>
                    </div>

                    {currentQuestion.tooltip && (
                      <div>
                        <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-200 sm:text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
                          Tip
                        </h4>
                        <p className="line-clamp-2 text-xs text-slate-300 italic sm:text-sm">
                          {currentQuestion.tooltip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1 sm:mt-4 sm:gap-2">
                  <Button
                    onClick={() => onHandleResponse("covered")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "covered"
                        ? "bg-[#0d7377] hover:bg-[#14a0a6]"
                        : "bg-[#0a5a5d] hover:bg-[#0d7377]"
                    } flex min-h-8 items-center justify-center gap-0 text-xs sm:min-h-10`}
                  >
                    <span>Covered</span>
                    <span className="text-xs">+10</span>
                  </Button>

                  <Button
                    onClick={() => onHandleResponse("partial")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "partial"
                        ? "bg-[#6b5b7b] hover:bg-[#7d6d8d]"
                        : "bg-[#5a4a6a] hover:bg-[#6b5b7b]"
                    } flex min-h-8 items-center justify-center gap-0 text-xs sm:min-h-10`}
                  >
                    <span>Partial</span>
                    <span className="text-xs">+5</span>
                  </Button>

                  <Button
                    onClick={() => onHandleResponse("missed")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "missed"
                        ? "bg-[#db8090] hover:bg-[#e89aaa]"
                        : "bg-[#9e4a5a] hover:bg-[#db8090]"
                    } flex min-h-8 items-center justify-center gap-0 text-xs sm:min-h-10`}
                  >
                    <span>Missed</span>
                    <span className="text-xs">+0</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          {!showAnswer ? (
            <Button
              onClick={onSkipQuestion}
              variant="outline"
              className="border-[rgba(13,115,119,0.08)] bg-white/90 text-[#89a4a0] transition-colors duration-200 hover:bg-slate-50 hover:text-[#0d7377]"
            >
              Skip Question
            </Button>
          ) : (
            <Button
              onClick={onNextQuestion}
              className="bg-[#0d7377] shadow-[0_4px_16px_-4px_rgba(13,115,119,0.4)] transition-all duration-200 hover:bg-[#0a5a5d]"
              disabled={userResponse === null}
            >
              {currentQuestionIndex < roundQuestionCount - 1 ? "Next Question" : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
