"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Info,
  Shuffle,
  Zap,
  Check,
  X,
  Loader2
} from "lucide-react";
import { InterviewPrepOutput, GeneratedQuestion } from "@/lib/interview-prep";
import { RapidFireModePage } from "../rapid-fire/RapidFireModePage";
import { Loader } from "@/components/ui/spinner";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { useToast } from "@/app/components/shared/ToastProvider";

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

  const [questionsList, setQuestionsList] = useState<GeneratedQuestion[]>([]);
  const [mode, setMode] = useState<"prep" | "rapid">("prep");

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

  // NEW: Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"restore-session" | null>(
    null,
  );

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
      const shuffled = shuffleQuestions(applicableQuestions);
      setQuestionsList(shuffled);
    }
  };

  const handleRapidFirePageStart = () => {
    setMode("rapid");
    setShowRapidFirePage(true);
  };

  const handleRapidFirePageExit = () => {
    setMode("prep");
    setShowRapidFirePage(false);
  };

  const handleSwitchToPrep = () => {
    setMode("prep");
    setShowRapidFirePage(false);
  };

  useEffect(() => {
    if (results === undefined || results === null) {
      setError("No results found. Please try again.");
      setLoading(false);
    } else if (results?.questions) {
      // Initialize with original order
      const applicableQuestions = results.questions.filter(
        (q: GeneratedQuestion) => q.applicable,
      );
      setQuestionsList(applicableQuestions);
      // Load existing answers
      if (sessionId) {
        loadAnswers();
      }
    }
  }, [results, sessionId]);

  // NEW: Load answers from database
  const loadAnswers = async () => {
    try {
      const response = await fetch(
        `/api/interview-prep/user-answers?sessionId=${sessionId}`,
      );
      const data = await response.json();

      if (data.success && data.answers) {
        const answersMap: Record<string, string> = {};
        data.answers.forEach((answer: any) => {
          answersMap[answer.question_id] = answer.user_answer_text || "";
        });
        setSavedAnswers(answersMap);
        // Also populate userAnswers with saved answers for modal editing
        setUserAnswers(answersMap);
      }
    } catch (error) {
      console.error("Error loading answers:", error);
    }
  };

  // NEW: Save answer to database
  const handleSaveAnswer = async (questionId: string) => {
    const answerText = userAnswers[questionId];

    if (!answerText || answerText.trim().length < 10) {
      showToast("Please write at least 10 characters", "error");
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

      if (!response.ok) throw new Error("Failed to save answer");

      // Update savedAnswers to reflect the newly saved answer
      setSavedAnswers((prev) => ({
        ...prev,
        [questionId]: answerText,
      }));

      showToast("Answer saved successfully!", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to save answer", "error");
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
      showToast("Write an answer first", "error");
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

      if (!response.ok) throw new Error("Failed to improve answer");

      const data = await response.json();
      setImprovedAnswers((prev) => ({
        ...prev,
        [questionId]: data.improvedAnswer,
      }));
      showToast("Answer improved successfully!", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to improve answer", "error");
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
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* removed  mx-auto from above div */}
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4 mb-4">
              <Button
                onClick={() => setMode("prep")}
                variant={mode === "prep" ? "default" : "outline"}
                className={
                  mode === "prep" ? "bg-teal-600 hover:bg-teal-700" : ""
                }
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Prep Mode
              </Button>
              <Button
                onClick={() => setMode("rapid")}
                variant={mode === "rapid" ? "default" : "outline"}
                className={
                  mode === "rapid" ? "bg-orange-600 hover:bg-orange-700" : ""
                }
              >
                <Zap className="h-4 w-4 mr-2" />
                Rapid Fire Mode
              </Button>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {mode === "prep"
                ? "Interview Preparation Flashcards"
                : "Rapid Fire Practice"}
            </h2>
            <p className="text-slate-600">
              {mode === "prep"
                ? "Click any question to view answers and guidance"
                : "Practice under time pressure with 10-second questions"}
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
              <div className="lg:w-2/5 px-4 lg:px-0">
                <div className="bg-white rounded-xl shadow-lg p-4 h-[calc(90vh-1rem)] sticky top-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-teal-600" />
                      Questions ({questionsList.length})
                    </h3>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="text-slate-500 hover:text-slate-700"
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
                  <ScrollArea className="h-[calc(100%-4rem)] pr-4">
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
                className={`${sidebarCollapsed ? "lg:w-11/12" : "lg:w-[75%]"} px-4 lg:px-0`}
              >
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-2 min-h-[calc(90vh-2rem)] flex items-center justify-center">
                  {selectedQuestion ? (
                    <div className="w-full max-w-2xl">
                      <div
                        className={`relative w-full h-full min-h-[575px] cursor-pointer transition-transform duration-700 ease-out-cubic ${
                          isFlipped ? "transform rotate-y-180" : ""
                        }`}
                        style={{
                          transformStyle: "preserve-3d",
                          perspective: "1000px",
                        }}
                        onClick={handleCardClick}
                      >
                        {/* Front of Card - Question */}
                        <div className="absolute inset-0 backface-hidden bg-linear-to-br from-teal-500 to-teal-700 rounded-2xl p-8 flex flex-col justify-between text-white shadow-xl">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                                {selectedQuestion.category}
                              </span>
                              {selectedQuestion.tooltip && (
                                <div className="group relative">
                                  <Info
                                    size={20}
                                    className="text-white/80 hover:text-white"
                                  />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded-lg p-3 z-50 shadow-xl border border-slate-700">
                                    <div className="text-teal-300 font-medium mb-1 flex items-center gap-1">
                                      <Info
                                        size={14}
                                        className="text-teal-300"
                                      />
                                      Tip
                                    </div>
                                    <p>{selectedQuestion.tooltip}</p>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold leading-tight">
                              {selectedQuestion.selectedQuestion ||
                                selectedQuestion.question}
                            </h3>
                          </div>
                          <div className="text-center">
                            <p className="text-teal-100 text-sm mb-2">
                              Click card to reveal answer
                            </p>
                            <div className="flex justify-center">
                              <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-bounce flex items-center justify-center">
                                <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of Card - Answer & Guidance */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-teal-600 to-teal-800 rounded-2xl p-8 flex flex-col text-white shadow-xl">
                          <div className="flex justify-between items-start mb-6">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                              {savedAnswers[selectedQuestion.id]
                                ? "Your Answer"
                                : "Answer & Guidance"}
                            </span>
                          </div>

                          <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-6">
                              {/* Show saved answer if it exists */}
                              {savedAnswers[selectedQuestion.id] && (
                                <div>
                                  <h4 className="text-green-200 font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-200 rounded-full"></span>
                                    Your Saved Answer
                                  </h4>
                                  <p className="text-slate-100 leading-relaxed">
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
                                    <h4 className="text-teal-200 font-semibold mb-2 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-teal-200 rounded-full"></span>
                                      Sample Answer
                                    </h4>
                                    <p className="text-slate-100 leading-relaxed">
                                      {selectedQuestion.sampleAnswer}
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="text-blue-200 font-semibold mb-2 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
                                      Guidance
                                    </h4>
                                    <p className="text-slate-200 leading-relaxed">
                                      {selectedQuestion.guidance}
                                    </p>
                                  </div>

                                  {selectedQuestion.tooltip && (
                                    <div>
                                      <h4 className="text-amber-200 font-semibold mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-amber-200 rounded-full"></span>
                                        Tip
                                      </h4>
                                      <p className="text-slate-300 text-sm italic">
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
                            <div className="mt-4 mb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card flip when clicking toggle
                                  setShowSampleAnswerInFlashcard((prev) => ({
                                    ...prev,
                                    [selectedQuestion.id]:
                                      !prev[selectedQuestion.id],
                                  }));
                                }}
                                className="w-full text-teal-100 hover:text-white text-sm font-medium transition-colors underline"
                              >
                                {showSampleAnswerInFlashcard[
                                  selectedQuestion.id
                                ]
                                  ? "Hide Sample"
                                  : "Compare with Sample"}
                              </button>
                            </div>
                          )}

                          {/* NEW: Answer button on back of card */}
                          <div className="mt-6 flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAnswerModal(true);
                              }}
                              className="flex-1 bg-white text-teal-700 hover:bg-teal-50 font-semibold"
                            >
                              {savedAnswers[selectedQuestion.id]
                                ? "Edit Answer"
                                : "Answer This Question"}
                            </Button>
                          </div>

                          <div className="text-center mt-4">
                            <p className="text-slate-300 text-sm">
                              Click card to flip back
                            </p>
                            <div className="flex justify-center mt-2">
                              <div className="w-8 h-8 border-2 border-slate-300 rounded-full animate-bounce flex items-center justify-center">
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            )}

            {/* Rapid Fire Mode */}
            {mode === "rapid" && (
              <div className="w-full">
                <div className="bg-white rounded-xl shadow-lg p-8 min-h-[calc(90vh-2rem)]">
                  <div className="text-center py-12">
                    <Zap className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      Rapid Fire Mode
                    </h3>
                    <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                      Test your interview readiness under time pressure.
                      Questions will appear one by one with a 10-second timer.
                      After time expires, answers will be revealed
                      automatically.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={handleRapidFirePageStart}
                        className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Start Rapid Fire Session
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {mode === "prep" && (
            <div className="mt-8 text-center">
              <Button
                onClick={onRestart}
                className="bg-[#0d7377] hover:bg-[#0a5a5d] text-white px-8 py-6 cursor-pointer text-lg"
              >
                Start New Interview Prep
              </Button>
            </div>
          )}

          {/* NEW: Answer Modal */}
          {showAnswerModal && selectedQuestion && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white flex justify-between items-start flex-shrink-0">
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
                    className="text-white hover:text-teal-100 transition-colors ml-4 flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 scrollbar-premium">
                  <div className="p-6 space-y-6">
                    {/* Sample Answer Reference - Premium Style */}
                    <div className="bg-gradient-to-br from-[#e8f6f6] to-white p-5 rounded-xl border border-[#14a0a6]/20 shadow-sm hover:shadow-md transition-shadow">
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
                            className="absolute top-3 right-3 transition-opacity hover:opacity-80 disabled:opacity-60 cursor-pointer flex-shrink-0"
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
                      <div className="bg-gradient-to-br from-[#e8f6f6] to-white rounded-xl border border-[#14a0a6]/20 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-sm text-[#0d7377] flex items-center gap-2">
                            AI-Improved Version
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-[#14a0a6]/10 text-[#0d7377] font-medium">
                            Review before using
                          </span>
                        </div>
                        <p className="text-sm text-[#0d7377] leading-relaxed mb-4 italic">
                          "{improvedAnswers[selectedQuestion.id]}"
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
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-slate-600">No results found. Please try again.</p>
      <Button
        onClick={onRestart}
        className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
      >
        Restart
      </Button>
    </div>
  );
};
