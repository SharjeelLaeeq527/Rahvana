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

  // ── Scroll-driven: switch after ~150 px of scrolling into the section ───────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onScroll = () => {
      if (window.innerWidth < 1024) return;
      const scrolled = window.scrollY - section.offsetTop;
      if (scrolled < 0) return;
      // Switch after 150 px — roughly one mouse-wheel click / one trackpad gesture
      setActiveIndex((scrolled >= 150 ? 1 : 0) as TwoWaysIndex);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectPath = (idx: TwoWaysIndex) => {
    if (sectionRef.current && window.innerWidth >= 1024) {
      const s = sectionRef.current;
      // Scroll to position that triggers the correct panel
      const target = idx === 0 ? s.offsetTop : s.offsetTop + 200;
      window.scrollTo({ top: target, behavior: "smooth" });
    } else {
      setActiveIndex(idx);
    }
  };

  return (
    <>
      {/* ── Desktop (lg+): scroll-driven sticky ─────────────────────────── */}
      <section
        ref={sectionRef}
        id="path"
        aria-label="Two ways to use Rahvana"
        className="relative hidden lg:block mt-40 md:mt-56"
        style={{ height: "calc(100vh + 600px)" }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
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

          {/* Scroll-progress pill indicators — right edge */}
          <div
            style={{
              position: "absolute",
              right: 28,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 10,
            }}
          >
            {([0, 1] as TwoWaysIndex[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectPath(i)}
                aria-label={`Show ${twoWaysPaths[i].title}`}
                style={{
                  width: 7,
                  height: activeIndex === i ? 22 : 7,
                  borderRadius: 4,
                  background: activeIndex === i ? "#0d7377" : "#c8d5d3",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            ))}
          </div>

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
                Choose how you want to use Rahvana.
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
          maxWidth: 520,
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
    <div style={{ position: "relative", width: 680, height: 560 }}>
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
  const [steps, setSteps] = useState([
    { id: 1, title: "Determine Eligibility", status: "done" },
    { id: 2, title: "Gather Required Documents", status: "done" },
    { id: 3, title: "Review Filing Methods", status: "todo" },
    { id: 4, title: "Fill Form I-130", status: "todo" },
    { id: 5, title: "Fill Form I-130A", status: "active" },
    { id: 6, title: "Submit to USCIS", status: "todo" },
    { id: 7, title: "Wait for Receipt", status: "todo" },
    { id: 8, title: "Prepare for Biometrics", status: "todo" },
  ]);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const toggleStep = (id: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status:
              s.status === "done" ? (id === 5 ? "active" : "todo") : "done",
          };
        }
        return s;
      }),
    );
  };

  const completedCount = steps.filter((s) => s.status === "done").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const isAllDone = completedCount === steps.length;

  return (
    <div
      className="relative flex flex-col overflow-visible rounded-[32px] border border-[#dde8e6] bg-[#f9fafc] shadow-[0_24px_80px_rgba(15,23,42,0.12),0_8px_24px_rgba(15,23,42,0.06)]"
      style={{
        width: 680,
        height: 560,
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e1ebe8] bg-white px-6 py-4 rounded-t-[32px]">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0d7377] text-white">
            <Compass className="size-6" />
          </div>
          <div>
            <div className="text-[15px] font-black uppercase tracking-wide text-[#162126]">
              IR-1 Journey
            </div>
            <div className="text-xs text-[#6b8097]">
              Islamabad Embassy · Online Filing
              {!isAllDone && (
                <span className="ml-2 inline-flex items-center gap-1 font-bold text-[#0d7377]">
                  · Click steps to try demo
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBellOpen(!isBellOpen)}
            className="relative flex size-10 items-center justify-center rounded-full border border-[#dde8e6] text-[#6b8097] hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <Bell className="size-5" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#e34242] ring-2 ring-white" />
            <AnimatePresence>
              {isBellOpen && (
                <motion.div
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 5, scale: 0.95 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    reduceMotion ? undefined : { opacity: 0, y: 5, scale: 0.95 }
                  }
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-12 z-[100] w-64 rounded-xl border border-[#dde8e6] bg-white p-4 shadow-xl text-left"
                >
                  <div className="text-xs font-bold text-[#162126]">
                    Notifications
                  </div>
                  <div className="mt-2 rounded-lg bg-[#f0f3f7] p-2 text-xs text-[#4a5c62]">
                    <span className="font-bold text-[#0d7377]">
                      NADRA Review:
                    </span>{" "}
                    Your documents have been processed and are ready.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <div className="flex size-10 items-center justify-center rounded-full border border-[#dde8e6] bg-[#f0f3f7] text-[#6b8097]">
            <User className="size-5" />
          </div>
        </div>
      </div>

      {/* Horizontal Stepper */}
      <div className="flex items-center gap-4 border-b border-[#e1ebe8] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#8284bf] text-sm font-bold text-white shadow-sm">
            1
          </div>
          <div>
            <div className="text-xs font-bold text-[#162126]">
              USCIS Petition
            </div>
            <div className="text-[10px] text-[#6b8097]">
              {Math.round(33 + completedCount * 1.5)}% done
            </div>
          </div>
        </div>
        <div className="h-px w-8 bg-[#dde8e6]" />
        <div className="flex items-center gap-3 opacity-50">
          <div className="flex size-8 items-center justify-center rounded-full border border-[#dde8e6] text-sm font-bold text-[#6b8097]">
            <Lock className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#6b8097]">NVC / CEAC</div>
            <div className="text-[10px] text-[#6b8097]">Locked</div>
          </div>
        </div>
        <div className="h-px w-8 bg-[#dde8e6]" />
        <div className="flex items-center gap-3 opacity-50">
          <div className="flex size-8 items-center justify-center rounded-full border border-[#dde8e6] text-sm font-bold text-[#6b8097]">
            <Lock className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#6b8097]">
              Med + Interview
            </div>
            <div className="text-[10px] text-[#6b8097]">Locked</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <div className="w-[240px] flex-shrink-0 border-r border-[#e1ebe8] bg-white p-5 flex flex-col relative z-10">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4E518C]">
            <div className="size-1.5 rounded-full bg-[#4E518C]" />
            CHAPTER 1 · IN PROGRESS
          </div>
          <h2 className="mt-2 text-[22px] font-black leading-tight text-[#162126]">
            USCIS Petition Filing
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#eef1f7] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#8284bf]"
                initial={false}
                animate={{ width: `${62.5 + completedCount * 3.5}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <span className="text-[11px] font-bold text-[#162126] w-8 text-right">
              {completedCount} / 8
            </span>
          </div>

          <div className="mt-8 text-[10px] font-bold uppercase tracking-widest text-[#6b8097]">
            Active Step
          </div>
          <div className="mt-2 rounded-xl border border-[#c8d1dc] bg-[#f8f9fb] p-3 shadow-sm">
            <div className="font-bold text-[#162126]">Fill Form I-130A</div>
            <div className="mt-1 text-[11px] text-[#6b8097]">
              Step 5 of 8 · In progress
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#fde68a] bg-[#fef3c7]/40 p-3">
            <div className="flex gap-2">
              <div className="mt-1 size-1.5 shrink-0 rounded-full bg-[#d97706]" />
              <div className="text-xs text-[#92400e] leading-snug">
                Fresh NADRA records required for ISL embassy.
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={() => toggleStep(5)}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d7377] px-4 py-3.5 text-[13px] font-bold text-white transition-all hover:bg-[#0a5c5f] hover:shadow-lg focus:outline-none"
            >
              <span>
                {steps[4].status === "done"
                  ? "Mark Incomplete"
                  : "Continue Step"}
              </span>
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-[#f9fafb] p-5 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d7377"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0d7377]">
              CHAPTER 1 STEPS
            </div>
            <div className="ml-auto rounded border border-[#d0e4f7] bg-white px-2 py-0.5 text-[9px] font-bold text-[#6b8097]">
              {completedCount} / 8 DONE
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {steps.map((step) => {
              const isDone = step.status === "done";
              const isActive = step.status === "active";

              return (
                <motion.div
                  key={step.id}
                  layout
                  className={`relative flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isActive
                      ? "border-[#8284bf] bg-[#f0f1fb] shadow-sm"
                      : isDone
                        ? "border-[#e1ebe8] bg-white"
                        : "border-transparent hover:border-[#dde8e6] hover:bg-white"
                  } group cursor-pointer`}
                  onClick={() => toggleStep(step.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-7 items-center justify-center rounded-full transition-all ${
                        isDone
                          ? "bg-[#0d7377] text-white shadow-sm"
                          : isActive
                            ? "bg-[#8284bf] text-white"
                            : "border border-[#dde8e6] bg-white text-[10px] font-bold text-[#6b8097]"
                      }`}
                    >
                      {isDone ? (
                        <Check className="size-4" strokeWidth={3} />
                      ) : isActive ? (
                        <ChevronRight className="size-4" strokeWidth={3} />
                      ) : (
                        step.id
                      )}
                    </div>

                    <span
                      className={`text-[13px] font-bold transition-colors ${
                        isDone
                          ? "text-[#0d7377]"
                          : isActive
                            ? "text-[#4E518C]"
                            : "text-[#6b8097]"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive && !isDone && (
                      <span className="rounded-md bg-[#e0e2f5] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#4E518C]">
                        Active
                      </span>
                    )}
                    {!isDone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(step.id);
                        }}
                        className={`rounded-md px-2.5 py-1.5 text-[10px] font-black transition-all ${
                          isActive
                            ? "bg-[#0d7377] text-white shadow-md hover:bg-[#0a5c5f]"
                            : "opacity-0 group-hover:opacity-100 text-[#0d7377] hover:underline underline-offset-2"
                        }`}
                      >
                        {isActive ? "Mark Completed" : "Complete"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#dde8e6] bg-white p-3.5 opacity-60">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-[#6b8097]" />
                <span className="text-[13px] font-bold text-[#6b8097]">
                  Ch. 2 · NVC / CEAC Processing
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
                Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="grid grid-cols-4 divide-x divide-[#e1ebe8] border-t border-[#e1ebe8] bg-white py-3.5 text-center rounded-b-[32px] relative z-20">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Steps Done
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#162126]">
            {completedCount} / 18
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Chapter
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#162126]">
            1 of 3
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Est. Timeline
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#162126]">
            ~8 months
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b8097]">
            Overall
          </div>
          <div className="mt-0.5 text-[15px] font-black text-[#162126]">
            {Math.round(17 + completedCount * 1.2)}%
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
    label: "Case Strength Analyzer",
    bg: "#f5f3ff",
    fg: "#7c3aed",
    border: "#ddd6fe",
    iconSrc: "/icons/case-strength-analyser.svg",
  },
  {
    id: "action",
    icon: LifeBuoy,
    label: "221(g) Action Planner",
    bg: "#ecfdf5",
    fg: "#059669",
    border: "#d1fae5",
    iconSrc: "/icons/221g-action-plan.svg",
  },
  {
    id: "path",
    icon: Compass,
    label: "Visa Path Finder",
    bg: "#fff7ed",
    fg: "#ea580c",
    border: "#ffedd5",
    iconSrc: "/icons/visa-path-finder.svg",
  },
  {
    id: "interview",
    icon: MessageSquare,
    label: "Interview Prep",
    bg: "#eff6ff",
    fg: "#2563eb",
    border: "#dbeafe",
    iconSrc: "/icons/interview-prep.svg",
  },
  {
    id: "sponsorship",
    icon: Calculator,
    label: "Sponsorship Calculator",
    bg: "#fff1f2",
    fg: "#e11d48",
    border: "#ffe4e6",
    iconSrc: "/icons/sponsorship-calculator.svg",
  },
  {
    id: "dq",
    icon: Clock,
    label: "DQ Status Check",
    bg: "#fdf4ff",
    fg: "#c026d3",
    border: "#fae8ff",
    iconSrc: "/icons/dq-case-tracker.svg",
  },
  {
    id: "bulletin",
    icon: Calendar,
    label: "Visa Bulletin Monitor",
    bg: "#f0fdfa",
    fg: "#0d9488",
    border: "#ccfbf1",
    iconSrc: "/icons/visa-bulletin-monitor.svg",
  },
  {
    id: "photo",
    icon: Camera,
    label: "Photo Booth",
    bg: "#fefce8",
    fg: "#ca8a04",
    border: "#fef9c3",
    iconSrc: "/icons/photo-booth.svg",
  },
  {
    id: "pdf",
    icon: Files,
    label: "PDF Tool Kit",
    bg: "#f0f9ff",
    fg: "#0369a1",
    border: "#bae6fd",
    iconSrc: "/icons/pdf-toolbox.svg",
  },
  {
    id: "snap",
    icon: PenTool,
    label: "Snap & Sign",
    bg: "#eef2ff",
    fg: "#4f46e5",
    border: "#c7d2fe",
    iconSrc: "/icons/snap-and-sign.svg",
  },
  {
    id: "filler",
    icon: Wand2,
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
    desc: "Review your IR-1 evidence and get a clear picture of what's strong, what's missing, and what to fix before you submit.",
    steps: [
      {
        n: 1,
        label: "Upload & Input",
        desc: "Share your relationship details, documents, and case info.",
      },
      {
        n: 2,
        label: "Analyze & Find Gaps",
        desc: "Checks your evidence and flags weak areas against approval patterns.",
      },
      {
        n: 3,
        label: "Review & Fix",
        desc: "Get a list of exactly what to strengthen before submission.",
      },
    ],
    tips: ["Joint Bank Statements", "Domicile Proof", "Communication Logs"],
  },
  action: {
    eyebrow: "Post-Interview",
    title: "221(g) Action Planner",
    desc: "Got a 221(g) slip after your interview? This tool tells you what documents are needed and what to do next — step by step.",
    steps: [
      {
        n: 1,
        label: "Enter Your Slip",
        desc: "Input the details from your 221(g) or AP notice.",
      },
      {
        n: 2,
        label: "Get Your Checklist",
        desc: "See exactly which documents are required and how to format them.",
      },
      {
        n: 3,
        label: "Submit & Track",
        desc: "Know where to send your response and what to expect next.",
      },
    ],
    tips: ["CEAC Tracking", "Embassy Contact", "AP Timeline"],
  },
  path: {
    eyebrow: "Getting Started",
    title: "Visa Path Finder",
    desc: "Starting your IR-1 journey and not sure where to begin? Answer a few quick questions and get a clear recommendation with your first action.",
    steps: [
      {
        n: 1,
        label: "Answer 5 Questions",
        desc: "Tell us about your relationship, citizenship, and current situation.",
      },
      {
        n: 2,
        label: "Confirm Your Path",
        desc: "We confirm IR-1 is the right category and explain what that means.",
      },
      {
        n: 3,
        label: "See Your Next Step",
        desc: "Get one clear action to take right now — petition, sponsor, or prepare.",
      },
    ],
    tips: ["IR-1 Eligibility", "Petitioner vs Beneficiary", "Where to Start"],
  },
  interview: {
    eyebrow: "Preparation",
    title: "Interview Prep",
    desc: "Practice real Islamabad Embassy questions, learn what officers focus on, and walk in prepared — not guessing.",
    steps: [
      {
        n: 1,
        label: "Pick Your Focus",
        desc: "Choose areas to practice — relationship, finances, or domicile.",
      },
      {
        n: 2,
        label: "Practice Questions",
        desc: "Go through real ISL questions with model answers.",
      },
      {
        n: 3,
        label: "Build Confidence",
        desc: "Know officer patterns and be ready for tough questions.",
      },
    ],
    tips: ["Joint Finances", "Communication Proof", "Future Plans"],
  },
  sponsorship: {
    eyebrow: "Financial Check",
    title: "Sponsorship Calculator",
    desc: "Check if the petitioner's income meets the I-864 poverty guideline threshold — and find out which form applies to your case.",
    steps: [
      {
        n: 1,
        label: "Enter Income",
        desc: "Input the petitioner's income, household size, and assets.",
      },
      {
        n: 2,
        label: "Check Threshold",
        desc: "Compared against the 2025 poverty guideline for your household.",
      },
      {
        n: 3,
        label: "Get Your Form",
        desc: "See if I-864 or I-864EZ applies and if a joint sponsor is needed.",
      },
    ],
    tips: ["Joint Sponsor", "Tax Returns", "Pay Stubs"],
  },
  dq: {
    eyebrow: "Scheduling",
    title: "DQ Status Check",
    desc: "See which Documentarily Qualified months are being scheduled at Islamabad right now, and estimate when your interview window will open.",
    steps: [
      {
        n: 1,
        label: "Select Embassy",
        desc: "Choose your embassy — Islamabad or another consulate.",
      },
      {
        n: 2,
        label: "See Current Month",
        desc: "Check which DQ months are being called right now.",
      },
      {
        n: 3,
        label: "Estimate Your Wait",
        desc: "Compare your DQ month to see your approximate interview window.",
      },
    ],
    tips: ["DQ Date", "Scheduling Month", "Wait Estimate"],
  },
  bulletin: {
    eyebrow: "Priority Date",
    title: "Visa Bulletin Monitor",
    desc: "IR-1 is always current — but if you're on a preference category, your priority date needs to be current before you can move forward. Track it here every month.",
    steps: [
      {
        n: 1,
        label: "Enter Priority Date",
        desc: "Enter your priority date from your I-130 approval notice.",
      },
      {
        n: 2,
        label: "Check This Month",
        desc: "We compare it to the latest Visa Bulletin cutoff dates automatically.",
      },
      {
        n: 3,
        label: "Track Movement",
        desc: "See how many months the bulletin moved and whether your date is current.",
      },
    ],
    tips: ["IR-1 Always Current", "Priority Date", "Monthly Updates"],
  },
  photo: {
    eyebrow: "Photo Requirement",
    title: "Photo Booth",
    desc: "Make a compliant U.S. visa photo without a studio visit. Upload any photo and get a properly formatted 2×2 inch result.",
    steps: [
      {
        n: 1,
        label: "Upload Your Photo",
        desc: "Take or upload any clear, front-facing photo.",
      },
      {
        n: 2,
        label: "Auto-Crop & Format",
        desc: "Cropped to 2×2 inches, white background — embassy standard.",
      },
      {
        n: 3,
        label: "Download & Use",
        desc: "Save your compliant photo and attach it to your application.",
      },
    ],
    tips: ["No Glasses", "Neutral Expression", "Both Ears Visible"],
  },
  pdf: {
    eyebrow: "Document Tools",
    title: "PDF Tool Kit",
    desc: "Merge, compress, and format your immigration documents to meet NVC's strict 2MB upload limit and CEAC requirements.",
    steps: [
      {
        n: 1,
        label: "Upload Your Files",
        desc: "Add PDFs, images, or scanned documents from any device.",
      },
      {
        n: 2,
        label: "Merge or Compress",
        desc: "Combine files or reduce size to meet NVC's 2MB limit.",
      },
      {
        n: 3,
        label: "Download Ready",
        desc: "Get a clean, NVC-ready PDF formatted for CEAC upload.",
      },
    ],
    tips: ["Merge PDFs", "Compress Files", "Convert to PDF"],
  },
  snap: {
    eyebrow: "Signatures",
    title: "Snap & Sign",
    desc: "Anywhere a signature is required — forms, letters, declarations, or documents — Snap & Sign creates a clean, professional digital signature in seconds.",
    steps: [
      {
        n: 1,
        label: "Draw, Type or Upload",
        desc: "Choose how you want to create your signature — freehand, typed style, or upload an existing one.",
      },
      {
        n: 2,
        label: "Preview & Adjust",
        desc: "Resize, reposition, and tweak until it looks exactly right on any form.",
      },
      {
        n: 3,
        label: "Download & Use",
        desc: "Save as a transparent PNG and drop it onto any document, form, or PDF that needs signing.",
      },
    ],
    tips: [
      "Any Immigration Form",
      "Letters & Declarations",
      "Works on Mobile & Desktop",
    ],
  },
  filler: {
    eyebrow: "Form Completion",
    title: "Smart Form Filler",
    desc: "Fill I-130, DS-260, and I-864 without the confusion. Enter your details once and get a completed, submission-ready PDF.",
    steps: [
      {
        n: 1,
        label: "Enter Your Details",
        desc: "Fill in personal and case info once in a simple guided flow.",
      },
      {
        n: 2,
        label: "Auto-Fill Form",
        desc: "Data mapped to the correct fields on the official form.",
      },
      {
        n: 3,
        label: "Download PDF",
        desc: "Get a completed, submission-ready PDF in minutes.",
      },
    ],
    tips: ["DS-260", "I-130A", "Review Before Submit"],
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [paused, setPaused] = useState(false);
  const loopWidth = featuredTools.length * STRIDE;

  // Inject CSS keyframe once
  useEffect(() => {
    const id = "tc-ks";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `@keyframes tcScroll{from{transform:translateX(0)}to{transform:translateX(-${loopWidth}px)}}`;
      document.head.appendChild(s);
    }
  }, [loopWidth]);

  // rAF: scale/lift icon nearest to centre
  useEffect(() => {
    const run = () => {
      const wrap = wrapRef.current;
      if (wrap) {
        const { left, width } = wrap.getBoundingClientRect();
        const centerX = left + width / 2;
        const hotZone = width * 0.13;
        wrap.querySelectorAll<HTMLElement>(".tc-icon-box").forEach((el) => {
          const r = el.getBoundingClientRect();
          const dist = Math.abs(r.left + r.width / 2 - centerX);
          const t = Math.max(0, 1 - dist / hotZone);
          el.style.transform = `translateY(${-t * 5}px) scale(${1 + t * 0.2})`;
          el.style.zIndex = t > 0.5 ? "10" : "1";
        });
      }
      rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // 3 copies is enough for seamless loop
  const items = [...featuredTools, ...featuredTools, ...featuredTools];

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 138,
        overflow: "hidden",
        borderTop: "1px solid #e8edf2",
        background: "linear-gradient(to bottom,#ffffff,#f8fafc)",
        WebkitMaskImage:
          "linear-gradient(90deg,transparent 0%,#000 12%,#000 88%,transparent 100%)",
        maskImage:
          "linear-gradient(90deg,transparent 0%,#000 12%,#000 88%,transparent 100%)",
      }}
    >
      {/* Auto-scrolling track */}
      <div
        ref={wrapRef}
        onMouseEnter={() => {
          setPaused(true);
          onHoverChange(true);
        }}
        onMouseLeave={() => {
          setPaused(false);
          onHoverChange(false);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: GAP,
          paddingLeft: GAP,
          height: "100%",
          animation: `tcScroll ${DURATION}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          willChange: "transform",
        }}
      >
        {items.map((tool, idx) => {
          const Icon = tool.icon;
          const toolIdx = idx % featuredTools.length;
          const isActive = toolIdx === activeIdx;
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
              <div
                className="tc-icon-box"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: tool.fg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  outline: isActive ? `2px solid ${tool.fg}` : "none",
                  outlineOffset: isActive ? "3px" : "0",
                  transition: "outline 0.2s",
                  transformOrigin: "50% 100%",
                }}
              >
                <Icon size={24} color="white" strokeWidth={2} />
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: isActive ? 900 : 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: isActive ? tool.fg : "#5a6a72",
                  textAlign: "center",
                  lineHeight: 1.3,
                  maxWidth: 90,
                  pointerEvents: "none",
                  transition: "color 0.2s",
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

// ── Main scene ────────────────────────────────────────────────────────────────

export function IndividualToolsScene() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((idx: number) => {
    const next =
      ((idx % featuredTools.length) + featuredTools.length) %
      featuredTools.length;
    setVisible(false);
    window.setTimeout(() => {
      setActiveIdx(next);
      setVisible(true);
    }, 200);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const t = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => {
        setActiveIdx((i) => (i + 1) % featuredTools.length);
        setVisible(true);
      }, 280);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [activeIdx, isPaused]);

  const tool = featuredTools[activeIdx];
  const content = toolContent[tool.id];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        width: 600,
        height: 500,
        borderRadius: 32,
        background: "white",
        border: "1px solid #dde8e6",
        boxShadow:
          "0 24px 80px rgba(15,23,42,0.12), 0 8px 24px rgba(15,23,42,0.06)",
        position: "absolute",
        left: 40,
        top: 30,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          height: 54,
          flexShrink: 0,
          background: tool.fg,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {(() => {
            const Icon = tool.icon;
            return <Icon size={16} color="white" strokeWidth={2.5} />;
          })()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1,
            }}
          >
            {content.eyebrow}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: "white",
              lineHeight: 1.2,
              marginTop: 2,
            }}
          >
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
            border: "none",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          Get Started
          <ArrowRight size={11} strokeWidth={2.5} />
        </a>
      </div>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: How it works */}
        <div
          style={{
            flex: 1,
            padding: "14px 16px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          {/* Tool description */}
          <div
            style={{
              fontSize: 11.5,
              color: "#4a5c62",
              lineHeight: 1.6,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid #f0f4f8",
            }}
          >
            {content.desc}
          </div>

          {/* Section label */}
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            How it works
          </div>

          {/* 3 Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {content.steps.map((step: any) => (
              <div
                key={step.n}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 12px",
                  border: "1px solid #f0f4f8",
                }}
              >
                {/* Step number circle */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: tool.fg,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {step.n}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#1e293b",
                      lineHeight: 1.2,
                      marginBottom: 3,
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tips */}
        <div
          style={{
            width: 148,
            background: "#f8fafc",
            borderLeft: "1px solid #f0f4f8",
            padding: "14px 12px",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.25s ease",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#94a3b8",
              marginBottom: 4,
            }}
          >
            Key Items
          </div>
          {content.tips.map((tip: string) => (
            <div
              key={tip}
              style={{
                background: "white",
                borderRadius: 9,
                border: `1px solid ${tool.border}`,
                padding: "7px 10px",
                fontSize: 10.5,
                fontWeight: 700,
                color: tool.fg,
                lineHeight: 1.3,
              }}
            >
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom carousel ── */}
      <ToolCarousel
        activeIdx={activeIdx}
        onSelect={(idx) => {
          goTo(idx);
          setIsPaused(true);
        }}
        onHoverChange={setIsPaused}
      />
    </div>
  );
}

export function ConsultationBanner({
  onConsultationClick,
}: {
  onConsultationClick: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const helpItems = [
    "Talk through your case",
    "Get clarity on your next steps",
    "Understand what to prepare next",
  ];

  return (
    <section
      aria-labelledby="consultation-heading"
      className="relative overflow-hidden px-6 py-20 sm:px-8 lg:py-[104px]"
      style={{
        background:
          "radial-gradient(circle at 20% 18%, rgba(220,230,236,0.55), transparent 32%), radial-gradient(circle at 72% 25%, rgba(243,217,204,0.42), transparent 28%), radial-gradient(circle at 78% 80%, rgba(220,235,226,0.30), transparent 24%), linear-gradient(135deg, #eef1f2 0%, #f4eeeb 52%, #edf3ef 100%)",
      }}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:gap-12 xl:gap-14"
      >
        <div className="flex flex-col">
          <p className="mb-5 inline-flex h-[30px] w-fit items-center rounded-full bg-[#dcf3ec]/95 px-3.5 text-[11px] font-bold uppercase tracking-[0.03em] text-[#24564c] shadow-[0_0_24px_rgba(209,255,239,0.72)]">
            ONE-ON-ONE GUIDANCE
          </p>
          <h2
            id="consultation-heading"
            className="max-w-[460px] text-[clamp(42px,4.4vw,66px)] font-black leading-[0.96] tracking-[-0.05em] text-[#12233a]"
          >
            You don't have to do it alone.
          </h2>
          <p className="mt-5 max-w-[430px] text-[17px] leading-[1.58] text-[#2f3f4c] sm:text-lg">
            If the roadmap feels like too much or a tool isn't enough, book a
            consultation for one-on-one help with your case.
          </p>

          <div className="mt-9 flex max-w-[430px] items-center gap-3">
            <p className="shrink-0 text-xs font-extrabold uppercase tracking-[0.03em] text-[#2f3d4d]">
              WHAT THIS CAN HELP WITH
            </p>
            <div className="h-px flex-1 bg-[rgba(28,39,52,0.24)]" />
          </div>

          <div className="mt-3 flex max-w-[430px] flex-col gap-2.5">
            {helpItems.map((item) => (
              <div
                key={item}
                className="grid min-h-[50px] grid-cols-[22px_1fr] items-center gap-3 rounded-[12px] border border-[rgba(45,59,72,0.08)] bg-white/45 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
              >
                <span className="flex size-[22px] items-center justify-center rounded-full bg-[#bff3d7] text-[#1d7352]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-[15px] font-medium leading-snug text-[#1f2f3b]">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onConsultationClick}
            className="mt-8 inline-flex h-[54px] w-fit items-center gap-2 rounded-[13px] bg-[linear-gradient(180deg,#0f8f8f_0%,#0b777f_100%)] px-6 text-base font-bold text-white shadow-[0_8px_18px_rgba(11,119,127,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(11,119,127,0.24)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d7377]/25"
          >
            Book a Consultation
            <ArrowRight className="size-4" />
          </button>
          <p className="mt-3 text-sm text-[#40505e]">
            Designed for IR-1 and family immigration questions.
          </p>
        </div>

        <ConsultationPreviewVisual />
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
