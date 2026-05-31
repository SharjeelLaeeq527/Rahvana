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
  <div className="flex justify-center items-center my-48">
    <div className="flex flex-col items-center gap-3 text-slate-600">
      <div className="h-10 w-10 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);

export const RapidFireNoQuestionsState = ({
  onSwitchToPrep,
  onExit,
}: RapidFireNoQuestionsStateProps) => (
  <div className="bg-linear-to-br from-slate-50 to-teal-50 site-main-py site-main-px">
    <div className="">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-4">No Questions Available</h3>
        <p className="text-slate-600 mb-6">
          No applicable questions found for rapid fire mode.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onSwitchToPrep}
            className="bg-teal-600 hover:bg-teal-700"
          >
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
      className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#0d7377]/10 text-[#0d7377] flex items-center justify-center mx-auto mb-6">
        <Zap className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
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
    <div className="bg-linear-to-br from-slate-50 to-teal-50 site-main-py site-main-px">
      <div className="">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {screen === "completed" ? "Training Complete!" : "Round Complete"}
          </h1>
          <p className="text-slate-600">
            {screen === "completed"
              ? "Your final readiness assessment"
              : `Round ${currentRound} performance summary`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-40 h-40 rounded-full border-8 border-teal-200 flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
                <div className="text-center">
                  <span className="text-4xl font-bold text-teal-700">
                    {readinessScore}%
                  </span>
                  <div className="text-sm text-teal-600 font-medium mt-1">
                    Readiness Score
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
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
              <p className="text-lg text-slate-700 font-medium">
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
              <div className="flex justify-center gap-2 mt-4">
                <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                  Questions: {shuffledQuestions.length}
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                  Time: {shuffledQuestions.length * 10}s
                </div>
              </div>
            </div>
          </div>

          {!isFreeTier && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-600">
                    {roundSummary?.coveredCount ??
                      questionResponses.filter((r) => r.response === "covered")
                        .length}
                  </div>
                  <div className="text-sm text-emerald-700">Covered Well</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-2xl font-bold text-amber-600">
                    {roundSummary?.partialCount ??
                      questionResponses.filter((r) => r.response === "partial")
                        .length}
                  </div>
                  <div className="text-sm text-amber-700">Partial Coverage</div>
                </div>
                <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="text-2xl font-bold text-rose-600">
                    {roundSummary?.missedCount ??
                      questionResponses.filter((r) => r.response === "missed")
                        .length}
                  </div>
                  <div className="text-sm text-rose-700">Missed</div>
                </div>
              </div>

              {skippedQuestions > 0 && (
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                    <span className="text-slate-600">Questions skipped:</span>
                    <span className="font-bold text-slate-800">
                      {skippedQuestions}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Performance Review
                </h3>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> Click on any of the
                    color-coded tabs to review the Q&A.
                  </p>
                </div>
                <div className="flex gap-1 mb-4 mt-2">
                  {shuffledQuestions.map((_, index) => {
                    const response = questionResponses.find(
                      (r) => r.index === index,
                    );
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
                        className={`h-3 flex-1 rounded-sm cursor-pointer transition-all hover:opacity-80 ${bgColor}`}
                        onClick={() => {
                          const questionResp = questionResponses.find(
                            (r) => r.index === index,
                          );
                          if (questionResp) {
                            handleReviewQuestionClick(questionResp.question);
                          }
                        }}
                        title={`Question ${index + 1}: ${response?.response || "Unanswered"}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span>Covered Well</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                    <span>Partial Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                    <span>Missed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                    <span>Skipped</span>
                  </div>
                </div>
              </div>

              {reviewQuestion && (
                <div className="mb-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-slate-900 text-lg">
                      Question Review
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewQuestion(null)}
                    >
                      Close
                    </Button>
                  </div>
                  <div
                    className={`relative w-full h-72 cursor-pointer transition-transform duration-700 ease-out-cubic ${
                      isReviewFlipped ? "transform rotate-y-180" : ""
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "1000px",
                    }}
                    onClick={handleReviewCardClick}
                  >
                    <div className="absolute inset-0 backface-hidden bg-linear-to-br from-teal-500 to-teal-700 rounded-xl p-6 flex flex-col justify-between text-white shadow-lg border border-teal-400/30">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                            {reviewQuestion.category}
                          </span>
                          <span className="text-teal-200 text-xs bg-white/10 px-2 py-1 rounded">
                            Review Mode
                          </span>
                        </div>
                        <h3 className="text-lg font-bold leading-tight">
                          {reviewQuestion.selectedQuestion ||
                            reviewQuestion.question}
                        </h3>
                      </div>
                      <div className="text-center">
                        <p className="text-teal-100 text-sm">
                          Click to see answer and guidance
                        </p>
                        <div className="flex justify-center mt-2">
                          <div className="w-6 h-6 border-2 border-white/50 rounded-full animate-bounce flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-teal-600 to-teal-800 rounded-xl p-6 flex flex-col text-white shadow-lg border border-teal-500/30">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                          Answer & Guidance
                        </span>
                      </div>

                      <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-premium">
                        {savedAnswers[reviewQuestion.id] && (
                          <div>
                            <h4 className="text-emerald-200 font-semibold mb-2 flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-emerald-200 rounded-full"></span>
                              Your Saved Answer
                            </h4>
                            <p className="text-slate-100 text-sm leading-relaxed">
                              {savedAnswers[reviewQuestion.id]}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-teal-200 font-semibold mb-2 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-teal-200 rounded-full"></span>
                            Sample Answer
                          </h4>
                          <p className="text-slate-100 text-sm leading-relaxed">
                            {reviewQuestion.sampleAnswer}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-blue-200 font-semibold mb-2 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
                            Guidance
                          </h4>
                          <p className="text-slate-200 text-sm leading-relaxed">
                            {reviewQuestion.guidance}
                          </p>
                        </div>
                      </div>

                      <div className="text-center mt-4">
                        <p className="text-slate-300 text-xs">
                          Click to flip back
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              onClick={onExit}
              className="bg-teal-600 hover:bg-teal-700 cursor-pointer"
            >
              Continue Training Later
            </Button>
            <Button
              onClick={startNextRound}
              className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
              disabled={screen === "completed"}
            >
              Start Next Round
            </Button>
          </div>
        </div>
      </div>

      {isFreeTier && showUpgradeModal && (
        <UpgradeModal feature="rapid_fire" onClose={() => setShowUpgradeModal(false)} />
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
    <div className="bg-linear-to-br from-slate-50 to-teal-50 min-h-screen w-full">
      <div className="site-main-px py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-500" />
              Rapid Fire Mode
            </h1>
            <p className="text-slate-600">
              Round {currentRound} • Question {currentQuestionIndex + 1} of {roundQuestionCount}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right flex gap-2">
              <div className="text-slate-900 font-bold">Score</div>
              <div className="text-lg font-bold text-teal-600">{score} pts</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={getProgressGradient(progress)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-87.5 sm:h-100 lg:h-112.5 mb-8">
          <div className="w-full h-full flex items-center justify-center p-3 sm:p-4 lg:p-6">
            <div
              className={`relative w-full h-full cursor-pointer transition-transform duration-700 ease-out-cubic ${
                isFlipped ? "transform rotate-y-180" : ""
              }`}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              <div
                className={`absolute inset-0 backface-hidden bg-white rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col justify-between text-slate-900 shadow-2xl border-4 ${
                  !showAnswer
                    ? timeLeft <= 3
                      ? "border-red-500 animate-pulse"
                      : "border-emerald-500"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <span className="bg-teal-100 text-teal-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                      {currentQuestion.category}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold leading-snug text-slate-800 mb-4 sm:mb-6 line-clamp-5 sm:line-clamp-4">
                    {currentQuestion.selectedQuestion || currentQuestion.question}
                  </h2>

                  {!showAnswer && (
                    <div className="flex justify-center mt-2 sm:mt-4">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                        <div
                          className={`absolute inset-0 rounded-full ${timeLeft <= 3 ? "ring-2 ring-red-100" : "ring-2 ring-teal-100"} opacity-50`}
                        />

                        <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 176 176">
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
                              <stop offset="0%" stopColor="#0d9488" />
                              <stop offset="100%" stopColor="#0f766e" />
                            </linearGradient>
                            <linearGradient id="timerDanger" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#dc2626" />
                            </linearGradient>
                          </defs>
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-1 sm:py-2">
                            <div
                              className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${timeLeft <= 3 ? "text-red-600" : "text-teal-600"} transition-all duration-500 ${timeLeft <= 3 ? "scale-105" : ""}`}
                            >
                              {timeLeft}
                            </div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5 sm:mt-1">
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
                    <div className="inline-flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                      <span>Preparing response...</span>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs sm:text-sm">Click to see answer</p>
                  )}
                </div>
              </div>

              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-teal-600 to-teal-800 rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col text-white shadow-2xl border border-teal-500/40">
                <div className="flex justify-between items-start mb-2 sm:mb-3 pb-2 border-b border-white/10">
                  <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                    Answer & Guidance
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 scrollbar-premium">
                  <div className="space-y-3 sm:space-y-4">
                    {savedAnswers[currentQuestion.id] && (
                      <div>
                        <h4 className="text-emerald-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                          <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full" />
                          Your Saved Answer
                        </h4>
                        <p className="text-slate-100 leading-relaxed text-xs sm:text-sm line-clamp-3">
                          {savedAnswers[currentQuestion.id]}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-teal-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                        <span className="w-1.5 h-1.5 bg-teal-200 rounded-full" />
                        Sample
                      </h4>
                      <p className="text-slate-100 leading-snug text-xs sm:text-sm line-clamp-3">
                        {currentQuestion.sampleAnswer}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-blue-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                        <span className="w-1.5 h-1.5 bg-blue-200 rounded-full" />
                        Guidance
                      </h4>
                      <p className="text-slate-200 leading-snug text-xs sm:text-sm line-clamp-3">
                        {currentQuestion.guidance}
                      </p>
                    </div>

                    {currentQuestion.tooltip && (
                      <div>
                        <h4 className="text-amber-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                          <span className="w-1.5 h-1.5 bg-amber-200 rounded-full" />
                          Tip
                        </h4>
                        <p className="text-slate-300 text-xs sm:text-sm italic line-clamp-2">
                          {currentQuestion.tooltip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2 sm:mt-4">
                  <Button
                    onClick={() => onHandleResponse("covered")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "covered"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-emerald-500 hover:bg-emerald-600"
                    } min-h-8 sm:min-h-10 flex items-center justify-center text-xs gap-0`}
                  >
                    <span>Covered</span>
                    <span className="text-xs">+10</span>
                  </Button>

                  <Button
                    onClick={() => onHandleResponse("partial")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "partial"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-amber-500 hover:bg-amber-600"
                    } min-h-8 sm:min-h-10 flex items-center justify-center text-xs gap-0`}
                  >
                    <span>Partial</span>
                    <span className="text-xs">+5</span>
                  </Button>

                  <Button
                    onClick={() => onHandleResponse("missed")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "missed"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-rose-500 hover:bg-rose-600"
                    } min-h-8 sm:min-h-10 flex items-center justify-center text-xs gap-0`}
                  >
                    <span>Missed</span>
                    <span className="text-xs">+0</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          {!showAnswer ? (
            <Button onClick={onSkipQuestion} variant="outline" className="bg-white hover:bg-slate-50">
              Skip Question
            </Button>
          ) : (
            <Button
              onClick={onNextQuestion}
              className="bg-orange-600 hover:bg-orange-700"
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
