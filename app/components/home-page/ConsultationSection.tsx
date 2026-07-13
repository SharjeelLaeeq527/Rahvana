"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as Icons from "lucide-react";

interface ConsultationSectionProps {
  onConsultationClick: () => void;
}

export default function ConsultationSection({ onConsultationClick }: ConsultationSectionProps) {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [currentX, setCurrentX] = useState(0);
  const currentXRef = useRef(0);
  const [maxX, setMaxX] = useState(0);
  const maxXRef = useRef(0);
  const [phase, setPhase] = useState<"idle" | "dragging" | "connecting" | "opening" | "answered">(
    "idle"
  );
  const [isNudging, setIsNudging] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [isSnapping, setIsSnapping] = useState(false);

  const updateX = (val: number) => {
    setCurrentX(val);
    currentXRef.current = val;
  };

  // Drag references
  const dragStartClientX = useRef(0);
  const dragStartX = useRef(0);
  const timersRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Measure rail size to calculate maximum drag distance
  const measure = () => {
    if (railRef.current) {
      const HANDLE_SIZE = 44;
      const PAD = 6;
      const calculatedMax = Math.max(railRef.current.offsetWidth - HANDLE_SIZE - PAD * 2, 0);
      setMaxX(calculatedMax);
      maxXRef.current = calculatedMax;
    }
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Idle nudge animation loop
  useEffect(() => {
    if (reduceMotion || phase !== "idle") return;

    const interval = setInterval(() => {
      setIsNudging(true);
      const timer = setTimeout(() => setIsNudging(false), 1000);
      return () => clearTimeout(timer);
    }, 2800);

    return () => clearInterval(interval);
  }, [phase, reduceMotion]);

  // Pointer events handling for dragging the slider
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase === "connecting" || phase === "opening" || phase === "answered") return;

    setPhase("dragging");
    setIsNudging(false);
    setIsPulsing(false);
    setIsSnapping(false);

    if (handleRef.current) {
      handleRef.current.setPointerCapture(e.pointerId);
    }

    dragStartClientX.current = e.clientX;
    dragStartX.current = currentXRef.current;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - dragStartClientX.current;
      const targetX = Math.max(0, Math.min(maxXRef.current, dragStartX.current + delta));
      updateX(targetX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      setIsSnapping(true);
      if (maxXRef.current > 0 && currentXRef.current > maxXRef.current * 0.7) {
        updateX(maxXRef.current);
        runCompletion();
      } else {
        // Snap back
        updateX(0);
        setPhase("idle");
        setIsPulsing(true);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Keyboard accessibility
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (phase === "connecting" || phase === "opening" || phase === "answered") return;

    setIsPulsing(false);
    setIsSnapping(true);
    updateX(maxXRef.current);
    runCompletion();
  };

  const runCompletion = () => {
    setPhase("connecting");

    // Clear any active timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Phase transitions
    const t1 = setTimeout(() => {
      setPhase("opening");
    }, 900);

    const t2 = setTimeout(() => {
      setPhase("answered");
      // Trigger the real booking logic
      onConsultationClick();
    }, 2100);

    // Reset after some time if action didn't navigate away, allowing user to retry
    const t3 = setTimeout(() => {
      updateX(0);
      setIsSnapping(true);
      setPhase("idle");
      setIsPulsing(true);
    }, 4200);

    timersRef.current = [t1, t2, t3];
  };

  // Drag progress styles
  const HANDLE_SIZE = 44;
  const PAD = 6;
  const stretch = maxX > 0 ? 1 + (currentX / maxX) * 0.16 : 1;
  const transformStyle = reduceMotion
    ? `translateX(${currentX}px)`
    : `translateX(${currentX}px) scaleX(${stretch})`;
  const fillWidth = currentX + HANDLE_SIZE / 2 + PAD;
  const hintOpacity = maxX > 0 ? Math.max(0, 1 - currentX / (maxX * 0.4)) : 1;

  // React component key for remounting and running the CSS animations from scratch
  const animationKey = phase === "idle" || phase === "dragging" ? "active" : "status";

  return (
    <section className="consult-container relative overflow-hidden pt-10 pb-20 md:pt-14 md:pb-24 px-6 sm:px-10 lg:px-16 text-[var(--ink)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="order-2 lg:order-1 flex flex-col items-start">
          <div className="animate-fade-in-up">
            <span className="badge inline-flex items-center gap-2 px-3 py-1 border border-[var(--line)] bg-white/60 text-[var(--teal-deep)] rounded-full text-xs font-semibold tracking-wider uppercase shadow-sm">
              <span className="dot w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              One-on-One Guidance
            </span>

            <h2 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-tight">
              Sometimes, a conversation is the{" "}
              <span className="accent text-primary">next step.</span>
            </h2>

            <p className="lede mt-5 max-w-lg text-lg text-[var(--sub)] leading-relaxed">
              When the roadmap feels overwhelming, one conversation can bring clarity and
              confidence.
            </p>

            <div className="trust mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <div className="trust-item flex items-center gap-2 text-sm font-medium text-[var(--sub)]">
                <Icons.Clock size={16} className="text-primary shrink-0" />
                30-minute sessions
              </div>
              <div className="trust-item flex items-center gap-2 text-sm font-medium text-[var(--sub)]">
                <Icons.ShieldCheck size={16} className="text-primary shrink-0" />
                Private &amp; confidential
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="card-wrap relative w-full max-w-sm">
            {/* Ambient background glow */}
            <div className="glow" aria-hidden="true" />

            {/* Interactive Card */}
            <div className="card relative rounded-3xl border border-[var(--card-border)] bg-[var(--card)] backdrop-blur-xl p-6 shadow-[0_30px_60px_-25px_rgba(21,41,37,0.35),0_10px_20px_-15px_rgba(21,41,37,0.15)]">
              {/* Card Status Row */}
              <div className="status-row flex items-center justify-between mb-8">
                <span className="status inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--sub)] uppercase">
                  <span className="status-dot-wrap relative w-2.5 h-2.5 flex items-center justify-center">
                    <span className="ping absolute inset-0 rounded-full bg-primary" />
                    <span className="statusdot relative w-2 h-2 rounded-full bg-primary" />
                  </span>
                  Consultation request
                </span>
                <span className="avatar w-9 h-9 rounded-full bg-[var(--teal-deep)] text-white flex items-center justify-center shadow-md">
                  <Icons.Phone size={16} strokeWidth={2} />
                </span>
              </div>

              {/* Changing Content Panels */}
              <div className="messages min-h-[132px] flex flex-col justify-center gap-3 mb-8">
                {(phase === "idle" || phase === "dragging") && (
                  <div key={`${animationKey}-messages`} className="message-panel">
                    <p className="msg msg1">30 minutes.</p>
                    <p className="msg msg2">All your questions.</p>
                  </div>
                )}
                {phase === "connecting" && (
                  <p key="connecting" className="status-line">
                    Connecting…
                  </p>
                )}
                {(phase === "opening" || phase === "answered") && (
                  <p key="opening" className="status-line">
                    Opening consultation booking…
                  </p>
                )}
              </div>

              {/* Drag/Swipe Rail */}
              <div
                ref={railRef}
                className="rail relative h-14 w-full rounded-full overflow-hidden bg-[var(--cream-deep)] select-none touch-none"
              >
                {/* Colored Fill Behind Drag handle */}
                <div
                  className="fill absolute top-0 bottom-0 left-0 rounded-full bg-[var(--fill-tint)]"
                  style={{ width: `${fillWidth}px` }}
                />

                {/* Hint Text */}
                <span
                  className="hint absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-wide text-[var(--sub)] pointer-events-none select-none"
                  style={{ opacity: hintOpacity }}
                >
                  Slide to book
                </span>

                {/* Drag Handle */}
                <div
                  ref={handleRef}
                  onPointerDown={onPointerDown}
                  onKeyDown={onKeyDown}
                  tabIndex={0}
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={maxX > 0 ? Math.round((currentX / maxX) * 100) : 0}
                  aria-label="Slide to answer the consultation call, or press Enter"
                  className={`handle absolute left-[6px] top-[6px] w-11 h-11 rounded-full bg-[var(--teal-deep)] text-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-shadow ${
                    isSnapping ? "snapping" : ""
                  } ${isNudging ? "nudging" : ""} ${isPulsing ? "pulsing" : ""} ${
                    phase === "connecting" || phase === "opening" || phase === "answered"
                      ? "busy"
                      : ""
                  }`}
                  style={{
                    transform: transformStyle,
                    transformOrigin: "left center",
                  }}
                >
                  {/* Pulse Rings */}
                  {isPulsing && !reduceMotion && (
                    <>
                      <span className="pulse-ring absolute inset-0 rounded-full" />
                      <span
                        className="pulse-ring absolute inset-0 rounded-full"
                        style={{ animationDelay: "1.1s" }}
                      />
                    </>
                  )}
                  <Icons.Phone size={16} className="shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .consult-container {
          --ink: #152925;
          --teal: #1b6b57;
          --teal-deep: #0f3d33;
          --clay: #c1794c;
          --sub: #5c6d67;
          --line: rgba(21, 41, 37, 0.1);
          --cream: #f5f8f3;
          --cream-deep: #eaf1e8;
          --card: rgba(255, 255, 255, 0.72);
          --card-border: rgba(255, 255, 255, 0.9);
          --fill-tint: rgba(27, 107, 87, 0.15);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .card-wrap {
          opacity: 0;
          animation: cardIn 0.35s ease-out forwards;
        }

        @keyframes cardIn {
          to {
            opacity: 1;
          }
        }

        .message-panel {
          opacity: 0;
          animation: panelIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.5s;
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateX(40px) rotate(3deg);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateX(0) rotate(0deg);
            filter: blur(0px);
          }
        }

        .glow {
          position: absolute;
          inset: -1.5rem;
          border-radius: 2.5rem;
          filter: blur(28px);
          background: radial-gradient(60% 60% at 50% 30%, rgba(27, 107, 87, 0.18), transparent);
          animation: breathe 5s ease-in-out infinite;
        }

        @keyframes breathe {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.55;
          }
        }

        .ping {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: var(--teal);
          opacity: 0.6;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes ping {
          75%,
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }

        .msg {
          margin: 0;
          opacity: 0;
          animation: fadeIn 0.6s ease-out forwards;
        }

        .msg1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink);
          animation-delay: 1.2s;
        }
        .msg2 {
          font-size: 1.125rem;
          font-weight: 500;
          color: var(--sub);
          animation-delay: 1.8s;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        .status-line {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--ink);
          opacity: 0;
          animation: fadeIn 0.4s ease-out forwards;
        }

        .handle.snapping {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .handle.nudging {
          animation: nudge 1s ease-in-out;
        }

        @keyframes nudge {
          0%,
          100% {
            transform: translateX(0px) scaleX(1);
          }
          50% {
            transform: translateX(10px) scaleX(1);
          }
        }

        .handle.busy {
          pointer-events: none;
          opacity: 0.7;
        }

        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: var(--teal);
          opacity: 0;
          pointer-events: none;
          animation: pulseRing 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-play-state: paused;
        }

        .handle.pulsing .pulse-ring {
          animation-play-state: running;
        }

        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.45;
          }
          70% {
            opacity: 0;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .card-wrap {
            animation: none;
            opacity: 1;
          }
          .message-panel {
            animation: none;
            opacity: 1;
            transform: none;
            filter: none;
          }
          .glow {
            animation: none;
            opacity: 0.4;
          }
          .msg {
            animation: none;
            opacity: 1;
          }
          .status-line {
            animation: none;
            opacity: 1;
          }
          .ping {
            animation: none;
            display: none;
          }
          .handle.nudging {
            animation: none;
          }
          .handle.snapping {
            transition: transform 0.2s linear;
          }
        }
      `}</style>
    </section>
  );
}
