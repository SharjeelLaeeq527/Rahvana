"use client";

import { useCallback, useRef, useState } from "react";

export function useQuestionSpeech() {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSpeakingRef = useRef(false);
  const [, forceUpdate] = useState(0);

  const speakNow = useCallback((text: string) => {
    // console.log("speakNow CALLED with text:", text);
    try {
      if (typeof window === "undefined") {
        return;
      }
      if (!window.speechSynthesis) {
        return;
      }

      const synth = window.speechSynthesis;

      // Only cancel if something is already in queue
      const isFirstSpeech = !synth.speaking && !synth.pending;

      if (!isFirstSpeech) {
        synth.cancel();
      }

      synth.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = "en-US";

      const voices = synth.getVoices();
      // console.log("Available voices:", voices.length);

      const preferred =
        voices.find((v) => v.name === "Google US English") ||
        voices.find(
          (v) => v.name === "Microsoft Aria Online (Natural) - English (United States)"
        ) ||
        voices.find(
          (v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)"
        ) ||
        voices.find((v) => v.lang === "en-US" && v.localService) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];

      if (preferred) {
        utterance.voice = preferred;
        utterance.lang = preferred.lang || "en-US";
        // console.log("Using voice:", preferred.name);
      }

      utterance.onerror = (event) => {
        const error = (event as SpeechSynthesisErrorEvent)?.error;

        // Ignore harmless browser interruption on first/queued speech
        if (error === "interrupted") {
          // treat as normal behavior, not failure
          isSpeakingRef.current = false;
          forceUpdate((x) => x + 1);
          return;
        }

        console.warn("TTS event (non-critical):", event?.error || event);

        isSpeakingRef.current = false;
        forceUpdate((x) => x + 1);
      };

      utterance.onstart = () => {
        // console.log("TTS STARTED");
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        // console.log("TTS ENDED");
        isSpeakingRef.current = false;
        forceUpdate((x) => x + 1);
      };

      currentUtteranceRef.current = utterance;
      // console.log("Calling synth.speak()");
      synth.speak(utterance);
      // console.log("synth.speak() completed");
    } catch (error) {
      console.error("speakNow error:", error);
    }
  }, []);

  const speakQuestion = useCallback(
    (text: string) => {
      // console.log("speakQuestion CALLED");
      if (typeof window === "undefined") {
        return;
      }
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
        return;
      }
      // console.log("Calling speakNow");
      speakNow(text);
    },
    [speakNow]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    // console.log("stopSpeaking called");
    window.speechSynthesis.cancel();
  }, []);

  return {
    speakQuestion,
    stopSpeaking,
    isQuestionSpeaking: isSpeakingRef.current,
  };
}
