"use client";

import { useState, useEffect, useCallback, useMemo, type MouseEvent } from "react";
import Image from "next/image";
import { msg, E } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Check, Info, Loader2, Mic, Shuffle, X, Zap } from "lucide-react";
import { InterviewPrepOutput, GeneratedQuestion } from "@/lib/interview-prep";
import { RapidFireModePage } from "../rapid-fire/RapidFireModePage";
import { MockInterviewModePage } from "../mock/MockInterviewModePage";
import { Loader } from "@/components/ui/spinner";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { useToast } from "@/app/components/shared/ToastProvider";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { getEntitlement } from "@/lib/entitlements/config";
import { InterviewModeTabs } from "@/app/components/interview-prep/InterviewModeTabs";

interface ResultPageProps {
  sessionId: string;
  results?: InterviewPrepOutput | null;
  onRestart: () => void;
}

export const ResultPage = ({ sessionId, results, onRestart }: ResultPageProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<GeneratedQuestion | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showRapidFirePage, setShowRapidFirePage] = useState(false);
  const [showMockInterviewPage, setShowMockInterviewPage] = useState(false);

  const [questionsList, setQuestionsList] = useState<GeneratedQuestion[]>([]);
  const [mode, setMode] = useState<"prep" | "rapid" | "mock">("prep");

  // Answer management state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState<Record<string, boolean>>({});
  const [aiImproving, setAiImproving] = useState<Record<string, boolean>>({});
  const [improvedAnswers, setImprovedAnswers] = useState<Record<string, string>>({});
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // Track which questions have saved answers (loaded from DB)
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});

  // Toggle to show/hide sample answer in flashcard
  const [showSampleAnswerInFlashcard, setShowSampleAnswerInFlashcard] = useState<
    Record<string, boolean>
  >({});

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMockUpgradeModal, setShowMockUpgradeModal] = useState(false);
  const [showPrepUpgradeModal, setShowPrepUpgradeModal] = useState(false);

  const plan = usePlan();

  const canSeePrepQuestion = useCallback(
    (question: GeneratedQuestion) => {
      if (plan.tier === "free") {
        return question.tier === "free";
      }

      return true;
    },
    [plan.tier]
  );

  const canAccessRapidFire = (): boolean => {
    const entitlement = getEntitlement("interview_rapid_fire", plan.tier);
    return entitlement.state === "full" || entitlement.state === "limited";
  };

  const canAccessMockInterview = (): boolean => {
    const entitlement = getEntitlement("mock_interview", plan.tier);
    return entitlement.state === "full" || entitlement.state === "limited";
  };

  // Check if tier has limited access (should only see free-tier questions)
  const hasLimitedRapidFire = (): boolean => {
    const entitlement = getEntitlement("interview_rapid_fire", plan.tier);
    return entitlement.state === "limited";
  };

  const hasLimitedMockInterview = (): boolean => {
    const entitlement = getEntitlement("mock_interview", plan.tier);
    return entitlement.state === "limited";
  };

  // Filter questions for rapid fire mode - limited tiers only see free-tier questions
  const rapidFireQuestions = useMemo(() => {
    if (hasLimitedRapidFire()) {
      return questionsList.filter((q) => q.tier === "free");
    }
    return questionsList;
  }, [questionsList, plan.tier]);

  // Filter questions for mock mode - limited tiers only see free-tier questions
  const mockInterviewQuestions = useMemo(() => {
    if (hasLimitedMockInterview()) {
      return questionsList.filter((q) => q.tier === "free");
    }
    return questionsList;
  }, [questionsList, plan.tier]);

  // Shuffle algorithm
  const shuffleQuestions = (questions: GeneratedQuestion[]): GeneratedQuestion[] => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleShuffle = () => {
    if (results?.questions) {
      const applicableQuestions = results.questions.filter((q: GeneratedQuestion) => q.applicable);
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
      const response = await fetch(`/api/interview-prep/user-answers?sessionId=${sessionId}`);
      const data = await response.json();

      if (data.success && data.answers) {
        const answersMap: Record<string, string> = {};
        data.answers.forEach(
          (answer: { question_id: string; user_answer_text?: string | null }) => {
            answersMap[answer.question_id] = answer.user_answer_text || "";
          }
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
      const applicableQuestions = results.questions.filter((q: GeneratedQuestion) => q.applicable);
      setQuestionsList(applicableQuestions.filter(canSeePrepQuestion));
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
        "error"
      );
    } finally {
      setSavingAnswers((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // NEW: Get AI improvement suggestion
  const handleImproveAnswer = async (
    questionId: string,
    question: string,
    type: "clarity" | "professional" | "complete" = "clarity"
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
        "error"
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

  const handleCardClick = (event?: MouseEvent<HTMLDivElement>) => {
    if (event) {
      const target = event.target as HTMLElement | null;

      if (
        target?.closest(
          "button, a, input, textarea, select, option, [role='button'], [data-no-card-flip='true']"
        )
      ) {
        return;
      }
    }

    setIsFlipped((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader size="md" text="Generating your interview preparation materials..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={onRestart} className="mt-4 bg-[#0d7377] text-white hover:bg-[#0a5a5d]">
          Restart
        </Button>
      </div>
    );
  }

  if (mode === "mock" && showMockInterviewPage) {
    return (
      <div className="interview-dots-bg site-main-py site-main-px relative min-h-screen overflow-hidden bg-linear-to-br from-[#e8f6f6] via-white to-slate-50">
        <div className="pointer-events-none absolute top-20 -left-32 h-96 w-96 rounded-full bg-[#afdbdb]/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-32 h-80 w-80 rounded-full bg-[#cdadcc]/10 blur-3xl" />
        <div className="relative z-10 mb-8 text-center">
          <InterviewModeTabs
            mode={mode}
            onPrep={() => setMode("prep")}
            onRapid={handleRapidFireModeClick}
            onMock={handleMockInterviewPageStart}
          />

          <h2 className="mb-2 text-3xl font-bold text-slate-900">Mock Interview Mode</h2>
          <p className="text-slate-600">
            Immersive voice interview simulation designed to mirror real interview experiences{" "}
          </p>
        </div>

        <MockInterviewModePage
          sessionId={sessionId}
          questions={mockInterviewQuestions}
          onExit={handleMockInterviewPageExit}
        />
      </div>
    );
  }

  if (mode === "rapid" && showRapidFirePage) {
    return (
      <RapidFireModePage
        sessionId={sessionId}
        questions={rapidFireQuestions}
        onExit={handleRapidFirePageExit}
        onSwitchToPrep={handleSwitchToPrep}
        savedAnswers={savedAnswers}
      />
    );
  }

  if (results && results.questions) {
    return (
      <div className="interview-dots-bg site-main-py site-main-px relative min-h-screen overflow-hidden bg-linear-to-br from-[#e8f6f6] via-white to-slate-50">
        {/* Ambient gradient blobs */}
        <div className="pointer-events-none absolute top-20 -left-32 h-96 w-96 rounded-full bg-[#afdbdb]/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-32 h-80 w-80 rounded-full bg-[#cdadcc]/10 blur-3xl" />
        <div className="">
          <div className="mb-8 text-center">
            <InterviewModeTabs
              mode={mode}
              onPrep={() => setMode("prep")}
              onRapid={handleRapidFireModeClick}
              onMock={handleMockInterviewPageStart}
            />

            <h2 className="mb-2 text-3xl font-bold text-slate-900">
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
                icon={<Info className="h-5 w-5" />}
                title="Important Disclaimer"
                message="The interview questions and sample answers provided by Rahvana are for educational and preparation purposes only. We do not guarantee that these exact questions will be asked during your interview. You are solely responsible for how you choose to respond in your actual interview."
                defaultOpen={true}
              />
            </div>
          )}

          {/* Action Button - Only show in prep mode */}
          {mode === "prep" && (
            <div className="mb-6 flex justify-center gap-4">
              <Button
                onClick={handleShuffle}
                className="flex items-center gap-2 rounded-lg bg-[#6b5b7b] px-6 py-2 font-semibold text-white shadow-[0_4px_16px_-4px_rgba(107,91,123,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a4a6a]"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle Questions
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* Questions Sidebar - Only in prep mode */}
            {mode === "prep" && !sidebarCollapsed && (
              <div className="px-4 lg:w-1/3 lg:px-0">
                <div className="sticky top-6 flex h-87.5 flex-col rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white/90 p-4 shadow-[0_8px_30px_rgba(13,115,119,0.08)] backdrop-blur-sm transition-shadow duration-200 sm:h-100 lg:h-126">
                  <div className="mb-4 flex items-center justify-between border-b border-[rgba(13,115,119,0.08)] pb-3">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
                      <BookOpen className="h-5 w-5 text-[#0d7377]" />
                      Questions ({questionsList.length})
                    </h3>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-600"
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
                      {questionsList.map((item: GeneratedQuestion, index: number) => (
                        <div
                          key={index}
                          onClick={() => handleQuestionSelect(item)}
                          className={`group w-full cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-[0_4px_16px_-6px_rgba(13,115,119,0.15)] ${
                            selectedQuestion?.id === item.id
                              ? "border-2 border-[#faf8fb] bg-[#cdadcc] shadow-[0_4px_16px_-6px_rgba(107,91,123,0.2)]"
                              : "border-[#f0e7f1] bg-white hover:border-[#cdadcc] hover:bg-[#faf8fb] hover:shadow-[0_4px_12px_-6px_rgba(107,91,123,0.12)]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white transition-colors duration-200 ${
                                selectedQuestion?.id === item.id ? "bg-[#6b5b7b]" : "bg-[#89a4a0]"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {item.selectedQuestion || item.question}
                              </p>
                              <div className="mt-2">
                                <span className="rounded-full bg-[#f3ede7] px-1.5 py-0.5 text-xs font-medium text-[#9c6f38]">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                  className="sticky top-6 h-fit rounded-xl border border-[rgba(13,115,119,0.08)] bg-white/90 p-3 text-[#89a4a0] shadow-[0_8px_30px_rgba(13,115,119,0.08)] backdrop-blur-sm transition-colors duration-200 hover:text-[#0d7377]"
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
                } flex flex-col px-4 lg:px-0`}
              >
                <div className="h-[500px] overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-xl">
                  {selectedQuestion ? (
                    <div className="flex h-full w-full items-center justify-center p-3 sm:p-4 lg:p-6">
                      <div
                        className={`ease-out-cubic relative h-full w-full cursor-pointer transition-transform duration-700 ${
                          isFlipped ? "rotate-y-180 transform" : ""
                        }`}
                        style={{
                          transformStyle: "preserve-3d",
                          perspective: "1000px",
                        }}
                        onClick={handleCardClick}
                      >
                        {/* Front of Card - Question */}
                        <div
                          className="absolute relative inset-0 flex flex-col overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] p-4 text-slate-900 shadow-[0_8px_30px_rgba(13,115,119,0.1)] backface-hidden sm:p-5 lg:p-7"
                          style={{
                            background:
                              "linear-gradient(145deg, #ffffff 0%, #fdfbf8 35%, #faf6f0 70%, #f7f1e8 100%)",
                          }}
                        >
                          {/* Soft radial glow top-right */}
                          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#afdbdb]/15 blur-2xl" />
                          {/* Decorative watermark */}
                          <div className="pointer-events-none absolute right-6 bottom-6 opacity-[0.035]">
                            <BookOpen className="h-28 w-28 text-[#0d7377]" strokeWidth={1} />
                          </div>
                          <div className="relative z-10 space-y-2 sm:space-y-3">
                            <div className="flex items-start justify-between gap-2 sm:gap-4">
                              <span className="rounded-full bg-[#f3ede7] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-[#9c6f38] sm:px-3 sm:py-1">
                                {selectedQuestion.category}
                              </span>
                              {selectedQuestion.tooltip && (
                                <div className="group relative z-50">
                                  <Info
                                    size={20}
                                    className="text-[#89a4a0] transition-colors duration-200 hover:text-[#0d7377]"
                                  />
                                  <div className="absolute top-full right-0 z-50 mt-2 hidden w-64 rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-white shadow-xl group-hover:block">
                                    <div className="mb-1 flex items-center gap-1 font-medium text-[#afdbdb]">
                                      <Info size={14} className="text-[#afdbdb]" />
                                      Tip
                                    </div>
                                    <p>{selectedQuestion.tooltip}</p>
                                    <div className="absolute right-4 bottom-full border-8 border-transparent border-b-slate-800"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg leading-snug font-bold text-slate-800 sm:text-xl lg:text-2xl">
                              {selectedQuestion.selectedQuestion || selectedQuestion.question}
                            </h3>
                          </div>
                          <div className="relative z-10 mt-52 space-y-1 pt-8 text-center">
                            <p className="text-xs text-[#89a4a0]">Click to reveal</p>
                            <div className="flex justify-center">
                              <div className="flex h-4 w-4 animate-bounce items-center justify-center rounded-full border-2 border-[#0d7377]/30">
                                <div className="h-1 w-1 rounded-full bg-[#0d7377]/50"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of Card - Answer & Guidance */}
                        <div className="absolute inset-0 flex rotate-y-180 flex-col overflow-visible rounded-2xl border border-teal-500/40 bg-linear-to-br from-teal-600 to-teal-800 p-4 text-white shadow-2xl backface-hidden sm:p-5 lg:p-7">
                          <div className="mb-2 flex items-start justify-between border-b border-white/10 pb-2 sm:mb-3">
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1">
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
                                  <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-green-200 sm:text-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-200"></span>
                                    Your Saved Answer
                                  </h4>
                                  <p className="text-xs leading-relaxed text-slate-100 sm:text-sm">
                                    {savedAnswers[selectedQuestion.id]}
                                  </p>
                                </div>
                              )}

                              {/* Toggle section with sample answer and guidance - visible by default or if no saved answer */}
                              {!savedAnswers[selectedQuestion.id] ||
                              showSampleAnswerInFlashcard[selectedQuestion.id] ? (
                                <>
                                  <div>
                                    <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-teal-200 sm:text-sm">
                                      <span className="h-1.5 w-1.5 rounded-full bg-teal-200"></span>
                                      Sample
                                    </h4>
                                    <p className="text-xs leading-snug text-slate-100 sm:text-sm">
                                      {selectedQuestion.sampleAnswer}
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-blue-200 sm:text-sm">
                                      <span className="h-1.5 w-1.5 rounded-full bg-blue-200"></span>
                                      Guidance
                                    </h4>
                                    <p className="text-xs leading-snug text-slate-200 sm:text-sm">
                                      {selectedQuestion.guidance}
                                    </p>
                                  </div>

                                  {selectedQuestion.tooltip && (
                                    <div>
                                      <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-200 sm:text-sm">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-200"></span>
                                        Tip
                                      </h4>
                                      <p className="text-xs text-slate-300 italic sm:text-sm">
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
                            <div className="mt-2 mb-1 sm:mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card flip when clicking toggle
                                  setShowSampleAnswerInFlashcard((prev) => ({
                                    ...prev,
                                    [selectedQuestion.id]: !prev[selectedQuestion.id],
                                  }));
                                }}
                                className="w-full text-xs font-medium text-teal-100 underline transition-colors hover:text-white sm:text-sm"
                              >
                                {showSampleAnswerInFlashcard[selectedQuestion.id]
                                  ? "Hide Sample"
                                  : "Compare"}
                              </button>
                            </div>
                          )}

                          {/* Answer button on back of card */}
                          <div className="mt-3 flex gap-2 sm:mt-4">
                            <div
                              className="group relative flex-1 overflow-visible"
                              data-no-card-flip="true"
                            >
                              <div
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    if (plan.tier === "free") {
                                      setShowPrepUpgradeModal(true);
                                      return;
                                    }

                                    setShowAnswerModal(true);
                                  }}
                                  className="w-full bg-white py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 sm:py-2 sm:text-sm"
                                >
                                  {savedAnswers[selectedQuestion.id] ? "Edit" : "Answer"}
                                </Button>
                              </div>

                              {plan.tier === "free" && (
                                <>
                                  <div className="pointer-events-none absolute -top-2 -right-4 z-20">
                                    <Image
                                      src="/icons/ribbon.png"
                                      alt="Premium feature ribbon"
                                      width={52}
                                      height={52}
                                      className="object-contain drop-shadow-lg"
                                    />
                                  </div>

                                  <div className="pointer-events-none absolute bottom-full left-[70%] z-50 mb-2 w-72 -translate-x-1/2 translate-y-1 rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                                    <div className="mb-1 font-semibold text-teal-300">
                                      AI Answer Builder
                                    </div>

                                    <p>
                                      Draft your own interview answers and receive AI-powered
                                      feedback to improve clarity, confidence, and interview
                                      readiness. Upgrade to unlock personalized answer building and
                                      AI guidance.
                                    </p>

                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 text-center">
                            <p className="text-xs text-slate-300">Click to flip</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-slate-500">
                        <BookOpen className="mx-auto mb-4 h-16 w-16 opacity-50" />

                        <h3 className="mb-2 text-xl font-medium">Select a Question</h3>

                        <p>
                          Choose any question from the sidebar to view detailed answers and guidance
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rapid Fire Mode */}
            {mode === "rapid" && (
              <div className="mx-auto w-full max-w-2xl">
                <div className="site-main-px relative overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white/80 shadow-[0_8px_30px_rgba(13,115,119,0.08)] backdrop-blur-sm">
                  {/* Soft decorative glow */}
                  <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#cdadcc]/12 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#afdbdb]/10 blur-3xl" />
                  <div className="site-main-py relative z-10 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cdadcc]/30 bg-[#cdadcc]/25 shadow-[0_4px_16px_-6px_rgba(205,173,204,0.4)]">
                      <Zap className="h-8 w-8 text-[#6b5b7b]" />
                    </div>

                    <h3 className="mb-2 text-2xl font-bold text-slate-900">Rapid Fire Practice</h3>

                    <p className="mx-auto mb-6 max-w-2xl text-[#89a4a0]">
                      Simulate real interview pressure with timed questions, adaptive retries, and
                      confidence-based repetition designed to improve long-term recall and speaking
                      confidence.
                    </p>

                    <div className="mx-auto max-w-2xl text-left">
                      <ExpandableTooltip
                        icon="i"
                        title="How Rapid Fire Training Works?"
                        message="Each round contains timed interview questions with a 10-second response window. Questions you miss or skip return quickly for reinforcement, while partially covered and well-covered questions reappear later using adaptive spaced repetition to strengthen long-term memory and confidence."
                      />
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={handleRapidFirePageStart}
                        className="flex items-center gap-2 bg-[#6b5b7b] px-8 py-3 text-lg font-semibold text-white hover:bg-[#5a4a6a]"
                      >
                        Start Rapid Fire Session
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Answer Modal */}
          {showAnswerModal && selectedQuestion && (
            <div className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm duration-200">
              <div className="animate-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white shadow-[0_30px_80px_-30px_rgba(13,115,119,0.35)] duration-200">
                {/* Modal Header */}
                <div
                  className="flex shrink-0 items-start justify-between p-5 text-white"
                  style={{ background: "linear-gradient(135deg, #0d7377 0%, #0a5a5d 100%)" }}
                >
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedQuestion.question}</h3>
                    <p className="mt-2 text-sm text-teal-100">{selectedQuestion.guidance}</p>
                  </div>
                  <button
                    onClick={() => setShowAnswerModal(false)}
                    className="ml-4 shrink-0 text-white transition-colors hover:text-teal-100"
                    aria-label="Close modal"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="scrollbar-premium flex-1 overflow-y-auto">
                  <div className="space-y-6 p-6">
                    {/* Sample Answer Reference - Premium Style */}
                    <div className="rounded-xl border border-[#0d7377]/15 bg-linear-to-br from-[#e8f6f6] to-white p-5 shadow-sm transition-shadow hover:shadow-md">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0d7377]">
                        Sample Answer
                      </h4>
                      <p className="text-sm leading-relaxed text-[#0d7377] italic">
                        {selectedQuestion.sampleAnswer}
                      </p>
                    </div>

                    {/* User's Text Input with Improve Icon */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                          className="min-h-40 rounded-lg border-2 border-slate-200 pr-12 text-base focus:border-teal-500"
                        />
                        {/* Only show AI icon if answer is saved */}
                        {savedAnswers[selectedQuestion.id] && (
                          <button
                            onClick={() =>
                              handleImproveAnswer(
                                selectedQuestion.id,
                                selectedQuestion.question,
                                "clarity"
                              )
                            }
                            disabled={aiImproving[selectedQuestion.id]}
                            className="absolute top-3 right-3 shrink-0 cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-60"
                            title="Improve with AI"
                            aria-label="Improve answer with AI"
                          >
                            {aiImproving[selectedQuestion.id] ? (
                              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            ) : (
                              <Image
                                src="/rahvana-ai.png"
                                alt="AI Improve"
                                width={48}
                                height={48}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {
                          (userAnswers[selectedQuestion.id] || "").split(/\s+/).filter((w) => w)
                            .length
                        }{" "}
                        words
                      </p>
                    </div>

                    {/* AI Improvements - Minimal Design */}
                    {improvedAnswers[selectedQuestion.id] && (
                      <div className="rounded-xl border border-[#0d7377]/15 bg-linear-to-br from-[#e8f6f6] to-white p-5 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-3 flex items-start justify-between">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-[#0d7377]">
                            AI-Improved Version
                          </h4>
                          <span className="rounded-full bg-[#0d7377]/8 px-2 py-1 text-xs font-medium text-[#0d7377]">
                            Review before using
                          </span>
                        </div>
                        <p className="mb-4 text-sm leading-relaxed text-[#0d7377] italic">
                          {improvedAnswers[selectedQuestion.id]}
                        </p>
                        <Button
                          onClick={() => acceptImprovement(selectedQuestion.id)}
                          size="sm"
                          className="bg-[#0d7377] font-semibold text-white hover:bg-[#0a5a5d]"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Use This Improvement
                        </Button>
                        <p className="mt-4 border-t border-[#0d7377]/8 pt-4 text-xs text-[#0a5a5d]">
                          <span className="font-medium">Tip:</span> AI can make mistakes and may not
                          fully reflect your intent. Please review carefully before using.
                        </p>
                      </div>
                    )}

                    {/* Save Answer Button - Scrolls with content */}
                    <Button
                      onClick={() => handleSaveAnswer(selectedQuestion.id)}
                      disabled={savingAnswers[selectedQuestion.id]}
                      className="w-full bg-[#0d7377] py-2 font-semibold text-white shadow-[0_4px_16px_-4px_rgba(13,115,119,0.4)] transition-all duration-200 hover:bg-[#0a5a5d]"
                    >
                      {savingAnswers[selectedQuestion.id] ? "Saving..." : "Save Answer"}
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
            interviewMode="rapid"
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
        {showPrepUpgradeModal && (
          <UpgradeModal
            feature="basic_interview_prep"
            interviewMode="prep"
            onClose={() => setShowPrepUpgradeModal(false)}
          />
        )}
        {showMockUpgradeModal && (
          <UpgradeModal
            feature="mock_interview"
            interviewMode="mock"
            onClose={() => setShowMockUpgradeModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="py-8 text-center">
      <p className="text-slate-600">{msg(E.TOOL_INTERVIEW_NO_SESSION)}</p>
      <Button onClick={onRestart} className="mt-4 bg-[#0d7377] text-white hover:bg-[#0a5a5d]">
        Restart
      </Button>
    </div>
  );
};
