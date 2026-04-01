"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GeneratedQuestion } from "@/lib/interview-prep";
import confetti from "canvas-confetti";
import { X, RotateCcw, Zap } from "lucide-react";

interface RapidFireModeProps {
  sessionId: string;
  questions: GeneratedQuestion[];
  onExit: () => void;
  onSwitchToPrep: () => void;
}

interface QuestionResponse {
  question: GeneratedQuestion;
  response: "covered" | "partial" | "missed" | "skipped" | null;
  index: number;
}

type ConfettiLevel = "excellent" | "good";

function fireConfetti(level: ConfettiLevel) {
  const isExcellent = level === "excellent";

  const end = Date.now() + (isExcellent ? 4000 : 2000);

  const config = {
    particleCount: isExcellent ? 4 : 1,
    startVelocity: isExcellent ? 60 : 30,
    spread: isExcellent ? 55 : 30,
    colors: ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"],
  };

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      ...config,
      angle: 60,
      origin: { x: 0, y: 0.5 },
    });

    confetti({
      ...config,
      angle: 120,
      origin: { x: 1, y: 0.5 },
    });

    requestAnimationFrame(frame);
  };

  frame();
}

export const RapidFireModePage = ({
  sessionId,
  questions,
  onExit,
  onSwitchToPrep,
}: RapidFireModeProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userResponse, setUserResponse] = useState<
    "covered" | "partial" | "missed" | "skipped" | null
  >(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [skippedQuestions, setSkippedQuestions] = useState<number>(0);
  const [questionResponses, setQuestionResponses] = useState<
    QuestionResponse[]
  >([]);
  const [reviewQuestion, setReviewQuestion] =
    useState<GeneratedQuestion | null>(null);
  const [isReviewFlipped, setIsReviewFlipped] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (totalScore === null || confettiFiredRef.current) return;

    if (totalScore >= 80) {
      fireConfetti("excellent");
    } else if (totalScore >= 60) {
      fireConfetti("good");
    }

    confettiFiredRef.current = true;
  }, [totalScore]);

  const shuffleArray = (array: GeneratedQuestion[]): GeneratedQuestion[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [shuffledQuestions, setShuffledQuestions] = useState<
    GeneratedQuestion[]
  >(() => shuffleArray(questions.filter((q) => q.applicable)));

  const getProgressGradient = (percent: number) => {
    return {
      background: `linear-gradient(to right, #0d9488 ${percent}%, #e5e7eb ${percent}%)`,
    };
  };

  useEffect(() => {
    if (timeLeft > 0 && !showAnswer) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showAnswer) {
      setShowAnswer(true);
      setIsFlipped(true);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, showAnswer]);

  const handleResponse = (response: "covered" | "partial" | "missed") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setUserResponse(response);
    setShowAnswer(true);
    setIsFlipped(true);

    // Store question response for review
    const newResponse: QuestionResponse = {
      question: currentQuestion,
      response,
      index: currentQuestionIndex,
    };

    setQuestionResponses((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.index === currentQuestionIndex,
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      }
      return [...prev, newResponse];
    });

    let points = 0;
    switch (response) {
      case "covered":
        points = 10;
        break;
      case "partial":
        points = 5;
        break;
      case "missed":
        points = 0;
        break;
    }

    const newScore = score + points;
    setScore(newScore);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(10);
      setShowAnswer(false);
      setIsFlipped(false);
      setUserResponse(null);
    } else {
      // Ensure all questions have responses recorded
      const allResponses = [...questionResponses];

      // Add any missing questions as 'missed' (in case they timed out without explicit response)
      // But don't overwrite skipped questions
      for (let i = 0; i < shuffledQuestions.length; i++) {
        const existingResponse = allResponses.find((r) => r.index === i);
        if (!existingResponse) {
          allResponses.push({
            question: shuffledQuestions[i],
            response: "missed",
            index: i,
          });
        } else if (existingResponse.response === "skipped") {
          // Keep skipped responses as is
          continue;
        }
      }

      // Calculate final score based on actual responses
      const coveredCount = allResponses.filter(
        (r) => r.response === "covered",
      ).length;
      const partialCount = allResponses.filter(
        (r) => r.response === "partial",
      ).length;
      const missedCount = allResponses.filter(
        (r) => r.response === "missed",
      ).length;
      const skippedCount = allResponses.filter(
        (r) => r.response === "skipped",
      ).length;

      const totalPoints = coveredCount * 10 + partialCount * 5;
      const maxPossiblePoints = (shuffledQuestions.length - skippedCount) * 10;

      const percentageScore =
        maxPossiblePoints > 0
          ? Math.round((totalPoints / maxPossiblePoints) * 100)
          : 0;

      // Update the state with complete response data
      setQuestionResponses(allResponses);
      setTotalScore(percentageScore);
      saveReadinessScore(percentageScore);
    }
  };

  const saveReadinessScore = async (score: number) => {
    try {
      const userEmail =
        typeof window !== "undefined"
          ? localStorage.getItem("userEmail") || "test@example.com"
          : "test@example.com";
      await fetch(`/api/interview-prep/sessions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-readiness-score",
          userEmail,
          score,
        }),
      });
    } catch (error) {
      console.error("Error saving readiness score:", error);
    }
  };

  const skipQuestion = () => {
    setSkippedQuestions((prev) => prev + 1);

    // Store skipped question response
    const newResponse: QuestionResponse = {
      question: currentQuestion,
      response: "skipped",
      index: currentQuestionIndex,
    };

    setQuestionResponses((prev) => {
      const existingIndex = prev.findIndex(
        (r) => r.index === currentQuestionIndex,
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      }
      return [...prev, newResponse];
    });

    // Reset state and go to next question
    setUserResponse("skipped");
    setShowAnswer(true);
    setIsFlipped(true);
  };

  const restartRapidFire = () => {
    setCurrentQuestionIndex(0);
    setTimeLeft(10);
    setScore(0);
    setShowAnswer(false);
    setIsFlipped(false);
    setUserResponse(null);
    setTotalScore(null);
    setSkippedQuestions(0);
    setQuestionResponses([]);
    setReviewQuestion(null);
    setIsReviewFlipped(false);
    setShuffledQuestions(shuffleArray(questions.filter((q) => q.applicable)));
  };

  // Track timed-out questions properly
  useEffect(() => {
    if (timeLeft === 0 && !showAnswer && userResponse === null) {
      // Check if this question was already recorded as skipped
      const isAlreadySkipped = questionResponses.some(
        (r) => r.index === currentQuestionIndex && r.response === "skipped",
      );

      if (!isAlreadySkipped) {
        // Auto-mark as missed when time expires (only if not already skipped)
        const newResponse: QuestionResponse = {
          question: currentQuestion,
          response: "missed",
          index: currentQuestionIndex,
        };

        setQuestionResponses((prev) => {
          const existingIndex = prev.findIndex(
            (r) => r.index === currentQuestionIndex,
          );
          if (existingIndex >= 0) {
            // Don't overwrite skipped responses
            if (prev[existingIndex].response === "skipped") {
              return prev;
            }
            const updated = [...prev];
            updated[existingIndex] = newResponse;
            return updated;
          }
          return [...prev, newResponse];
        });
      }
    }
  }, [
    timeLeft,
    showAnswer,
    userResponse,
    currentQuestion,
    currentQuestionIndex,
    questionResponses,
  ]);

  const handleReviewQuestionClick = (question: GeneratedQuestion) => {
    setReviewQuestion(question);
    setIsReviewFlipped(false);
  };

  const handleReviewCardClick = () => {
    setIsReviewFlipped(!isReviewFlipped);
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
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
                Exit Rapid Fire
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (totalScore !== null) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Rapid Fire Completed!
            </h1>
            <p className="text-slate-600">
              Your interview readiness assessment
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="w-40 h-40 rounded-full border-8 border-teal-200 flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-teal-700">
                      {Math.round(
                        (score /
                          (shuffledQuestions.length - skippedQuestions)) *
                          10,
                      )}
                      %
                    </span>
                    <div className="text-sm text-teal-600 font-medium mt-1">
                      Readiness Score
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      totalScore >= 80
                        ? "bg-green-100 text-green-800"
                        : totalScore >= 60
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {totalScore >= 80
                      ? "Excellent"
                      : totalScore >= 60
                        ? "Good"
                        : "Needs Practice"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-lg text-slate-700 font-medium">
                  {totalScore >= 80
                    ? "Outstanding interview preparation!"
                    : totalScore >= 60
                      ? "Solid foundation established!"
                      : "Keep practicing to build confidence"}
                </p>
                <p className="text-slate-500">
                  You scored{" "}
                  <span className="font-semibold text-teal-600">{score}</span>{" "}
                  points out of{" "}
                  <span className="font-semibold">
                    {(shuffledQuestions.length - skippedQuestions) * 10}
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

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">
                  {
                    questionResponses.filter((r) => r.response === "covered")
                      .length
                  }
                </div>
                <div className="text-sm text-emerald-700">Covered Well</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="text-2xl font-bold text-amber-600">
                  {
                    questionResponses.filter((r) => r.response === "partial")
                      .length
                  }
                </div>
                <div className="text-sm text-amber-700">Partial Coverage</div>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-100">
                <div className="text-2xl font-bold text-rose-600">
                  {
                    questionResponses.filter((r) => r.response === "missed")
                      .length
                  }
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

            {/* Reviewable Progress Bar */}
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
                  let bgColor = "bg-gray-300"; // Gray for unanswered/skipped

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

            {/* Review Question Card */}
            {reviewQuestion && (
              <div className="mb-8 bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-slate-900">
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
                  className={`relative w-full h-80 cursor-pointer transition-transform duration-700 ease-out-cubic ${
                    isReviewFlipped ? "transform rotate-y-180" : ""
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                  }}
                  onClick={handleReviewCardClick}
                >
                  {/* Front of Card - Question */}
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-6 flex flex-col justify-between text-white shadow-lg">
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
                        {reviewQuestion.selectedQuestion || reviewQuestion.question}
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

                  {/* Back of Card - Answer & Guidance */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-6 flex flex-col text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                        Answer & Guidance
                      </span>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
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

            <div className="flex gap-3 justify-center">
              <Button
                onClick={restartRapidFire}
                className="bg-teal-600 hover:bg-teal-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={onSwitchToPrep}
                className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
              >
                <Zap className="w-4 h-4 mr-2" />
                Switch to Prep Mode
              </Button>
              <Button
                onClick={onExit}
                variant="outline"
                className="cursor-pointer"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-500" />
              Rapid Fire Mode
            </h1>
            <p className="text-slate-600">
              Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right flex gap-2">
              <div className="text-slate-900 font-bold">Score</div>
              <div className="text-lg font-bold text-teal-600">{score} pts</div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </Button>
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

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 min-h-125 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div
              className={`relative w-full h-full min-h-112.5 cursor-pointer transition-transform duration-700 ease-out-cubic ${
                isFlipped ? "transform rotate-y-180" : ""
              }`}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              <div
                className={`absolute inset-0 backface-hidden bg-white rounded-2xl p-8 flex flex-col justify-between text-slate-900 shadow-xl border-4 ${
                  !showAnswer
                    ? timeLeft <= 3
                      ? "border-red-500 animate-pulse"
                      : "border-emerald-500"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentQuestion.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight text-slate-800 mb-8">
                    {currentQuestion.selectedQuestion || currentQuestion.question}
                  </h2>

                  {!showAnswer && (
                    <div className="flex justify-center mt-14">
                      <div className="relative w-44 h-44">
                        {/* Subtle outer ring for depth */}
                        <div
                          className={`absolute inset-0 rounded-full ${timeLeft <= 3 ? "ring-2 ring-red-100" : "ring-2 ring-teal-100"} opacity-50`}
                        ></div>

                        {/* Enhanced circular timer */}
                        <svg
                          className="w-full h-full drop-shadow-sm"
                          viewBox="0 0 176 176"
                        >
                          {/* Background ring with subtle gradient */}
                          <circle
                            cx="88"
                            cy="88"
                            r="76"
                            fill="none"
                            stroke="url(#timerBg)"
                            strokeWidth="6"
                          />

                          {/* Progress ring with smooth animation */}
                          <circle
                            cx="88"
                            cy="88"
                            r="76"
                            fill="none"
                            stroke={
                              timeLeft <= 3
                                ? "url(#timerDanger)"
                                : "url(#timerSuccess)"
                            }
                            strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 76}`}
                            strokeDashoffset={`${2 * Math.PI * 76 * (1 - timeLeft / 10)}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                            transform="rotate(-90 88 88)"
                          />

                          {/* Gradient definitions */}
                          <defs>
                            <linearGradient
                              id="timerBg"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#f1f5f9" />
                              <stop offset="100%" stopColor="#e2e8f0" />
                            </linearGradient>
                            <linearGradient
                              id="timerSuccess"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#0d9488" />
                              <stop offset="100%" stopColor="#0f766e" />
                            </linearGradient>
                            <linearGradient
                              id="timerDanger"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#dc2626" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Enhanced timer display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2">
                            <div
                              className={`text-5xl font-black tracking-tight ${timeLeft <= 3 ? "text-red-600" : "text-teal-600"} transition-all duration-500 ${timeLeft <= 3 ? "scale-105" : ""}`}
                            >
                              {timeLeft}
                            </div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                              seconds
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  {!showAnswer ? (
                    <div className="inline-flex items-center gap-2 text-slate-600">
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                      <span>Preparing your response...</span>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm">
                      Click card to see answer
                    </p>
                  )}
                </div>
              </div>

              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-teal-600 to-teal-800 rounded-2xl p-8 flex flex-col text-white shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    Answer & Guidance
                  </span>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <h4 className="text-teal-200 font-semibold mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-200 rounded-full"></span>
                      Sample Answer
                    </h4>
                    <p className="text-slate-100 leading-relaxed">
                      {currentQuestion.sampleAnswer}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-blue-200 font-semibold mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
                      Guidance
                    </h4>
                    <p className="text-slate-200 leading-relaxed">
                      {currentQuestion.guidance}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <Button
                    onClick={() => handleResponse("covered")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "covered"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-emerald-500 hover:bg-emerald-600"
                    } h-14 flex items-center justify-center`}
                  >
                    <span className="text-sm">Covered Most</span>
                    <span className="text-xs">+10 pts</span>
                  </Button>

                  <Button
                    onClick={() => handleResponse("partial")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "partial"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-amber-500 hover:bg-amber-600"
                    } h-14 flex items-center justify-center`}
                  >
                    <span className="text-sm">Partial</span>
                    <span className="text-xs">+5 pts</span>
                  </Button>

                  <Button
                    onClick={() => handleResponse("missed")}
                    disabled={userResponse !== null}
                    className={`${
                      userResponse === "missed"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-rose-500 hover:bg-rose-600"
                    } h-14 flex items-center justify-center`}
                  >
                    <span className="text-sm">Missed</span>
                    <span className="text-xs">+0 pts</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="float-right items-center">
          <div className="flex gap-3">
            {!showAnswer ? (
              <Button onClick={skipQuestion} variant="outline">
                Skip Question
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={userResponse === null}
              >
                {currentQuestionIndex < shuffledQuestions.length - 1
                  ? "Next Question"
                  : "Finish"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
