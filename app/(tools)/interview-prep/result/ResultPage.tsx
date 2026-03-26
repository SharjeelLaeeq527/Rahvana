"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Info, Shuffle, Zap } from "lucide-react";
import { InterviewPrepOutput, GeneratedQuestion } from "@/lib/interview-prep";
import { RapidFireModePage } from "../rapid-fire/RapidFireModePage";
import { Loader } from "@/components/ui/spinner";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] =
    useState<GeneratedQuestion | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showRapidFirePage, setShowRapidFirePage] = useState(false);

  const [questionsList, setQuestionsList] = useState<GeneratedQuestion[]>([]);
  const [mode, setMode] = useState<"prep" | "rapid">("prep");

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
    }
  }, [results]);

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
      />
    );
  }

  if (results && results.questions) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 p-6">
        <div className="max-w-7xl">
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

          {/* Action Button - Only show in prep mode */}
          {mode === "prep" && (
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle Questions
              </Button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Questions Sidebar - Only in prep mode */}
            {mode === "prep" && !sidebarCollapsed && (
              <div className="lg:w-2/5">
                <div className="bg-white rounded-xl shadow-lg p-6 h-[calc(90vh-1rem)] sticky top-6">
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
                                  {item.question}
                                </p>
                                <div className="mt-2">
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
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
                className={`${sidebarCollapsed ? "lg:w-11/12" : "lg:w-3/5"}`}
              >
                <div className="bg-white rounded-xl shadow-lg p-8 min-h-[calc(90vh-2rem)] flex items-center justify-center">
                  {/* CASE 1: No questions */}
                  {questionsList.length === 0 ? (
                    <div className="text-center text-slate-500">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium mb-2">
                        No Questions Available
                      </h3>
                      <p className="max-w-md mx-auto">
                        We couldn&apos;t find any relevant questions based on your
                        responses. Try restarting and adjusting your answers for
                        better results.
                      </p>

                      <Button
                        onClick={onRestart}
                        className="mt-6 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : /* CASE 2: Question selected */
                  selectedQuestion ? (
                    <div className="w-full max-w-2xl">
                      <div
                        className={`relative w-full h-full min-h-143.75 cursor-pointer transition-transform duration-700 ease-out-cubic ${
                          isFlipped ? "transform rotate-y-180" : ""
                        }`}
                        style={{
                          transformStyle: "preserve-3d",
                          perspective: "1000px",
                        }}
                        onClick={handleCardClick}
                      >
                        {/* Front */}
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
                                      <Info size={14} />
                                      Tip
                                    </div>
                                    <p>{selectedQuestion.tooltip}</p>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <h3 className="text-2xl font-bold leading-tight">
                              {selectedQuestion.question}
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

                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-teal-600 to-teal-800 rounded-2xl p-8 flex flex-col text-white shadow-xl">
                          <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-teal-200 font-semibold mb-2">
                                  Suggested Answer
                                </h4>
                                <p className="text-slate-100">
                                  {selectedQuestion.suggestedAnswer}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-blue-200 font-semibold mb-2">
                                  Guidance
                                </h4>
                                <p className="text-slate-200">
                                  {selectedQuestion.guidance}
                                </p>
                              </div>

                              {selectedQuestion.tooltip && (
                                <div>
                                  <h4 className="text-amber-200 font-semibold mb-2">
                                    Tip
                                  </h4>
                                  <p className="text-slate-300 text-sm italic">
                                    {selectedQuestion.tooltip}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>

                          <div className="text-center mt-4">
                            <p className="text-slate-300 text-sm">
                              Click card to flip back
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CASE 3: Questions exist but none selected */
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
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 cursor-pointer text-lg"
              >
                Start New Interview Prep
              </Button>
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
