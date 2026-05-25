"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export type VoiceState = "idle" | "listening" | "speaking" | "silence" | "processing";

export interface VoiceTranscriptUpdate {
  finalTranscript: string;
  interimTranscript: string;
}

interface VoiceEngineCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscriptUpdate?: (update: VoiceTranscriptUpdate) => void;
  onMicError?: (message: string) => void;
}

interface VoiceEngineOptions extends VoiceEngineCallbacks {
  language?: string;
  vadConfig?: {
    speechThreshold?: number;
    silenceDelayMs?: number;
    minSpeechDurationMs?: number;
    silenceActionDelayMs?: number;
  };
}

interface FullscreenElementLike extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

const getBrowserSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
};

const defaultVadConfig = {
  speechThreshold: 0.06,
  silenceDelayMs: 1200,
  minSpeechDurationMs: 300,
  silenceActionDelayMs: 2500,
};

export function useVoiceEngine(options: VoiceEngineOptions = {}) {
  const {
    onSpeechStart,
    onSpeechEnd,
    onTranscriptUpdate,
    onMicError,
    language = "en-US",
    vadConfig = {},
  } = options;

  const mergedVadConfig = useMemo(() => ({ ...defaultVadConfig, ...vadConfig }), [vadConfig]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptBufferRef = useRef("");
  const silenceStartRef = useRef<number | null>(null);
  const speechCandidateStartRef = useRef<number | null>(null);
  const noiseFloorRef = useRef(0.02);
  const speakingRef = useRef(false);
  const listeningRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const micErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [silenceNotice, setSilenceNotice] = useState(false);

  const flashMicError = useCallback(
    (message: string) => {
      setMicError(message);
      onMicError?.(message);

      if (micErrorTimerRef.current) {
        clearTimeout(micErrorTimerRef.current);
      }

      micErrorTimerRef.current = setTimeout(() => setMicError(null), 4000);
    },
    [onMicError]
  );

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort?.();
      } catch {
        // noop
      }
    }
  }, []);

  const teardownAudio = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    speakingRef.current = false;
    silenceStartRef.current = null;
    speechCandidateStartRef.current = null;
    setSilenceNotice(false);
  }, []);

  const clearTranscript = useCallback(() => {
    transcriptBufferRef.current = "";
    setCurrentTranscript("");
    setInterimTranscript("");
  }, []);

  const ensureRecognition = useCallback(() => {
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
    recognition.lang = language;

    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      setVoiceState((previous) => (previous === "idle" ? "listening" : previous));
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalTranscript = transcriptBufferRef.current;
      let interimValue = "";

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const transcript = event.results[index][0].transcript;

        if (event.results[index].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimValue += transcript;
        }
      }

      const trimmedFinal = finalTranscript.trim();
      const trimmedInterim = interimValue.trim();

      transcriptBufferRef.current = trimmedFinal;
      setCurrentTranscript(trimmedFinal);
      setInterimTranscript(trimmedInterim);
      onTranscriptUpdate?.({
        finalTranscript: trimmedFinal,
        interimTranscript: trimmedInterim,
      });
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        flashMicError("Microphone access was blocked. Please allow mic permission and try again.");
        stopRecognition();
        return;
      }

      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      if (event.error === "audio-capture") {
        flashMicError(
          "No microphone input detected. Please connect or enable your microphone and retry."
        );
        stopRecognition();
        return;
      }

      flashMicError(`Microphone error: ${event.error}`);
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;

      if (listeningRef.current && !stopRequestedRef.current && voiceState !== "idle") {
        setTimeout(() => {
          if (!listeningRef.current || stopRequestedRef.current || recognitionActiveRef.current) {
            return;
          }

          try {
            recognition.start();
          } catch {
            // ignore
          }
        }, 800);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [flashMicError, language, onTranscriptUpdate, stopRecognition, voiceState]);

  const updateVadState = useCallback(
    (normalizedEnergy: number) => {
      const floor = noiseFloorRef.current;
      const dynamicThreshold = Math.max(mergedVadConfig.speechThreshold, floor * 1.8);
      const isSpeechCandidate = normalizedEnergy > dynamicThreshold;

      if (normalizedEnergy < floor) {
        noiseFloorRef.current = Math.max(0.01, floor * 0.98 + normalizedEnergy * 0.02);
      } else {
        noiseFloorRef.current = Math.min(0.08, floor * 0.995 + normalizedEnergy * 0.005);
      }

      if (isSpeechCandidate) {
        if (!speechCandidateStartRef.current) {
          speechCandidateStartRef.current = Date.now();
        }

        const candidateDuration = Date.now() - speechCandidateStartRef.current;

        if (candidateDuration < mergedVadConfig.minSpeechDurationMs) {
          return;
        }

        silenceStartRef.current = null;
        setSilenceNotice(false);
        speechCandidateStartRef.current = null;

        if (!speakingRef.current) {
          speakingRef.current = true;
          setVoiceState("speaking");
          onSpeechStart?.();
        } else if (voiceState !== "speaking") {
          setVoiceState("speaking");
        }

        return;
      }

      speechCandidateStartRef.current = null;

      if (speakingRef.current && !silenceStartRef.current) {
        silenceStartRef.current = Date.now();
      }

      if (
        speakingRef.current &&
        silenceStartRef.current &&
        Date.now() - silenceStartRef.current > mergedVadConfig.silenceDelayMs
      ) {
        speakingRef.current = false;
        silenceStartRef.current = Date.now();
        setVoiceState("silence");
        onSpeechEnd?.();
      }

      if (
        !speakingRef.current &&
        silenceStartRef.current &&
        Date.now() - silenceStartRef.current > mergedVadConfig.silenceActionDelayMs
      ) {
        setSilenceNotice(true);
      }
    },
    [
      mergedVadConfig.silenceActionDelayMs,
      mergedVadConfig.silenceDelayMs,
      mergedVadConfig.speechThreshold,
      onSpeechEnd,
      onSpeechStart,
      voiceState,
    ]
  );

  const setupAudioPipeline = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      mediaStreamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        return;
      }

      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!listeningRef.current) {
          return;
        }

        animationFrameRef.current = requestAnimationFrame(draw);

        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext("2d");
          if (context) {
            const width = canvas.width;
            const height = canvas.height;
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let index = 0; index < bufferLength; index++) {
              sum += dataArray[index];
            }

            const normalized = sum / bufferLength / 255;
            updateVadState(normalized);

            context.clearRect(0, 0, width, height);

            const barCount = 40;
            const barWidth = (width / barCount) * 0.72;
            const gap = (width / barCount) * 0.28;

            for (let index = 0; index < barCount; index++) {
              const sampleIndex = Math.floor((index / barCount) * (bufferLength * 0.6));
              const value = dataArray[sampleIndex] / 255;
              const minHeight = height * 0.08;
              const barHeight = minHeight + value * (height - minHeight);
              const x = index * (barWidth + gap);
              const y = (height - barHeight) / 2;

              const gradient = context.createLinearGradient(x, y + barHeight, x, y);
              gradient.addColorStop(0, "#0d7377");
              gradient.addColorStop(0.5, "#14a0a6");
              gradient.addColorStop(1, "#32e0c4");

              context.globalAlpha = 0.55 + value * 0.45;
              context.fillStyle = gradient;

              const radius = barWidth / 2;
              context.beginPath();
              context.moveTo(x + radius, y);
              context.lineTo(x + barWidth - radius, y);
              context.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
              context.lineTo(x + barWidth, y + barHeight - radius);
              context.quadraticCurveTo(
                x + barWidth,
                y + barHeight,
                x + barWidth - radius,
                y + barHeight
              );
              context.lineTo(x + radius, y + barHeight);
              context.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
              context.lineTo(x, y + radius);
              context.quadraticCurveTo(x, y, x + radius, y);
              context.closePath();
              context.fill();
            }

            context.globalAlpha = 1;
          }
        }
      };

      draw();
    } catch {
      // Mic permission denied or unavailable; the UI will remain functional without VAD.
    }
  }, [canvasRef, updateVadState]);

  const startListening = useCallback(async () => {
    stopRequestedRef.current = false;
    listeningRef.current = true;
    setMicError(null);

    const recognition = ensureRecognition();
    if (!recognition) {
      flashMicError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return false;
    }

    setVoiceState((previous) => (previous === "processing" ? "listening" : "listening"));
    setSilenceNotice(false);

    if (!mediaStreamRef.current || !audioContextRef.current || !analyserRef.current) {
      await setupAudioPipeline();
    }

    if (recognitionActiveRef.current) {
      return true;
    }

    try {
      recognition.start();
    } catch {
      // already running
    }

    return true;
  }, [ensureRecognition, flashMicError, setupAudioPipeline]);

  const stopListening = useCallback(() => {
    stopRequestedRef.current = true;
    listeningRef.current = false;
    setVoiceState("processing");

    stopRecognition();
    teardownAudio();
    setVoiceState("idle");
  }, [stopRecognition, teardownAudio]);

  const toggleListening = useCallback(() => {
    if (listeningRef.current) {
      stopListening();
      return;
    }

    void startListening();
  }, [startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (micErrorTimerRef.current) {
        clearTimeout(micErrorTimerRef.current);
      }

      stopRequestedRef.current = true;
      listeningRef.current = false;
      stopRecognition();
      teardownAudio();

      if (recognitionRef.current) {
        recognitionRef.current = null;
      }
    };
  }, [stopRecognition, teardownAudio]);

  const isListening = voiceState !== "idle" && voiceState !== "processing";

  return {
    canvasRef,
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
  };
}
