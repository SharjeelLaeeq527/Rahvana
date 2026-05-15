"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
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
  questions: GeneratedQuestion[];
  onExit: () => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
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

const getBrowserSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

  return (
    browserWindow.SpeechRecognition ||
    browserWindow.webkitSpeechRecognition ||
    null
  );
};

export function MockInterviewModePage({
  questions,
  onExit,
}: MockInterviewModePageProps) {
  const interviewQuestions = useMemo(
    () => questions.filter((question) => question.applicable),
    [questions],
  );

  const [phase, setPhase] = useState<"intro" | "running" | "completed">(
    "intro",
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SECONDS);
  const [isListening, setIsListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [focusWarningMessage, setFocusWarningMessage] = useState<string | null>(
    null,
  );
  const [showExitModal, setShowExitModal] = useState(false);
  const [questionRecords, setQuestionRecords] = useState<
    Record<string, QuestionRecord>
  >({});

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recordsRef = useRef<Record<string, QuestionRecord>>({});
  const activeQuestionIdRef = useRef<string>("");
  const questionStartRef = useRef<number>(Date.now());
  const listeningRef = useRef(false);
  const phaseRef = useRef(phase);
  const warningTimestampRef = useRef(0);
  const transcriptBufferRef = useRef("");
  const justStartedRef = useRef(false);
  const exitRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const warningHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const micErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionActiveRef = useRef(false);
  const explicitExitRef = useRef(false);
  // Web Audio API waveform visualizer refs
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
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

  const completionPercentage =
    interviewQuestions.length > 0
      ? Math.round((completedCount / interviewQuestions.length) * 100)
      : 0;

  const timeProgressPercent =
    ((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100;

  const flashMicError = (message: string) => {
    setMicError(message);
    if (micErrorTimerRef.current) {
      clearTimeout(micErrorTimerRef.current);
    }
    micErrorTimerRef.current = setTimeout(() => setMicError(null), 4000);
  };

  const stopRecognition = () => {
    listeningRef.current = false;
    setIsListening(false);

    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort?.();
      } catch {
        // noop
      }
    }
  };

  const ensureRecognition = () => {
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const RecognitionCtor = getBrowserSpeechRecognition();
    if (!RecognitionCtor) {
      setMicUnsupported(true);
      return null;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      justStartedRef.current = true;
      warningTimestampRef.current = Date.now();
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalTranscript = transcriptBufferRef.current;
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      transcriptBufferRef.current = finalTranscript.trim();
      setCurrentTranscript(finalTranscript.trim());
      setInterimTranscript(interimTranscript.trim());
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        flashMicError(
          "Microphone access was blocked. Please allow mic permission and try again.",
        );
        stopRecognition();
        return;
      }

      if (event.error === "no-speech") {
        return;
      }

      if (event.error === "audio-capture") {
        flashMicError(
          "No microphone input detected. Please connect/enable your microphone and retry.",
        );
        stopRecognition();
        return;
      }

      if (event.error === "aborted") {
        return;
      }

      flashMicError(`Microphone error: ${event.error}`);
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;

      if (listeningRef.current && phaseRef.current === "running") {
        setTimeout(() => {
          if (
            !listeningRef.current ||
            phaseRef.current !== "running" ||
            recognitionActiveRef.current
          ) {
            return;
          }

          try {
            recognition.start();
          } catch {
            // ignore
          }
        }, 1500);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const startListening = async () => {
    const recognition = ensureRecognition();

    if (!recognition) {
      flashMicError(
        "Voice input is not supported in this browser. Try Chrome or Edge.",
      );
      return false;
    }

    listeningRef.current = true;
    setIsListening(true);
    setMicError(null);

    if (recognitionActiveRef.current) {
      return true;
    }

    try {
      recognition.start();
    } catch {
      // already running
    }

    return true;
  };

  const finalizeCurrentQuestion = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    const responseText = transcriptBufferRef.current;
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
  }, [currentQuestion]);

  const completeInterview = useCallback(() => {
    if (phaseRef.current !== "running") {
      return;
    }

    stopRecognition();
    phaseRef.current = "completed";
    setPhase("completed");
    setCurrentTranscript("");
    setInterimTranscript("");
  }, []);

  // ── Web Audio waveform visualizer
  useEffect(() => {
    if (!isListening) {
      // Tear down audio pipeline and cancel draw loop
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
        analyserRef.current = null;
      }

      // Draw a flat idle line on the canvas
      const canvas = waveformCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    // Start capturing mic audio
    let cancelled = false;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        const AudioContextCtor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextCtor) return;

        const audioCtx = new AudioContextCtor();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const BAR_COUNT = 40;
        const PRIMARY = "#0d7377";
        const LIGHT = "#14a0a6";
        const SECONDARY = "#32e0c4";

        const draw = () => {
          if (cancelled) return;
          animFrameRef.current = requestAnimationFrame(draw);

          const canvas = waveformCanvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          analyser.getByteFrequencyData(dataArray);

          const W = canvas.width;
          const H = canvas.height;
          ctx.clearRect(0, 0, W, H);

          const barW = (W / BAR_COUNT) * 0.72;
          const gap = (W / BAR_COUNT) * 0.28;

          for (let i = 0; i < BAR_COUNT; i++) {
            // Sample from the lower frequency range (voices live there)
            const dataIndex = Math.floor(
              (i / BAR_COUNT) * (bufferLength * 0.6),
            );
            const value = dataArray[dataIndex] / 255;

            // Minimum idle height so bars are always visible
            const minH = H * 0.08;
            const barH = minH + value * (H - minH);

            const x = i * (barW + gap);
            const y = (H - barH) / 2;

            const grad = ctx.createLinearGradient(x, y + barH, x, y);
            grad.addColorStop(0, PRIMARY);
            grad.addColorStop(0.5, LIGHT);
            grad.addColorStop(1, SECONDARY);

            // Opacity tied to amplitude for lively feel
            ctx.globalAlpha = 0.55 + value * 0.45;
            ctx.fillStyle = grad;

            const radius = barW / 2;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barW - radius, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
            ctx.lineTo(x + barW, y + barH - radius);
            ctx.quadraticCurveTo(
              x + barW,
              y + barH,
              x + barW - radius,
              y + barH,
            );
            ctx.lineTo(x + radius, y + barH);
            ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
          }

          ctx.globalAlpha = 1;
        };

        draw();
      } catch {
        // Mic permission denied or not available — visualizer silently degrades
      }
    };

    setup();

    return () => {
      cancelled = true;
    };
  }, [isListening]);

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

  const isDocumentFullscreenActive = () =>
    Boolean(
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element | null })
        .webkitFullscreenElement,
    );

  const startInterview = async () => {
    if (interviewQuestions.length === 0) {
      setPhase("completed");
      return;
    }

    recordsRef.current = {};
    activeQuestionIdRef.current = interviewQuestions[0].id;
    transcriptBufferRef.current = "";
    questionStartRef.current = Date.now();

    phaseRef.current = "running";
    setPhase("running");
    setCurrentQuestionIndex(0);
    setSecondsRemaining(TOTAL_SECONDS);
    setQuestionRecords({});
    setCurrentTranscript("");
    setInterimTranscript("");
    setFocusWarnings(0);
    setFocusWarningMessage(null);
    warningTimestampRef.current = Date.now() + 1500;

    skipFullscreenExitPromptRef.current = true;
    try {
      await startListening();

      await requestDocumentFullscreen();
    } finally {
      skipFullscreenExitPromptRef.current = false;
    }
  };

  const exitInterview = () => {
    exitViaConfirmRef.current = true;
    explicitExitRef.current = true;
    stopRecognition();

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }

    onExit();
  };

  const advanceQuestion = () => {
    recognitionRef.current?.abort?.();
    stopRecognition();

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
    transcriptBufferRef.current = "";
    setCurrentTranscript("");
    setInterimTranscript("");

    void startListening();
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
      return;
    }

    startListening();
  };

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
        completeInterview();
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

      // Fullscreen ended (e.g. ESC processed before our listener). Show exit choice and
      // try to re-enter fullscreen so the session stays immersive until the user confirms exit.
      if (!isDocumentFullscreenActive()) {
        stopRecognition();
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
  }, []);

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
      const wantsRefresh =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

      if (wantsRefresh) {
        event.preventDefault();
        event.stopPropagation();

        stopRecognition();
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
        stopRecognition();
        showExitModalRef.current = true;
        setShowExitModal(true);
      }
    };

    document.addEventListener("keydown", onKeyDown, {
      capture: true,
      passive: false,
    });

    return () =>
      document.removeEventListener("keydown", onKeyDown, {
        capture: true,
      });
  }, [phase]);

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
          completeInterview();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, completeInterview, finalizeCurrentQuestion]);

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

      if (micErrorTimerRef.current) {
        clearTimeout(micErrorTimerRef.current);
      }

      stopRecognition();

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, []);

  //  INTRO PHASE
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
                onClick={startInterview}
                className="flex-1 h-12 bg-[#0d7377] hover:bg-[#14a0a6] text-white font-semibold shadow-[0_10px_30px_-12px_rgba(13,115,119,0.6)]"
              >
                <Play className="h-4 w-4 mr-2" />
                Begin Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  COMPLETED PHASE
  if (phase === "completed") {
    // Analysis Engine
    const analyzeSession = () => {
      const records = Object.values(questionRecords);
      if (records.length === 0) return null;

      // Transcript stats
      const answeredRecords = records.filter((r) => !r.skipped);
      const transcriptLengths = answeredRecords.map(
        (r) => r.transcript.split(" ").length,
      );
      const avgTranscriptLength =
        transcriptLengths.length > 0
          ? Math.round(
              transcriptLengths.reduce((a, b) => a + b, 0) /
                transcriptLengths.length,
            )
          : 0;

      // Long answer threshold: responses that become substantially more verbose
      const longAnswerThreshold = Math.max(45, avgTranscriptLength * 1.5);
      const longAnswerCount = answeredRecords.filter(
        (r) => r.transcript.split(" ").length > longAnswerThreshold,
      ).length;

      // Duration variance
      const durations = records
        .filter((r) => !r.skipped)
        .map((r) => r.durationSeconds);
      const avgDuration =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;
      const durationVariance =
        durations.length > 1
          ? Math.sqrt(
              durations.reduce(
                (sum, d) => sum + Math.pow(d - avgDuration, 2),
                0,
              ) / durations.length,
            )
          : 0;

      // Category breakdown
      const categoryStats: Record<
        string,
        { answered: number; skipped: number }
      > = {};
      interviewQuestions.forEach((q) => {
        const cat = q.category || "Other";
        if (!categoryStats[cat]) {
          categoryStats[cat] = { answered: 0, skipped: 0 };
        }
        const record = questionRecords[q.id];
        if (record) {
          if (record.skipped) {
            categoryStats[cat].skipped++;
          } else {
            categoryStats[cat].answered++;
          }
        }
      });

      // Identify weak categories
      const weakCategories = Object.entries(categoryStats)
        .filter(([, stats]) => stats.skipped > 0 || stats.answered === 0)
        .map(([cat]) => cat);

      return {
        answeredCount: completedCount,
        skippedCount,
        totalQuestions: interviewQuestions.length,
        avgTranscriptLength,
        longAnswerCount,
        avgDuration,
        durationVariance,
        focusWarningsCount: focusWarnings,
        categoryStats,
        weakCategories,
      };
    };

    const analysis = analyzeSession();

    // Generate Insights
    const generateSessionSnapshot = () => {
      if (!analysis) return "";
      const { answeredCount, totalQuestions } = analysis;
      const completionRate = Math.round((answeredCount / totalQuestions) * 100);

      let snapshot = "";
      if (completionRate >= 90) {
        snapshot = `You completed ${answeredCount} of ${totalQuestions} questions with excellent participation. `;
      } else if (completionRate >= 70) {
        snapshot = `You completed ${answeredCount} of ${totalQuestions} questions with strong engagement. `;
      } else {
        snapshot = `You completed ${answeredCount} of ${totalQuestions} questions. `;
      }

      if (focusWarnings === 0) {
        snapshot += "Your focus remained strong throughout the session.";
      } else if (focusWarnings === 1) {
        snapshot +=
          "You stayed focused for most of the session, with one brief attention lapse.";
      } else {
        snapshot += `You had ${focusWarnings} focus warnings—concentration dipped at times.`;
      }

      return snapshot;
    };

    const generateStrengths = () => {
      if (!analysis) return [];
      const strengths: string[] = [];

      if (completedCount / interviewQuestions.length > 0.8) {
        strengths.push("Consistent participation across most questions");
      }

      if (focusWarnings === 0) {
        strengths.push("Strong focus throughout the entire session");
      }

      if (
        completedCount > 0 &&
        analysis.longAnswerCount / completedCount < 0.3
      ) {
        strengths.push("Kept answers focused and concise");
      }

      if (skippedCount === 0) {
        strengths.push("Answered every question without skipping");
      }

      if (analysis.durationVariance < 5) {
        strengths.push("Maintained consistent pacing across responses");
      }

      return strengths.length > 0
        ? strengths
        : ["Session completed successfully"];
    };

    const generateImprovements = () => {
      if (!analysis) return [];
      const improvements: string[] = [];

      if (skippedCount > 0) {
        improvements.push(
          `${skippedCount} question(s) were skipped—aim to answer all questions, even if briefly`,
        );
      }

      if (completedCount > 0 && analysis.longAnswerCount > completedCount / 2) {
        improvements.push(
          `Many responses ran long (${analysis.longAnswerCount} answers were notably verbose)—tighten to the key point and supporting example`,
        );
      }

      if (analysis.durationVariance > 10) {
        improvements.push(
          "Response pacing varied significantly—aim for more consistent answer lengths",
        );
      }

      if (focusWarnings > 1) {
        improvements.push(
          "You had multiple focus warnings—minimize distractions and stay present",
        );
      }

      if (
        analysis.weakCategories.length > 0 &&
        analysis.weakCategories.length <= 2
      ) {
        improvements.push(
          `Focus on ${analysis.weakCategories.join(" and ")} questions—these had gaps`,
        );
      }

      return improvements;
    };

    const generateNextFocus = () => {
      const focuses: string[] = [];

      if (skippedCount > 0) {
        focuses.push("Answer all questions in your next session");
      }

      if (analysis && analysis.longAnswerCount > completedCount / 3) {
        focuses.push("Practice giving concise but complete answers");
      }

      if (analysis && analysis.weakCategories.length > 0) {
        focuses.push(
          `Deep dive into ${analysis.weakCategories[0]} questions next`,
        );
      }

      if (focusWarnings > 0) {
        focuses.push(
          "Eliminate distractions and re-take in a focused environment",
        );
      }

      if (analysis && averageResponseTime < 30) {
        focuses.push("Spend more time structuring thoughtful responses");
      }

      return focuses;
    };

    const strengths = generateStrengths();
    const improvements = generateImprovements();
    const nextFocus = generateNextFocus();
    const snapshot = generateSessionSnapshot();

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
              <p className="text-slate-500">Your performance analysis</p>
            </div>

            {/* Session Snapshot */}
            <div className="rounded-2xl border border-[#0d7377]/15 bg-[#e8f6f6]/50 p-5 mb-6">
              <p className="text-sm leading-relaxed text-slate-800">
                {snapshot}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Answered", value: completedCount },
                { label: "Completion", value: `${completionPercentage}%` },
                { label: "Avg Response", value: `${averageResponseTime}s` },
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

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  Your Strengths
                </h3>
                <div className="space-y-2">
                  {strengths.map((strength, idx) => (
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
            {improvements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  Areas to Improve
                </h3>
                <div className="space-y-2">
                  {improvements.map((improvement, idx) => (
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
            {nextFocus.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  Next Practice Focus
                </h3>
                <div className="space-y-2">
                  {nextFocus.map((focus, idx) => (
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
                onClick={() => setPhase("intro")}
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
                stopRecognition();
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
      <main className="relative flex-1 min-h-0 overflow-auto">
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-8 py-6 sm:py-8">
          {currentQuestion && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* LEFT: Stats column */}
              <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-3 lg:mt-10">
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
                <div className="mb-4 flex items-center gap-2">
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
                <div className="mt-5 h-[320px] sm:h-[360px] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-20px_rgba(13,115,119,0.2)] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          {isListening ? "Listening" : "Paused"}
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
                            ? "Speak naturally — your answer will appear here as you talk…"
                            : "Press Start Listening to begin recording your answer."}
                        </p>
                      )}
                      {interimTranscript && (
                        <p className="text-base text-slate-400 italic leading-relaxed">
                          {interimTranscript}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Controls */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={toggleListening}
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
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Listening
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={advanceQuestion}
                    disabled={isListening}
                    className="flex-1 h-12 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      isListening
                        ? "Stop listening to advance"
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
                    Stop listening to enable the Next button.
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
