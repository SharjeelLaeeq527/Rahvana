"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  GeneratedQuestion,
  InterviewPrepQuestionResponse,
  InterviewPrepRoundSummary,
  InterviewPrepSessionProgressInput,
  InterviewPrepProgressScreen,
} from "@/lib/interview-prep";
import confetti from "canvas-confetti";
import { Zap } from "lucide-react";
import { usePlan } from "@/app/context/PlanContext";
import { Loader } from "@/components/ui/spinner";
import {
  computeQuestionCooldowns,
  QuestionCooldownMap,
  reduceCooldowns,
} from "@/lib/interview-prep/round-engine";
import {
  RapidFireTrainingView,
} from "./RapidFireModePage.views";
import { ResultGate } from "@/app/components/entitlements/ResultGate";

const QUESTIONS_PER_ROUND = 12;

interface RapidFireModeProps {
  sessionId: string;
  questions: GeneratedQuestion[];
  onExit: () => void;
  onSwitchToPrep: () => void;
  savedAnswers?: Record<string, string>;
}

type QuestionResponse = InterviewPrepQuestionResponse;
type AdaptiveScreen = InterviewPrepProgressScreen;
type RoundSummary = InterviewPrepRoundSummary;

interface PersistedAdaptiveTraining {
  sessionId: string;
  currentRound: number;
  completedQuestionIds: string[];
  retryQuestionIds: string[];
  masteredQuestionIds: string[];
  lastRoundScore: number;
  totalRoundsCompleted: number;
  completed: boolean;
  currentQuestionIndex: number;
  timeLeft: number;
  score: number;
  showAnswer: boolean;
  isFlipped: boolean;
  userResponse: QuestionResponse["response"] | null;
  questionResponses: QuestionResponse[];
  shuffledQuestionIds: string[];
  screen: AdaptiveScreen;
  roundSummary: RoundSummary | null;
  skippedQuestions: number;
}

const buildProgressEndpoint = (sessionId: string) =>
  `/api/interview-prep/sessions/${sessionId}/progress`;

const computeRoundSummary = (responses: QuestionResponse[]): RoundSummary => {
  const coveredCount = responses.filter(
    (response) => response.response === "covered",
  ).length;
  const partialCount = responses.filter(
    (response) => response.response === "partial",
  ).length;
  const missedCount = responses.filter(
    (response) => response.response === "missed",
  ).length;
  const skippedCount = responses.filter(
    (response) => response.response === "skipped",
  ).length;

  const earnedPoints = coveredCount * 10 + partialCount * 5;
  const possiblePoints = (coveredCount + partialCount + missedCount) * 10;
  return {
    coveredCount,
    partialCount,
    missedCount,
    skippedCount,
    earnedPoints,
    possiblePoints,
    readinessScore:
      possiblePoints > 0
        ? Math.round((earnedPoints / possiblePoints) * 100)
        : 0,
    weakQuestionIds: responses
      .filter(
        (response) =>
          response.response === "missed" || response.response === "skipped",
      )
      .map((response) => response.question.id),
  };
};

// Round-selection and retry/mastered computation moved to server.
// Client no longer derives retry lists; server endpoint computes next-round payload.

