"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { msg, E } from '@/lib/errors';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Check,
  Info,
  Loader2,
  Mic,
  Shuffle,
  X,
  Zap,
} from "lucide-react";
import { InterviewPrepOutput, GeneratedQuestion } from "@/lib/interview-prep";
import { RapidFireModePage } from "../rapid-fire/RapidFireModePage";
import { MockInterviewModePage } from "../mock/MockInterviewModePage";
import { Loader } from "@/components/ui/spinner";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { useToast } from "@/app/components/shared/ToastProvider";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { getEntitlement } from "@/lib/entitlements/config";

interface ResultPageProps {
  sessionId: string;
  results?: InterviewPrepOutput | null;
  onRestart: () => void;
}

export const ResultPage = ({
  sessionId,
  results,
  onRestart,
}: ResultPageProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] =
    useState<GeneratedQuestion | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showRapidFirePage, setShowRapidFirePage] = useState(false);
  const [showMockInterviewPage, setShowMockInterviewPage] = useState(false);

  const [questionsList, setQuestionsList] = useState<GeneratedQuestion[]>([]);
  const [mode, setMode] = useState<"prep" | "rapid" | "mock">("prep");

  // NEW: Answer management state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState<Record<string, boolean>>(
    {},
  );
  const [aiImproving, setAiImproving] = useState<Record<string, boolean>>({});
  const [improvedAnswers, setImprovedAnswers] = useState<
    Record<string, string>
  >({});
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // NEW: Track which questions have saved answers (loaded from DB)
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});

  // NEW: Toggle to show/hide sample answer in flashcard
  const [showSampleAnswerInFlashcard, setShowSampleAnswerInFlashcard] =
    useState<Record<string, boolean>>({});

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMockUpgradeModal, setShowMockUpgradeModal] = useState(false);

  const plan = usePlan();

  const canSeePrepQuestion = useCallback(
    (question: GeneratedQuestion) => {
      if (plan.tier === "free") {
        return question.tier === "free";
      }

      return true;
    },
    [plan.tier],
  );

  const canAccessRapidFire = (): boolean => {
    const entitlement = getEntitlement("interview_rapid_fire", plan.tier);
    return entitlement.state === "full";
  };

  const canAccessMockInterview = (): boolean => {
    const entitlement = getEntitlement("mock_interview", plan.tier);
    return entitlement.state === "full";
  };

  // Shuffle algorithm
  const shuffleQuestions = (
    questions: GeneratedQuestion[],
  ): GeneratedQuestion[] => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleShuffle = () => {
    if (results?.questions) {
      const applicableQuestions = results.questions.filter(
        (q: GeneratedQuestion) => q.applicable,
      );
      const visibleQuestions = applicableQuestions.filter(canSeePrepQuestion);
      const shuffled = shuffleQuestions(visibleQuestions);
      setQuestionsList(shuffled);
    }
  };

  const handleRapidFireModeClick = () => {
    if (!canAccessRapidFire()) {
      setShowUpgradeModal(true);
      return;
    }
    setMode("rapid");
  };

  const handleRapidFirePageStart = () => {
    setShowRapidFirePage(true);
  };

  const handleRapidFirePageExit = () => {
    setMode("prep");
    setShowRapidFirePage(false);
  };

  const handleMockInterviewPageStart = () => {
    if (!canAccessMockInterview()) {
      setShowMockUpgradeModal(true);
      return;
    }
    setMode("mock");
    setShowMockInterviewPage(true);
  };

  const handleMockInterviewPageExit = () => {
    setMode("prep");
    setShowMockInterviewPage(false);
  };

  const handleSwitchToPrep = () => {
    setMode("prep");
    setShowRapidFirePage(false);
    setShowMockInterviewPage(false);
  };

  const loadAnswers = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/interview-prep/user-answers?sessionId=${sessionId}`,
      );
      const data = await response.json();

      if (data.success && data.answers) {
        const answersMap: Record<string, string> = {};
        data.answers.forEach(
          (answer: {
            question_id: string;
            user_answer_text?: string | null;
          }) => {
            answersMap[answer.question_id] = answer.user_answer_text || "";
          },
        );
        setSavedAnswers(answersMap);
        setUserAnswers(answersMap);
      }
    } catch (error: unknown) {
      console.error("Error loading answers:", error);
      showToast(msg(E.TOOL_INTERVIEW_SESSION_FAILED), "error");
    }
  }, [sessionId]);

  useEffect(() => {
    if (results === undefined || results === null) {
      setError(msg(E.TOOL_INTERVIEW_NO_SESSION));
      setLoading(false);
    } else if (results?.questions) {
      // Initialize with original order
      const applicableQuestions = results.questions.filter(
        (q: GeneratedQuestion) => q.applicable,
      );
      setQuestionsList(
        applicableQuestions.filter(canSeePrepQuestion),
      );
      // Load existing answers
      if (sessionId) {
        loadAnswers();
      }
    }
  }, [canSeePrepQuestion, results, sessionId, loadAnswers]);

  // NEW: Save answer to database
  const handleSaveAnswer = async (questionId: string) => {
    const answerText = userAnswers[questionId];

    if (!answerText || answerText.trim().length < 10) {
      showToast(msg(E.INTERVIEW_ANSWER_TOO_SHORT), "error");
      return;
    }

    setSavingAnswers((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch("/api/interview-prep/user-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId,
          userAnswerText: answerText,
        }),
      });

      if (!response.ok) throw new Error(msg(E.TOOL_INTERVIEW_SAVE_FAILED));

      // Update savedAnswers to reflect the newly saved answer
      setSavedAnswers((prev) => ({
        ...prev,
        [questionId]: answerText,
      }));

      showToast("Answer saved successfully!", "success");
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : msg(E.TOOL_INTERVIEW_SAVE_FAILED),
        "error",
      );
    } finally {
      setSavingAnswers((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // NEW: Get AI improvement suggestion
  const handleImproveAnswer = async (
    questionId: string,
    question: string,
    type: "clarity" | "professional" | "complete" = "clarity",
  ) => {
    const answerText = userAnswers[questionId];

    if (!answerText) {
      showToast(msg(E.INTERVIEW_ANSWER_TOO_SHORT), "error");
      return;
    }

    setAiImproving((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch("/api/interview-prep/ai-improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId,
          userAnswer: answerText,
          question,
          improvementType: type,
        }),
      });

      if (!response.ok) throw new Error(msg(E.TOOL_INTERVIEW_IMPROVE_FAILED));

      const data = await response.json();
      setImprovedAnswers((prev) => ({
        ...prev,
        [questionId]: data.improvedAnswer,
      }));
      showToast("Answer improved successfully!", "success");
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : msg(E.TOOL_INTERVIEW_IMPROVE_FAILED),
        "error",
      );
    } finally {
      setAiImproving((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // NEW: Accept AI improvement
  const acceptImprovement = (questionId: string) => {
    const improved = improvedAnswers[questionId];
    if (improved) {
      setUserAnswers((prev) => ({ ...prev, [questionId]: improved }));
      setImprovedAnswers((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  const handleQuestionSelect = (question: GeneratedQuestion) => {
    setSelectedQuestion(question);
    setIsFlipped(false);
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader
          size="md"
          text="Generating your interview preparation materials..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
        <Button
          onClick={onRestart}
          className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
        >
          Restart
        </Button>
      </div>
    );
  }

  if (mode === "mock" && showMockInterviewPage) {
    return (
      <MockInterviewModePage
        sessionId={sessionId}
        questions={questionsList}
        onExit={handleMockInterviewPageExit}
      />
    );
  }

  if (mode === "rapid" && showRapidFirePage) {
    return (
      <RapidFireModePage
        sessionId={sessionId}
        questions={questionsList}
        onExit={handleRapidFirePageExit}
        onSwitchToPrep={handleSwitchToPrep}
        savedAnswers={savedAnswers}
      />
    );
  }

  if (results && results.questions) {
    return (
      <div className="bg-white site-main-py site-main-px">
        <div className="">
          {/* removed  mx-auto from above div */}
          <div className="text-center mb-8">
          <div className="flex flex-col md:flex-row justify-center gap-4 mb-4">
          <Button
  onClick={() => setMode("prep")}
  variant={mode === "prep" ? "default" : "outline"}
  className={`w-full md:w-auto ${
    mode === "prep" ? "bg-teal-600 hover:bg-teal-700" : ""
  }`}
>
                <BookOpen className="h-4 w-4 mr-2" />
                Prep Mode
              </Button>
              <div className="relative w-full md:w-auto">
              <Button
  onClick={handleRapidFireModeClick}
  variant={mode === "rapid" ? "default" : "outline"}
  className={`w-full md:w-auto ${
    mode === "rapid" ? "bg-[#0d7377] hover:bg-[#0a5a5d]" : ""
  }`}
>
                  <Zap className="h-4 w-4 mr-2" />
                  Rapid Fire Mode
                </Button>
                {(plan.tier === "free" || plan.tier === "basic") && (
                  <div className="absolute -top-2 -right-4 z-20 pointer-events-none">
                    <Image
                      src="/icons/ribbon.png"
                      alt="Premium feature ribbon"
                      width={52}
                      height={52}
                      priority={false}
                      className="object-contain drop-shadow-lg"
                    />
                  </div>
                )}
              </div>
              <div className="relative w-full md:w-auto">
                <Button
                  onClick={handleMockInterviewPageStart}
                  variant={mode === "mock" ? "default" : "outline"}
                  className={`w-full md:w-auto ${
                    mode === "mock" ? "bg-slate-900 hover:bg-slate-800" : ""
                  }`}
                  title={
                    !canAccessMockInterview()
                      ? "Upgrade to Executive to unlock Mock Interview Mode"
                      : ""
                  }
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Mock Interview Mode
                </Button>
                {(plan.tier === "free" ||
                  plan.tier === "basic" ||
                  plan.tier === "premium") && (
                  <div className="absolute -top-2 -right-4 z-20 pointer-events-none">
                    <Image
                      src="/icons/ribbon.png"
                      alt="Executive feature ribbon"
                      width={52}
                      height={52}
                      priority={false}
                      className="object-contain drop-shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {mode === "prep"
                ? "Interview Preparation Flashcards"
                : mode === "rapid"
                  ? "Rapid Fire Practice"
                  : "Mock Interview Mode"}
            </h2>
            <p className="text-slate-600">
              {mode === "prep"
                ? "Click any question to view answers and guidance"
                : mode === "rapid"
                  ? "Practice under time pressure with 10-second questions"
                  : "Fullscreen voice interview simulation with a 15-minute timer"}
            </p>
          </div>

          {/* Disclaimer Tooltip */}
          {mode === "prep" && (
            <div className="mb-6 px-4 lg:px-0">
              <ExpandableTooltip
                icon={<Info className="w-5 h-5" />}
                title="Important Disclaimer"
                message="The interview questions and sample answers provided by Rahvana are for educational and preparation purposes only. We do not guarantee that these exact questions will be asked during your interview. You are solely responsible for how you choose to respond in your actual interview."
                defaultOpen={true}
              />
            </div>
          )}

          {/* Action Button - Only show in prep mode */}
          {mode === "prep" && (
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={handleShuffle}
                className="flex items-center gap-2 bg-[#0d7377] hover:bg-[#0a5a5d] text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle Questions
              </Button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Questions Sidebar - Only in prep mode */}
            {mode === "prep" && !sidebarCollapsed && (
              <div className="lg:w-1/3 px-4 lg:px-0">
                <div className="bg-white rounded-2xl shadow-lg p-4 h-87.5 sm:h-100 lg:h-112.5 sticky top-6 flex flex-col border border-slate-200/50">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50">
                    <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-teal-600" />
                      Questions ({questionsList.length})
                    </h3>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="text-slate-500 hover:text-teal-600 transition-colors p-1 hover:bg-slate-100 rounded"
                      aria-label="Collapse sidebar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                      {questionsList.map(
                        (item: GeneratedQuestion, index: number) => (
                          <div
                            key={index}
                            onClick={() => handleQuestionSelect(item)}
                            className={`w-full cursor-pointer p-4 rounded-lg transition-all duration-200 border ${
                              selectedQuestion?.id === item.id
                                ? "bg-teal-100 border-2 border-teal-500 shadow-md"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-medium mt-1">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-sm">
                                  {item.selectedQuestion || item.question}
                                </p>
                                <div className="mt-2">
                                  <span className="text-xs text-slate-500 bg-slate-100 p-1 rounded">
                                    {item.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Expand button when sidebar is collapsed - Only in prep mode */}
            {mode === "prep" && sidebarCollapsed && (
              <div className="lg:w-1/12">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="bg-white rounded-xl shadow-lg p-3 h-fit sticky top-6 text-slate-500 hover:text-slate-700"
                  aria-label="Expand sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Flashcard Area - Only in prep mode */}
            {mode === "prep" && (
              <div
                className={`${
                  sidebarCollapsed ? "lg:flex-1" : "lg:w-2/3"
                } px-4 lg:px-0 flex flex-col`}
              >
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden h-87.5 sm:h-100 lg:h-112.5">
                  {selectedQuestion ? (
                    <div className="w-full h-full flex items-center justify-center p-3 sm:p-4 lg:p-6">
                      <div
                        className={`relative w-full h-full cursor-pointer transition-transform duration-700 ease-out-cubic ${
                          isFlipped ? "transform rotate-y-180" : ""
                        }`}
                        style={{
                          transformStyle: "preserve-3d",
                          perspective: "1000px",
                        }}
                        onClick={handleCardClick}
                      >
                        {/* Front of Card - Question */}
                        <div className="absolute inset-0 backface-hidden bg-linear-to-br from-teal-500 to-teal-700 rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col justify-between text-white shadow-2xl border border-teal-400/40">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between items-start gap-2 sm:gap-4">
                              <span className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                {selectedQuestion.category}
                              </span>
                              {selectedQuestion.tooltip && (
                                <div className="group relative z-50">
                                  <Info
                                    size={20}
                                    className="text-white/80 hover:text-white"
                                  />
                                  <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded-lg p-3 z-50 shadow-xl border border-slate-700">
                                    <div className="text-teal-300 font-medium mb-1 flex items-center gap-1">
                                      <Info
                                        size={14}
                                        className="text-teal-300"
                                      />
                                      Tip
                                    </div>
                                    <p>{selectedQuestion.tooltip}</p>
                                    <div className="absolute bottom-full right-4 border-8 border-transparent border-b-slate-800"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold leading-snug line-clamp-5 sm:line-clamp-4">
                              {selectedQuestion.selectedQuestion ||
                                selectedQuestion.question}
                            </h3>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-teal-100 text-xs">
                              Click to reveal
                            </p>
                            <div className="flex justify-center">
                              <div className="w-4 h-4 border-2 border-white/50 rounded-full animate-bounce flex items-center justify-center">
                                <div className="w-1 h-1 bg-white/80 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of Card - Answer & Guidance */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-teal-600 to-teal-800 rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col text-white shadow-2xl border border-teal-500/40">
                          <div className="flex justify-between items-start mb-2 sm:mb-3 pb-2 border-b border-white/10">
                            <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                              {savedAnswers[selectedQuestion.id]
                                ? "Your Answer"
                                : "Answer & Guidance"}
                            </span>
                          </div>

                          <ScrollArea className="flex-1 pr-2 sm:pr-3">
                            <div className="space-y-3 sm:space-y-4">
                              {/* Show saved answer if it exists */}
                              {savedAnswers[selectedQuestion.id] && (
                                <div>
                                  <h4 className="text-green-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                                    <span className="w-1.5 h-1.5 bg-green-200 rounded-full"></span>
                                    Your Saved Answer
                                  </h4>
                                  <p className="text-slate-100 leading-relaxed text-xs sm:text-sm line-clamp-3">
                                    {savedAnswers[selectedQuestion.id]}
                                  </p>
                                </div>
                              )}

                              {/* Toggle section with sample answer and guidance - visible by default or if no saved answer */}
                              {!savedAnswers[selectedQuestion.id] ||
                              showSampleAnswerInFlashcard[
                                selectedQuestion.id
                              ] ? (
                                <>
                                  <div>
                                    <h4 className="text-teal-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                                      <span className="w-1.5 h-1.5 bg-teal-200 rounded-full"></span>
                                      Sample
                                    </h4>
                                    <p className="text-slate-100 leading-snug text-xs sm:text-sm line-clamp-3">
                                      {selectedQuestion.sampleAnswer}
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="text-blue-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                                      <span className="w-1.5 h-1.5 bg-blue-200 rounded-full"></span>
                                      Guidance
                                    </h4>
                                    <p className="text-slate-200 leading-snug text-xs sm:text-sm line-clamp-3">
                                      {selectedQuestion.guidance}
                                    </p>
                                  </div>

                                  {selectedQuestion.tooltip && (
                                    <div>
                                      <h4 className="text-amber-200 font-semibold mb-1 flex items-center gap-2 text-xs sm:text-sm">
                                        <span className="w-1.5 h-1.5 bg-amber-200 rounded-full"></span>
                                        Tip
                                      </h4>
                                      <p className="text-slate-300 text-xs sm:text-sm italic line-clamp-2">
                                        {selectedQuestion.tooltip}
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </ScrollArea>

                          {/* Toggle button if answer is saved */}
                          {savedAnswers[selectedQuestion.id] && (
                            <div className="mt-2 sm:mt-3 mb-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card flip when clicking toggle
                                  setShowSampleAnswerInFlashcard((prev) => ({
                                    ...prev,
                                    [selectedQuestion.id]:
                                      !prev[selectedQuestion.id],
                                  }));
                                }}
                                className="w-full text-teal-100 hover:text-white text-xs sm:text-sm font-medium transition-colors underline"
                              >
                                {showSampleAnswerInFlashcard[
                                  selectedQuestion.id
                                ]
                                  ? "Hide Sample"
                                  : "Compare"}
                              </button>
                            </div>
                          )}

                          {/* Answer button on back of card */}
                          {plan.tier !== 'free' && (
                            <div className="mt-3 sm:mt-4 flex gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAnswerModal(true);
                                }}
                              className="flex-1 bg-white text-teal-700 hover:bg-teal-50 font-semibold text-xs sm:text-sm py-1 sm:py-2"
                            >
                              {savedAnswers[selectedQuestion.id]
                                ? "Edit"
                                : "Answer"}
                            </Button>
                          </div>)}

                          <div className="text-center mt-2">
                            <p className="text-slate-300 text-xs">
                              Click to flip
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-slate-500">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />

                        <h3 className="text-xl font-medium mb-2">
                          Select a Question
                        </h3>

                        <p>
                          Choose any question from the sidebar to view detailed
                          answers and guidance
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rapid Fire Mode */}
            {mode === "rapid" && (
              <div className="w-full max-w-2xl mx-auto">
              <div className="bg-linear-to-br from-[#e8f6f6] via-[#f0faf9] to-[#e8f6f6] rounded-2xl shadow-lg site-main-px border border-[#0d7377]/20">
                <div className="text-center site-main-py">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0d7377]/10 mb-4">
                    <Zap className="w-8 h-8 text-[#0d7377]" />
                  </div>
            
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Rapid Fire Practice
                  </h3>
            
                  <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                    Simulate real interview pressure with timed questions, adaptive
                    retries, and confidence-based repetition designed to improve long-term
                    recall and speaking confidence.
                  </p>
            
                  <div className="max-w-2xl mx-auto text-left">
                    <ExpandableTooltip
                      icon="i"
                      title="How Rapid Fire Training Works?"
                      message="Each round contains timed interview questions with a 10-second response window. Questions you miss or skip return quickly for reinforcement, while partially covered and well-covered questions reappear later using adaptive spaced repetition to strengthen long-term memory and confidence."
                    />
                  </div>        
    
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleRapidFirePageStart}
                      className="bg-[#0d7377] hover:bg-[#0a5a5d] px-8 py-3 text-lg flex items-center gap-2 text-white font-semibold"
                    >
                      Start Rapid Fire Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* NEW: Answer Modal */}
          {showAnswerModal && selectedQuestion && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="bg-linear-to-r from-teal-600 to-teal-700 p-6 text-white flex justify-between items-start shrink-0">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">
                      {selectedQuestion.question}
                    </h3>
                    <p className="text-teal-100 text-sm mt-2">
                      {selectedQuestion.guidance}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAnswerModal(false)}
                    className="text-white hover:text-teal-100 transition-colors ml-4 shrink-0"
                    aria-label="Close modal"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 scrollbar-premium">
                  <div className="p-6 space-y-6">
                    {/* Sample Answer Reference - Premium Style */}
                    <div className="bg-linear-to-br from-[#e8f6f6] to-white p-5 rounded-xl border border-[#14a0a6]/20 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-sm text-[#0d7377] mb-3 flex items-center gap-2">
                        Sample Answer
                      </h4>
                      <p className="text-sm text-[#0d7377] leading-relaxed italic">
                        {selectedQuestion.sampleAnswer}
                      </p>
                    </div>

                    {/* User's Text Input with Improve Icon */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Your Answer:
                      </label>
                      <div className="relative">
                        <Textarea
                          value={userAnswers[selectedQuestion.id] || ""}
                          onChange={(e) =>
                            setUserAnswers((prev) => ({
                              ...prev,
                              [selectedQuestion.id]: e.target.value,
                            }))
                          }
                          placeholder="Write your answer here... (minimum 10 characters)"
                          className="min-h-40 text-base border-2 border-slate-200 focus:border-teal-500 rounded-lg pr-12"
                        />
                        {/* NEW: Only show AI icon if answer is saved */}
                        {savedAnswers[selectedQuestion.id] && (
                          <button
                            onClick={() =>
                              handleImproveAnswer(
                                selectedQuestion.id,
                                selectedQuestion.question,
                                "clarity",
                              )
                            }
                            disabled={aiImproving[selectedQuestion.id]}
                            className="absolute top-3 right-3 transition-opacity hover:opacity-80 disabled:opacity-60 cursor-pointer shrink-0"
                            title="Improve with AI"
                            aria-label="Improve answer with AI"
                          >
                            {aiImproving[selectedQuestion.id] ? (
                              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                            ) : (
                              <Image
                                src="/rahvana-ai.png"
                                alt="AI Improve"
                                width={48}
                                height={48}
                                className="w-8 h-8 object-contain"
                              />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {
                          (userAnswers[selectedQuestion.id] || "")
                            .split(/\s+/)
                            .filter((w) => w).length
                        }{" "}
                        words
                      </p>
                    </div>

                    {/* AI Improvements - Minimal Design */}
                    {improvedAnswers[selectedQuestion.id] && (
                      <div className="bg-linear-to-br from-[#e8f6f6] to-white rounded-xl border border-[#14a0a6]/20 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-sm text-[#0d7377] flex items-center gap-2">
                            AI-Improved Version
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-[#14a0a6]/10 text-[#0d7377] font-medium">
                            Review before using
                          </span>
                        </div>
                        <p className="text-sm text-[#0d7377] leading-relaxed mb-4 italic">
                          {improvedAnswers[selectedQuestion.id]}
                        </p>
                        <Button
                          onClick={() => acceptImprovement(selectedQuestion.id)}
                          size="sm"
                          className="bg-[#0d7377] hover:bg-[#0a5a5d] text-white font-semibold"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Use This Improvement
                        </Button>
                        <p className="text-xs text-[#0a5a5d] mt-4 pt-4 border-t border-[#14a0a6]/10">
                          <span className="font-medium">Tip:</span> AI can make
                          mistakes and may not fully reflect your intent. Please
                          review carefully before using.
                        </p>
                      </div>
                    )}

                    {/* Save Answer Button - Scrolls with content */}
                    <Button
                      onClick={() => handleSaveAnswer(selectedQuestion.id)}
                      disabled={savingAnswers[selectedQuestion.id]}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2"
                    >
                      {savingAnswers[selectedQuestion.id]
                        ? "Saving..."
                        : "Save Answer"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showUpgradeModal && (
          <UpgradeModal
            feature="interview_rapid_fire"
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
        {showMockUpgradeModal && (
          <UpgradeModal
            feature="mock_interview"
            onClose={() => setShowMockUpgradeModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-slate-600">{msg(E.TOOL_INTERVIEW_NO_SESSION)}</p>
      <Button
        onClick={onRestart}
        className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
      >
        Restart
      </Button>
    </div>
  );
};
