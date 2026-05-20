"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useVoiceEngine } from "@/lib/interview-prep/useVoiceEngine";
import {
  generateSessionReport,
  type InterviewSession,
  type SessionEndReason,
  type SessionEvent,
} from "@/lib/interview-prep/analyticsEngine";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListChecks,
  Mic,
  MicOff,
  Play,
  ShieldCheck,
  Timer,
  X,
  TrendingUp,
} from "lucide-react";
import { GeneratedQuestion } from "@/lib/interview-prep";

interface MockInterviewModePageProps {
  sessionId?: string;
  questions: GeneratedQuestion[];
  onExit: () => void;
}

interface FullscreenElementLike extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

interface QuestionRecord {
  transcript: string;
  durationSeconds: number;
  skipped: boolean;
}

const TOTAL_SECONDS = 15 * 60;

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
};

export function MockInterviewModePage({
  questions,
  onExit,
  sessionId,
}: MockInterviewModePageProps) {
  // reference sessionId to avoid unused-variable compile errors (kept for telemetry/analytics)
  void sessionId;
  const interviewQuestions = useMemo(() => {
    // Base: filter applicable and sort by explicit order (fallback 9999)
    const base = questions
      .filter((question) => question.applicable)
      .slice()
      .sort(
        (a, b) =>
          (a.mockInterviewOrder ?? 9999) - (b.mockInterviewOrder ?? 9999),
      );

    // Helper to remove and return items by id list
    const extractByIds = (arr: typeof base, ids: string[]) => {
      const map = new Map<string, (typeof arr)[0]>();
      for (const id of ids) {
        const idx = arr.findIndex((q) => q.id === id);
        if (idx !== -1) {
          map.set(id, arr.splice(idx, 1)[0]);
        }
      }
      return map;
    };

    // Desired timeline sequence (will be moved together)
    const timelineOrder = [
      "relationship-timeline-started",
      "relationship-origin-first-meeting", // meet in person
      "relationship-timeline-engagement",
      "basic-case-marriage-timing", // when did you get married
      "relationship-timeline-walkthrough",
    ];

    const timelineMap = extractByIds(base, timelineOrder);

    // Insert timeline after the relationship-origin-how question if present
    const anchorIdx = base.findIndex((q) => q.id === "relationship-origin-how");
    const insertAt = anchorIdx === -1 ? 0 : anchorIdx + 1;
    const timelineItems = timelineOrder
      .map((id) => timelineMap.get(id))
      .filter(Boolean) as typeof base;
    base.splice(insertAt, 0, ...timelineItems);

    // Move finance-related questions earlier (after spouse family block)
    const financeIds = [
      "employment-spouse",
      "spouse-education",
      "petitioner-household",
      "finances-support",
      "finances-shared",
    ];
    const financeMap = extractByIds(base, financeIds);
    const financeAnchor = base.findIndex(
      (q) => q.id === "spouse-family-members",
    );
    const financeInsertAt = financeAnchor === -1 ? 3 : financeAnchor + 1;
    const financeItems = financeIds
      .map((id) => financeMap.get(id))
      .filter(Boolean) as typeof base;
    base.splice(financeInsertAt, 0, ...financeItems);

    // Promote a set of very-common IR-1 questions if present in the bank
    const commonPromoteIds = [
      "spouse-dob",
      "spouse-current-location",
      "spouse-live-with",
      "spouse-address",
      "last-time-talked",
      "recent-talk-content",
      "marriage-type",
      "who-proposed-first",
      "why-choose-this-person",
      "last-visit-date",
      "last-visit-duration",
      "spouse-workplace",
      "spouse-working-hours",
    ];
    const commonMap = extractByIds(base, commonPromoteIds);
    const commonAnchor = base.findIndex((q) => q.id === "spouse-age");
    const commonInsertAt = commonAnchor === -1 ? 2 : commonAnchor + 1;
    const commonItems = commonPromoteIds
      .map((id) => commonMap.get(id))
      .filter(Boolean) as typeof base;
    base.splice(commonInsertAt, 0, ...commonItems);

    return base;
  }, [questions]);

  const [phase, setPhase] = useState<
    "intro" | "opening" | "running" | "closing" | "completed"
  >("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SECONDS);
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [focusWarningMessage, setFocusWarningMessage] = useState<string | null>(
    null,
  );
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAnsweringFlowModal, setShowAnsweringFlowModal] = useState(false);
  const [answeringFlowMode, setAnsweringFlowMode] = useState<
    "toggle" | "pushToTalk"
  >("toggle");
  const [questionRecords, setQuestionRecords] = useState<
    Record<string, QuestionRecord>
  >({});
  const [sessionEndReason, setSessionEndReason] =
    useState<SessionEndReason | null>(null);

  const {
    canvasRef: waveformCanvasRef,
    voiceState,
    isListening,
    micUnsupported,
    micError,
    silenceNotice,
    currentTranscript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  } = useVoiceEngine({
    vadConfig: {
      speechThreshold: 0.06,
      silenceDelayMs: 1200,
      minSpeechDurationMs: 300,
      silenceActionDelayMs: 2500,
    },
  });

  const recordsRef = useRef<Record<string, QuestionRecord>>({});
  const activeQuestionIdRef = useRef<string>("");
  const questionStartRef = useRef<number>(Date.now());
  const phaseRef = useRef(phase);
  const warningTimestampRef = useRef(0);
  const justStartedRef = useRef(false);
  const exitRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const warningHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const explicitExitRef = useRef(false);
  const showExitModalRef = useRef(false);
  const exitViaConfirmRef = useRef(false);
  const skipFullscreenExitPromptRef = useRef(false);

  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const progressPercent =
    interviewQuestions.length > 0
      ? ((currentQuestionIndex + 1) / interviewQuestions.length) * 100
      : 0;

  const completedCount = Object.values(questionRecords).filter(
    (record) => record.transcript.trim().length > 0,
  ).length;
  const skippedCount = Object.values(questionRecords).filter(
    (record) => record.skipped,
  ).length;
  const averageResponseTime =
    Object.values(questionRecords).length > 0
      ? Math.round(
          Object.values(questionRecords).reduce(
            (sum, record) => sum + record.durationSeconds,
            0,
          ) / Object.values(questionRecords).length,
        )
      : 0;

  const timeProgressPercent =
    ((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100;

  const voiceStatusLabel =
    voiceState === "speaking"
      ? "Speaking"
      : voiceState === "silence"
        ? "Silence"
        : voiceState === "listening"
          ? "Listening"
          : "Paused";

  const finalizeCurrentQuestion = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    const responseText = currentTranscript;
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - questionStartRef.current) / 1000),
    );

    const record: QuestionRecord = {
      transcript: responseText,
      durationSeconds,
      skipped: responseText.trim().length === 0,
    };

    const nextRecords = {
      ...recordsRef.current,
      [currentQuestion.id]: record,
    };

    recordsRef.current = nextRecords;
    setQuestionRecords(nextRecords);
  }, [currentQuestion, currentTranscript]);

  const completeInterview = useCallback(
    (endReason: SessionEndReason = "completed") => {
      if (phaseRef.current !== "running") {
        return;
      }

      setSessionEndReason(endReason);

      stopListening();

      // If ending due to time or focus, skip closing flow and go straight to completion
      if (endReason === "aborted_time" || endReason === "aborted_focus") {
        phaseRef.current = "completed";
        setPhase("completed");
        clearTranscript();
        return;
      }

      // Normal completion: proceed to closing flow
      phaseRef.current = "closing";
      setPhase("closing");
      clearTranscript();
      questionStartRef.current = Date.now();
    },
    [clearTranscript, stopListening],
  );

  const requestDocumentFullscreen = async () => {
    try {
      const elem = document.documentElement as FullscreenElementLike;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
    } catch {
      // best-effort
    }
  };

  const ensureMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // immediately release temporary stream
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch {
      return false;
    }
  };

  const isDocumentFullscreenActive = () =>
    Boolean(
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element | null })
        .webkitFullscreenElement,
    );

  const proceedToRun = async () => {
    recordsRef.current = {};
    activeQuestionIdRef.current = interviewQuestions[0]?.id || "";
    questionStartRef.current = Date.now();
    phaseRef.current = "running";
    setPhase("running");
    setCurrentQuestionIndex(0);
    setSecondsRemaining(TOTAL_SECONDS);
    setQuestionRecords({});
    setFocusWarnings(0);
    setFocusWarningMessage(null);
    warningTimestampRef.current = Date.now() + 1500;

    // IMPORTANT:
    // Pre-request microphone permission BEFORE push-to-talk starts.
    // Otherwise the first Space press causes fullscreen exit.
    skipFullscreenExitPromptRef.current = true;

    try {
      await ensureMicrophonePermission();

      if (!isDocumentFullscreenActive()) {
        await requestDocumentFullscreen();
      }
    } catch {
      // best effort
    } finally {
      skipFullscreenExitPromptRef.current = false;
    }
  };

  const startInterview = async () => {
    if (interviewQuestions.length === 0) {
      setPhase("completed");
      return;
    }

    // Switch UI immediately so intro screen does not linger during async setup.
    setSessionEndReason(null);
    phaseRef.current = "opening";
    setPhase("opening");
    questionStartRef.current = Date.now();
    clearTranscript();

    skipFullscreenExitPromptRef.current = true;
    try {
      await requestDocumentFullscreen();
    } finally {
      skipFullscreenExitPromptRef.current = false;
    }
  };

  const handleBeginInterviewClick = () => {
    setShowAnsweringFlowModal(true);
  };

  const exitInterview = () => {
    exitViaConfirmRef.current = true;
    explicitExitRef.current = true;
    stopListening();

    // Mark session as manually exited (unless already marked as focus abort)
    if (sessionEndReason !== "aborted_focus") {
      setSessionEndReason("aborted_manual");
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }

    onExit();
  };

  const advanceQuestion = () => {
    if (phaseRef.current !== "running" || !currentQuestion) {
      return;
    }

    finalizeCurrentQuestion();

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= interviewQuestions.length) {
      completeInterview();
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    activeQuestionIdRef.current = interviewQuestions[nextIndex].id;
    questionStartRef.current = Date.now();
    clearTranscript();
    // Do not auto-start listening for the next question — user must opt in.
  };

  const handleListeningToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    questionStartRef.current = Date.now();
    void startListening();
  }, [isListening, startListening, stopListening]);

  const registerFocusWarning = useCallback(() => {
    if (phaseRef.current !== "running") {
      return;
    }

    const now = Date.now();
    if (now - warningTimestampRef.current < 1500) {
      return;
    }

    warningTimestampRef.current = now;

    setFocusWarnings((previous) => {
      const nextWarningCount = previous + 1;
      if (nextWarningCount > 2) {
        completeInterview("aborted_focus");
      } else {
        setFocusWarningMessage(
          "Please stay focused during the mock interview.",
        );
      }

      return nextWarningCount;
    });
  }, [completeInterview]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (phaseRef.current !== "running") return;

      if (skipFullscreenExitPromptRef.current) {
        return;
      }

      if (explicitExitRef.current) {
        explicitExitRef.current = false;
        return;
      }

      if (!isDocumentFullscreenActive()) {
        stopListening();
        showExitModalRef.current = true;
        setShowExitModal(true);
        void requestDocumentFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [stopListening]);

  const resumeInterview = async () => {
    skipFullscreenExitPromptRef.current = true;
    try {
      showExitModalRef.current = false;
      setShowExitModal(false);
      explicitExitRef.current = false;
      exitViaConfirmRef.current = false;

      await startListening();
      await requestDocumentFullscreen();
    } finally {
      skipFullscreenExitPromptRef.current = false;
    }
  };

  const handleExitModalOpenChange = (open: boolean) => {
    if (!open) {
      if (!exitViaConfirmRef.current) {
        void resumeInterview();
        return;
      }
      exitViaConfirmRef.current = false;
    }

    if (open) {
      showExitModalRef.current = true;
    }

    setShowExitModal(open);
  };

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (
        event.code === "Space" &&
        !isTypingTarget &&
        phaseRef.current === "running"
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (event.repeat && answeringFlowMode === "pushToTalk") {
          return;
        }

        if (answeringFlowMode === "pushToTalk") {
          if (!isListening) {
            void startListening();
          }
        } else {
          handleListeningToggle();
        }
        return;
      }

      const wantsRefresh =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

      if (wantsRefresh) {
        event.preventDefault();
        event.stopPropagation();

        stopListening();
        showExitModalRef.current = true;
        setShowExitModal(true);
        return;
      }

      const isEscape = event.key === "Escape" || event.code === "Escape";

      if (
        isEscape &&
        phaseRef.current === "running" &&
        !showExitModalRef.current
      ) {
        if (isDocumentFullscreenActive()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        stopListening();
        showExitModalRef.current = true;
        setShowExitModal(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (
        event.code === "Space" &&
        !isTypingTarget &&
        phaseRef.current === "running" &&
        answeringFlowMode === "pushToTalk"
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        stopListening();
      }
    };

    window.addEventListener("keydown", onKeyDown, {
      capture: true,
      passive: false,
    });
    window.addEventListener("keyup", onKeyUp, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown, {
        capture: true,
      });
      window.removeEventListener("keyup", onKeyUp, {
        capture: true,
      });
    };
  }, [
    answeringFlowMode,
    handleListeningToggle,
    isListening,
    phase,
    startListening,
    stopListening,
  ]);

  useEffect(() => {
    showExitModalRef.current = showExitModal;
  }, [showExitModal]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          finalizeCurrentQuestion();
          completeInterview("aborted_time");
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completeInterview, finalizeCurrentQuestion, phase]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        registerFocusWarning();
      }
    };

    const onBlur = () => {
      if (justStartedRef.current) {
        justStartedRef.current = false;
        return;
      }
      registerFocusWarning();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [phase, registerFocusWarning]);

  useEffect(() => {
    if (!focusWarningMessage) {
      return;
    }

    if (warningHideTimerRef.current) {
      clearTimeout(warningHideTimerRef.current);
    }

    warningHideTimerRef.current = setTimeout(() => {
      setFocusWarningMessage(null);
    }, 3000);

    return () => {
      if (warningHideTimerRef.current) {
        clearTimeout(warningHideTimerRef.current);
      }
    };
  }, [focusWarningMessage]);

  useEffect(() => {
    const exitTimer = exitRedirectTimerRef.current;
    return () => {
      if (exitTimer) {
        clearTimeout(exitTimer);
      }

      if (warningHideTimerRef.current) {
        clearTimeout(warningHideTimerRef.current);
      }

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, []);

  // Opening/closing are now rendered inside the main interview UI below

  if (phase === "intro") {
    return (
      <div className="guide-grid-bg relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e8f6f6] via-white to-slate-50 flex items-center justify-center px-4 py-12 sm:py-16">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[#32e0c4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#0d7377]/10 blur-3xl" />

        <div className="relative w-full max-w-2xl">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(13,115,119,0.25)] p-8 sm:p-10">
            <div className="text-center mb-10">
              <h2 className="text-4xl sm:text-5xl font-semibold text-slate-900 mb-4 tracking-tight">
                Mock Interview Mode
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                Step into a focused, distraction-free environment and rehearse
                with realistic pacing and live voice transcription.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                {
                  icon: Clock,
                  title: "15-Minute Session",
                  desc: "Realistic interview pacing",
                },
                {
                  icon: Mic,
                  title: "Voice Answering",
                  desc: "Live, accurate transcription",
                },
                {
                  icon: ShieldCheck,
                  title: "Focus Tracked",
                  desc: "Stay present, stay sharp",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white hover:border-[#14a0a6]/40 hover:shadow-[0_8px_24px_-12px_rgba(13,115,119,0.2)] transition p-4"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f6f6] border border-[#0d7377]/15 mb-3 group-hover:bg-[#0d7377] transition">
                    <item.icon className="h-[18px] w-[18px] text-[#0d7377] group-hover:text-white transition" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#0d7377]/15 bg-[#e8f6f6]/60 p-4 mb-8">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-[#0d7377]">
                  Heads up —{" "}
                </span>
                this mode uses your existing prepared questions. The session
                will enter fullscreen and listen for your voice.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onExit}
                variant="outline"
                className="flex-1 h-12 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBeginInterviewClick}
                className="flex-1 h-12 bg-[#0d7377] hover:bg-[#14a0a6] text-white font-semibold shadow-[0_10px_30px_-12px_rgba(13,115,119,0.6)]"
              >
                <Play className="h-4 w-4 mr-2" />
                Begin Interview
              </Button>
            </div>
          </div>

          {showAnsweringFlowModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
              <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-slate-900">
                    Choose your answering flow
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Pick the control style you want before entering fullscreen.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setAnsweringFlowMode("toggle")}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      answeringFlowMode === "toggle"
                        ? "border-[#0d7377] bg-[#e8f6f6]"
                        : "border-slate-200 bg-white hover:border-[#0d7377]/30 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#0d7377]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            answeringFlowMode === "toggle"
                              ? "bg-[#0d7377]"
                              : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          Flow 1: Button or Space Toggle
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Use the answer button or press Space to start and
                          stop.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnsweringFlowMode("pushToTalk")}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      answeringFlowMode === "pushToTalk"
                        ? "border-[#0d7377] bg-[#e8f6f6]"
                        : "border-slate-200 bg-white hover:border-[#0d7377]/30 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#0d7377]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            answeringFlowMode === "pushToTalk"
                              ? "bg-[#0d7377]"
                              : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          Flow 2: Hold Space to Talk
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Hold Space to speak and release to stop, while the
                          answer button still works.
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-[#0d7377]/10 px-2.5 py-1 text-xs font-medium text-[#0d7377]">
                          Recommended
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="h-12 flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowAnsweringFlowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-12 flex-1 bg-[#0d7377] text-white font-semibold hover:bg-[#14a0a6]"
                    onClick={() => {
                      setShowAnsweringFlowModal(false);
                      void startInterview();
                    }}
                  >
                    Continue to Interview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  //  COMPLETED PHASE
  if (phase === "completed") {
    // Build canonical session log from questionRecords
    const buildSessionLog = (): InterviewSession => {
      const events: SessionEvent[] = [];
      let eventId = 0;

      // Add question events (only those in interviewQuestions)
      for (const question of interviewQuestions) {
        const record = questionRecords[question.id];
        if (record) {
          events.push({
            id: `event-${eventId++}`,
            type: "question",
            questionId: question.id,
            transcript: record.transcript,
            durationSeconds: record.durationSeconds,
            skipped: record.skipped,
            timestamp: Date.now(), // approximate
          });
        }
      }

      return {
        sessionId: sessionId || "local-session",
        events,
        focusWarnings,
        sessionEndReason: sessionEndReason || "completed",
        startedAt: Date.now() - TOTAL_SECONDS * 1000, // approximate
        endedAt: Date.now(),
      };
    };

    // Generate robust report
    const session = buildSessionLog();
    const report = generateSessionReport(session, interviewQuestions.length);

    const { metrics, insights, validity } = report;

    return (
      <div className="guide-grid-bg relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e8f6f6] via-white to-slate-50 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[#32e0c4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#0d7377]/10 blur-3xl" />

        <div className="relative w-full max-w-3xl">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(13,115,119,0.25)] p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f6f6] border border-[#0d7377]/20">
                <CheckCircle2 className="h-8 w-8 text-[#0d7377]" />
              </div>
              <h2 className="text-4xl font-semibold text-slate-900 mb-2 tracking-tight">
                Session Complete
              </h2>
              <p className="text-slate-500">
                {report.sessionEndReason === "completed"
                  ? "Your performance analysis"
                  : "Session Summary"}
              </p>
            </div>

            {/* Session Snapshot */}
            <div className="rounded-2xl border border-[#0d7377]/15 bg-[#e8f6f6]/50 p-5 mb-6">
              <p className="text-sm leading-relaxed text-slate-800">
                {insights.snapshot}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  label: "Attempted",
                  value: metrics.attemptedQuestions,
                },
                {
                  label: "Completion",
                  value:
                    report.sessionEndReason === "completed"
                      ? `${Math.round(metrics.completionRate)}%`
                      : "Partial",
                },
                {
                  label: "Avg Response",
                  value: `${metrics.avgResponseTime}s`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-center"
                >
                  <div className="text-3xl font-semibold text-slate-900 tracking-tight">
                    {stat.value}
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mt-1.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Validity Notice (for partial sessions) */}
            {!validity.isFullSession && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 mb-6">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Note:</span> This analysis is
                  based on a
                  {report.sessionEndReason === "aborted_focus"
                    ? " focus-limited"
                    : report.sessionEndReason === "aborted_time"
                      ? " time-limited"
                      : " partial"}{" "}
                  session. Complete future sessions for comprehensive feedback.
                </p>
              </div>
            )}

            {/* Strengths */}
            {insights.strengths.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  Your Strengths
                </h3>
                <div className="space-y-2">
                  {insights.strengths.map((strength, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900"
                    >
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Needs Improvement */}
            {insights.improvements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  Areas to Improve
                </h3>
                <div className="space-y-2">
                  {insights.improvements.map((improvement, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900"
                    >
                      {improvement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Practice Focus */}
            {insights.nextFocus.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  Next Practice Focus
                </h3>
                <div className="space-y-2">
                  {insights.nextFocus.map((focus, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm text-blue-900 flex items-start gap-2"
                    >
                      <span className="text-blue-600 font-semibold mt-0.5">
                        •
                      </span>
                      <span>{focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setPhase("intro");
                  setSessionEndReason(null);
                }}
                variant="outline"
                className="flex-1 h-12 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                Try Again
              </Button>
              <Button
                onClick={onExit}
                className="flex-1 h-12 bg-[#0d7377] hover:bg-[#14a0a6] text-white font-semibold shadow-[0_10px_30px_-12px_rgba(13,115,119,0.6)]"
              >
                Back to Prep
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  RUNNING PHASE - fullscreen
  const isPhaseOpening = phase === "opening";
  const isPhaseClosing = phase === "closing";

  const sidebarStats = [
    {
      icon: ListChecks,
      label: "Answered",
      value: `${completedCount}`,
      hint: `${skippedCount} skipped`,
    },
    {
      icon: ShieldCheck,
      label: "Focus warnings",
      value: `${focusWarnings}/2`,
      hint: focusWarnings === 0 ? "Stay present" : "Keep focused",
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex flex-col bg-gradient-to-br from-[#e8f6f6] via-white to-slate-50 text-slate-900">
      {/* ambient color */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#32e0c4]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[26rem] w-[26rem] rounded-full bg-[#0d7377]/5 blur-3xl" />

      {/* Alerts */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2 max-w-sm">
        {focusWarningMessage && (
          <div className="pointer-events-auto w-full rounded-xl border border-amber-200 bg-amber-50/95 backdrop-blur-md p-3 flex items-start gap-3 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-900">{focusWarningMessage}</p>
          </div>
        )}
        {micError && (
          <div className="pointer-events-auto w-full max-w-md rounded-xl border border-red-200 bg-red-50/95 backdrop-blur-md p-3 flex items-start gap-3 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-900">{micError}</p>
          </div>
        )}
      </div>

      {/* HEADER */}
      <header className="relative shrink-0 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 px-4 sm:px-8 py-3.5">
          {/* Left: exit */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopListening();
                showExitModalRef.current = true;
                setShowExitModal(true);
              }}
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition"
              aria-label="Exit interview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Center: title */}
          <div className="flex-1 flex justify-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Mock Interview Mode
            </h2>
          </div>

          {/* Right: timer */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-3 sm:px-4 py-2 transition ${
                secondsRemaining < 60
                  ? "border-red-200 bg-red-50"
                  : "border-[#0d7377]/15 bg-[#e8f6f6]"
              }`}
            >
              <Timer
                className={`h-4 w-4 ${
                  secondsRemaining < 60
                    ? "text-red-600 animate-pulse"
                    : "text-[#0d7377]"
                }`}
              />
              <div className="leading-none">
                <div
                  className={`text-xl sm:text-2xl font-semibold tabular-nums tracking-tight ${
                    secondsRemaining < 60 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {formatTime(secondsRemaining)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#0d7377] via-[#14a0a6] to-[#32e0c4] transition-all duration-300"
            style={{
              width: `${Math.max(progressPercent, timeProgressPercent)}%`,
            }}
          />
        </div>
      </header>

      {/* MAIN */}
      <main
        className={`relative flex-1 min-h-0 ${
          isPhaseOpening || isPhaseClosing ? "overflow-hidden" : "overflow-auto"
        }`}
      >
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-8 py-6 sm:py-8">
          {isPhaseOpening && (
            <div className="flex items-center justify-center min-h-[70vh] px-4">
              <div className="w-full max-w-2xl">
                <div className="bg-white border-2 border-[#14a0a6] rounded-2xl shadow-xl p-8 md:p-10">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#14a0a6] font-semibold text-center rounded-full bg-white/10 border border-white/20">
                    Mock Interview Intro
                  </p>

                  <div className="mt-4 space-y-4 text-sm text-gray-700 leading-relaxed font-medium">
                    <p>
                      Greetings, and welcome to your mock immigrant visa
                      interview.
                    </p>
                    <p>
                      My name is Officer Sandro, and I will be conducting your
                      interview today. Please answer each question clearly and
                      naturally, as you would during an actual visa interview.
                    </p>
                    <p>Let&apos;s begin.</p>
                  </div>

                  <button
                    onClick={() => {
                      void proceedToRun();
                    }}
                    className="mt-8 w-full py-3 rounded-xl font-semibold text-white shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPhaseClosing && (
            <div className="flex items-center justify-center min-h-[70vh] px-4">
              <div className="w-full max-w-2xl">
                <div className="bg-white border-2 border-[#14a0a6] rounded-2xl shadow-xl p-8 md:p-10">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#14a0a6] font-semibold text-center rounded-full bg-white/10 border border-white/20">
                    Interview Complete
                  </p>

                  <div className="mt-4 space-y-4 text-sm text-gray-700 leading-relaxed font-medium">
                    <p>Thank you. That concludes your interview.</p>
                    <p>
                      Your responses have been recorded for performance
                      evaluation. You may now review your interview summary and
                      feedback.
                    </p>
                    <p>Have a good day.</p>
                  </div>

                  <button
                    onClick={() => {
                      phaseRef.current = "completed";
                      setPhase("completed");
                      clearTranscript();
                    }}
                    className="mt-8 w-full py-3 rounded-xl font-semibold text-white shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
                    }}
                  >
                    Continue to Summary
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "running" && currentQuestion && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* LEFT: Stats column */}
              <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-3 lg:mt-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.1)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0d7377]">
                    Progress
                  </p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-sm text-slate-400">
                      / {interviewQuestions.length}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0d7377] to-[#32e0c4] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Questions remaining:{" "}
                    {interviewQuestions.length - (currentQuestionIndex + 1)}
                  </p>
                </div>

                {sidebarStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.08)] hover:border-[#14a0a6]/40 transition"
                  >
                    <div className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {stat.label}
                      </p>
                      <p className="text-base font-semibold text-slate-900 truncate">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {stat.hint}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Avg response card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.08)] hover:border-[#14a0a6]/40 transition">
                  <div className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                    <TrendingUp className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Avg Response
                    </p>

                    <p className="text-base font-semibold text-slate-900">
                      {averageResponseTime}s
                    </p>

                    <p className="text-[11px] text-slate-400">per question</p>
                  </div>
                </div>
              </aside>

              {/* RIGHT: Question + transcript */}
              <section className="flex-1 min-w-0 w-full flex flex-col">
                <div className="mb-2 -mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e8f6f6] border border-[#0d7377]/15 text-[#0d7377] text-[11px] font-semibold rounded-full uppercase tracking-wider">
                    {currentQuestion.category}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_8px_30px_-16px_rgba(13,115,119,0.18)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
                    Current Question
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug tracking-tight">
                    {currentQuestion.selectedQuestion ||
                      currentQuestion.question}
                  </h3>
                </div>

                {/* Transcript card */}
                <div className="mt-5 h-[320px] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-20px_rgba(13,115,119,0.2)] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          {voiceStatusLabel}
                        </p>

                        {/* Live waveform canvas */}
                        <canvas
                          ref={waveformCanvasRef}
                          width={140}
                          height={28}
                          className={`ml-2 rounded transition-opacity duration-300 ${isListening ? "opacity-100" : "opacity-0"}`}
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 uppercase tracking-wider hidden sm:block">
                      Live Transcript
                    </p>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="px-5 py-5 space-y-2 pr-7">
                      {currentTranscript ? (
                        <p className="text-base text-slate-800 leading-relaxed">
                          {currentTranscript}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          {isListening
                            ? answeringFlowMode === "pushToTalk"
                              ? "Hold Space and speak naturally — your answer will appear here as you talk…"
                              : "Speak naturally — your answer will appear here as you talk…"
                            : answeringFlowMode === "pushToTalk"
                              ? "Hold Space or press Start Answering to begin recording your answer."
                              : "Press Start Answering to begin recording your answer."}
                        </p>
                      )}
                      {interimTranscript && (
                        <p className="text-base text-slate-400 italic leading-relaxed">
                          {interimTranscript}
                        </p>
                      )}
                      {silenceNotice && isListening && (
                        <p className="text-xs text-slate-500 pt-1">
                          Still recording. Continue speaking or press Next.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Controls */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => {
                      if (answeringFlowMode === "pushToTalk") {
                        if (!isListening) {
                          void startListening();
                        } else {
                          stopListening();
                        }
                        return;
                      }

                      handleListeningToggle();
                    }}
                    disabled={micUnsupported}
                    className={`flex-1 h-12 font-semibold transition-all ${
                      isListening
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_10px_30px_-12px_rgba(220,38,38,0.5)]"
                        : "bg-[#0d7377] hover:bg-[#14a0a6] text-white shadow-[0_10px_30px_-12px_rgba(13,115,119,0.55)]"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Answering
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Answering
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (isListening) return;
                      advanceQuestion();
                    }}
                    disabled={isListening}
                    className="flex-1 h-12 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      isListening
                        ? "Stop Answering to advance"
                        : "Move to the next question"
                    }
                  >
                    {currentQuestionIndex + 1 >= interviewQuestions.length
                      ? "Finish Interview"
                      : "Next Question"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {isListening && (
                  <p className="mt-2 text-[11px] text-slate-400 text-center sm:text-right">
                    {answeringFlowMode === "pushToTalk"
                      ? "Release Space or Stop Answering to enable the Next button."
                      : "Stop Answering to enable the Next button."}
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Exit confirmation modal */}
      <ConfirmationModal
        open={showExitModal}
        onOpenChange={handleExitModalOpenChange}
        title="Exit mock interview?"
        description="Leaving fullscreen may end your interview session."
        cancelText="Continue Interview"
        confirmText="Exit"
        confirmVariant="danger"
        onCancel={resumeInterview}
        onConfirm={exitInterview}
      />
    </div>
  );
}