const loadPersistedAdaptiveTraining = async (
  sessionId: string,
): Promise<PersistedAdaptiveTraining | null> => {
  try {
    const response = await fetch(buildProgressEndpoint(sessionId), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const progress = payload?.progress;

    if (!progress) {
      return null;
    }

    return {
      sessionId,
      currentRound: progress.current_round,
      completedQuestionIds: progress.completed_question_ids || [],
      retryQuestionIds: progress.retry_question_ids || [],
      masteredQuestionIds: progress.mastered_question_ids || [],
      lastRoundScore: progress.last_round_score || 0,
      totalRoundsCompleted: progress.total_rounds_completed || 0,
      completed: progress.completed || false,
      currentQuestionIndex: progress.current_question_index || 0,
      timeLeft: progress.time_left || 10,
      score: progress.score || 0,
      showAnswer: progress.show_answer || false,
      isFlipped: progress.is_flipped || false,
      userResponse: progress.user_response || null,
      questionResponses: progress.question_responses || [],
      shuffledQuestionIds: progress.round_question_ids || [],
      screen: progress.screen || "training",
      roundSummary: progress.round_summary || null,
      skippedQuestions: progress.skipped_questions || 0,
    };
  } catch {
    return null;
  }
};

const savePersistedAdaptiveTraining = async (
  state: PersistedAdaptiveTraining,
) => {
  const payload: Partial<InterviewPrepSessionProgressInput> = {
    current_round: state.currentRound,
    current_question_index: state.currentQuestionIndex,
    round_question_ids: state.shuffledQuestionIds,
    completed_question_ids: state.completedQuestionIds,
    retry_question_ids: state.retryQuestionIds,
    mastered_question_ids: state.masteredQuestionIds,
    question_responses: state.questionResponses,
    round_summary: state.roundSummary,
    last_round_score: state.lastRoundScore,
    total_rounds_completed: state.totalRoundsCompleted,
    score: state.score,
    time_left: state.timeLeft,
    show_answer: state.showAnswer,
    is_flipped: state.isFlipped,
    user_response: state.userResponse ?? undefined,
    skipped_questions: state.skippedQuestions,
    screen: state.screen,
    completed: state.completed,
  };

  try {
    await fetch(buildProgressEndpoint(state.sessionId), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort persistence
  }
};

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
  savedAnswers = {},
}: RapidFireModeProps) => {
  const plan = usePlan();
  const isFreeTier = plan.tier === "free";

  const questionsPerRound = isFreeTier ? 5 : QUESTIONS_PER_ROUND;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userResponse, setUserResponse] = useState<
    "covered" | "partial" | "missed" | "skipped" | null
  >(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [screen, setScreen] = useState<AdaptiveScreen>("training");
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [resumeProgress, setResumeProgress] =
    useState<PersistedAdaptiveTraining | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isHydratingProgress, setIsHydratingProgress] = useState(true);
  const [skippedQuestions, setSkippedQuestions] = useState<number>(0);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([]);
  const [reviewQuestion, setReviewQuestion] = useState<GeneratedQuestion | null>(null);
  const [isReviewFlipped, setIsReviewFlipped] = useState(false);
  const [questionCooldowns, setQuestionCooldowns] =
    useState<QuestionCooldownMap>({});

  // States for retry rounds
  const [currentRound, setCurrentRound] = useState(1);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>(
    [],
  );
  const [retryQuestionIds, setRetryQuestionIds] = useState<string[]>([]);
  const [masteredQuestionIds, setMasteredQuestionIds] = useState<string[]>([]);
  const [totalRoundsCompleted, setTotalRoundsCompleted] = useState(0);
  const hasHydratedProgressRef = useRef(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // NOTE: `buildQuestionRound` moved to server-side; client no longer performs full round computation.

  const [shuffledQuestions, setShuffledQuestions] = useState<GeneratedQuestion[]>(() =>
    shuffleArray(questions).filter((q) => q.applicable).slice(0, questionsPerRound),
  );
  const roundQuestionCount = questionsPerRound;
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / roundQuestionCount) * 100;

  const getProgressGradient = (percent: number) => {
    return {
      background: `linear-gradient(to right, #0d9488 ${percent}%, #e5e7eb ${percent}%)`,
    };
  };

  // Track used questions
  useEffect(() => {
    const ids = shuffledQuestions.map((q) => q.id);

    setUsedQuestionIds((prev) => [...new Set([...prev, ...ids])]);
    setCompletedQuestionIds((prev) => [...new Set([...prev, ...ids])]);
  }, [shuffledQuestions]);

  useEffect(() => {
    let cancelled = false;

    const hydrateProgress = async () => {
      setIsHydratingProgress(true);
      const savedProgress = await loadPersistedAdaptiveTraining(sessionId);

      if (cancelled) return;

      if (savedProgress && !savedProgress.completed) {
        // ROUND ALREADY FINISHED -> AUTO START NEXT ROUND
        if (savedProgress.screen === "results") {
          try {
            const resp = await fetch(
              `/api/interview-prep/sessions/${sessionId}/next-round`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  questionResponses: savedProgress.questionResponses,
                  allQuestions: questions,
                  completedQuestionIds: savedProgress.completedQuestionIds,
                  currentRound: savedProgress.currentRound,
                }),
              },
            );

            if (resp.ok) {
              const data = await resp.json();

              setCurrentRound(data.currentRound);
              setShuffledQuestions(data.shuffledQuestions ?? []);
              setRetryQuestionIds(data.retryQuestionIds ?? []);
              setMasteredQuestionIds(data.masteredQuestionIds ?? []);
              setCompletedQuestionIds(data.completedQuestionIds ?? []);
              setQuestionResponses([]);
              setRoundScore(null);
              setScore(0);
              setShowAnswer(false);
              setIsFlipped(false);
              setUserResponse(null);
              setSkippedQuestions(0);
              setCurrentQuestionIndex(0);
              setResumeProgress(null);
              setScreen("training");

              hasHydratedProgressRef.current = true;
              setIsStorageReady(true);
              setIsHydratingProgress(false);

              return;
            }
          } catch (err) {
            console.error("Failed to auto-start next round", err);
          }
        }

        setResumeProgress(savedProgress);
        setScreen(savedProgress.screen);
        setCurrentRound(savedProgress.currentRound);
        setUsedQuestionIds(savedProgress.completedQuestionIds);
        setCompletedQuestionIds(savedProgress.completedQuestionIds);
        setRetryQuestionIds(savedProgress.retryQuestionIds);
        setMasteredQuestionIds(savedProgress.masteredQuestionIds);
        setTotalRoundsCompleted(savedProgress.totalRoundsCompleted);
        setRoundScore(savedProgress.lastRoundScore);
        setTotalScore(savedProgress.lastRoundScore);
        setRoundSummary(savedProgress.roundSummary);
        setSkippedQuestions(savedProgress.skippedQuestions);
        setCurrentQuestionIndex(savedProgress.currentQuestionIndex);
        setTimeLeft(savedProgress.timeLeft);
        setScore(savedProgress.score);
        setShowAnswer(savedProgress.showAnswer);
        setIsFlipped(savedProgress.isFlipped);
        setUserResponse(savedProgress.userResponse);
        setQuestionResponses(savedProgress.questionResponses);

        const restoredQuestions = savedProgress.shuffledQuestionIds
          .map((questionId) =>
            questions.find((question) => question.id === questionId),
          )
          .filter(Boolean) as GeneratedQuestion[];

        if (restoredQuestions.length > 0) {
          setShuffledQuestions(restoredQuestions);
        }
      }

      hasHydratedProgressRef.current = true;
      setIsStorageReady(true);
      setIsHydratingProgress(false);
    };

    void hydrateProgress();

    return () => {
      cancelled = true;
    };
  }, [questions, sessionId]);

  useEffect(() => {
    if (!isStorageReady || !hasHydratedProgressRef.current) {
      return;
    }

    const adaptiveState: PersistedAdaptiveTraining = {
      sessionId,
      currentRound,
      completedQuestionIds,
      retryQuestionIds,
      masteredQuestionIds,
      lastRoundScore: roundScore ?? totalScore ?? 0,
      totalRoundsCompleted,
      completed: screen === "completed",
      currentQuestionIndex,
      timeLeft,
      score,
      showAnswer,
      isFlipped,
      userResponse,
      questionResponses,
      shuffledQuestionIds: shuffledQuestions.map((question) => question.id),
      screen,
      roundSummary,
      skippedQuestions,
    };

    void savePersistedAdaptiveTraining(adaptiveState);
  }, [
    currentQuestionIndex,
    currentRound,
    isFlipped,
    isStorageReady,
    masteredQuestionIds,
    questionResponses,
    roundScore,
    roundSummary,
    retryQuestionIds,
    screen,
    score,
    sessionId,
    shuffledQuestions,
    showAnswer,
    skippedQuestions,
    timeLeft,
    totalRoundsCompleted,
    totalScore,
    userResponse,
    usedQuestionIds,
    completedQuestionIds,
  ]);

  useEffect(() => {
    if (screen !== "training" || isHydratingProgress || !isStorageReady) {
      return;
    }

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
  }, [
    currentQuestion,
    currentQuestionIndex,
    isHydratingProgress,
    isStorageReady,
    screen,
    showAnswer,
    timeLeft,
    userResponse,
  ]);

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

    const responsePoints =
      response === "covered" ? 10 : response === "partial" ? 5 : 0;

    setQuestionResponses((prev) => {
      const existingIndex = prev.findIndex((r) => r.index === currentQuestionIndex);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      }
      return [...prev, newResponse];
    });

    setUsedQuestionIds((prev) => [...new Set([...prev, currentQuestion.id])]);
    setCompletedQuestionIds((prev) => [
      ...new Set([...prev, currentQuestion.id]),
    ]);

    if (response === "covered" || response === "partial") {
      setMasteredQuestionIds((prev) => [
        ...new Set([...prev, currentQuestion.id]),
      ]);

      setRetryQuestionIds((prev) =>
        prev.filter((id) => id !== currentQuestion.id),
      );
    } else if (response === "missed") {
      setRetryQuestionIds((prev) => [
        ...new Set([...prev, currentQuestion.id]),
      ]);
    }

    const previousResponse = questionResponses.find(
      (item) => item.index === currentQuestionIndex,
    );
    const previousPoints =
      previousResponse?.response === "covered"
        ? 10
        : previousResponse?.response === "partial"
          ? 5
          : 0;

    const newScore = score - previousPoints + responsePoints;
    setScore(newScore);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(10);
      setShowAnswer(false);
      setIsFlipped(false);
      setUserResponse(null);
      return;
    }

    finalizeRound();
  };

  const saveReadinessScore = async (scoreToSave: number) => {
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
          score: scoreToSave,
        }),
      });
    } catch (error) {
      console.error("Error saving readiness score:", error);
    }
  };

  const finalizeRound = () => {
    const normalizedResponses: QuestionResponse[] = shuffledQuestions.map(
      (question, index) => {
        const existingResponse = questionResponses.find(
          (response) => response.index === index,
        );

        return (existingResponse ?? {
          question,
          response: "missed",
          index,
        }) as QuestionResponse;
      },
    );

    const summary = computeRoundSummary(normalizedResponses);

    const reducedCooldowns = reduceCooldowns(questionCooldowns);

    const updatedCooldowns = computeQuestionCooldowns(
      normalizedResponses,
      reducedCooldowns,
    );

    setQuestionCooldowns(updatedCooldowns);

    const completedIds = [
      ...new Set([
        ...completedQuestionIds,
        ...normalizedResponses.map((response) => response.question.id),
      ]),
    ];

    const isTrainingComplete =
      summary.weakQuestionIds.length === 0 &&
      questions.filter((q) => q.applicable && !completedIds.includes(q.id))
        .length === 0;

    setQuestionResponses(normalizedResponses);
    setRoundSummary(summary);
    setRoundScore(summary.readinessScore);
    setTotalScore(summary.readinessScore);
    setCompletedQuestionIds(completedIds);
    setSkippedQuestions(summary.skippedCount);
    setScreen(isTrainingComplete ? "completed" : "results");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setTotalRoundsCompleted((prev) => Math.max(prev, currentRound));

    if (isTrainingComplete) {
      fireConfetti(summary.readinessScore >= 80 ? "excellent" : "good");
    }

    saveReadinessScore(summary.readinessScore);
  };

  const startNextRound = async () => {
    if (screen === "completed") return;

    const resp = await fetch(
      `/api/interview-prep/sessions/${sessionId}/next-round`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionResponses,
          allQuestions: questions,
          completedQuestionIds,
          currentRound,
        }),
      },
    );

    if (!resp.ok) {
      console.error("Failed to fetch next round", await resp.text());
      return;
    }

    const data = await resp.json();

    setCurrentRound(data.currentRound ?? currentRound + 1);
    setShuffledQuestions(data.shuffledQuestions ?? []);
    setRetryQuestionIds(data.retryQuestionIds ?? []);
    setMasteredQuestionIds(data.masteredQuestionIds ?? []);
    setCompletedQuestionIds(data.completedQuestionIds ?? []);
    setRoundSummary(data.roundSummary ?? null);
    setTotalScore(data.totalScore ?? totalScore);

    setQuestionResponses([]);
    setRoundScore(null);
    setScore(0);
    setShowAnswer(false);
    setIsFlipped(false);
    setUserResponse(null);
    setSkippedQuestions(0);
    setCurrentQuestionIndex(0);
    setResumeProgress(null);
    setTotalRoundsCompleted((prev) =>
      Math.max(prev, data.currentRound ?? currentRound + 1),
    );

    setScreen(data.isTrainingComplete ? "completed" : "training");
  };

  const skipQuestion = () => {
    setSkippedQuestions((prev) => prev + 1);

    const newResponse: QuestionResponse = {
      question: currentQuestion,
      response: "skipped",
      index: currentQuestionIndex,
    };

    setQuestionResponses((prev) => {
      const existingIndex = prev.findIndex((r) => r.index === currentQuestionIndex);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      }
      return [...prev, newResponse];
    });

    setUserResponse("skipped");
    setShowAnswer(true);
    setIsFlipped(true);
    setUsedQuestionIds((prev) => [...new Set([...prev, currentQuestion.id])]);
    setCompletedQuestionIds((prev) => [
      ...new Set([...prev, currentQuestion.id]),
    ]);
    setRetryQuestionIds((prev) => [...new Set([...prev, currentQuestion.id])]);

    setMasteredQuestionIds((prev) =>
      prev.filter((id) => id !== currentQuestion.id),
    );
  };

  const handleReviewQuestionClick = (question: GeneratedQuestion) => {
    setReviewQuestion(question);
    setIsReviewFlipped(false);
  };

  const handleReviewCardClick = () => {
    setIsReviewFlipped(!isReviewFlipped);
  };

  if (isHydratingProgress) {
    return (
      <div className="flex justify-center items-center my-48">
        <Loader size="md" text="Restoring session..." />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="bg-linear-to-br from-slate-50 to-teal-50 site-main-py site-main-px">
        <div className="">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold mb-4">No Questions Available</h3>
            <p className="text-slate-600 mb-6">
              No applicable questions found for rapid fire mode.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onSwitchToPrep} className="bg-teal-600 hover:bg-teal-700">
                Switch to Prep Mode
              </Button>
              <Button onClick={onExit} variant="outline"></Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resumeProgress && isHydratingProgress) {
    return (
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
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            Restoring Rapid Fire
          </h3>
          <p className="text-slate-500 leading-relaxed">
            Resuming your last round and restoring timer state.
          </p>
        </motion.div>
      </div>
    );
  }

  if (screen === "results" || screen === "completed") {
    return (
      <ResultGate
        feature="interview_rapid_fire"
        title="Rapid Fire Results Ready"
        description="Upgrade to Basic or above to view your readiness score, question breakdown, and performance review."
        minHeight="400px"
      >
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
                      {roundScore ?? totalScore ?? 0}%
                    </span>
                    <div className="text-sm text-teal-600 font-medium mt-1">Readiness Score</div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      (roundScore ?? totalScore ?? 0) >= 80
                        ? "bg-green-100 text-green-800"
                        : (roundScore ?? totalScore ?? 0) >= 60
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {(roundScore ?? totalScore ?? 0) >= 80
                      ? "Excellent"
                      : (roundScore ?? totalScore ?? 0) >= 60
                        ? "Good"
                        : "Needs Practice"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-lg text-slate-700 font-medium">
                  {(roundScore ?? totalScore ?? 0) >= 80
                    ? "Outstanding interview preparation!"
                    : (roundScore ?? totalScore ?? 0) >= 60
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
                      {/* Front of Card - Question */}
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

                      {/* Back of Card - Answer & Guidance */}
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

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  onExit();
                }}
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
              {/* <Button
                onClick={restartRapidFire}
                variant="outline"
                className="cursor-pointer"
              >
                Restart Training
              </Button> */}
            </div>
          </div>
        </div>
      </div>
      </ResultGate>
    );
  }

  return (
    <RapidFireTrainingView
      currentRound={currentRound}
      currentQuestionIndex={currentQuestionIndex}
      roundQuestionCount={roundQuestionCount}
      score={score}
      progress={progress}
      currentQuestion={currentQuestion}
      timeLeft={timeLeft}
      showAnswer={showAnswer}
      isFlipped={isFlipped}
      userResponse={userResponse}
      savedAnswers={savedAnswers}
      onHandleResponse={handleResponse}
      onSkipQuestion={skipQuestion}
      onNextQuestion={nextQuestion}
      getProgressGradient={getProgressGradient}
    />
  );
};

