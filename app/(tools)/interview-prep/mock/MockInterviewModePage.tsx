"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { usePlan } from "@/app/context/PlanContext";
import { useVoiceEngine } from "@/lib/interview-prep/useVoiceEngine";
import { useQuestionSpeech } from "@/lib/interview-prep/useQuestionSpeech";
import {
  generateSessionReport,
  type InterviewSession,
  type SessionEndReason,
  type SessionEvent,
} from "@/lib/interview-prep/analyticsEngine";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ListChecks,
  Mic,
  MicOff,
  Pencil,
  Play,
  ShieldCheck,
  Timer,
  Volume2,
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

const EXECUTIVE_TOTAL_SECONDS = 15 * 60;

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
};

export function MockInterviewModePage({
  questions,
  onExit,
  sessionId,
}: MockInterviewModePageProps) {
  // reference sessionId to avoid unused-variable compile errors (kept for telemetry/analytics)
  void sessionId;
  const plan = usePlan();
  const isExecutiveTier = plan.tier === "executive";
  const isFreeTier = plan.tier === "free";
  const sessionDurationSeconds = isExecutiveTier ? EXECUTIVE_TOTAL_SECONDS : 3 * 60;

  const interviewQuestions = useMemo(() => {
    // Base: filter applicable and sort by explicit order (fallback 9999)
    const base = questions
      .filter((question) => question.applicable)
      .slice()
      .sort((a, b) => (a.mockInterviewOrder ?? 9999) - (b.mockInterviewOrder ?? 9999));

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
    const financeAnchor = base.findIndex((q) => q.id === "spouse-family-members");
    const financeInsertAt = financeAnchor === -1 ? 3 : financeAnchor + 1;
    const financeItems = financeIds.map((id) => financeMap.get(id)).filter(Boolean) as typeof base;
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

    const questionLimit = isExecutiveTier ? base.length : 5;

    return base.slice(0, questionLimit);
  }, [isExecutiveTier, questions]);

  const [phase, setPhase] = useState<"intro" | "opening" | "running" | "closing" | "completed">(
    "intro"
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(sessionDurationSeconds);
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [focusWarningMessage, setFocusWarningMessage] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAnsweringFlowModal, setShowAnsweringFlowModal] = useState(false);
  const [answeringFlowMode, setAnsweringFlowMode] = useState<"toggle" | "pushToTalk">("pushToTalk");
  const [questionRecords, setQuestionRecords] = useState<Record<string, QuestionRecord>>({});
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason | null>(null);
  const [editedTranscript, setEditedTranscript] = useState<string>("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

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
    clearTranscript,
  } = useVoiceEngine({
    vadConfig: {
      speechThreshold: 0.06,
      silenceDelayMs: 1200,
      minSpeechDurationMs: 300,
      silenceActionDelayMs: 2500,
    },
  });

  const { speakQuestion, stopSpeaking, isQuestionSpeaking } = useQuestionSpeech();
  const lastSpokenQuestionIdRef = useRef<string>("");
  const currentQuestion = interviewQuestions[currentQuestionIndex];

  // Trigger speech when question changes during the running phase
  useEffect(() => {
    if (!currentQuestion) return;
    if (phase !== "running") return;

    const id = currentQuestion.id;

    if (lastSpokenQuestionIdRef.current === id) return;

    lastSpokenQuestionIdRef.current = id;

    const textToSpeak = currentQuestion.selectedQuestion || currentQuestion.question;

    // delay ensures React + voices + state settle
    const t = setTimeout(() => {
      // console.log("SPEAK TRIGGERED:", textToSpeak);
      speakQuestion(textToSpeak);
    }, 300);

    return () => clearTimeout(t);
  }, [currentQuestion?.id, phase, speakQuestion]);

  const recordsRef = useRef<Record<string, QuestionRecord>>({});
  const activeQuestionIdRef = useRef<string>("");
  const questionStartRef = useRef<number>(Date.now());
  const phaseRef = useRef(phase);
  const warningTimestampRef = useRef(0);
  const justStartedRef = useRef(false);
  const exitRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const explicitExitRef = useRef(false);
  const showExitModalRef = useRef(false);
  const exitViaConfirmRef = useRef(false);
  const skipFullscreenExitPromptRef = useRef(false);
  const progressPercent =
    interviewQuestions.length > 0
      ? ((currentQuestionIndex + 1) / interviewQuestions.length) * 100
      : 0;

  const completedCount = Object.values(questionRecords).filter(
    (record) => record.transcript.trim().length > 0
  ).length;
  const skippedCount = Object.values(questionRecords).filter((record) => record.skipped).length;
  const averageResponseTime =
    Object.values(questionRecords).length > 0
      ? Math.round(
          Object.values(questionRecords).reduce((sum, record) => sum + record.durationSeconds, 0) /
            Object.values(questionRecords).length
        )
      : 0;

  const timeProgressPercent =
    ((sessionDurationSeconds - secondsRemaining) / sessionDurationSeconds) * 100;

  // Replay question audio handler
  const handleReplayQuestion = useCallback(() => {
    if (!currentQuestion || isQuestionSpeaking) return;
    stopSpeaking();
    const textToSpeak = currentQuestion.selectedQuestion || currentQuestion.question;
    speakQuestion(textToSpeak);
  }, [currentQuestion, isQuestionSpeaking, speakQuestion, stopSpeaking]);

  // Sync editedTranscript with live transcript while listening
  useEffect(() => {
    if (isListening) {
      setEditedTranscript(currentTranscript);
      setIsEditingTranscript(false);
    }
  }, [isListening, currentTranscript]);

  const voiceStatusLabel = isQuestionSpeaking
    ? "Question Speaking"
    : voiceState === "speaking"
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

    // Use edited transcript if available, otherwise use live transcript
    const responseText = editedTranscript || currentTranscript;
    const durationSeconds = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));

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
  }, [currentQuestion, currentTranscript, editedTranscript]);

  const completeInterview = useCallback(
    (endReason: SessionEndReason = "completed") => {
      if (phaseRef.current !== "running") {
        return;
      }

      setSessionEndReason(endReason);

      stopListening();
      stopSpeaking();

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
    [clearTranscript, stopListening]
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
      (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement
    );

  const proceedToRun = async () => {
    // console.log("proceedToRun() STARTED");
    recordsRef.current = {};
    activeQuestionIdRef.current = interviewQuestions[0]?.id || "";
    questionStartRef.current = Date.now();
    phaseRef.current = "running";
    setPhase("running");
    setCurrentQuestionIndex(0);
    setSecondsRemaining(sessionDurationSeconds);
    setQuestionRecords({});
    setFocusWarnings(0);
    setFocusWarningMessage(null);
    warningTimestampRef.current = Date.now() + 1500;
    lastSpokenQuestionIdRef.current = "";

    // IMPORTANT:
    // Pre-request microphone permission BEFORE push-to-talk starts.
    // Otherwise the first Space press causes fullscreen exit.
    skipFullscreenExitPromptRef.current = true;

    try {
      // Request fullscreen first while still in the user gesture,
      // then request microphone permission. Some browsers block
      // fullscreen if called after async permission dialogs.
      if (!isDocumentFullscreenActive()) {
        await requestDocumentFullscreen();
      }

      await ensureMicrophonePermission();
    } catch {
      // best effort
    } finally {
      skipFullscreenExitPromptRef.current = false;
    }

    // unlock speech synthesis
    window.speechSynthesis.getVoices();

    // console.log("Voices at start:", window.speechSynthesis.getVoices());

    window.speechSynthesis.onvoiceschanged = () => {
      // console.log("Voices loaded:", window.speechSynthesis.getVoices());
    };
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

    stopSpeaking();
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
    setEditedTranscript("");
    setIsEditingTranscript(false);
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
        setFocusWarningMessage("Please stay focused during the mock interview.");
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
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
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
      const isTypingTarget = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.code === "Space" && !isTypingTarget && phaseRef.current === "running") {
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
        event.key === "F5" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

      if (wantsRefresh) {
        event.preventDefault();
        event.stopPropagation();

        stopListening();
        showExitModalRef.current = true;
        setShowExitModal(true);
        return;
      }

      const isEscape = event.key === "Escape" || event.code === "Escape";

      if (isEscape && phaseRef.current === "running" && !showExitModalRef.current) {
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
      const isTypingTarget = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

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
  }, [answeringFlowMode, handleListeningToggle, isListening, phase, startListening, stopListening]);

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
      <div className="relative flex min-h-screen items-start justify-center overflow-hidden px-4 pt-4 pb-4 sm:pt-6 sm:pb-6">
        <div className="relative w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-[rgba(13,115,119,0.08)] bg-white/90 p-8 shadow-[0_30px_80px_-30px_rgba(13,115,119,0.2)] backdrop-blur-xl sm:p-10">
            {/* Decorative radial glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#afdbdb]/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#cdadcc]/10 blur-3xl" />
            <div className="relative z-10 mb-8 text-center">
              <h2 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Mock Interview Mode
              </h2>
              <p className="mx-auto max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                {isExecutiveTier
                  ? "Step into a focused, distraction-free environment and rehearse with realistic pacing and live voice transcription."
                  : "Try a short mock interview preview before you upgrade to the full executive experience."}
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(isExecutiveTier
                ? [
                    {
                      icon: Clock,
                      title: "15-Minute Session",
                      desc: "Realistic interview pacing",
                      color: "#0d7377",
                      bg: "#e8f6f6",
                    },
                    {
                      icon: Mic,
                      title: "Voice Answering",
                      desc: "Live, accurate transcription",
                      color: "#6b5b7b",
                      bg: "#f3eff5",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Focus Tracked",
                      desc: "Stay present, stay sharp",
                      color: "#9e4a5a",
                      bg: "#fceef1",
                    },
                  ]
                : [
                    {
                      icon: Clock,
                      title: `${interviewQuestions.length} Practice Questions`,
                      desc: "Free preview of the interview flow",
                      color: "#0d7377",
                      bg: "#e8f6f6",
                    },
                    {
                      icon: ShieldCheck,
                      title: `${formatTime(sessionDurationSeconds)} Timer`,
                      desc: "Short preview session",
                      color: "#6b5b7b",
                      bg: "#f3eff5",
                    },
                    {
                      icon: Mic,
                      title: "Upgrade to Executive",
                      desc: "Unlock full analytics and recommendations",
                      color: "#9e4a5a",
                      bg: "#fceef1",
                    },
                  ]
              ).map((item) => (
                <div
                  key={item.title}
                  className="group cursor-default rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-[0_8px_24px_-12px_rgba(13,115,119,0.2)]"
                  style={{ "--hover-bg": item.bg } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = item.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                  }}
                >
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg transition group-hover:opacity-90"
                    style={{ background: item.bg, border: `1px solid ${item.color}20` }}
                  >
                    <item.icon className="h-4.5 w-4.5 transition" style={{ color: item.color }} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 rounded-xl border border-[#0d7377]/15 bg-[#e8f6f6]/60 p-4">
              <p className="text-sm leading-relaxed text-slate-700">
                <span className="font-semibold text-[#0d7377]">
                  {isExecutiveTier ? "Heads up, " : "Preview note, "}{" "}
                </span>
                {isExecutiveTier
                  ? "this mode uses your existing prepared questions. The session will enter fullscreen and listen for your voice."
                  : "this is a short preview. Upgrade to Executive for full-length interviews."}
              </p>
            </div>

            <div className="mx-auto flex items-center justify-center">
              <Button
                onClick={handleBeginInterviewClick}
                className="h-14 rounded-2xl bg-[#0d7377] px-10 text-lg font-semibold text-white shadow-[0_8px_30px_-8px_rgba(13,115,119,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a5a5d] hover:shadow-[0_12px_36px_-8px_rgba(13,115,119,0.6)]"
              >
                <Play className="mr-2 h-5 w-5" />
                Begin Interview
              </Button>
            </div>
          </div>

          {showAnsweringFlowModal && (
            <div className="fixed inset-0 z-10000 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl border border-[#f0d6dc] bg-[#fffdfd] p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] sm:p-8">
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-semibold text-slate-900">
                    Choose your answering flow
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Pick the control style you want before entering fullscreen.
                  </p>
                </div>

                <div className="mb-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => setAnsweringFlowMode("pushToTalk")}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      answeringFlowMode === "pushToTalk"
                        ? "border-[#db8090] bg-[#fff7f8] shadow-[0_4px_16px_-8px_rgba(219,128,144,0.25)]"
                        : "border-[#f0d6dc] bg-white hover:border-[#db8090]/40 hover:bg-[#fffafb]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#db8090]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            answeringFlowMode === "pushToTalk" ? "bg-[#db8090]" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <div className="font-semibold text-[#4b3b46]">
                          Flow 1: Hold Space to Talk
                        </div>
                        <p className="mt-1 text-sm text-[#8b7280]">
                          Hold Space to speak and release to stop, while the answer button still
                          works.
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-[#f3ede7] px-2.5 py-1 text-xs font-medium text-[#9c6f38]">
                          Most Popular
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnsweringFlowMode("toggle")}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      answeringFlowMode === "toggle"
                        ? "border-[#db8090] bg-[#fff7f8] shadow-[0_4px_16px_-8px_rgba(219,128,144,0.25)]"
                        : "border-[#f0d6dc] bg-white hover:border-[#db8090]/40 hover:bg-[#fffafb]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#db8090]">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            answeringFlowMode === "toggle" ? "bg-[#db8090]" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <div className="font-semibold text-[#4b3b46]">
                          Flow 2: Button or Space Toggle
                        </div>
                        <p className="mt-1 text-sm text-[#8b7280]">
                          Use the answer button or press Space to start and stop.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="h-12 flex-1 border-[#f0d6dc] text-slate-700 hover:bg-[#fff7f8]"
                    onClick={() => setShowAnsweringFlowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-12 flex-1 bg-[#db8090] font-semibold text-white shadow-[0_4px_16px_-4px_rgba(219,128,144,0.35)] hover:bg-[#c96f80]"
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
        startedAt: Date.now() - sessionDurationSeconds * 1000, // approximate
        endedAt: Date.now(),
      };
    };

    // Generate robust report
    const session = buildSessionLog();
    const report = generateSessionReport(session, interviewQuestions.length);

    const { metrics, insights, validity } = report;

    return (
      <div className="interview-dots-bg relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#e8f6f6] via-white to-slate-50 px-4 py-12 sm:py-16">
        <div className="pointer-events-none absolute -top-40 -left-40 h-112 w-md rounded-full bg-[#afdbdb]/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-112 w-md rounded-full bg-[#0d7377]/10 blur-3xl" />

        <div className="relative w-full max-w-3xl">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_30px_80px_-30px_rgba(13,115,119,0.25)] backdrop-blur-xl sm:p-10">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0d7377]/20 bg-[#e8f6f6]">
                <CheckCircle2 className="h-8 w-8 text-[#0d7377]" />
              </div>
              <h2 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">
                Session Complete
              </h2>
              <p className="text-slate-500">
                {report.sessionEndReason === "completed"
                  ? "Your performance analysis"
                  : "Session Summary"}
              </p>
            </div>

            {/* Session Snapshot */}
            <div className="mb-6 rounded-2xl border border-[#0d7377]/15 bg-[#e8f6f6]/50 p-5">
              <p className="text-sm leading-relaxed text-slate-800">{insights.snapshot}</p>
            </div>

            {/* Key Metrics */}
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
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
                  className="relative overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-4 text-center transition-shadow duration-200 hover:shadow-[0_4px_16px_-8px_rgba(13,115,119,0.15)]"
                >
                  <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#afdbdb]/8 blur-xl" />
                  <div className="relative z-10 text-3xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </div>
                  <p className="relative z-10 mt-1.5 text-[11px] tracking-wider text-slate-500 uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Validity Notice (for partial sessions) */}
            {!validity.isFullSession && (
              <div className="mb-6 rounded-xl border border-[#db8090]/25 bg-[#db8090]/8 p-4">
                <p className="text-sm text-[#9e4a5a]">
                  <span className="font-semibold">Note:</span> This analysis is based on a
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
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900 uppercase">
                  Your Strengths
                </h3>
                <div className="space-y-2">
                  {insights.strengths.map((strength, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-emerald-200/60 bg-emerald-50/40 p-3 text-sm text-emerald-800"
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
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900 uppercase">
                  Areas to Improve
                </h3>
                <div className="space-y-2">
                  {insights.improvements.map((improvement, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#db8090]/25 bg-[#db8090]/8 p-3 text-sm text-[#9e4a5a]"
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
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900 uppercase">
                  Next Practice Focus
                </h3>
                <div className="space-y-2">
                  {insights.nextFocus.map((focus, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-[#afdbdb]/50 bg-[#afdbdb]/20 p-3 text-sm text-[#0d7377]"
                    >
                      <span className="mt-0.5 font-semibold text-[#0d7377]">•</span>
                      <span>{focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  setPhase("intro");
                  setSessionEndReason(null);
                }}
                variant="outline"
                className="h-12 flex-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                Try Again
              </Button>
              <Button
                onClick={onExit}
                className="h-12 flex-1 bg-[#0d7377] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(13,115,119,0.6)] hover:bg-[#0a5a5d]"
              >
                Back to Prep
                <ArrowRight className="ml-2 h-4 w-4" />
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
    <div className="fixed inset-0 z-9999 flex flex-col overflow-hidden bg-linear-to-br from-[#e8f6f6] via-white to-slate-50 text-slate-900">
      {/* ambient color */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-120 w-120 rounded-full bg-[#afdbdb]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 -bottom-40 h-104 w-104 rounded-full bg-[#0d7377]/5 blur-3xl" />

      {/* Alerts */}
      <div className="pointer-events-none fixed right-6 bottom-6 z-60 flex max-w-sm flex-col items-end gap-2">
        {focusWarningMessage && (
          <div className="animate-in slide-in-from-right-5 fade-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-[#db8090]/30 bg-[#db8090]/10 p-3 shadow-lg backdrop-blur-md duration-300">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#db8090]" />
            <p className="text-sm text-[#9e4a5a]">{focusWarningMessage}</p>
          </div>
        )}
        {micError && (
          <div className="animate-in slide-in-from-right-5 fade-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-red-200 bg-red-50/95 p-3 shadow-lg backdrop-blur-md duration-300">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-900">{micError}</p>
          </div>
        )}
      </div>

      {/* HEADER */}
      <header className="relative shrink-0 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 px-4 py-3.5 sm:px-8">
          {/* Left: exit */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopListening();
                showExitModalRef.current = true;
                setShowExitModal(true);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Exit interview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Center: title */}
          <div className="flex flex-1 justify-center">
            <div className="text-center">
              <h2 className="text-sm font-semibold text-slate-900 md:text-lg">
                Mock Interview Mode
              </h2>
              <p className="mt-1 text-[9px] tracking-[0.18em] text-slate-500 uppercase md:text-[11px]">
                {isExecutiveTier
                  ? `Executive session • ${interviewQuestions.length} questions`
                  : `Preview session • ${interviewQuestions.length} questions`}
              </p>
            </div>
          </div>

          {/* Right: timer */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition duration-200 sm:px-4 ${
                secondsRemaining < 60
                  ? "border-[#db8090]/30 bg-[#db8090]/10"
                  : "border-[#0d7377]/15 bg-[#e8f6f6]"
              }`}
            >
              <Timer
                className={`h-4 w-4 ${
                  secondsRemaining < 60 ? "animate-pulse text-[#db8090]" : "text-[#0d7377]"
                }`}
              />

              <span className="hidden md:inline">
                {isExecutiveTier ? "Session Timer" : "Preview Timer"}
              </span>

              <div
                className={`text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${
                  secondsRemaining < 60 ? "text-[#db8090]" : "text-slate-900"
                }`}
              >
                {formatTime(secondsRemaining)}
              </div>
            </div>
          </div>
        </div>

        {/* progress bar */}
        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-slate-100">
          <div
            className="h-full bg-linear-to-r from-[#0d7377] to-[#afdbdb] transition-all duration-300"
            style={{
              width: `${Math.max(progressPercent, timeProgressPercent)}%`,
            }}
          />
        </div>
      </header>

      {/* MAIN */}
      <main
        className={`relative min-h-0 flex-1 ${
          isPhaseOpening || isPhaseClosing ? "overflow-hidden" : "overflow-auto"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          {isPhaseOpening && (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
              <div className="w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-8 shadow-[0_8px_30px_rgba(13,115,119,0.1)] md:p-10">
                  {/* Soft radial glow */}
                  <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#afdbdb]/12 blur-3xl" />
                  <p className="relative z-10 text-center text-sm font-semibold tracking-[0.2em] text-[#0d7377] uppercase">
                    Mock Interview Intro
                  </p>

                  <div className="mt-4 space-y-4 text-sm leading-relaxed font-medium text-gray-700">
                    <p>Greetings, and welcome to your mock immigrant visa interview.</p>
                    <p>
                      My name is Officer Alexa, and I will be conducting your interview today.
                      Please answer each question clearly and naturally, as you would during an
                      actual visa interview.
                    </p>
                    <p>Let&apos;s begin.</p>
                  </div>

                  <button
                    onClick={() => {
                      // console.log("Continue button clicked");
                      const firstQuestion = interviewQuestions[0];
                      if (firstQuestion) {
                        const questionText =
                          firstQuestion.selectedQuestion || firstQuestion.question;
                        // console.log("About to speak first question:", questionText);
                        lastSpokenQuestionIdRef.current = firstQuestion.id;
                        speakQuestion(questionText);
                        // console.log("speakQuestion() called");
                      } else {
                        // console.log("No first question found");
                      }
                      // console.log("About to call proceedToRun");
                      void proceedToRun();
                    }}
                    className="mt-8 w-full rounded-xl bg-[#0d7377] py-3.5 font-semibold text-white shadow-[0_6px_24px_-6px_rgba(13,115,119,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a5a5d]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPhaseClosing && (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
              <div className="w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-8 shadow-[0_8px_30px_rgba(13,115,119,0.1)] md:p-10">
                  {/* Soft radial glow */}
                  <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#afdbdb]/12 blur-3xl" />
                  <p className="relative z-10 text-center text-sm font-semibold tracking-[0.2em] text-[#0d7377] uppercase">
                    Interview Complete
                  </p>

                  <div className="mt-4 space-y-4 text-sm leading-relaxed font-medium text-gray-700">
                    <p>Thank you. That concludes your interview.</p>
                    <p>
                      Your responses have been recorded for performance evaluation. You may now
                      review your interview summary and feedback.
                    </p>
                    <p>Have a good day.</p>
                  </div>

                  <button
                    onClick={() => {
                      phaseRef.current = "completed";
                      setPhase("completed");
                      clearTranscript();
                    }}
                    className="mt-8 w-full rounded-xl bg-[#0d7377] py-3.5 font-semibold text-white shadow-[0_6px_24px_-6px_rgba(13,115,119,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a5a5d]"
                  >
                    Continue to Summary
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "running" && currentQuestion && (
            <div className="flex flex-col items-start gap-6 lg:flex-row">
              {/* LEFT: Stats column */}
              <aside className="flex w-full shrink-0 flex-col gap-3 lg:mt-4 lg:w-72">
                <div className="rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-5 shadow-[0_4px_20px_-12px_rgba(13,115,119,0.1)]">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-[#0d7377] uppercase">
                    Progress
                  </p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-sm text-slate-400">/ {interviewQuestions.length}</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#afdbdb]/30">
                    <div
                      className="h-full bg-linear-to-r from-[#0d7377] to-[#afdbdb] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Questions remaining: {interviewQuestions.length - (currentQuestionIndex + 1)}
                  </p>
                </div>

                {sidebarStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-5 shadow-[0_4px_20px_-12px_rgba(13,115,119,0.08)] transition-colors duration-200 hover:border-[#0d7377]/20"
                  >
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        {stat.label}
                      </p>
                      <p className="truncate text-base font-semibold text-slate-900">
                        {stat.value}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">{stat.hint}</p>
                    </div>
                  </div>
                ))}

                {/* Avg response card */}
                <div className="flex items-center gap-3 rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-5 shadow-[0_4px_20px_-12px_rgba(13,115,119,0.08)] transition-colors duration-200 hover:border-[#0d7377]/20">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f6] text-[#0d7377]">
                    <TrendingUp className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                      Avg Response
                    </p>

                    <p className="text-base font-semibold text-slate-900">{averageResponseTime}s</p>

                    <p className="text-[11px] text-slate-400">per question</p>
                  </div>
                </div>
              </aside>

              {/* RIGHT: Question + transcript */}
              <section className="flex w-full min-w-0 flex-1 flex-col">
                <div className="-mt-4 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0d7377]/15 bg-[#e8f6f6] px-3 py-1 text-[11px] font-semibold tracking-wider text-[#0d7377] uppercase">
                    {currentQuestion.category}
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white p-6 shadow-[0_8px_30px_-16px_rgba(13,115,119,0.18)] sm:p-7">
                  {/* Soft radial glow */}
                  <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#afdbdb]/12 blur-2xl" />
                  {/* Decorative watermark */}
                  <div className="pointer-events-none absolute right-4 bottom-4 opacity-[0.035]">
                    <Mic className="h-24 w-24 text-[#0d7377]" strokeWidth={1} />
                  </div>
                  <div className="relative z-10 mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[#89a4a0] uppercase">
                      Current Question
                    </p>
                    <button
                      onClick={handleReplayQuestion}
                      disabled={isQuestionSpeaking || isListening}
                      className="mr-16 inline-flex items-center gap-1.5 rounded-lg border border-[#0d7377]/15 bg-[#e8f6f6] px-3 py-1.5 text-[11px] font-semibold text-[#0d7377] transition-all hover:border-[#0d7377]/30 hover:bg-[#d6f0f0] disabled:cursor-not-allowed disabled:opacity-40"
                      title="Listen to question again"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Replay
                    </button>
                  </div>
                  <h3 className="relative z-10 text-2xl leading-snug font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    {currentQuestion.selectedQuestion || currentQuestion.question}
                  </h3>
                </div>

                {/* Transcript card */}
                <div className="mt-5 flex h-80 flex-col overflow-hidden rounded-2xl border border-[rgba(13,115,119,0.08)] bg-white shadow-[0_12px_40px_-20px_rgba(13,115,119,0.15)]">
                  <div className="flex shrink-0 items-center justify-between border-b border-[rgba(13,115,119,0.06)] bg-[#f0faf9]/60 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
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

                    <div className="flex items-center gap-2">
                      {!isListening && currentTranscript && (
                        <button
                          onClick={() => {
                            if (isEditingTranscript) {
                              setIsEditingTranscript(false);
                            } else {
                              setEditedTranscript(currentTranscript);
                              setIsEditingTranscript(true);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            isEditingTranscript
                              ? "bg-[#0d7377] text-white"
                              : "bg-[#e8f6f6] text-[#0d7377] hover:bg-[#d6f0f0]"
                          }`}
                        >
                          {isEditingTranscript ? (
                            <>
                              <Check className="h-3 w-3" />
                              Done
                            </>
                          ) : (
                            <>
                              <Pencil className="h-3 w-3" />
                              Edit
                            </>
                          )}
                        </button>
                      )}
                      <p className="hidden text-[11px] tracking-wider text-slate-400 uppercase sm:block">
                        {isEditingTranscript ? "Editing" : "Live Transcript"}
                      </p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-2 px-5 py-5 pr-7">
                      {isEditingTranscript ? (
                        <textarea
                          value={editedTranscript}
                          onChange={(e) => setEditedTranscript(e.target.value)}
                          className="h-full min-h-[200px] w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-slate-800 outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                          placeholder="Type your answer here..."
                        />
                      ) : editedTranscript || currentTranscript ? (
                        <p className="text-base leading-relaxed text-slate-800">
                          {editedTranscript || currentTranscript}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          {isListening
                            ? answeringFlowMode === "pushToTalk"
                              ? "Hold Space and speak naturally, your answer will appear here as you talk..."
                              : "Speak naturally, your answer will appear here as you talk..."
                            : answeringFlowMode === "pushToTalk"
                              ? "Hold Space or press Start Answering to begin recording your answer."
                              : "Press Start Answering to begin recording your answer."}
                        </p>
                      )}
                      {interimTranscript && !isEditingTranscript && (
                        <p className="text-base leading-relaxed text-slate-400 italic">
                          {interimTranscript}
                        </p>
                      )}
                      {silenceNotice && isListening && (
                        <p className="pt-1 text-xs text-slate-500">
                          Still recording. Continue speaking or press Next.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Controls */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
                    disabled={micUnsupported || isQuestionSpeaking}
                    className={`h-12 flex-1 font-semibold transition-all ${
                      isListening
                        ? "bg-red-600 text-white shadow-[0_10px_30px_-12px_rgba(220,38,38,0.5)] hover:bg-red-500"
                        : "bg-[#0d7377] text-white shadow-[0_10px_30px_-12px_rgba(13,115,119,0.55)] hover:bg-[#0a5a5d]"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop Answering
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Start Answering
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (isListening) return;
                      advanceQuestion();
                    }}
                    disabled={isListening || isQuestionSpeaking}
                    className="h-12 flex-1 border border-slate-200 bg-white font-semibold text-slate-900 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isListening ? "Stop Answering to advance" : "Move to the next question"}
                  >
                    {currentQuestionIndex + 1 >= interviewQuestions.length
                      ? "Finish Interview"
                      : "Next Question"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {isListening && (
                  <p className="mt-2 text-center text-[11px] text-slate-400 sm:text-right">
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
