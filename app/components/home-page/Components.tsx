import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Lock,
  Signpost,
  Sparkles,
  Compass,
  ThumbsUp,
  Lightbulb,
  Mic,
  Layers,
  Calendar,
  Brain,
  LifeBuoy,
  MessageSquare,
  Calculator,
  Clock,
  Camera,
  Files,
  PenTool,
  Wand2,
  Bell,
  User,
  Users,
  ShieldCheck,
  Scale,
  BookOpen,
} from "lucide-react";
import { getFormConfig } from "@/lib/formConfig";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
  useSpring,
} from "framer-motion";
import Image from "next/image";
import { FormStep } from "@/app/components/forms/auto-visaform-filling/FormStep";
// import { ProgressBar } from "@/app/components/forms/auto-visaform-filling/ProgressBar";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  chapters,
  caseFields,
  heroI130PreviewDisplay,
  heroI130PreviewNatural,
  milestones,
} from "@/data/home-page-data";
import ir1Data from "@/data/visa-category/ir-1.json";
import { StepQuestDemo } from "./StepQuestDemo";

export const journeyHref = "/visa-category/ir-category/ir1-journey";
export const toolsHref = "/tools";

export function ProductFrame({
  children,
  view = "Dashboard",
  className = "",
  style,
}: {
  children: React.ReactNode;
  view?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[24px] border-2 border-[#d0e4f7] bg-[#f4f7fb] text-[#1c2b3a] shadow-[0_28px_76px_rgba(22,33,38,0.16),0_8px_24px_rgba(44,58,62,0.12)] ${className}`}
      style={style}
    >
      <div className="flex h-[52px] items-center gap-3 border-b border-white/35 bg-white/45 px-5 pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[#6b8097]">
          <LayoutDashboard size={14} strokeWidth={3} />
          Dashboard
          {view !== "Dashboard" && (
            <>
              <ChevronRight size={12} className="opacity-30" strokeWidth={3} />
              <span className="text-[#3a4f63]">{view}</span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full border border-[#d0e4f7] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#3a4f63]">
            IR-1
          </span>
          <span className="hidden rounded-full border border-[#b5e0d0] bg-[#eaf7f2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#1a7a5e] sm:inline-flex">
            Saved
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function StepStatusIcon({
  status,
  index,
}: {
  status: string;
  index: number;
}) {
  if (status === "done") {
    return (
      <div className="flex size-7 items-center justify-center rounded-full border-2 border-white/45 bg-white/20 text-[11px] font-bold text-white">
        <Check size={13} strokeWidth={3} />
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="flex size-7 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100 text-neutral-400">
        <Lock size={12} strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="flex size-7 items-center justify-center rounded-full border-2 border-current bg-white text-[11px] font-bold">
      {index + 1}
    </div>
  );
}

export function StepRow({
  step,
  chapter,
  index,
  active = false,
  isClicking = false,
}: {
  step: readonly [string, string, string, string];
  chapter: (typeof chapters)[number];
  index: number;
  active?: boolean;
  isClicking?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [, name, description, status] = step;
  const isDone = status === "done";
  const isLocked = status === "locked";
  const isCurrent = status === "current" || active;

  return (
    <motion.div
      className={`relative flex items-center gap-3 rounded-[13px] border-[1.5px] px-4 py-3 shadow-[0_10px_28px_rgba(22,33,38,0.11),0_2px_8px_rgba(44,58,62,0.08)] ${
        isDone
          ? chapter.number === 3
            ? "border-[#31415F] bg-[linear-gradient(100deg,#051738_0%,#0a234f_58%,rgba(11,79,58,0.9)_76%,#073827_100%)] text-white"
            : chapter.number === 2
              ? "border-[#8B4388] bg-[linear-gradient(100deg,#520a50_0%,#2f062e_58%,rgba(11,79,58,0.88)_76%,#0b4f3a_100%)] text-white"
              : "border-[#B9BBE2] bg-[linear-gradient(100deg,#8284bf_0%,#4e518c_58%,rgba(11,79,58,0.88)_76%,#0b4f3a_100%)] text-white"
          : isLocked
            ? "border-neutral-200 bg-neutral-50 text-neutral-400 opacity-80"
            : `bg-white/95 ${chapter.border} ${chapter.text}`
      } ${isCurrent && !isDone && !isLocked ? "before:absolute before:inset-y-1 before:left-0 before:w-1.5 before:rounded-full" : ""}`}
      style={
        isCurrent && !isDone && !isLocked
          ? ({ "--tw-before-bg": chapter.color } as React.CSSProperties)
          : undefined
      }
      animate={
        reduceMotion
          ? undefined
          : isClicking
            ? { scale: 0.97, x: 0 }
            : isCurrent
              ? {
                  x: [0, 3, 0],
                  borderColor: [chapter.color, chapter.color, chapter.color],
                }
              : { x: 0 }
      }
      transition={
        isClicking
          ? { duration: 0.15 }
          : { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {isCurrent && !isDone && !isLocked && (
        <span
          className="absolute inset-y-1 left-0 w-1.5 rounded-full"
          style={{ background: chapter.color }}
        />
      )}
      <StepStatusIcon status={status} index={index} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold leading-[1.3]">
          {name}
        </div>
        <div
          className={`mt-0.5 truncate text-[11.5px] font-semibold ${
            isDone
              ? "text-white/90"
              : isLocked
                ? "opacity-60"
                : "text-[#2C3A3E]"
          }`}
        >
          {isLocked ? "Upgrade to unlock" : description}
        </div>
      </div>
      {isLocked ? (
        <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
          Upgrade
        </span>
      ) : (
        <ChevronRight
          className="shrink-0 text-[#b3a6b3] opacity-35"
          size={14}
          strokeWidth={3}
        />
      )}
    </motion.div>
  );
}

function getHeroSceneIndex(phase: number) {
  if (phase >= 21) return 6;
  if (phase >= 20) return 5;
  if (phase >= 9) return 4;
  if (phase >= 6) return 3;
  if (phase >= 4) return 2;
  if (phase >= 3) return 1;
  return 0;
}

export function RealDashboardScene({
  compact = false,
  onSceneChange,
}: {
  compact?: boolean;
  onSceneChange?: (sceneIndex: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const schedule = [
      [0, 0],
      [3000, 1],
      [5600, 2],
      [7600, 3],
      [11600, 4],
      [14600, 5],
      [16400, 6],
      [19800, 7],
      [22400, 8],
      [24100, 9],
      [27000, 10],
      [28500, 11],
      [30500, 12],
      [31500, 13],
      [33000, 14],
      [34500, 15],
      [36500, 16],
      [37500, 17],
      [39000, 18],
      [40500, 19],
      [42500, 20],
      [54500, 21],
      [62500, 0],
    ] as const;

    let timers: number[] = [];
    const run = () => {
      timers.forEach(window.clearTimeout);
      timers = schedule.map(([delay, nextPhase]) =>
        window.setTimeout(() => setPhase(nextPhase), delay),
      );
    };

    run();
    const interval = window.setInterval(run, 64500);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    onSceneChange?.(getHeroSceneIndex(phase));
  }, [onSceneChange, phase]);

  const cursorStates: Record<
    number,
    { opacity: number; left: string; top: string; scale: number }
  > = {
    0: { opacity: 1, left: "112%", top: "10%", scale: 0.96 }, // Initial / Dashboard Idle
    1: { opacity: 1, left: "12%", top: "67%", scale: 1 }, // Hover Chapter 1 in Dashboard Sidebar
    2: { opacity: 1, left: "12%", top: "67%", scale: 1 }, // Click Chapter 1
    3: { opacity: 1, left: "12%", top: "60%", scale: 1 }, // Exit Dashboard View
    4: { opacity: 1, left: "12%", top: "70%", scale: 1 }, // Hover Step 4 (I-130) Card in Chapter View
    5: { opacity: 1, left: "12%", top: "70%", scale: 1 }, // Click Step 4 Card
    6: { opacity: 1, left: "15%", top: "88%", scale: 1 }, // Move to Launch button in Step View
    7: { opacity: 1, left: "25%", top: "95%", scale: 1 }, // Hover Launch I-130 Autoform Button
    8: { opacity: 1, left: "25%", top: "95%", scale: 1 }, // Click Launch Button
    9: { opacity: 1, left: "45.5%", top: "27%", scale: 1 }, // Autoform Panel Intro
    10: { opacity: 1, left: "12%", top: "55%", scale: 1 }, // Move to Family Name Field
    11: { opacity: 1, left: "45.5%", top: "55%", scale: 1 }, // Typing "Khan"
    12: { opacity: 1, left: "88%", top: "78%", scale: 1 }, // Move to Next Button (reveals Given Name)
    13: { opacity: 1, left: "88%", top: "78%", scale: 0.95 }, // Click Next Button
    14: { opacity: 1, left: "12%", top: "70%", scale: 1 }, // Move to Given Name Field
    15: { opacity: 1, left: "45.5%", top: "75.4%", scale: 1 }, // Typing "Amina"
    16: { opacity: 1, left: "88%", top: "90%", scale: 1 }, // Move to Next Button (reveals Middle Name)
    17: { opacity: 1, left: "88%", top: "90%", scale: 0.95 }, // Click Next Button
    18: { opacity: 1, left: "12%", top: "90%", scale: 1 }, // Move to Middle Name Field
    19: { opacity: 1, left: "45.5%", top: "90%", scale: 1 }, // Typing "Noor"
    20: { opacity: 1, left: "12%", top: "51.1%", scale: 1 }, // PDF Preview Scrolling View
    21: { opacity: 1, left: "12%", top: "20.7%", scale: 0.96 }, // Dashboard Complete View (Success State)
  };

  const currentCursor = cursorStates[phase] ?? cursorStates[0];
  const isClicking =
    phase === 2 || phase === 5 || phase === 8 || phase === 13 || phase === 17;
  const view =
    phase >= 21
      ? "dashboard-complete"
      : phase >= 20
        ? "pdf"
        : phase >= 9
          ? "autoform"
          : phase >= 6
            ? "step"
            : phase >= 3
              ? "chapter"
              : "dashboard";

  return (
    <motion.div
      animate={
        reduceMotion
          ? undefined
          : { y: [0, 0, -4, -4, 0], scale: [1, 1, 1.004, 1.004, 1] }
      }
      transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }}
    >
      <ProductFrame
        className={compact ? "h-full w-full min-w-0 backdrop-blur-2xl" : ""}
        style={
          compact
            ? {
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.55)",
                borderRadius: 28,
                boxShadow:
                  "0 30px 90px rgba(15,23,42,0.30), inset 0 1px 0 rgba(255,255,255,0.38)",
              }
            : undefined
        }
      >
        <div className="relative h-full min-h-[470px] overflow-hidden bg-white/10">
          <motion.div
            className="relative h-full min-h-[470px] overflow-hidden"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale:
                      phase === 1 ||
                      phase === 2 ||
                      phase === 4 ||
                      phase === 5 ||
                      phase === 7 ||
                      phase === 8 ||
                      phase === 10
                        ? 1.012
                        : 1,
                  }
            }
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {view === "dashboard" && (
                <motion.div
                  key="dashboard"
                  className="absolute inset-0 p-4 xl:p-5"
                  initial={{ opacity: 0.96, scale: 0.992 }}
                  animate={{
                    opacity: 1,
                    scale: phase === 1 || phase === 2 ? 1.012 : 1,
                  }}
                  exit={{ opacity: 0, scale: 1.01, y: -8 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroDashboardPanel
                    completedI130={false}
                    chapterTargeted={phase === 1 || phase === 2}
                  />
                </motion.div>
              )}
              {view === "chapter" && (
                <motion.div
                  key="chapter"
                  className="absolute inset-0 p-5"
                  initial={{ opacity: 0, scale: 0.986, y: 16 }}
                  animate={{
                    opacity: 1,
                    scale: phase === 4 || phase === 5 ? 1.01 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 1.01, y: -10 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroChapterOnePanel
                    stepTargeted={phase === 4 || phase === 5}
                    isClicking={phase === 5}
                  />
                </motion.div>
              )}
              {view === "step" && (
                <motion.div
                  key="step"
                  className="absolute inset-0 overflow-hidden bg-white"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: phase === 7 || phase === 8 ? 1.01 : 1,
                  }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroI130StepPanel
                    launchTargeted={phase === 7 || phase === 8}
                    isClicking={phase === 8}
                  />
                </motion.div>
              )}
              {view === "autoform" && (
                <motion.div
                  key="autoform"
                  className="absolute inset-0 overflow-hidden bg-white"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroAutoformPanel
                    playPhase={phase}
                    isClicking={isClicking}
                  />
                </motion.div>
              )}
              {view === "pdf" && (
                <motion.div
                  key="pdf"
                  className="absolute inset-0 overflow-hidden bg-white p-5"
                  initial={{ opacity: 0, scale: 0.985, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroPdfPreviewPanel />
                </motion.div>
              )}
              {view === "dashboard-complete" && (
                <motion.div
                  key="dashboard-complete"
                  className="absolute inset-0 p-4 xl:p-5"
                  initial={{ opacity: 0, scale: 0.992, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroDashboardPanel completedI130 />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-50 text-white drop-shadow-[0_16px_18px_rgba(5,23,56,0.32)]"
            initial={false}
            animate={currentCursor}
            transition={{
              left: { duration: 2.05, ease: [0.22, 1, 0.36, 1] },
              top: { duration: 2.05, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.35, ease: "easeOut" },
              scale: {
                duration: isClicking ? 0.22 : 0.5,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
          >
            <svg
              aria-hidden="true"
              className="size-9 overflow-visible"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  "drop-shadow(0 2px 0 rgba(255,255,255,0.9)) drop-shadow(0 8px 14px rgba(5,23,56,0.30))",
              }}
            >
              <path
                d="M4.7 3.4V20.7L9.6 15.9L13.2 22L16.1 20.3L12.6 14.4H19.4L4.7 3.4Z"
                fill="white"
                stroke="#07131f"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
            </svg>
            <AnimatePresence>
              {isClicking && (
                <motion.span
                  key={`hero-cursor-click-${phase}`}
                  className="absolute left-[-8px] top-[-9px] size-7 rounded-full border-2 border-[#0d7377]/70 bg-[#0d7377]/10"
                  initial={{ opacity: 0.82, scale: 0.45 }}
                  animate={{ opacity: 0, scale: 1.45 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </ProductFrame>
    </motion.div>
  );
}

export function HeroDashboardPanel({
  completedI130,
  chapterTargeted = false,
}: {
  completedI130: boolean;
  chapterTargeted?: boolean;
}) {
  const nextStepTitle = completedI130 ? "Fill Form I-130A" : "Fill Form I-130";
  const nextStepBody = completedI130
    ? "Complete the beneficiary spouse information form using Rahvana's guided Autoform Filler."
    : "Use Rahvana's guided Autoform Filler to complete the I-130 Petition for Alien Relative.";

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[22px] border-2 border-[#31415F] bg-[#051738] p-5 text-white shadow-[0_24px_70px_rgba(5,23,56,0.30),0_8px_28px_rgba(13,115,119,0.16)] outline outline-1 outline-white/20">
          <div className="absolute -right-[50px] -top-[50px] size-[180px] rounded-full bg-[#8284BF24]" />
          <div className="relative z-10">
            <div className="mb-2 text-[10.5px] font-black uppercase tracking-[0.12em] text-white/60">
              Next roadmap step
            </div>
            <h3 className="text-[27px] font-black leading-tight tracking-tight">
              {nextStepTitle}
            </h3>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/75">
              {nextStepBody}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#051738]">
              Continue step
              <ArrowRight size={14} />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 2xl:grid 2xl:grid-cols-3">
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.name}
              className={`relative rounded-[18px] border-2 bg-white p-4 text-left ${
                index === 0
                  ? `${chapter.border} shadow-[0_16px_42px_rgba(22,33,38,0.15)]`
                  : "border-[#d0e4f7]"
              }`}
              animate={
                index === 0 && chapterTargeted
                  ? { y: -4, scale: 1.018 }
                  : { y: 0, scale: 1 }
              }
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {index === 0 && chapterTargeted && (
                <motion.span
                  className="absolute inset-[-5px] rounded-[22px] border border-[#0d7377]/35"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.72, 0] }}
                  transition={{ duration: 0.9, repeat: 1 }}
                />
              )}
              <div
                className={`mb-3 inline-flex rounded-full border px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.08em] ${chapter.tint} ${chapter.border} ${chapter.text}`}
              >
                Chapter {chapter.number}
              </div>
              <p className="text-[13.5px] font-black leading-tight text-[#162126]">
                {chapter.name}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    background: chapter.color,
                    width: `${index === 0 && completedI130 ? 52 : chapter.pct}%`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[22px] border-2 border-[#d9e2e1] bg-white/95 p-4 shadow-[0_14px_34px_rgba(22,33,38,0.10)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[12.5px] font-black uppercase tracking-[0.1em] text-[#0c1b33]">
              Case Details
            </h3>
            <ChevronDown size={14} className="text-[#6b8097]" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {caseFields.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[#d0e4f7] bg-[#f4f7fb] p-3"
              >
                <div className="text-[10.5px] font-black uppercase tracking-[0.1em] text-[#6b8097]">
                  {label}
                </div>
                <div className="mt-1 text-[12.5px] font-bold text-[#162126]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border-2 border-[#d9e2e1] bg-white/95 p-4 shadow-[0_14px_34px_rgba(22,33,38,0.10)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[12.5px] font-black uppercase tracking-[0.1em] text-[#0c1b33]">
              Milestones
            </h3>
            <span className="text-[11px] font-black text-[#0d7377]">
              {completedI130 ? "4 / 10" : "3 / 10"}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {milestones.slice(0, 5).map(([label, done], index) => {
              const isDone = done || (completedI130 && index === 3);
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 rounded-xl border-b px-2 py-2 shadow-[0_8px_22px_rgba(22,33,38,0.08)] ${
                    isDone
                      ? "border-l-4 border-[#0D7377]/45 bg-[#e8f5ef]"
                      : "border-l-4 border-[#D9E2E1] bg-white/95"
                  }`}
                >
                  <div
                    className={`flex size-5 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                      isDone
                        ? "border-[#15744f] bg-[#15744f] text-white"
                        : "border-[#d0e4f7] bg-[#f4f7fb] text-[#6b8097]"
                    }`}
                  >
                    {isDone ? <Check size={11} strokeWidth={3} /> : index + 1}
                  </div>
                  <span className="text-[12.5px] font-bold text-[#2C3A3E]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroChapterOnePanel({
  stepTargeted = false,
  isClicking = false,
}: {
  stepTargeted?: boolean;
  isClicking?: boolean;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!stepTargeted) return;

    const container = scrollContainerRef.current;
    const stepEl = stepRefs.current[3]; // Step 4 (index 3)

    if (container && stepEl) {
      const stepTop = stepEl.offsetTop;
      const containerTop = container.offsetTop;

      // Align Step 4 with the cursor's fixed coordinate (320px)
      // We want: stepTop - containerTop - container.scrollTop = 320
      const targetScrollTop = stepTop - containerTop - 280; // 280 to account for step height centering

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    }
  }, [stepTargeted]);

  return (
    <div
      ref={scrollContainerRef}
      className="pointer-events-none mx-auto h-full max-w-[680px] overflow-y-auto pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <motion.div
        className="ir1-card-primary mb-4 rounded-3xl border-[#B9BBE2] py-[32px] px-[24px]"
        initial={false}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#B9BBE2] bg-[#F0F1FB] px-[13px] py-[4px] text-[11px] font-bold uppercase tracking-[0.07em] text-[#4E518C]">
            In Progress
          </div>
        </div>
        <h1 className="mb-1 text-[clamp(23px,3vw,30px)] font-black tracking-tight text-[#162126]">
          USCIS Petition Filing
        </h1>
        <p className="mb-4 text-[14.5px] leading-[1.7] text-[#2C3A3E]">
          File Form I-130 with USCIS to begin the IR-1 spouse visa process for
          your Pakistani spouse.
        </p>
        <div className="flex items-center gap-2.5">
          <div className="h-[7px] flex-1 overflow-hidden rounded-[13px] bg-[#F0F1FB]">
            <div
              className="h-full rounded-[13px] bg-[#8284BF] shadow-[0_2.5px_12px_rgba(36,42,66,0.18)]"
              style={{ width: "41%" }}
            />
          </div>
          <div className="text-[12px] font-bold text-[#4E518C]">41%</div>
        </div>
      </motion.div>

      <motion.div className="flex flex-col gap-1.5 px-2 pb-20" initial={false}>
        {chapters[0].steps.slice(0, 5).map((chapterStep, index) => {
          const status =
            index < 3 ? "done" : index === 3 ? "current" : "locked";
          return (
            <motion.div
              key={chapterStep[0]}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              animate={
                index === 3 && stepTargeted
                  ? { scale: 1.015, x: 3 }
                  : { scale: 1, x: 0 }
              }
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepRow
                step={
                  [
                    chapterStep[0],
                    chapterStep[1],
                    chapterStep[2],
                    status,
                  ] as const
                }
                chapter={chapters[0]}
                index={index}
                active={index === 3}
                isClicking={index === 3 && isClicking}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function HeroI130StepPanel({
  launchTargeted = false,
  isClicking = false,
}: {
  launchTargeted?: boolean;
  isClicking?: boolean;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!launchTargeted) return;
    const container = scrollContainerRef.current;
    const button = buttonRef.current;
    if (container && button) {
      // Responsive offset: 406 for desktop, reduced for mobile to scroll more
      const isMobile = window.innerWidth < 768;
      const offset = isMobile ? 210 : 406;
      const targetScrollTop = button.offsetTop - container.offsetTop - offset;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    }
  }, [launchTargeted]);

  const tool = {
    launch_module: {
      eyebrow: "Autoform Filler · USCIS Form I-130",
      heading: "Guided completion, start to finish",
      features: [
        "Question-by-question guided flow",
        "Plain-language prompts for every field",
        "Built-in review before you finalize",
        "Pakistan-context defaults where relevant",
      ],
      button_label: "Launch I-130 Autoform Filler",
      note: "Opens in a new browser tab — you can return to the roadmap anytime",
    },
  };

  return (
    <div
      ref={scrollContainerRef}
      className="pointer-events-none h-full overflow-y-auto bg-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <motion.div
        className="w-full animate-in fade-in slide-in-from-bottom-6 duration-1000"
        animate={{ y: launchTargeted ? -68 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex w-full max-w-[760px] flex-col px-[24px] pb-[80px] pt-8">
          <h1 className="text-[clamp(26px,4vw,34px)] font-black leading-[1.2] text-[#0f1f38]">
            Fill Form I-130
          </h1>
          <p className="mb-[28px] max-w-[620px] text-[15px] leading-[1.65] text-[#3a4f63]">
            Use Rahvana&apos;s guided Autoform Filler to complete the I-130
            Petition for Alien Relative — with structured step-by-step support,
            clear prompts, and a built-in review flow.
          </p>

          <div className="mb-[22px] flex flex-wrap gap-[8px]">
            <span className="rounded-full border border-[#d0e4f7] bg-[#e8f1fb] px-[12px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] text-primary/80">
              Petitioner
            </span>
            <span className="rounded-full border border-[#c9bef2] bg-[#f3f0fb] px-[12px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#4a2d8a]">
              Rahvana Tool
            </span>
          </div>

          <div className="relative mb-[20px] overflow-hidden rounded-[16px] border border-[#c0596a] bg-[#28151c]">
            <div
              className="absolute left-0 right-0 top-0 h-[2px] opacity-70"
              style={{
                background: "linear-gradient(90deg, #c0596a 0%, #28151c 100%)",
              }}
            />
            <div className="p-[36px_36px_32px]">
              <div className="mb-[26px] flex items-start gap-[16px]">
                <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] border border-[#c0596a] bg-[#c0596a]">
                  <FileText
                    size={22}
                    className="text-white"
                    strokeWidth={1.6}
                  />
                </div>
                <div className="flex-1">
                  <div className="mb-[5px] text-[10px] font-bold uppercase tracking-widest text-[#c0596a]">
                    {tool.launch_module.eyebrow}
                  </div>
                  <h2 className="text-[clamp(20px,3vw,24px)] leading-[1.25] text-white">
                    {tool.launch_module.heading}
                  </h2>
                </div>
              </div>
              <div className="mb-[22px] h-px bg-[#c0596a]/30" />
              <div className="mb-[26px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                {tool.launch_module.features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-start gap-[10px] rounded-[10px] border border-[#c0596a]/30 bg-[#3a232a] p-[12px_14px]"
                  >
                    <div className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#c0596a]" />
                    <div className="text-[13px] leading-[1.4] text-[#fbeaec]">
                      {feat}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-[11px]">
                <motion.button
                  ref={buttonRef}
                  className="group inline-flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[12px] bg-[#c0596a] p-[16px_28px] font-sans text-[15px] font-semibold tracking-[0.01em] text-white shadow-[0_4px_20px_rgba(192,89,106,0.25)] transition-all duration-200 hover:bg-[#a13e4e]"
                  animate={
                    isClicking
                      ? {
                          scale: 0.965,
                          boxShadow: "0 2px 8px rgba(192,89,106,0.15)",
                        }
                      : launchTargeted
                        ? {
                            scale: 1.018,
                            boxShadow: "0 8px 32px rgba(192,89,106,0.35)",
                          }
                        : {
                            scale: 1,
                            boxShadow: "0 4px 20px rgba(192,89,106,0.25)",
                          }
                  }
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span>{tool.launch_module.button_label}</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </motion.button>
                <div className="flex items-center justify-center gap-[5px] text-center text-[12px] leading-[1.4] text-[#fbeaec]">
                  <ExternalLink size={11} strokeWidth={1.8} />
                  <span>{tool.launch_module.note}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function HeroAutoformPanel({
  playPhase,
  isClicking,
}: {
  playPhase: number;
  isClicking: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fillStage, setFillStage] = useState(0);
  const config = useMemo(() => getFormConfig("i130"), []);
  const fields = useMemo(
    () =>
      config?.formFields
        .filter(
          (field) => field.section === "Information About You (Petitioner)",
        )
        .filter((field) => field.key === "full_name_group")
        .slice(0, 1) ?? [],
    [config],
  );

  useEffect(() => {
    if (playPhase < 9) {
      setFormData({});
      setFillStage(0);
      return;
    }

    if (playPhase === 11) {
      setFillStage(1);
      const timers = [
        window.setTimeout(() => setFormData({ family_name: "K" }), 200),
        window.setTimeout(() => setFormData({ family_name: "Khan" }), 600),
      ];
      return () => timers.forEach(window.clearTimeout);
    } else if (playPhase === 13) {
      setFillStage(2);
    } else if (playPhase === 15) {
      const timers = [
        window.setTimeout(
          () => setFormData((prev) => ({ ...prev, given_name: "A" })),
          200,
        ),
        window.setTimeout(
          () => setFormData((prev) => ({ ...prev, given_name: "Amina" })),
          600,
        ),
      ];
      return () => timers.forEach(window.clearTimeout);
    } else if (playPhase === 17) {
      setFillStage(3);
    } else if (playPhase === 19) {
      const timers = [
        window.setTimeout(
          () => setFormData((prev) => ({ ...prev, middle_name: "N" })),
          200,
        ),
        window.setTimeout(
          () => setFormData((prev) => ({ ...prev, middle_name: "Noor" })),
          600,
        ),
      ];
      return () => timers.forEach(window.clearTimeout);
    } else if (playPhase >= 20) {
      setFillStage(4);
    }
  }, [playPhase]);

  return (
    <div className="h-full w-full overflow-hidden bg-[#f7fbfb]">
      <div
        className="backdrop-blur-xl border-b z-30"
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          borderColor: "rgba(13, 115, 119, 0.08)",
        }}
      >
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">
                Form I-130
              </h1>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                Petition for Alien Relative
              </p>
            </div>
          </div>
        </div>
      </div>
      <motion.div
        className="flex gap-6 px-4 md:px-8 py-6 justify-center"
        animate={{
          y: fillStage >= 4 ? -80 : fillStage >= 2 ? -28 : 0,
          scale: fillStage >= 1 ? 1.015 : 1,
          opacity: fillStage >= 4 ? 0 : 1,
        }}
        transition={{
          duration: fillStage >= 4 ? 0.3 : 0.85,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="w-full max-w-2xl px-4 md:px-0">
          <FormStep
            stepNumber={1}
            sectionTitle="Information About You (Petitioner)"
            fields={fields}
            formData={formData}
            onInputChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                [event.target.name]: event.target.value,
              }))
            }
            progressiveSubQuestionIndices={{
              full_name_group: fillStage >= 3 ? 2 : fillStage >= 2 ? 1 : 0,
            }}
          />

          <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
            <motion.button
              className="px-6 py-2.5 rounded-xl text-white font-medium shadow-[0_4px_14px_rgba(13,115,119,0.25)] flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
              }}
              animate={
                fillStage >= 4
                  ? { scale: 0.94, opacity: 0.9 }
                  : isClicking
                    ? { scale: 0.96 }
                    : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.1 }}
            >
              Next
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function HeroPdfPreviewPanel() {
  const reduceMotion = useReducedMotion();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="h-full overflow-hidden bg-[#eef2f7] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
          <FileCheck2 size={16} strokeWidth={2.5} />
          Form I-130 PDF Preview
        </div>
        <span className="rounded-full border border-[#b5e0d0] bg-[#eaf7f2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#15744f]">
          Filled
        </span>
      </div>
      <div className="relative h-[470px] overflow-hidden rounded-xl border border-gray-300 bg-[#d9e0ea] shadow-inner">
        <div className="absolute inset-x-0 top-0 z-10 flex h-10 items-center justify-between border-b border-gray-300 bg-white/95 px-4 text-[11px] font-bold text-gray-600 shadow-sm">
          <span>I-130-auto-filled.pdf</span>
          <span>Page 1 of 12</span>
        </div>
        <motion.div
          className="mx-auto pt-14"
          style={{ width: heroI130PreviewDisplay.width }}
          initial={{ y: 0 }}
          animate={
            reduceMotion || !isLoaded
              ? undefined
              : {
                  y: [0, -124, -212, -268, -236, -258],
                }
          }
          transition={{
            duration: 11.5,
            times: [0, 0.22, 0.46, 0.68, 0.84, 1],
            ease: "easeInOut",
          }}
        >
          <div
            className="relative overflow-hidden border border-[#c8d1dc] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.20)]"
            style={{
              width: heroI130PreviewDisplay.width,
              minHeight: heroI130PreviewDisplay.height,
            }}
          >
            <Image
              src="/homepage/hero-i130-filled-preview.png"
              alt="Filled Form I-130 preview"
              width={heroI130PreviewNatural.width}
              height={heroI130PreviewNatural.height}
              unoptimized
              className="block h-auto w-full"
              onLoad={() => setIsLoaded(true)}
            />
            {!isLoaded && (
              <div className="absolute inset-0 animate-pulse bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(233,238,245,0.9))]" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export const twoWaysPaths = [
  {
    title: "Guided Roadmap",
    eyebrow: "01 - Guided roadmap",
    shortTitle: "Follow the guided IR-1 roadmap.",
    teaser: "A complete IR-1 path with chapters, steps, and progress.",
    description:
      "Follow the full IR-1 journey through structured chapters, guided steps, and clear progress from petition filing to interview readiness.",
    supportEyebrow: "GUIDED ROADMAP",
    supportLead: "A structured path from start to finish.",
    supportText:
      "Move step by step through the IR-1 process with clear milestones, built-in guidance, and the right next action always surfaced. It is designed to reduce uncertainty and keep your case moving with confidence.",
    bestFor: "Best for people who want end-to-end guidance.",
    cta: "Explore the Roadmap",
    href: journeyHref,
  },
  {
    title: "Tools & Resources",
    eyebrow: "02 - Tools & resources",
    shortTitle: "Jump into the help you need today.",
    teaser: "Focused help when one specific task needs attention.",
    description:
      "Use focused tools, guides, calculators, and services when you already know where you are stuck and only need help with one task.",
    supportEyebrow: "TOOLS & RESOURCES",
    supportLead: "Get focused help exactly where you need it.",
    supportText:
      "Jump directly into calculators, checklists, and support tools when you have a specific task to complete. Use them independently or alongside the roadmap whenever you need targeted help.",
    bestFor:
      "Best for people who want targeted help without using the full roadmap.",
    cta: "Browse Tools",
    href: toolsHref,
  },
] as const;

type TwoWaysIndex = 0 | 1;

/** Scales the 680×560 visual to exactly fill its container width. */
function ResponsiveVisual({ index }: { index: TwoWaysIndex }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.offsetWidth / 680));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full"
      style={{ height: Math.round(560 * scale) }}
    >
      <div
        style={{
          width: 680,
          height: 560,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        <TwoWaysVisual index={index} />
      </div>
    </div>
  );
}

export function TwoWaysSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState<TwoWaysIndex>(0);
  const reduceMotion = useReducedMotion();

  const selectPath = (idx: TwoWaysIndex) => {
    setActiveIndex(idx);
  };

  return (
    <>
      {/* ── Desktop (lg+): scroll-driven sticky ─────────────────────────── */}
      <section
        id="path"
        aria-label="Two ways to use Rahvana"
        className="relative hidden lg:block"
      >
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            background:
              "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
            borderTop: "1px solid #e1ebe8",
            borderBottom: "1px solid #e1ebe8",
          }}
        >
          {/* Decorative radial highlights */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-72"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 16% 0%,rgba(13,115,119,0.08),transparent 30%)," +
                "radial-gradient(circle at 86% 14%,rgba(219,128,144,0.07),transparent 28%)",
            }}
          />

          {/* Main grid */}
          <div
            className="relative mx-auto w-full px-10 xl:px-12"
            style={{
              maxWidth: 1360,
              display: "grid",
              gridTemplateColumns: "minmax(0,420px) 1fr",
              gap: "clamp(48px,6vw,100px)",
              alignItems: "start",
            }}
          >
            {/* Left: text + selectors + CTAs */}
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d7377]">
                TWO WAYS TO MOVE FORWARD
              </p>

              <h2
                className="mt-4 mb-0 font-extrabold text-[#162126]"
                style={{
                  fontSize: "clamp(30px,4.2vw,60px)",
                  lineHeight: 1.0,
                  maxWidth: 440,
                }}
              >
                Choose how you want to use Rahvana
              </h2>

              <p
                className="mt-4 mb-0 text-[#4a5c62]"
                style={{
                  fontSize: "clamp(14px,1.15vw,17px)",
                  lineHeight: 1.68,
                  maxWidth: 420,
                }}
              >
                Follow the guided IR-1 roadmap, use focused tools and resources
                independently, and choose the support style that fits what you
                need right now.
              </p>

              {/* Active-panel label */}
              <div style={{ minHeight: 80, marginTop: 22, overflow: "hidden" }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeIndex}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="m-0 text-[11px] font-black uppercase tracking-[0.11em] text-[#0d7377]">
                      {twoWaysPaths[activeIndex].eyebrow}
                    </p>
                    <h3
                      className="mb-0 mt-1.5 font-extrabold text-[#162126]"
                      style={{
                        fontSize: "clamp(17px,1.5vw,21px)",
                        lineHeight: 1.2,
                        maxWidth: 420,
                      }}
                    >
                      {twoWaysPaths[activeIndex].shortTitle}
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Selector buttons */}
              <div className="mt-5 flex flex-col gap-1.5">
                {twoWaysPaths.map((path, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <button
                      key={path.title}
                      type="button"
                      onClick={() => selectPath(i as TwoWaysIndex)}
                      aria-current={isActive ? "true" : undefined}
                      className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left transition-[background,border-color,box-shadow]"
                      style={{
                        border: isActive
                          ? "1.5px solid #0d7377"
                          : "1px solid #e2ebe8",
                        background: isActive ? "#f4fbfa" : "transparent",
                        boxShadow: isActive
                          ? "0 5px 18px rgba(13,115,119,0.10)"
                          : "none",
                        WebkitTapHighlightColor: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className="flex shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                        style={{
                          width: 24,
                          height: 24,
                          background: isActive ? "#0d7377" : "transparent",
                          color: isActive ? "white" : "#9aaeac",
                          border: isActive ? "none" : "1.5px solid #c8d5d3",
                          transition:
                            "background 0.22s, color 0.22s, border-color 0.22s",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[15px] font-black leading-tight"
                          style={{
                            color: isActive ? "#0d7377" : "#162126",
                            transition: "color 0.22s",
                          }}
                        >
                          {path.title}
                        </div>
                        <div
                          className="mt-0.5 text-[12px] leading-snug"
                          style={{
                            color: isActive ? "#4a5c62" : "#9aaeac",
                            transition: "color 0.22s",
                          }}
                        >
                          {path.teaser}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href={journeyHref}
                  className="inline-flex h-10 items-center gap-1.5 rounded-[13px] bg-[#0d7377] px-4 text-[13.5px] font-bold text-white no-underline"
                  style={{ boxShadow: "0 10px 24px rgba(13,115,119,0.22)" }}
                >
                  Start the Roadmap
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href={toolsHref}
                  className="inline-flex h-10 items-center rounded-[13px] border border-[#c8d5d3] bg-white px-4 text-[13.5px] font-bold text-[#162126] no-underline"
                >
                  Browse Resources
                </Link>
              </div>
            </div>

            {/* Right: animated visual */}
            {reduceMotion ? (
              <div className="flex min-w-0 flex-col gap-5">
                <TwoWaysSupportText path={twoWaysPaths[activeIndex]} />
                <ResponsiveVisual index={activeIndex} />
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeIndex}
                  className="flex min-w-0 flex-col gap-5"
                  initial={{ opacity: 0, y: 18, scale: 0.988 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.992 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TwoWaysSupportText path={twoWaysPaths[activeIndex]} />
                  <ResponsiveVisual index={activeIndex} />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      {/* ── Mobile / tablet (below lg): stacked, click to switch ─────────── */}
      <section
        aria-label="Two ways to use Rahvana"
        className="block lg:hidden mt-32 sm:mt-40"
        style={{
          background:
            "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
          borderTop: "1px solid #e1ebe8",
          borderBottom: "1px solid #e1ebe8",
        }}
      >
        <div
          className="relative mx-auto px-5 sm:px-8 py-14 sm:py-16"
          style={{ maxWidth: 1360 }}
        >
          <div className="grid grid-cols-1 gap-y-10">
            {/* Text + selectors */}
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d7377]">
                TWO WAYS TO MOVE FORWARD
              </p>
              <h2
                className="mt-4 mb-0 font-extrabold text-[#162126]"
                style={{ fontSize: "clamp(30px,6.5vw,40px)", lineHeight: 1.05 }}
              >
                Choose how you want to use Rahvana.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.65,
                  color: "#4a5c62",
                  margin: "14px 0 28px 0",
                }}
              >
                Use the full IR-1 roadmap, or jump into focused tools and
                resources when you need targeted help.
              </p>

              <div className="space-y-3">
                {twoWaysPaths.map((path, i) => (
                  <button
                    key={path.title}
                    type="button"
                    onClick={() => setActiveIndex(i as TwoWaysIndex)}
                    aria-current={activeIndex === i ? "true" : undefined}
                    className={`flex w-full items-start gap-3 rounded-[18px] border p-4 text-left transition ${
                      activeIndex === i
                        ? "border-[#0d7377] bg-[#edf8f6] shadow-[0_12px_28px_rgba(13,115,119,0.12)]"
                        : "border-[#d7e6e2] bg-white/80"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                        activeIndex === i
                          ? "bg-[#0d7377] text-white"
                          : "border border-[#c8d5d3] text-[#7f9290]"
                      }`}
                    >
                      {String(i + 1).padStart(2, "00")}
                    </span>
                    <div>
                      <h3
                        className={`text-lg font-black leading-tight ${
                          activeIndex === i
                            ? "text-[#0d7377]"
                            : "text-[#162126]"
                        }`}
                      >
                        {path.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#4a5c62]">
                        {path.teaser}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual preview card */}
            <div className="overflow-hidden rounded-[24px] border border-[#d7e6e2] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeIndex}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TwoWaysSupportText path={twoWaysPaths[activeIndex]} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="relative h-[300px] overflow-hidden border-t border-[#d7e6e2] bg-white sm:h-[380px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeIndex}
                    className="absolute left-1/2 top-1/2 origin-center"
                    style={{ width: 680, height: 560 }}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 10, scale: 0.48 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 0.5 }}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, y: -8, scale: 0.49 }
                    }
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div style={{ transform: "translate(-50%, -50%)" }}>
                      <TwoWaysVisual index={activeIndex} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={journeyHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d7377] px-5 text-sm font-bold text-white"
              >
                Start the Roadmap
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={toolsHref}
                className="inline-flex min-h-11 items-center rounded-xl border border-[#c8d5d3] bg-white px-5 text-sm font-bold text-[#162126]"
              >
                Browse Resources
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
export function TwoWaysScene() {
  return <TwoWaysSection />;
}

export function TwoWaysSupportText({
  path,
}: {
  path: (typeof twoWaysPaths)[number];
}) {
  return (
    <div className="w-full">
      <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#0d7377]">
        {path.supportEyebrow}
      </p>
      <h3
        className="mb-0 mt-1.5 font-extrabold tracking-tight text-[#162126]"
        style={{ fontSize: "clamp(18px,1.8vw,24px)", lineHeight: 1.18 }}
      >
        {path.supportLead}
      </h3>
      <p
        className="mt-2 mb-0 text-[#4a5c62]"
        style={{
          fontSize: "clamp(13px,1.1vw,15px)",
          lineHeight: 1.62,
        }}
      >
        {path.supportText}
      </p>
    </div>
  );
}

// Wraps each visual scene in a stable 680x560 relative container so
// internal absolute-positioned children render correctly.
export function TwoWaysVisual({ index }: { index: TwoWaysIndex }) {
  return (
    <div
      className="flex size-full items-center justify-center"
      style={{ position: "relative", width: 680, height: 520 }}
    >
      {index === 0 ? <GuidedRoadmapScene /> : <IndividualToolsScene />}
    </div>
  );
}

export function TwoWaysMobile({
  activeIndex,
  onSelect,
}: {
  activeIndex: TwoWaysIndex;
  onSelect: (index: TwoWaysIndex) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-2xl">
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#0d7377",
          margin: "0 0 16px 0",
        }}
      >
        TWO WAYS TO MOVE FORWARD
      </p>
      <h2
        style={{
          fontSize: "clamp(30px,6.5vw,40px)",
          lineHeight: 1.05,
          fontWeight: 800,
          color: "#162126",
          margin: "0 0 14px 0",
        }}
      >
        Choose how you want to use Rahvana.
      </h2>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.65,
          color: "#4a5c62",
          margin: "0 0 32px 0",
        }}
      >
        Use the full IR-1 roadmap, or jump into focused tools and resources when
        you need targeted help.
      </p>

      <div className="space-y-3">
        {twoWaysPaths.map((path, index) => (
          <button
            key={path.title}
            type="button"
            onClick={() => onSelect(index as TwoWaysIndex)}
            aria-current={activeIndex === index ? "true" : undefined}
            className={`flex w-full items-start gap-3 rounded-[18px] border p-4 text-left transition ${
              activeIndex === index
                ? "border-[#0d7377] bg-[#edf8f6] shadow-[0_12px_28px_rgba(13,115,119,0.12)]"
                : "border-[#d7e6e2] bg-white/80"
            }`}
          >
            <span
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                activeIndex === index
                  ? "bg-[#0d7377] text-white"
                  : "border border-[#c8d5d3] text-[#7f9290]"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3
                className={`text-lg font-black leading-tight ${
                  activeIndex === index ? "text-[#0d7377]" : "text-[#162126]"
                }`}
              >
                {path.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#4a5c62]">
                {path.teaser}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-[#d7e6e2] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
        <div className="p-5 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <TwoWaysSupportText path={twoWaysPaths[activeIndex]} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative h-[300px] overflow-hidden border-t border-[#d7e6e2] bg-white sm:h-[380px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              className="absolute left-1/2 top-1/2 origin-center"
              style={{ width: 680, height: 560 }}
              initial={
                reduceMotion ? false : { opacity: 0, y: 10, scale: 0.48 }
              }
              animate={{ opacity: 1, y: 0, scale: 0.5 }}
              exit={
                reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.49 }
              }
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ transform: "translate(-50%, -50%)" }}>
                <TwoWaysVisual index={activeIndex} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={journeyHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d7377] px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d7377]/25"
        >
          Start the Roadmap
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href={toolsHref}
          className="inline-flex min-h-11 items-center rounded-xl border border-[#c8d5d3] bg-white px-5 text-sm font-bold text-[#162126] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d7377]/20"
        >
          Browse Resources
        </Link>
      </div>
    </div>
  );
}

export function GuidedRoadmapScene() {
  const [view, setView] = useState<"dashboard" | "chapter" | "step">(
    "dashboard",
  );
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isCaseDetailsOpen, setIsCaseDetailsOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const activeChapter = chapters[activeChapterIdx];
  const activeStep =
    activeStepIdx !== -1 ? activeChapter.steps[activeStepIdx] : null;

  const nextStep =
    chapters[0].steps.find((s) => !completedSteps.has(s[0])) ||
    chapters[0].steps[0];

  const handleSelectChapter = (idx: number) => {
    if (idx >= 1) return; // Only Chapter 1 is open in demo
    setActiveChapterIdx(idx);
    setView("chapter");
  };

  const handleSelectStep = (idx: number) => {
    setActiveStepIdx(idx);
    setView("step");
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const getChapterProgress = (chapterIdx: number) => {
    const chapterSteps = chapters[chapterIdx].steps;
    const done = chapterSteps.filter((s) => completedSteps.has(s[0])).length;
    return Math.round((done / chapterSteps.length) * 100);
  };

  const totalDone = Array.from(completedSteps).length;
  const totalSteps = chapters.reduce((acc, c) => acc + c.steps.length, 0);

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[32px] border border-[#dde8e6] bg-[#f9fafc] shadow-[0_24px_80px_rgba(15,23,42,0.12),0_8px_24px_rgba(15,23,42,0.06)]"
      style={{
        width: 680,
        height: 560,
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Header / Nav */}
      <div className="flex items-center justify-between border-b border-[#e1ebe8] bg-white px-6 py-4 rounded-t-[32px] shrink-0">
        <div className="flex items-center gap-3">
          {view !== "dashboard" ? (
            <button
              onClick={() =>
                view === "step" ? setView("chapter") : setView("dashboard")
              }
              className="flex size-9 items-center justify-center rounded-full border border-[#dde8e6] text-[#6b8097] hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} className="text-[#0d7377]" />
              <span className="text-[14px] font-black uppercase tracking-[0.1em] text-[#162126]">
                Dashboard
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {view === "dashboard" && (
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white px-4 py-1.5 text-[11px] font-black text-[#162126] border border-[#dde8e6] shadow-sm uppercase tracking-wider">
                IR-1
              </div>
              <div className="rounded-full bg-[#f0f9f6] px-4 py-1.5 text-[11px] font-black text-[#0d7377] border border-[#d1e7e2] uppercase tracking-wider">
                Saved
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsBellOpen(!isBellOpen)}
                className="relative flex size-9 items-center justify-center rounded-full border border-[#dde8e6] text-[#6b8097] hover:bg-slate-50 transition-colors"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#e34242] ring-2 ring-white" />
              </button>
              <AnimatePresence>
                {isBellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 z-[100] w-64 rounded-xl border border-[#dde8e6] bg-white p-4 shadow-xl text-left"
                  >
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#162126] mb-1">
                      Notifications Center
                    </div>
                    <p className="text-[10px] text-[#6b8097] leading-relaxed mb-4">
                      This is where your real-time case updates and automated
                      tracking alerts will appear.
                    </p>
                    <div className="space-y-2">
                      <div className="rounded-lg bg-[#f0f9f6] p-2.5 border border-[#d1e7e2]">
                        <div className="text-[10px] font-black text-[#0d7377] uppercase mb-1 flex items-center gap-1.5">
                          <div className="size-1.5 rounded-full bg-[#0d7377]" />
                          Live Case Tracking
                        </div>
                        <div className="text-[11px] leading-snug text-[#4a5c62]">
                          Automated alerts for USCIS/NVC status changes and
                          priority date movements.
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 opacity-60">
                        <div className="text-[10px] font-black text-[#6b8097] uppercase mb-1">
                          System Intelligence
                        </div>
                        <div className="text-[11px] leading-snug text-[#6b8097]">
                          Personalized reminders for upcoming deadlines and
                          document expirations.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full border border-[#dde8e6] bg-[#f0f3f7] text-[#6b8097]">
              <User size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 p-5 overflow-y-auto"
            >
              {/* Next Roadmap Step Card */}
              <div className="mb-6 rounded-[24px] bg-[#051738] p-6 text-white shadow-lg relative overflow-hidden min-h-[170px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                <div className="absolute -right-8 -bottom-8 size-48 rounded-full bg-[#0d7377]/10 blur-2xl" />

                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40 mb-1.5">
                    Next Roadmap Step
                  </div>
                  <h3 className="text-2xl font-black mb-2">{nextStep[1]}</h3>
                  <p className="text-[13px] text-white/50 max-w-sm leading-snug mb-5">
                    {completedSteps.size === 0
                      ? "Start your IR-1 journey today by confirming your eligibility."
                      : "Complete the beneficiary spouse information form using Rahvana's guided Autofill."}
                  </p>
                  <button
                    onClick={() => handleSelectChapter(0)}
                    className="flex w-fit items-center gap-2 rounded-full bg-white px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#051738] hover:bg-white/90 transition-all shadow-md"
                  >
                    Continue Step <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Chapters Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {chapters.map((chapter, idx) => {
                  const isLocked = idx >= 1;
                  const progress = getChapterProgress(idx);
                  const colors = [
                    {
                      pillBg: "bg-[#F0F1FB]",
                      pillText: "text-[#4E518C]",
                      pillBorder: "border-[#B9BBE2]",
                      bar: "bg-[#8284BF]",
                    },
                    {
                      pillBg: "bg-[#F4E6F3]",
                      pillText: "text-[#520A50]",
                      pillBorder: "border-[#8B4388]",
                      bar: "bg-[#520A50]",
                    },
                    {
                      pillBg: "bg-[#E8ECF3]",
                      pillText: "text-[#051738]",
                      pillBorder: "border-[#31415F]",
                      bar: "bg-[#051738]",
                    },
                  ][idx];

                  return (
                    <div
                      key={chapter.name}
                      onClick={() => !isLocked && handleSelectChapter(idx)}
                      className={`group relative flex flex-col rounded-[20px] border-2 bg-white p-4 transition-all ${
                        isLocked
                          ? "border-[#dde8e6]/50 opacity-60 cursor-default"
                          : "border-[#dde8e6] cursor-pointer hover:border-[#0d7377] hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider border ${colors.pillBg} ${colors.pillText} ${colors.pillBorder}`}
                        >
                          Chapter {idx + 1}
                        </div>
                        {isLocked && (
                          <Lock size={14} className="text-slate-300" />
                        )}
                      </div>

                      <h4
                        className={`text-[14px] font-black leading-snug mb-6 ${isLocked ? "text-slate-400" : "text-[#162126]"}`}
                      >
                        {chapter.name}
                      </h4>

                      <div className="mt-auto">
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${colors.bar}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Case Details & Milestones */}
              <div className="mt-6 space-y-3 pb-6">
                {/* Case Details */}
                <div className="overflow-hidden rounded-[20px] border border-[#dde8e6] bg-white shadow-sm">
                  <button
                    onClick={() => setIsCaseDetailsOpen(!isCaseDetailsOpen)}
                    className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0f3f7] text-[#0d7377]">
                        <BookOpen size={16} />
                      </div>
                      <span className="text-[12px] font-black uppercase tracking-wider text-[#162126]">
                        Case Details
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-[#6b8097] transition-transform duration-300 ${isCaseDetailsOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isCaseDetailsOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#dde8e6] bg-[#f9fafc] p-5">
                          {caseFields.map(([label, value]) => (
                            <div key={label}>
                              <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
                                {label}
                              </div>
                              <div className="mt-0.5 text-[13px] font-bold text-[#162126]">
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Milestone History */}
                <div className="overflow-hidden rounded-[20px] border border-[#dde8e6] bg-white shadow-sm">
                  <button
                    onClick={() => setIsMilestonesOpen(!isMilestonesOpen)}
                    className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0f3f7] text-[#0d7377]">
                        <Signpost size={16} />
                      </div>
                      <span className="text-[12px] font-black uppercase tracking-wider text-[#162126]">
                        Milestone History
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-[#6b8097] transition-transform duration-300 ${isMilestonesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isMilestonesOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-[#dde8e6] bg-[#f9fafc] p-5">
                          {milestones.map(([title, completed], idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5"
                            >
                              <div
                                className={`flex size-4 items-center justify-center rounded-full border ${completed ? "bg-[#0d7377] border-[#0d7377] text-white" : "border-[#dde8e6] bg-white text-transparent"}`}
                              >
                                <Check size={10} strokeWidth={4} />
                              </div>
                              <span
                                className={`text-[12px] font-bold ${completed ? "text-[#162126]" : "text-slate-400"}`}
                              >
                                {title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {view === "chapter" && (
            <motion.div
              key="chapter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex"
            >
              <div className="w-[240px] shrink-0 border-r border-[#e1ebe8] bg-white p-5 flex flex-col">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4E518C]">
                  <div className="size-1.5 rounded-full bg-[#4E518C]" />
                  Chapter {activeChapterIdx + 1}
                </div>
                <h2 className="mt-2 text-[20px] font-black leading-tight text-[#162126]">
                  {activeChapter.name}
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-[#6b8097]">
                  {activeChapter.description}
                </p>

                <div className="mt-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b8097] mb-2">
                    Chapter Progress
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0d7377] transition-all"
                        style={{
                          width: `${getChapterProgress(activeChapterIdx)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#162126]">
                      {getChapterProgress(activeChapterIdx)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-[#f9fafb]">
                <div className="flex flex-col gap-2">
                  {activeChapter.steps.map((step, idx) => {
                    const isDone = completedSteps.has(step[0]);
                    const isLocked = !(activeChapterIdx === 0 && idx === 0);
                    return (
                      <div
                        key={step[0]}
                        onClick={() => !isLocked && handleSelectStep(idx)}
                        className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                          isLocked
                            ? "border-transparent bg-white/60 opacity-70 cursor-default"
                            : isDone
                              ? "border-[#0d7377] bg-white cursor-pointer"
                              : "border-transparent bg-white shadow-sm hover:border-[#dde8e6] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => {
                              if (isLocked) return;
                              e.stopPropagation();
                              toggleStep(step[0]);
                            }}
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              isLocked
                                ? "border-slate-200 bg-slate-50 text-slate-300"
                                : isDone
                                  ? "bg-[#0d7377] border-[#0d7377] text-white"
                                  : "border-[#dde8e6] text-slate-300 group-hover:border-[#0d7377] group-hover:text-[#0d7377]"
                            }`}
                          >
                            {isLocked ? (
                              <Lock size={12} />
                            ) : isDone ? (
                              <Check size={14} strokeWidth={3} />
                            ) : (
                              <div className="size-2 rounded-full bg-current" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`text-[13.5px] font-bold ${
                                isLocked
                                  ? "text-slate-400"
                                  : isDone
                                    ? "text-[#0d7377]"
                                    : "text-[#162126]"
                              }`}
                            >
                              {step[1]}
                            </div>
                            <div className="text-[11px] text-[#6b8097]">
                              {step[2]}
                            </div>
                          </div>
                        </div>
                        {!isLocked && (
                          <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:translate-x-1 transition-all"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {view === "step" && activeStep && (
            <motion.div
              key="step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col bg-white overflow-y-auto"
            >
              {activeChapterIdx === 0 && activeStepIdx === 0 ? (
                <StepQuestDemo
                  onComplete={() => {
                    toggleStep(activeStep[0]);
                    setView("chapter");
                  }}
                />
              ) : activeChapterIdx === 0 && activeStepIdx === 1 ? (
                <StepDocsDemo
                  onComplete={() => {
                    toggleStep(activeStep[0]);
                    setView("chapter");
                  }}
                />
              ) : (
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f0f1fb] text-[#4e518c] mb-6 shadow-sm">
                    <FileText size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-[#162126] mb-2">
                    {activeStep[1]}
                  </h2>
                  <p className="max-w-md text-[#6b8097] leading-relaxed mb-8">
                    In the full app, this step includes interactive guides,
                    Pakistan-specific checklists, and automated tools to help
                    you finish faster.
                  </p>

                  <div className="flex flex-col w-full max-w-sm gap-3">
                    <button
                      onClick={() => {
                        toggleStep(activeStep[0]);
                        setView("chapter");
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0d7377] py-4 text-[14px] font-black uppercase tracking-wider text-white shadow-lg hover:bg-[#0a5c5f] transition-all"
                    >
                      {completedSteps.has(activeStep[0])
                        ? "Mark as Incomplete"
                        : "Complete this step"}
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => setView("chapter")}
                      className="w-full py-3 text-sm font-bold text-[#6b8097] hover:text-[#162126] transition-colors"
                    >
                      Back to Checklist
                    </button>
                  </div>

                  <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="rounded-xl border border-dashed border-[#dde8e6] p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b8097] mb-1">
                        Free Access
                      </div>
                      <div className="text-sm font-bold text-[#162126]">
                        Preview Only
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#d0e4f7] bg-[#f0f7ff] p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#0d7377] mb-1">
                        Pro Tool
                      </div>
                      <div className="text-sm font-bold text-[#0d7377]">
                        Auto-Fill Ready
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status Bar */}
      <div className="grid grid-cols-3 divide-x divide-[#e1ebe8] border-t border-[#e1ebe8] bg-white py-4 text-center shrink-0">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Overall Progress
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#162126]">
            {Math.round((totalDone / totalSteps) * 100)}%
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Steps Done
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#162126]">
            {totalDone} / {totalSteps}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Demo Mode
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#0d7377]">
            Free Preview
          </div>
        </div>
      </div>
    </div>
  );
}

// ── tools ──
const featuredTools = [
  {
    id: "strength",
    icon: Brain,
    iconSize: 20,
    label: "Case Strength Analyzer",
    bg: "#f5f3ff",
    fg: "#7c3aed",
    border: "#ddd6fe",
    iconSrc: "/icons/case-strength-analyser.svg",
  },
  {
    id: "action",
    icon: LifeBuoy,
    iconSize: 20,
    label: "221(g) Action Planner",
    bg: "#ecfdf5",
    fg: "#059669",
    border: "#d1fae5",
    iconSrc: "/icons/221g-action-plan.svg",
  },
  {
    id: "path",
    icon: Compass,
    iconSize: 18,
    label: "Visa Path Finder",
    bg: "#fff7ed",
    fg: "#ea580c",
    border: "#ffedd5",
    iconSrc: "/icons/visa-path-finder.svg",
  },
  {
    id: "interview",
    icon: MessageSquare,
    iconSize: 18,
    label: "Interview Prep",
    bg: "#eff6ff",
    fg: "#2563eb",
    border: "#dbeafe",
    iconSrc: "/icons/interview-prep.svg",
  },
  {
    id: "sponsorship",
    icon: Calculator,
    iconSize: 20,
    label: "Sponsorship Calculator",
    bg: "#fff1f2",
    fg: "#e11d48",
    border: "#ffe4e6",
    iconSrc: "/icons/sponsorship-calculator.svg",
  },
  {
    id: "dq",
    icon: Clock,
    iconSize: 20,
    label: "DQ Status Check",
    bg: "#fdf4ff",
    fg: "#c026d3",
    border: "#fae8ff",
    iconSrc: "/icons/dq-case-tracker.svg",
  },
  {
    id: "bulletin",
    icon: Calendar,
    iconSize: 19,
    label: "Visa Bulletin Monitor",
    bg: "#f0fdfa",
    fg: "#0d9488",
    border: "#ccfbf1",
    iconSrc: "/icons/visa-bulletin-monitor.svg",
  },
  {
    id: "photo",
    icon: Camera,
    iconSize: 18,
    label: "Photo Booth",
    bg: "#fefce8",
    fg: "#ca8a04",
    border: "#fef9c3",
    iconSrc: "/icons/photo-booth.svg",
  },
  {
    id: "pdf",
    icon: Files,
    iconSize: 19,
    label: "PDF Tool Kit",
    bg: "#f0f9ff",
    fg: "#0369a1",
    border: "#bae6fd",
    iconSrc: "/icons/pdf-toolbox.svg",
  },
  {
    id: "snap",
    icon: PenTool,
    iconSize: 18,
    label: "Snap & Sign",
    bg: "#eef2ff",
    fg: "#4f46e5",
    border: "#c7d2fe",
    iconSrc: "/icons/snap-and-sign.svg",
  },
  {
    id: "filler",
    icon: Wand2,
    iconSize: 20,
    label: "Smart Form Filler",
    bg: "#fff7ed",
    fg: "#c2410c",
    border: "#fed7aa",
    iconSrc: "/icons/smart-form-filler.svg",
  },
];

const toolContent: Record<string, any> = {
  strength: {
    eyebrow: "Case Review",
    title: "Case Strength Analyzer",
    headline: "Know if your case is ready before the officer does.",
    subtext:
      "Review your evidence, spot the gaps, and fix them before you submit — not after.",
    benefits: [
      "Evidence gaps flagged instantly",
      "Domicile & financial check",
      "Fix list included",
    ],
  },
  action: {
    eyebrow: "Post-Interview",
    title: "221(g) Action Planner",
    headline: "Got a 221(g)? Here's exactly what to do next.",
    subtext:
      "Step-by-step response guide — right documents, right format, right place.",
    benefits: [
      "Not a denial — act fast",
      "Document checklist included",
      "Embassy-specific guidance",
    ],
  },
  path: {
    eyebrow: "Getting Started",
    title: "Visa Path Finder",
    headline: "5 questions. One clear starting point.",
    subtext:
      "Confirm IR-1 is your path and get your first action — no legal knowledge needed.",
    benefits: [
      "Confirm IR-1 eligibility",
      "Know who files what",
      "Instant next step",
    ],
  },
  interview: {
    eyebrow: "Preparation",
    title: "Interview Prep",
    headline: "Walk into ISL prepared, not guessing.",
    subtext:
      "Real Islamabad embassy questions, real model answers, built for IR-1 spouses.",
    benefits: [
      "50+ real ISL questions",
      "Relationship & domicile focus",
      "Officer pattern insights",
    ],
  },
  sponsorship: {
    eyebrow: "Financial Check",
    title: "Sponsorship Calculator",
    headline: "Does your income qualify? Find out in 60 seconds.",
    subtext:
      "Check I-864 threshold, pick the right form, and see if a joint sponsor is needed.",
    benefits: [
      "2025 guidelines updated",
      "I-864 vs I-864EZ",
      "Joint sponsor check",
    ],
  },
  dq: {
    eyebrow: "Scheduling",
    title: "DQ Status Check",
    headline: "See where the ISL scheduling queue stands today.",
    subtext:
      "Check which DQ months are being called and estimate when your interview window opens.",
    benefits: [
      "Live scheduling month",
      "ISL embassy data",
      "Estimate your wait",
    ],
  },
  bulletin: {
    eyebrow: "Priority Date",
    title: "Visa Bulletin Monitor",
    headline: "IR-1 is always current. But yours might not be.",
    subtext:
      "Track your priority date against the latest monthly Visa Bulletin cutoffs.",
    benefits: [
      "Monthly bulletin updates",
      "Priority date tracker",
      "Current or waiting?",
    ],
  },
  photo: {
    eyebrow: "Photo Requirement",
    title: "Photo Booth",
    headline: "Compliant visa photo. Without the studio visit.",
    subtext:
      "Upload any photo — get a 2×2 inch, white background, embassy-ready result.",
    benefits: [
      "Auto-crop & format",
      "Meets USCIS standards",
      "Download in seconds",
    ],
  },
  pdf: {
    eyebrow: "Document Tools",
    title: "PDF Tool Kit",
    headline: "NVC rejects big files. We fix that.",
    subtext:
      "Merge, compress, and convert your documents to meet CEAC's strict 2MB upload limit.",
    benefits: [
      "Under 2MB guaranteed",
      "Merge multiple files",
      "PDF & JPG ready",
    ],
  },
  snap: {
    eyebrow: "Signatures",
    title: "Snap & Sign",
    headline: "Every document needs a signature. Make yours in seconds.",
    subtext:
      "Draw, type, or upload your signature — download as PNG and drop it anywhere.",
    benefits: [
      "Works on any form or doc",
      "Transparent PNG download",
      "Mobile & desktop ready",
    ],
  },
  filler: {
    eyebrow: "Form Completion",
    title: "Smart Form Filler",
    headline: "I-130 done in minutes. Not hours.",
    subtext:
      "Fill your details once and get a completed, submission-ready PDF — no blank fields.",
    benefits: [
      "I-130, DS-260, I-864",
      "Pakistan-specific defaults",
      "Review before you submit",
    ],
  },
};

// ── constants ─────────────────────────────────────────────────────────────────

const ITEM_W = 108;
const GAP = 20;
const STRIDE = ITEM_W + GAP;
const DURATION = 28;

// ── carousel: CSS auto-scroll, pauses on hover ────────────────────────────────

function ToolCarousel({
  activeIdx,
  onSelect,
  onHoverChange,
}: {
  activeIdx: number;
  onSelect: (idx: number) => void;
  onHoverChange: (h: boolean) => void;
}) {
  const N = featuredTools.length;
  const COPIES = 20;
  const totalStep = useRef(10 * N); // start at copy 10, icon 0
  const prevIdx = useRef(activeIdx);
  const [offset, setOffset] = useState(
    () => 300 - (GAP + 10 * N * STRIDE + ITEM_W / 2),
  );
  const [animated, setAnimated] = useState(true);

  useEffect(() => {
    if (activeIdx === prevIdx.current) return;
    // Advance by correct steps forward (handles wrap-around 10→0)
    const diff = (activeIdx - prevIdx.current + N) % N;
    totalStep.current += diff || N;
    prevIdx.current = activeIdx;
    setAnimated(true);
    setOffset(300 - (GAP + totalStep.current * STRIDE + ITEM_W / 2));
  }, [activeIdx, N]);

  const items = Array.from({ length: COPIES }, () => featuredTools).flat();

  return (
    <div
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 138,
        overflow: "hidden",
        borderTop: "1px solid #e8edf2",
        background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: GAP,
          paddingLeft: GAP,
          height: "100%",
          transform: `translateX(${offset}px)`,
          transition: animated
            ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            : "none",
          willChange: "transform",
        }}
      >
        {items.map((tool, idx) => {
          const toolIdx = idx % N;
          const isActive = toolIdx === activeIdx;
          const Icon = tool.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelect(toolIdx)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                width: ITEM_W,
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {/* Icon box — pops when active */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  minWidth: 54,
                  minHeight: 54,
                  borderRadius: 16,
                  background: tool.fg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: isActive ? "scale(1.13)" : "scale(1)",
                  transition:
                    "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  outline: isActive ? `3px solid ${tool.fg}` : "none",
                  outlineOffset: isActive ? "3px" : "0",
                  boxShadow: isActive ? `0 8px 24px ${tool.fg}55` : "none",
                }}
              >
                <Icon size={tool.iconSize} color="white" strokeWidth={1.75} />
              </div>
              {/* Fixed-height label so all icons sit at same level */}
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: isActive ? 900 : 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: isActive ? tool.fg : "#5a6a72",
                  textAlign: "center",
                  lineHeight: 1.3,
                  width: 90,
                  height: 26,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  pointerEvents: "none",
                  transition: "color 0.3s",
                }}
              >
                {tool.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function IndividualToolsScene() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdxRef = useRef(0);

  const goTo = useCallback((idx: number) => {
    const next =
      ((idx % featuredTools.length) + featuredTools.length) %
      featuredTools.length;
    activeIdxRef.current = next;
    setVisible(false);
    window.setTimeout(() => {
      setActiveIdx(next);
      setVisible(true);
    }, 220);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      goTo(activeIdxRef.current + 1);
    }, 4500);
  }, [goTo]);

  useEffect(() => {
    if (hovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hovered, startAutoPlay]);

  const handleSelect = useCallback((idx: number) => {
    goTo(idx);
    if (!hovered) startAutoPlay();
  }, [goTo, hovered, startAutoPlay]);

  const tool = featuredTools[activeIdx];
  const content = toolContent[tool.id];

  return (
    <div
      style={{
        width: 600,
        height: 460,
        borderRadius: 32,
        background: "white",
        border: "1px solid #dde8e6",
        boxShadow:
          "0 24px 80px rgba(15,23,42,0.12), 0 8px 24px rgba(15,23,42,0.06)",
        position: "relative",
        margin: "auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          background: tool.fg,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          transition: "background 0.4s ease",
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {content.eyebrow}
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "white" }}>
            {content.title}
          </div>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            flexShrink: 0,
            background: "white",
            color: tool.fg,
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 10.5,
            fontWeight: 800,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Open Tool <ArrowRight size={10} strokeWidth={2.5} />
        </a>
      </div>

      {/* ── Ad content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: visual panel */}
        <div
          style={{
            width: 195,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            background: tool.bg,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 16px 138px",
            transition: "background 0.4s ease",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: `${tool.fg}08`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -25,
              left: -25,
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: `${tool.fg}06`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "60%",
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: `${tool.fg}05`,
            }}
          />

          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: tool.border,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              boxShadow: `0 12px 32px ${tool.fg}15`,
            }}
          >
            {(() => {
              const Icon = tool.icon;
              return <Icon size={36} color={tool.fg} strokeWidth={1.5} />;
            })()}
          </div>

          {/* Tool label */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: tool.fg,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              lineHeight: 1.4,
              position: "relative",
            }}
          >
            {tool.label}
          </div>
        </div>

        {/* Right: headline + benefits */}
        <div
          style={{
            flex: 1,
            padding: "10px 32px 138px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}
        >
          {/* Headline */}
          <h2
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.25,
              marginBottom: 12,
              letterSpacing: "-0.01em",
            }}
          >
            {content.headline}
          </h2>

          {/* Subtext */}
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 22,
              maxWidth: 320,
            }}
          >
            {content.subtext}
          </p>

          {/* Benefits */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              width: "fit-content",
              alignItems: "flex-start",
            }}
          >
            {content.benefits.map((b: string) => (
              <div
                key={b}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: tool.bg,
                    border: `1.5px solid ${tool.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check size={10} color={tool.fg} strokeWidth={3} />
                </div>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#334155",
                    textAlign: "left",
                  }}
                >
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Carousel ── */}
      <ToolCarousel
        activeIdx={activeIdx}
        onSelect={handleSelect}
        onHoverChange={setHovered}
      />
    </div>
  );
}

// Interactive Clock Widget Component
function InteractiveClockWidget() {
  const clockRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(60);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<number>(2); // Thu - 4:00 PM selected by default

  const timeSlots = [
    { day: "Tue", time: "2:30 PM" },
    { day: "Wed", time: "11:00 AM" },
    { day: "Thu", time: "4:00 PM" },
  ];

  const springAngle = useSpring(60, { stiffness: 30, damping: 15, mass: 1 });

  // Calculate time from angle (angle represents full 12-hour rotation = 720 minutes)
  const totalMinutes = Math.floor((angle / 360) * 12 * 60);
  let h = Math.floor(totalMinutes / 60) || 12;
  let m = totalMinutes % 60;
  m = Math.round(m / 5) * 5;
  if (m === 60) {
    m = 0;
    h = h === 12 ? 1 : h + 1;
  }

  // Minute hand: Each minute = 6 degrees (360 / 60 minutes)
  const minuteHandAngle = m * 6;

  // Hour hand: Each hour = 30 degrees (360 / 12 hours) + each minute adds 0.5 degrees (30 / 60)
  const hourHandAngle = (h % 12) * 30 + m * 0.5;

  const minuteHandRotate = useSpring(minuteHandAngle, {
    stiffness: 30,
    damping: 15,
    mass: 1,
  });
  const hourHandRotate = useSpring(hourHandAngle, {
    stiffness: 30,
    damping: 15,
    mass: 1,
  });

  useEffect(() => {
    springAngle.set(angle);
    minuteHandRotate.set(minuteHandAngle);
    hourHandRotate.set(hourHandAngle);
  }, [
    angle,
    minuteHandAngle,
    hourHandAngle,
    springAngle,
    minuteHandRotate,
    hourHandRotate,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(false), 3600);
    return () => window.clearTimeout(t);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    const fineSnap = 6;
    deg = Math.round(deg / fineSnap) * fineSnap;

    setAngle(deg);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setShowHint(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    const fineSnap = 6;
    deg = Math.round(deg / fineSnap) * fineSnap;
    setAngle(deg);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const timeStr = `${h}:${m.toString().padStart(2, "0")}`;

  const CLOCK_RADIUS = 130;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center gap-8 w-full"
    >
      {/* Soft split glow behind clock - pale blue left, warm cream right */}
      <motion.div
        animate={{ scale: [1, 1.04, 1], opacity: [0.72, 0.98, 0.72] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] blur-[58px] rounded-full pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(216, 236, 251, 0.98) 0%, rgba(216, 236, 251, 0.98) 48%, rgba(252, 243, 210, 0.98) 52%, rgba(252, 243, 210, 0.98) 100%)",
        }}
      />

      <motion.div
        animate={{
          y: isHovered || isDragging ? -6 : 0,
          boxShadow:
            isHovered || isDragging
              ? "0 48px 96px rgba(8,54,58,0.22), inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -3px 8px rgba(0,0,0,0.08)"
              : "0 24px 56px rgba(11,102,106,0.16), inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -2px 6px rgba(0,0,0,0.04)",
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        ref={clockRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerMove={handlePointerMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsDragging(false);
        }}
        className={`relative flex items-center justify-center touch-none bg-gradient-to-b from-white via-[#f8fbfc] to-white/98 backdrop-blur-sm ring-1 ring-[#0B666A]/10 rounded-full group z-20 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ width: CLOCK_RADIUS * 2, height: CLOCK_RADIUS * 2 }}
      >
        {/* Shimmer sweep effect on hover */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-[-100%] w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/60 to-transparent -rotate-45 group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
        </div>

        {/* Outer polished ring */}
        <div className="absolute inset-0 rounded-full border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.02)] pointer-events-none" />

        {/* Inner depth ring */}
        <div className="absolute inset-3 rounded-full border-[1.5px] border-white/50 shadow-[inset_0_6px_20px_rgba(0,0,0,0.05)] pointer-events-none" />
        <div className="absolute inset-[14px] rounded-full border-[0.5px] border-[#0B666A]/8 pointer-events-none" />

        {/* Premium Dial Markers */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              i % 3 === 0
                ? "w-[2.8px] h-5 bg-gradient-to-b from-[#041f23] to-[#082d31] shadow-[0_2px_8px_rgba(8,54,58,0.16),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                : "w-[1.6px] h-3.5 bg-[#0B666A]/70 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            }`}
            style={{
              transform: `rotate(${i * 30}deg) translateY(-${CLOCK_RADIUS * 0.72}px)`,
            }}
          />
        ))}

        <AnimatePresence>
          {showHint && !isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full border border-[#0B666A]/20 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B666A] shadow-[0_8px_20px_rgba(11,102,106,0.14)]"
            >
              Drag to set
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hands Container */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <div
            className="absolute w-[1.5px] rounded-full bg-[#0B666A]/15 origin-bottom shadow-[inset_0_1px_2px_rgba(11,102,106,0.1)]"
            style={{
              height: CLOCK_RADIUS * 0.6,
              bottom: "50%",
              transform: `rotate(180deg)`,
            }}
          />

          {/* Minute Hand */}
          <motion.div
            className="absolute origin-bottom filter drop-shadow-[0_8px_16px_rgba(8,54,58,0.40)]"
            style={{
              height: CLOCK_RADIUS * 0.58,
              bottom: "50%",
              rotate: minuteHandRotate,
            }}
          >
            <div className="w-[3px] h-full rounded-full bg-gradient-to-t from-[#06292d] via-[#0b7a7f] to-[#0ea5a8] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]" />
            <div className="absolute -top-1 -left-[1.5px] w-[6px] h-[6px] rounded-full bg-[#f8fdff] border border-[#0a3c40] shadow-[0_2px_6px_rgba(8,54,58,0.24)]" />
          </motion.div>

          {/* Hour Hand */}
          <motion.div
            className="absolute origin-bottom"
            style={{
              height: CLOCK_RADIUS * 0.36,
              bottom: "50%",
              rotate: hourHandRotate,
            }}
          >
            <div className="w-[4.4px] h-full rounded-full bg-gradient-to-t from-[#03181b] via-[#0a4e53] to-[#0b7a7f] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.26)]" />
          </motion.div>

          {/* Premium Center Pin Stack */}
          <div className="absolute w-5 h-5 rounded-full bg-gradient-to-b from-white to-[#f0f8f9] shadow-[0_4px_12px_rgba(0,0,0,0.12),inset_0_2px_4px_rgba(255,255,255,1)] z-20 flex items-center justify-center border-2 border-white">
            <div className="w-2 h-2 rounded-full bg-gradient-to-b from-[#0B666A] to-[#041f23] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
          </div>
        </div>
      </motion.div>

      {/* Enhanced Floating Time Display */}
      <motion.div
        animate={{ y: isHovered ? -3 : 0, scale: isHovered ? 1.02 : 1 }}
        className="bg-gradient-to-b from-white via-white to-[#f8fbfc] backdrop-blur-md border border-white/80 px-6 py-4 rounded-[20px] shadow-[0_16px_48px_rgba(11,102,106,0.14),inset_0_1px_2px_rgba(255,255,255,1)] z-20 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        <span className="text-[32px] font-bold text-[#041f23] tracking-tight font-['Inter',sans-serif] select-none">
          {timeStr}{" "}
          <span className="text-xs font-semibold text-[#0B666A]/75 uppercase ml-2 tracking-widest">
            EST
          </span>
        </span>
      </motion.div>
    </motion.div>
  );
}

export function ConsultationBanner({
  onConsultationClick,
}: {
  onConsultationClick: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const helpWith = [
    "Talk through your exact case",
    "Clarity on the roadmap & timelines",
    "Understand document preparation",
    "Get expert, tailored guidance",
  ];
  const leaveWith = [
    "A clear, defined next step",
    "Better case understanding",
    "Confidence on preparation",
    "Actionable, strategic direction",
  ];
  const cardSections = [
    {
      label: "WHAT WE DISCUSS",
      title: "Case clarity",
      description:
        "Practical guidance on exactly what will move your case forward.",
      accent: "#0B666A",
      bg: "#F4F7F6",
      pillBg: "rgba(11, 102, 106, 0.05)",
      textColor: "#0F1F2A",
      labelColor: "#0B666A",
      number: "01",
      items: helpWith,
      baseDelay: 0.6,
    },
    {
      label: "WHAT YOU LEAVE WITH",
      title: "A real next move",
      description: "A clearer decision and a tight plan for the next steps.",
      accent: "#B07D5B",
      bg: "#FAF8F4",
      pillBg: "rgba(176, 125, 91, 0.06)",
      textColor: "#0F1F2A",
      labelColor: "#B07D5B",
      number: "02",
      items: leaveWith,
      baseDelay: 0.75,
    },
  ];

  return (
    <section
      aria-labelledby="consultation-heading"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
        borderTop: "1px solid #e1ebe8",
        borderBottom: "1px solid #e1ebe8",
      }}
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ opacity: [0.7, 0.95, 0.7], scale: [1, 1.02, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 top-0 h-72 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 16% 0%,rgba(13,115,119,0.08),transparent 30%)," +
              "radial-gradient(circle at 86% 14%,rgba(219,128,144,0.07),transparent 28%)",
          }}
        />
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full px-10 xl:px-12 z-10 grid grid-cols-1 lg:grid-cols-[1.28fr_0.72fr] gap-14 lg:gap-16 xl:gap-20 items-center"
        style={{
          maxWidth: 1360,
          paddingTop: "clamp(48px,7vh,96px)",
          paddingBottom: "clamp(48px,7vh,96px)",
        }}
      >
        {/* LEFT SIDE: Hero + Cards */}
        <div className="flex flex-col">
          {/* Hero Section */}
          <div className="flex flex-col items-start">
            {/* Badge with animated dot */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/80 mb-8 shadow-[0_4px_12px_rgba(11,102,106,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-1.5 h-1.5 rounded-full bg-[#0B666A]"
              />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#0B666A] font-bold">
                One-On-One Guidance
              </span>
            </motion.div>

            {/* Animated Title with line-by-line reveal */}
            <h2
              id="consultation-heading"
              className="mt-4 mb-0 max-w-full font-extrabold text-[#162126] md:max-w-[640px] lg:max-w-none"
              style={{
                fontSize: "clamp(30px,4.2vw,60px)",
                lineHeight: 1.0,
              }}
            >
              You don&apos;t have to do it{" "}
              <span className="inline-block text-[#0B666A]">alone.</span>
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-4 mb-0 max-w-full text-[#4a5c62] md:max-w-[540px] lg:max-w-none"
              style={{
                fontSize: "clamp(14px,1.15vw,17px)",
                lineHeight: 1.68,
              }}
            >
              If the roadmap feels like too much or a tool isn&apos;t enough,
              book a consultation for tailored clarity on your immigration case.
            </motion.p>
          </div>

          {/* Two-card illustrated grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-10"
          >
            {cardSections.map((card) => (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-[36px] border border-white/60 p-8 sm:p-9 shadow-[0_32px_64px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_48px_80px_rgba(0,0,0,0.06)]"
                style={{
                  background: `radial-gradient(circle at 70% 20%, white 0%, ${card.bg} 100%)`,
                }}
              >
                {/* Concentric rings decoration behind badge */}
                <div className="absolute -right-16 -top-16 size-72 opacity-[0.05] pointer-events-none transition-transform duration-700 group-hover:scale-110">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-full border border-black/60"
                      style={{ transform: `scale(${1 - i * 0.08})` }}
                    />
                  ))}
                </div>

                <div className="relative flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.25em] mb-3"
                      style={{ color: card.labelColor }}
                    >
                      {card.label}
                    </p>
                    <div className="h-[0.5px] w-full bg-black/10 mb-8" />
                    <h3
                      className="text-[26px] font-bold tracking-tight leading-tight"
                      style={{ color: card.textColor }}
                    >
                      {card.title}
                    </h3>
                  </div>

                  {/* Large 3D Badge */}
                  <div
                    className="relative flex size-12 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.18),inset_0_2px_4px_rgba(255,255,255,0.3)]"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${card.accent}ee 0%, ${card.accent} 100%)`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/20 to-transparent pointer-events-none" />
                    {card.number}
                  </div>
                </div>

                <p
                  className="mt-5 mb-12 text-[15px] leading-relaxed opacity-70 font-medium max-w-none"
                  style={{ color: card.textColor }}
                >
                  {card.description}
                </p>

                <div className="relative space-y-4">
                  {card.items.map((item, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: card.baseDelay + i * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      key={item}
                      className="flex items-center gap-4 rounded-lg p-2.5 pr-6 transition-all duration-300 hover:translate-x-2"
                      style={{ background: card.pillBg }}
                    >
                      {/* Bead-like number icon */}
                      <div
                        className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.4)]"
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${card.accent}dd 0%, ${card.accent} 100%)`,
                        }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                        {(i + 1).toString().padStart(2, "0")}
                      </div>
                      <span
                        className="text-[15px] font-bold tracking-tight"
                        style={{ color: card.textColor }}
                      >
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT SIDE: Clock & CTA */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center w-full relative"
        >
          {/* Subtle connecting line */}
          <div className="absolute top-[40%] bottom-[20%] w-[1px] bg-gradient-to-b from-transparent via-[#0B666A]/20 to-transparent -z-10" />

          {/* Availability Header */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col items-center mb-10 gap-4"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#0B666A]/20 shadow-[0_2px_12px_rgba(11,102,106,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B666A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B666A]"></span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#2C3E3F] font-bold">
                Availability
              </span>
            </div>
            <p className="text-[13px] text-[#4A5D5E] font-medium text-center max-w-[240px] leading-relaxed">
              Scheduled around your convenience. Choose what works best for you.
            </p>
          </motion.div>

          {/* Clock Widget */}
          <InteractiveClockWidget />

          {/* CTA Button */}
          <button
            onClick={onConsultationClick}
            className="mt-14 inline-flex min-h-11 w-full max-w-[280px] items-center justify-center gap-2 rounded-[13px] border border-[#0d7377] bg-[#0d7377] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,115,119,0.22)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d7377]/20"
          >
            Book a Consultation
            <ArrowRight className="size-4" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function ConsultationPreviewVisual() {
  const topics = [
    { label: "Case questions", icon: FolderOpen },
    { label: "Next-step guidance", icon: Signpost },
    { label: "Document preparation", icon: Layers },
    { label: "Interview / process clarity", icon: Mic },
  ];
  const slots = ["Tue · 2:30 PM", "Wed · 11:00 AM", "Thu · 4:00 PM"];
  const outcomes = [
    { label: "A clearer next step", icon: Compass },
    { label: "Better understanding of your case", icon: Lightbulb },
    { label: "Confidence about what to prepare", icon: ThumbsUp },
  ];

  return (
    <div className="flex items-center justify-center lg:items-center lg:justify-start lg:grid lg:gap-4 md:grid-cols-[minmax(0,1fr)_254px] md:gap-5 lg:grid-cols-[minmax(0,460px)_254px] mt-6 lg:mt-8">
      <div className="rounded-[20px] border border-[rgba(40,50,60,0.08)] bg-[rgba(248,245,240,0.95)] p-6 shadow-[0_16px_30px_rgba(37,41,46,0.08)] sm:p-[26px]">
        <span className="mb-5 inline-flex h-[30px] items-center rounded-full bg-[#cfeee3] px-3.5 text-[11px] font-bold uppercase tracking-[0.03em] text-[#24564c]">
          One-on-one guidance
        </span>
        <h3 className="mb-7 text-[30px] font-black leading-none tracking-[-0.035em] text-[#12233a] sm:text-[32px]">
          IR-1 Consultation
        </h3>
        <div className="flex flex-col gap-3">
          {topics.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="grid min-h-[64px] grid-cols-[42px_1fr_24px] items-center gap-3 rounded-[14px] border border-[rgba(34,44,55,0.06)] bg-white/50 px-4"
            >
              <span className="flex size-[42px] items-center justify-center text-[#154f50]">
                <Icon className="size-8" strokeWidth={1.8} />
              </span>
              <span className="text-lg font-medium leading-tight text-[#111c29]">
                {label}
              </span>
              <span className="flex size-6 items-center justify-center rounded-full bg-[#4f9a71] text-white">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-[18px] border border-[rgba(40,50,60,0.08)] bg-[rgba(248,245,240,0.95)] p-5 shadow-[0_16px_30px_rgba(37,41,46,0.08)]">
          <div className="mb-4 flex items-center gap-2.5">
            <Calendar
              className="size-[22px] text-[#154f50]"
              strokeWidth={1.8}
            />
            <h4 className="m-0 text-[17px] font-black uppercase tracking-[-0.01em] text-[#101b27]">
              Availability
            </h4>
          </div>
          <p className="mb-3 text-[13px] text-[#6b7785]">
            Scheduled around your convenience. Choose what works best for you.
          </p>
          <div className="flex flex-col gap-3">
            {slots.map((slot) => (
              <div
                key={slot}
                className="flex h-[44px] items-center rounded-[999px] border border-[rgba(34,44,55,0.04)] bg-[#ebe8e1]/70 px-4 text-[15px] font-medium text-[#111827]"
              >
                {slot}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-[rgba(40,50,60,0.08)] bg-[rgba(248,245,240,0.95)] p-5 shadow-[0_16px_30px_rgba(37,41,46,0.08)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h4 className="m-0 text-[18px] font-black leading-tight tracking-[-0.02em] text-[#111827]">
              What you&apos;ll leave with
            </h4>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#d97706",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {outcomes.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="grid grid-cols-[30px_1fr] items-start gap-3"
              >
                <span className="flex size-[30px] items-center justify-center text-[#154f50]">
                  <Icon className="size-7" strokeWidth={1.8} />
                </span>
                <span className="text-[15px] font-medium leading-snug text-[#111827]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepDocsDemo({ onComplete }: { onComplete: () => void }) {
  const [docStatus, setDocStatus] = useState<Record<string, string>>({
    doc_citizenship: "not-started",
    doc_passport_ben: "not-started",
    doc_nikah_nama: "not-started",
    doc_mrc: "not-started",
  });

  const docs = [
    {
      id: "doc_citizenship",
      name: "Proof of U.S. Citizenship",
      subtitle: "Establishes the petitioner's right to file",
      icon: <ShieldCheck className="size-5" />,
    },
    {
      id: "doc_passport_ben",
      name: "Beneficiary Passport",
      subtitle: "Pakistan passport of the immigrant spouse",
      icon: <User className="size-5" />,
    },
    {
      id: "doc_nikah_nama",
      name: "Nikah Nama (Original)",
      subtitle: "Islamic marriage contract — foundational doc",
      icon: <FileText className="size-5" />,
    },
    {
      id: "doc_mrc",
      name: "NADRA Marriage Certificate",
      subtitle: "Government civil registration (MRC)",
      icon: <FileCheck2 className="size-5" />,
    },
  ];

  const toggleDoc = (id: string) => {
    setDocStatus((prev) => ({
      ...prev,
      [id]: prev[id] === "reviewed" ? "not-started" : "reviewed",
    }));
  };

  const doneCount = Object.values(docStatus).filter(
    (s) => s === "reviewed",
  ).length;
  const isAllDone = doneCount === docs.length;

  return (
    <div className="flex-1 p-8 bg-[#f9fafb]">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black text-[#162126]">Gather Documents</h1>
        <div className="flex items-center gap-2 text-[12px] font-bold text-[#0d7377] bg-white px-3 py-1 rounded-full border border-[#dde8e6]">
          {doneCount} / {docs.length} COLLECTED
        </div>
      </div>
      <p className="text-[#6b8097] max-w-xl leading-relaxed mb-8">
        Prepare the documents needed for your IR-1 spouse petition. In the full
        app, you get Pakistan-specific guides for each.
      </p>

      <div className="grid gap-3">
        {docs.map((doc) => {
          const isDone = docStatus[doc.id] === "reviewed";
          return (
            <div
              key={doc.id}
              onClick={() => toggleDoc(doc.id)}
              className={`group flex items-center justify-between rounded-2xl border-2 p-4 transition-all cursor-pointer bg-white ${
                isDone
                  ? "border-[#0d7377] shadow-sm"
                  : "border-transparent shadow-sm hover:border-[#dde8e6]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isDone
                      ? "bg-[#0d7377] text-white"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {doc.icon}
                </div>
                <div>
                  <h4
                    className={`font-black text-[15px] ${
                      isDone ? "text-[#0d7377]" : "text-[#162126]"
                    }`}
                  >
                    {doc.name}
                  </h4>
                  <p className="text-[12px] text-[#6b8097]">{doc.subtitle}</p>
                </div>
              </div>
              <div
                className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? "bg-[#0d7377] border-[#0d7377] text-white"
                    : "border-[#dde8e6] text-transparent group-hover:border-[#0d7377]"
                }`}
              >
                <Check size={16} strokeWidth={4} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 p-5 rounded-2xl bg-[#051738] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Lock className="size-5 text-white/60" />
          </div>
          <div>
            <div className="text-sm font-black">Pakistan-Specific Guides</div>
            <div className="text-[11px] text-white/50">
              Unlock Nikah Nama & NADRA instructions with Pro
            </div>
          </div>
        </div>
        <button className="rounded-lg bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider hover:bg-white/20 transition-all">
          Upgrade
        </button>
      </div>

      {isAllDone && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onComplete}
          className="mt-8 w-full rounded-2xl bg-[#0d7377] py-5 text-base font-black uppercase tracking-widest text-white shadow-xl hover:bg-[#0a5c5f] transition-all"
        >
          Confirm Documents & Continue
        </motion.button>
      )}
    </div>
  );
}
