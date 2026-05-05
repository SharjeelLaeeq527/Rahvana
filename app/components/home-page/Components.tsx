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
}: {
  step: readonly [string, string, string, string];
  chapter: (typeof chapters)[number];
  index: number;
  active?: boolean;
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
        reduceMotion || !isCurrent
          ? undefined
          : {
              x: [0, 3, 0],
              borderColor: [chapter.color, chapter.color, chapter.color],
            }
      }
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
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
  if (phase >= 12) return 6;
  if (phase >= 11) return 5;
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
      [27800, 10],
      [32100, 11],
      [36900, 12],
      [42400, 0],
    ] as const;

    let timers: number[] = [];
    const run = () => {
      timers.forEach(window.clearTimeout);
      timers = schedule.map(([delay, nextPhase]) =>
        window.setTimeout(() => setPhase(nextPhase), delay),
      );
    };

    run();
    const interval = window.setInterval(run, 44200);

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
    { opacity: number; x: number; y: number; scale: number }
  > = {
    0: { opacity: 1, x: 760, y: 56, scale: 0.96 },
    1: { opacity: 1, x: 82, y: 334, scale: 1 },
    2: { opacity: 1, x: 82, y: 334, scale: 1 },
    3: { opacity: 1, x: 82, y: 334, scale: 1 },
    4: { opacity: 1, x: 310, y: 502, scale: 1 },
    5: { opacity: 1, x: 310, y: 502, scale: 1 },
    6: { opacity: 1, x: 348, y: 506, scale: 1 },
    7: { opacity: 1, x: 490, y: 424, scale: 1 },
    8: { opacity: 1, x: 490, y: 424, scale: 1 },
    9: { opacity: 1, x: 502, y: 318, scale: 1 },
    10: { opacity: 1, x: 502, y: 318, scale: 1 },
    11: { opacity: 1, x: 536, y: 286, scale: 0.96 },
    12: { opacity: 1, x: 650, y: 116, scale: 0.96 },
  };

  const currentCursor = cursorStates[phase] ?? cursorStates[0];
  const isClicking = phase === 2 || phase === 5 || phase === 8 || phase === 10;
  const view =
    phase >= 12
      ? "dashboard-complete"
      : phase >= 11
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
                  <HeroAutoformPanel playPhase={phase} />
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
              x: { duration: 2.05, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 2.05, ease: [0.22, 1, 0.36, 1] },
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
}: {
  stepTargeted?: boolean;
}) {
  return (
    <div className="mx-auto h-full max-w-[680px] overflow-hidden pt-2">
      <motion.div
        className="ir1-card-primary mb-4 rounded-3xl border-[#B9BBE2] py-[32px] px-[24px]"
        animate={{ y: stepTargeted ? -32 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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

      <motion.div
        className="flex flex-col gap-1.5"
        animate={{ y: stepTargeted ? -32 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {chapters[0].steps.slice(0, 5).map((chapterStep, index) => {
          const status =
            index < 3 ? "done" : index === 3 ? "current" : "locked";
          return (
            <motion.div
              key={chapterStep[0]}
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
}: {
  launchTargeted?: boolean;
}) {
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
    <div className="h-full overflow-hidden bg-white">
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
                  className="group inline-flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[12px] bg-[#c0596a] p-[16px_28px] font-sans text-[15px] font-semibold tracking-[0.01em] text-white shadow-[0_4px_20px_rgba(192,89,106,0.25)] transition-all duration-200 hover:bg-[#a13e4e]"
                  animate={
                    launchTargeted
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

export function HeroAutoformPanel({ playPhase }: { playPhase: number }) {
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
    setFormData({});
    setFillStage(0);
    if (playPhase < 10) return;

    const timers = [
      window.setTimeout(() => {
        setFillStage(1);
        setFormData({ family_name: "K" });
      }, 450),
      window.setTimeout(() => setFormData({ family_name: "Khan" }), 1050),
      window.setTimeout(() => {
        setFillStage(2);
        setFormData((prev) => ({ ...prev, given_name: "A" }));
      }, 1650),
      window.setTimeout(
        () => setFormData((prev) => ({ ...prev, given_name: "Amina" })),
        2300,
      ),
      window.setTimeout(() => {
        setFillStage(3);
        setFormData((prev) => ({ ...prev, middle_name: "Noor" }));
      }, 3100),
      window.setTimeout(() => setFillStage(4), 4000),
    ];
    return () => timers.forEach(window.clearTimeout);
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
            duration: 6.2,
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
    <div ref={wrapRef} className="w-full" style={{ height: Math.round(560 * scale) }}>
      <div style={{ width: 680, height: 560, transformOrigin: "top left", transform: `scale(${scale})` }}>
        <TwoWaysVisual index={index} />
      </div>
    </div>
  );
}

export function TwoWaysSection() {
  const sectionRef   = useRef<HTMLElement>(null);
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
        className="relative hidden lg:block"
        style={{ height: "calc(100vh + 600px)" }}
      >
        <div
          style={{
            position : "sticky",
            top      : 0,
            height   : "100vh",
            display  : "flex",
            alignItems : "center",
            overflow : "hidden",
            background:
              "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
            borderTop    : "1px solid #e1ebe8",
            borderBottom : "1px solid #e1ebe8",
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
              position        : "absolute",
              right           : 28,
              top             : "50%",
              transform       : "translateY(-50%)",
              display         : "flex",
              flexDirection   : "column",
              gap             : 8,
              zIndex          : 10,
            }}
          >
            {([0, 1] as TwoWaysIndex[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectPath(i)}
                aria-label={`Show ${twoWaysPaths[i].title}`}
                style={{
                  width      : 7,
                  height     : activeIndex === i ? 22 : 7,
                  borderRadius : 4,
                  background : activeIndex === i ? "#0d7377" : "#c8d5d3",
                  border     : "none",
                  cursor     : "pointer",
                  padding    : 0,
                  transition : "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            ))}
          </div>

          {/* Main grid */}
          <div
            className="relative mx-auto w-full px-10 xl:px-12"
            style={{
              maxWidth            : 1360,
              display             : "grid",
              gridTemplateColumns : "minmax(0,420px) 1fr",
              gap                 : "clamp(48px,6vw,100px)",
              alignItems          : "center",
            }}
          >
            {/* Left: text + selectors + CTAs */}
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d7377]">
                TWO WAYS TO MOVE FORWARD
              </p>

              <h2
                className="mt-4 mb-0 font-extrabold text-[#162126]"
                style={{ fontSize: "clamp(30px,4.2vw,60px)", lineHeight: 1.0, maxWidth: 440 }}
              >
                Choose how you want to use Rahvana.
              </h2>

              <p
                className="mt-4 mb-0 text-[#4a5c62]"
                style={{ fontSize: "clamp(14px,1.15vw,17px)", lineHeight: 1.68, maxWidth: 420 }}
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
                      style={{ fontSize: "clamp(17px,1.5vw,21px)", lineHeight: 1.2, maxWidth: 420 }}
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
                        border     : isActive ? "1.5px solid #0d7377" : "1px solid #e2ebe8",
                        background : isActive ? "#f4fbfa" : "transparent",
                        boxShadow  : isActive ? "0 5px 18px rgba(13,115,119,0.10)" : "none",
                        WebkitTapHighlightColor: "transparent",
                        cursor     : "pointer",
                      }}
                    >
                      <span
                        className="flex shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                        style={{
                          width      : 24,
                          height     : 24,
                          background : isActive ? "#0d7377" : "transparent",
                          color      : isActive ? "white" : "#9aaeac",
                          border     : isActive ? "none" : "1.5px solid #c8d5d3",
                          transition : "background 0.22s, color 0.22s, border-color 0.22s",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[15px] font-black leading-tight"
                          style={{ color: isActive ? "#0d7377" : "#162126", transition: "color 0.22s" }}
                        >
                          {path.title}
                        </div>
                        <div
                          className="mt-0.5 text-[12px] leading-snug"
                          style={{ color: isActive ? "#4a5c62" : "#9aaeac", transition: "color 0.22s" }}
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
        className="block lg:hidden"
        style={{
          background   : "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
          borderTop    : "1px solid #e1ebe8",
          borderBottom : "1px solid #e1ebe8",
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
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#4a5c62", margin: "14px 0 28px 0" }}>
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
                          activeIndex === i ? "text-[#0d7377]" : "text-[#162126]"
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
                    initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.48 }}
                    animate={{ opacity: 1, y: 0, scale: 0.5 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.49 }}
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
        style={{ fontSize: "clamp(13px,1.1vw,15px)", lineHeight: 1.62, maxWidth: 520 }}
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
  const reduceMotion = useReducedMotion();

  // Chapter data for the horizontal nav + right step list
  const chapterNav = [
    { n: 1, label: "USCIS Petition",  color: "#8284BF", ring: "#B9BBE2", bg: "#F0F1FB", text: "#4E518C", pct: 33, active: true  },
    { n: 2, label: "NVC / CEAC",      color: "#8B4388", ring: "#8B4388", bg: "#F4E6F3", text: "#520A50", pct: 0,  active: false },
    { n: 3, label: "Med + Interview", color: "#31415F", ring: "#31415F", bg: "#E8ECF3", text: "#051738", pct: 0,  active: false },
  ] as const;

  const steps = [
    { id: 1, name: "Determine Eligibility",     done: true,  current: false },
    { id: 2, name: "Gather Required Documents", done: true,  current: false },
    { id: 3, name: "Review Filing Methods",     done: false, current: true  },
    { id: 4, name: "Fill Form I-130",           done: false, current: false },
    { id: 5, name: "Fill Form I-130A",          done: false, current: false },
    { id: 6, name: "Submit to USCIS",           done: false, current: false },
  ];

  return (
    <div style={{ width: 600, height: 500, borderRadius: 32, background: "#f4f7fb", border: "1px solid #dde8e6", boxShadow: "0 24px 80px rgba(15,23,42,0.13), 0 8px 24px rgba(15,23,42,0.07)", position: "absolute", left: 40, top: 30, overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar (52px) ── */}
      <div style={{ height: 52, background: "white", borderBottom: "1px solid #edf2f0", display: "flex", alignItems: "center", padding: "0 18px", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg, #0d7377, #0a5e62)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(13,115,119,0.28)" }}>
            <Compass size={15} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1e293b", lineHeight: 1 }}>IR-1 Journey</div>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginTop: 2 }}>Islamabad Embassy · Online Filing</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Bell size={17} color="#64748b" strokeWidth={2} />
            <div style={{ position: "absolute", top: -1, right: -1, width: 6, height: 6, borderRadius: "50%", background: "#ef4444", border: "1.5px solid white" }} />
          </div>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
            <User size={14} color="#64748b" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* ── Horizontal chapter timeline (42px) ── */}
      <div style={{ height: 42, background: "white", borderBottom: "1px solid #edf2f0", display: "flex", alignItems: "center", padding: "0 20px", gap: 0, flexShrink: 0 }}>
        {chapterNav.map((ch, idx) => (
          <div key={ch.n} style={{ display: "flex", alignItems: "center", flex: idx < 2 ? "none" : 1 }}>
            {/* Node + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: ch.active ? `linear-gradient(135deg, ${ch.color}, ${ch.color}bb)` : "#f1f5f9", border: `2px solid ${ch.active ? ch.ring : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ch.active ? `0 0 0 3px ${ch.color}28` : "none", flexShrink: 0 }}>
                {ch.active ? <span style={{ fontSize: 10, fontWeight: 900, color: "white" }}>{ch.n}</span> : <Lock size={9} color="#94a3b8" strokeWidth={2.5} />}
              </div>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: ch.active ? "#1e293b" : "#94a3b8", lineHeight: 1, whiteSpace: "nowrap" }}>{ch.label}</div>
                <div style={{ fontSize: 7.5, fontWeight: 700, color: ch.active ? ch.text : "#cbd5e1", marginTop: 1 }}>{ch.active ? `${ch.pct}% done` : "Locked"}</div>
              </div>
            </div>
            {/* Connector line between chapters */}
            {idx < 2 && <div style={{ flex: 1, height: 2, background: idx === 0 ? `linear-gradient(to right, ${chapterNav[0].ring}, #e2e8f0)` : "#e2e8f0", margin: "0 10px", minWidth: 24 }} />}
          </div>
        ))}
      </div>

      {/* ── Main area — two columns (362px total) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Journey card (192px) */}
        <div style={{ width: 192, background: "white", borderRight: "1px solid #edf2f0", padding: "14px 15px", display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Chapter header */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#8284BF" }} className={reduceMotion ? "" : "animate-pulse"} />
              <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4E518C" }}>Chapter 1 · In Progress</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: "#1e293b", lineHeight: 1.25, marginBottom: 7 }}>USCIS Petition Filing</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 99, background: "#e8edf2", overflow: "hidden" }}>
                <div style={{ width: "33%", height: "100%", background: "linear-gradient(90deg, #8284BF, #4E518C)", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 800, color: "#4E518C", whiteSpace: "nowrap" }}>2/6</span>
            </div>
          </div>

          <div style={{ height: 1, background: "#f0f4f3", marginBottom: 10 }} />

          {/* Current step card */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 5 }}>Active Step</div>
            <div style={{ background: "linear-gradient(135deg, #F0F1FB, #f9f9fe)", borderRadius: 10, padding: "9px 10px", border: "1px solid #B9BBE2" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4E518C", lineHeight: 1.3, marginBottom: 3 }}>Review Filing Methods</div>
              <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.45 }}>Step 3 of 6 · Online or paper mail?</div>
            </div>
          </div>

          {/* Alert */}
          <div style={{ borderRadius: 9, padding: "7px 9px", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", marginTop: 3.5, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "#92400e", lineHeight: 1.45 }}>Fresh NADRA records required for ISL embassy.</span>
            </div>
          </div>

          {/* CTA — marginTop: auto, never cropped */}
          <button type="button" style={{ width: "100%", background: "linear-gradient(135deg, #0d7377 0%, #0a9e6e 100%)", border: "none", borderRadius: 11, padding: "11px 14px", color: "white", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", boxShadow: "0 4px 14px rgba(13,115,119,0.28)", marginTop: "auto", flexShrink: 0 }}>
            Continue Step
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right: Step list (flex: 1) */}
        <div style={{ flex: 1, padding: "14px 14px", overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Signpost size={11} color="#0d7377" strokeWidth={2.5} />
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>Chapter 1 Steps</span>
            <span style={{ marginLeft: "auto", fontSize: 8.5, fontWeight: 800, color: "#4E518C", background: "#F0F1FB", border: "1px solid #B9BBE2", padding: "2px 7px", borderRadius: 5 }}>2 / 6 done</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: step.current ? "8px 10px" : "5px 10px", borderRadius: 10, background: step.current ? "linear-gradient(to right, #F0F1FB, #f9f9fe)" : "transparent", border: step.current ? "1.5px solid #B9BBE2" : "1px solid transparent", boxShadow: step.current ? "0 2px 7px rgba(130,132,191,0.12)" : "none" }}>
                {step.done ? (
                  <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                ) : step.current ? (
                  <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#8284BF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 3px rgba(130,132,191,0.22)" }}>
                    <ChevronRight size={10} color="white" strokeWidth={3} />
                  </div>
                ) : (
                  <div style={{ width: 19, height: 19, borderRadius: "50%", border: "1.5px solid #dde8e6", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: "#cbd5e1" }}>{idx + 1}</span>
                  </div>
                )}
                <span style={{ fontSize: 11.5, fontWeight: step.current ? 800 : step.done ? 600 : 500, color: step.current ? "#4E518C" : step.done ? "#059669" : "#94a3b8" }}>
                  {step.name}
                </span>
                {step.current && <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 900, color: "#4E518C", background: "rgba(130,132,191,0.15)", padding: "2px 7px", borderRadius: 5, textTransform: "uppercase", flexShrink: 0 }}>Active</span>}
              </div>
            ))}
          </div>

          {/* Locked chapters – compact */}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { n: 2, label: "NVC / CEAC Processing", steps: "8 steps" },
              { n: 3, label: "Medical + Interview",    steps: "6 steps" },
            ].map(ch => (
              <div key={ch.n} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, background: "white", border: "1px dashed #e2e8f0" }}>
                <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#f1f5f9", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Lock size={9} color="#94a3b8" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Ch. {ch.n} · {ch.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 8.5, fontWeight: 700, color: "#cbd5e1", flexShrink: 0 }}>{ch.steps}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom stats bar (44px) ── */}
      <div style={{ height: 44, background: "white", borderTop: "1px solid #edf2f0", display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0 }}>
        {([
          { label: "Steps Done",    value: "2 / 18"    },
          { label: "Chapter",       value: "1 of 3"    },
          { label: "Est. Timeline", value: "~8 months" },
          { label: "Overall",       value: "17%"       },
        ] as const).map((stat, i) => (
          <div key={stat.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {i > 0 && <div style={{ width: 1, height: 18, background: "#e8edf2", marginRight: "auto", flexShrink: 0 }} />}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>{stat.label}</div>
              <div style={{ fontSize: 11.5, fontWeight: 900, color: "#1e293b", marginTop: 1 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── tools ──
const featuredTools = [
  { id: "strength",    icon: Brain,         label: "Case Strength Analyzer",  bg: "#f5f3ff", fg: "#7c3aed", border: "#ddd6fe", iconSrc: "/icons/case-strength-analyser.svg" },
  { id: "action",      icon: LifeBuoy,      label: "221(g) Action Planner",   bg: "#ecfdf5", fg: "#059669", border: "#d1fae5", iconSrc: "/icons/221g-action-plan.svg"        },
  { id: "path",        icon: Compass,       label: "Visa Path Finder",        bg: "#fff7ed", fg: "#ea580c", border: "#ffedd5", iconSrc: "/icons/visa-path-finder.svg"         },
  { id: "interview",   icon: MessageSquare, label: "Interview Prep",          bg: "#eff6ff", fg: "#2563eb", border: "#dbeafe", iconSrc: "/icons/interview-prep.svg"           },
  { id: "sponsorship", icon: Calculator,    label: "Sponsorship Calculator",  bg: "#fff1f2", fg: "#e11d48", border: "#ffe4e6", iconSrc: "/icons/sponsorship-calculator.svg"   },
  { id: "dq",          icon: Clock,         label: "DQ Status Check",         bg: "#fdf4ff", fg: "#c026d3", border: "#fae8ff", iconSrc: "/icons/dq-case-tracker.svg"          },
  { id: "bulletin",    icon: Calendar,      label: "Visa Bulletin Monitor",   bg: "#f0fdfa", fg: "#0d9488", border: "#ccfbf1", iconSrc: "/icons/visa-bulletin-monitor.svg"    },
  { id: "photo",       icon: Camera,        label: "Photo Booth",             bg: "#fefce8", fg: "#ca8a04", border: "#fef9c3", iconSrc: "/icons/photo-booth.svg"              },
  { id: "pdf",         icon: Files,         label: "PDF Tool Kit",            bg: "#f0f9ff", fg: "#0369a1", border: "#bae6fd", iconSrc: "/icons/pdf-toolbox.svg"              },
  { id: "snap",        icon: PenTool,       label: "Snap & Sign",             bg: "#eef2ff", fg: "#4f46e5", border: "#c7d2fe", iconSrc: "/icons/snap-and-sign.svg"            },
  { id: "filler",      icon: Wand2,         label: "Smart Form Filler",       bg: "#fff7ed", fg: "#c2410c", border: "#fed7aa", iconSrc: "/icons/smart-form-filler.svg"        },
];

const toolContent: Record<string, any> = {
  strength: {
    eyebrow: "Case Review",
    title: "Case Strength Analyzer",
    tagline: "See what's strong, what's missing, what to fix",
    desc: "Quickly review your IR-1 case evidence — relationship proof, financial ties, and domicile documents — and see exactly where you stand before submission.",
    stats: [["Evidence Reviewed", "Instantly"], ["Gaps Highlighted", "Yes"]],
    badge: "Before you submit",
    badgeDesc: "Catch weak spots in your evidence before the officer does — not after.",
    recoTitle: "Most Common Gap",
    recoMain: "Joint Bank Statements",
    recoDesc: "Missing joint financial evidence is the most common reason IR-1 cases face extra scrutiny. Add 6+ months to strengthen your case.",
    recoTags: ["Domicile Proof", "Communication Logs"],
  },
  action: {
    eyebrow: "Post-Interview",
    title: "221(g) Action Planner",
    tagline: "Know exactly what to do after a 221(g) refusal",
    desc: "Got a 221(g) slip? This tool tells you what documents are needed, how to prepare them, and where to submit — step by step.",
    stats: [["Case Still Active?", "Yes"], ["Typical Response", "10–30 days"]],
    badge: "Not a denial",
    badgeDesc: "A 221(g) is a request for more information, not a refusal. Acting correctly and quickly keeps your case moving.",
    recoTitle: "Most Common Type",
    recoMain: "Administrative Processing",
    recoDesc: "Background check holds can last 60–240+ days. Track your CEAC status weekly and keep a record of every embassy interaction.",
    recoTags: ["CEAC Tracking", "Embassy Contact"],
  },
  path: {
    eyebrow: "Getting Started",
    title: "Visa Path Finder",
    tagline: "Not sure which visa applies to you? Start here",
    desc: "Answer a few simple questions about your relationship and citizenship status. Get a clear visa category recommendation with your next step.",
    stats: [["Questions", "5–7"], ["Time", "Under 3 mins"]],
    badge: "No legal knowledge needed",
    badgeDesc: "Built for people who are just starting out and don't know which visa category fits their situation.",
    recoTitle: "Most Common Path",
    recoMain: "IR-1 Spouse Visa",
    recoDesc: "Married to a U.S. citizen? IR-1 is the most common path for Pakistani spouses — no waiting list, no priority dates.",
    recoTags: ["IR-1 / CR-1", "K-1 Fiancé", "IR-5 Parent"],
  },
  interview: {
    eyebrow: "Preparation",
    title: "Interview Prep",
    tagline: "Practice real questions before your embassy interview",
    desc: "Go through common Islamabad Embassy interview questions, see what officers focus on, and practice answers that reflect your actual situation.",
    stats: [["Questions", "50+"], ["Tailored For", "Islamabad"]],
    badge: "ISL-focused content",
    badgeDesc: "Questions and guidance based on Islamabad embassy patterns — relationship credibility, domicile, and financial ties.",
    recoTitle: "What Officers Focus On",
    recoMain: "Genuine Relationship",
    recoDesc: "ISL officers look closely at joint finances, communication history, and your plans after the visa is granted.",
    recoTags: ["Joint Finances", "Communication Proof", "Future Plans"],
  },
  sponsorship: {
    eyebrow: "Financial Check",
    title: "Sponsorship Calculator",
    tagline: "Check if your income meets the I-864 requirement",
    desc: "Enter the petitioner's income and household size to see if the poverty guideline threshold is met — and which sponsorship form applies.",
    stats: [["Guideline", "2025 Updated"], ["Form Selected", "Automatically"]],
    badge: "I-864 or I-864EZ?",
    badgeDesc: "The tool selects the right Affidavit of Support form for your situation — no guessing about which one to file.",
    recoTitle: "If Income Falls Short",
    recoMain: "Use a Joint Sponsor",
    recoDesc: "Any eligible person in the U.S. can co-sponsor by filing a separate I-864. They don't need to be a relative.",
    recoTags: ["Joint Sponsor", "Tax Returns", "Pay Stubs"],
  },
  dq: {
    eyebrow: "Scheduling",
    title: "DQ Status Check",
    tagline: "Check which DQ months are being called right now",
    desc: "See which Documentarily Qualified months are currently being scheduled at Islamabad and estimate when your interview window will open.",
    stats: [["Updated", "Weekly"], ["Embassy", "ISL + Others"]],
    badge: "Islamabad scheduling",
    badgeDesc: "Embassies schedule in DQ date order — knowing the current scheduling month tells you roughly how long your wait is.",
    recoTitle: "How the Queue Works",
    recoMain: "DQ Month Matters",
    recoDesc: "The closer your DQ month is to the current scheduling month, the sooner you will receive your interview invitation.",
    recoTags: ["DQ Date", "Scheduling Month", "Wait Estimate"],
  },
  bulletin: {
    eyebrow: "Priority Date",
    title: "Visa Bulletin Monitor",
    tagline: "Track your priority date against the Visa Bulletin",
    desc: "Check if your priority date is current in the latest monthly Visa Bulletin. Useful for F2A, F3, and F4 family preference categories.",
    stats: [["Released", "Monthly"], ["Categories", "F1 · F2A · F3 · F4"]],
    badge: "IR-1 has no wait",
    badgeDesc: "Immediate relatives like IR-1 are always current. This tool is for family preference categories with a waiting list.",
    recoTitle: "Most Common Category",
    recoMain: "F2A — Spouse of LPR",
    recoDesc: "If your petitioner has a green card (not citizenship), F2A applies. Monitor monthly to know when your date becomes current.",
    recoTags: ["F2A", "F3", "F4"],
  },
  photo: {
    eyebrow: "Photo Requirement",
    title: "Photo Booth",
    tagline: "Make a compliant visa photo without going to a studio",
    desc: "Upload any clear photo and get a properly formatted 2×2 inch U.S. visa photo — correct head size, white background, embassy-ready.",
    stats: [["Output Size", "2×2 Inch"], ["Background", "White"]],
    badge: "No studio visit needed",
    badgeDesc: "Meets USCIS and embassy photo requirements. Avoid rejected photos at the counter or in your application.",
    recoTitle: "Common Fail Reasons",
    recoMain: "Head Size Too Small",
    recoDesc: "Head must fill 70–80% of the frame. Glasses, visible hat, and heavy shadows are grounds for rejection.",
    recoTags: ["No Glasses", "Neutral Face", "Both Ears Visible"],
  },
  pdf: {
    eyebrow: "Document Tools",
    title: "PDF Tool Kit",
    tagline: "Merge, compress, and format docs for NVC upload",
    desc: "Organize your immigration documents, compress them under NVC's 2MB limit, and convert files to the required PDF format — all in one place.",
    stats: [["NVC Limit", "2.0 MB"], ["Accepted Formats", "PDF, JPG"]],
    badge: "NVC upload-ready",
    badgeDesc: "CEAC rejects oversized files and wrong formats. This handles resizing and conversion automatically.",
    recoTitle: "Scanning Tip",
    recoMain: "Grayscale at 300 DPI",
    recoDesc: "Scan non-photo documents in grayscale at 300 DPI. Keeps file sizes manageable without losing readability.",
    recoTags: ["Merge PDFs", "Compress", "Convert to PDF"],
  },
  snap: {
    eyebrow: "Signatures",
    title: "Snap & Sign",
    tagline: "Create a clean digital signature for your forms",
    desc: "Draw, type, or upload your signature — then download it as a PNG ready to place on any immigration form. Works on mobile and desktop.",
    stats: [["Output", "PNG / JPG"], ["Works On", "I-130, DS-260, I-864"]],
    badge: "No scanner needed",
    badgeDesc: "Compatible with all major immigration forms that require a wet signature from the petitioner.",
    recoTitle: "Where It's Required",
    recoMain: "Form I-864 — Affidavit",
    recoDesc: "A missing signature on the Affidavit of Support is one of the most common reasons NVC sends a Request for Evidence.",
    recoTags: ["I-130", "I-864", "DS-260"],
  },
  filler: {
    eyebrow: "Form Completion",
    title: "Smart Form Filler",
    tagline: "Fill I-130, DS-260, and I-864 without the confusion",
    desc: "Enter your details once and get a completed, ready-to-submit PDF. Every field is guided — no blank boxes, no common mistakes.",
    stats: [["Forms Covered", "I-130, DS-260"], ["Time", "Minutes not hours"]],
    badge: "Pakistan-specific defaults",
    badgeDesc: "Pre-set for Pakistani applicants — CNIC format, union council addresses, and local terminology all handled.",
    recoTitle: "Easy to Miss",
    recoMain: "Social Media (5 Years)",
    recoDesc: "DS-260 requires all social media handles used in the last 5 years. Leaving this blank causes processing delays.",
    recoTags: ["DS-260", "I-130A", "Review First"],
  },
};

// ── constants ─────────────────────────────────────────────────────────────────

const ITEM_W   = 108;
const GAP      = 20;
const STRIDE   = ITEM_W + GAP;
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
  const rafRef  = useRef<number>(0);
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
          const r    = el.getBoundingClientRect();
          const dist = Math.abs(r.left + r.width / 2 - centerX);
          const t    = Math.max(0, 1 - dist / hotZone);
          el.style.transform = `translateY(${-t * 5}px) scale(${1 + t * 0.2})`;
          el.style.zIndex    = t > 0.5 ? "10" : "1";
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
        position:"absolute", bottom:0, left:0, width:"100%", height:138,
        overflow:"hidden", borderTop:"1px solid #e8edf2",
        background:"linear-gradient(to bottom,#ffffff,#f8fafc)",
        WebkitMaskImage:"linear-gradient(90deg,transparent 0%,#000 12%,#000 88%,transparent 100%)",
        maskImage:"linear-gradient(90deg,transparent 0%,#000 12%,#000 88%,transparent 100%)",
      }}
    >
      {/* Auto-scrolling track */}
      <div
        ref={wrapRef}
        onMouseEnter={() => { setPaused(true);  onHoverChange(true);  }}
        onMouseLeave={() => { setPaused(false); onHoverChange(false); }}
        style={{
          display:"flex", alignItems:"center", gap:GAP,
          paddingLeft: GAP, height:"100%",
          animation:`tcScroll ${DURATION}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          willChange:"transform",
        }}
      >
        {items.map((tool, idx) => {
          const Icon    = tool.icon;
          const toolIdx = idx % featuredTools.length;
          const isActive = toolIdx === activeIdx;
          return (
            <div
              key={idx}
              onClick={() => onSelect(toolIdx)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:9, width:ITEM_W, flexShrink:0, cursor:"pointer" }}
            >
              <div
                className="tc-icon-box"
                style={{
                  width:54, height:54, borderRadius:16,
                  background:tool.fg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  outline: isActive ? `2px solid ${tool.fg}` : "none",
                  outlineOffset: isActive ? "3px" : "0",
                  transition:"outline 0.2s",
                  transformOrigin:"50% 100%",
                }}
              >
                <Icon size={24} color="white" strokeWidth={2} />
              </div>
              <span style={{
                fontSize:9.5, fontWeight: isActive ? 900 : 700,
                textTransform:"uppercase", letterSpacing:"0.07em",
                color: isActive ? tool.fg : "#5a6a72",
                textAlign:"center", lineHeight:1.3, maxWidth:90,
                pointerEvents:"none", transition:"color 0.2s",
              }}>
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
  const [visible, setVisible]     = useState(true);
  const [isPaused, setIsPaused]   = useState(false);

  // Navigate to a specific tool with crossfade
  const goTo = useCallback((idx: number) => {
    const next = ((idx % featuredTools.length) + featuredTools.length) % featuredTools.length;
    setVisible(false);
    window.setTimeout(() => { setActiveIdx(next); setVisible(true); }, 200);
  }, []);

  // Auto-advance every 5s — pauses when carousel is hovered
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

  const tool    = featuredTools[activeIdx];
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
      }}
    >
      {/* ── Info panel — fades on tool change ── */}
      <div
        style={{
          position   : "relative",
          width      : "100%",
          height     : 362,
          opacity    : visible ? 1 : 0,
          transform  : visible ? "translateY(0)" : "translateY(6px)",
          transition : "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        {/* Hero card — left column */}
        <div
          style={{
            position      : "absolute",
            left          : 22, top : 24,
            width         : 288, height: 310,
            borderRadius  : 24,
            background    : "white",
            border        : `2px solid ${tool.fg}`,
            boxShadow     : `0 16px 48px ${tool.border}55`,
            padding       : "16px",
            display       : "flex",
            flexDirection : "column",
          }}
        >
          {/* Eyebrow badge */}
          <span
            style={{
              display       : "inline-flex",
              borderRadius  : 999,
              border        : `1px solid ${tool.border}`,
              background    : tool.bg,
              padding       : "3px 10px",
              fontSize      : 9.5, fontWeight: 800,
              textTransform : "uppercase",
              letterSpacing : "0.1em",
              color         : tool.fg,
              alignSelf     : "flex-start",
            }}
          >
            {content.eyebrow}
          </span>

          <h3 style={{ fontSize:19, fontWeight:800, lineHeight:1.15, color:"#162126", margin:"10px 0 0" }}>
            {content.title}
          </h3>
          <p style={{ fontSize:12.5, lineHeight:1.6, color:"#4a5c62", margin:"6px 0 0" }}>
            {content.desc}
          </p>

          <div style={{ marginTop:"auto", display:"flex", flexDirection:"column", gap:7 }}>
            {content.stats.map(([label, value]: [string, string]) => (
              <div
                key={label}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  borderRadius:10, border:"1px solid #e2e8f0",
                  background:"#f7fafc", padding:"6px 12px",
                }}
              >
                <span style={{ fontSize:11.5, color:"#4a5c62", fontWeight:600 }}>{label}</span>
                <span style={{ fontSize:12.5, fontWeight:800, color:"#162126" }}>{value}</span>
              </div>
            ))}

            {/* Status badge */}
            <div style={{ borderRadius:10, border:`1px solid ${tool.border}`, background:tool.bg, padding:"7px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, color:tool.fg }}>
                <Check style={{ width:11, height:11 }} strokeWidth={3} />
                <span style={{ fontSize:11.5, fontWeight:800 }}>{content.badge}</span>
              </div>
              <p style={{ fontSize:10.5, lineHeight:1.5, color:"#4a5c62", margin:"3px 0 0" }}>
                {content.badgeDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Right column ── illustration card */}
        <div
          style={{
            position     : "absolute",
            left         : 324, top: 24,
            width        : 254, height: 110,
            borderRadius : 18,
            background   : tool.bg,
            border       : `1.5px solid ${tool.border}`,
            padding      : "14px 16px",
            display      : "flex", alignItems:"center", gap:14,
            overflow     : "hidden",
          }}
        >
          {/* Tool illustration icon */}
          <div style={{ width:64, height:64, borderRadius:16, background:"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 4px 12px ${tool.border}88` }}>
            <Image
              src={tool.iconSrc}
              alt={tool.label}
              width={44}
              height={44}
              style={{ objectFit:"contain" }}
              unoptimized
            />
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{content.eyebrow}</div>
            <div style={{ fontSize:14, fontWeight:900, color:"#162126", lineHeight:1.25 }}>{tool.label}</div>
            <div style={{ fontSize:10.5, lineHeight:1.5, color:"#4a5c62", marginTop:4 }}>{content.tagline}</div>
          </div>
        </div>

        {/* Insight / recommendation card */}
        <div
          style={{
            position     : "absolute",
            left         : 320, top: 148,
            width        : 258,
            borderRadius : 20,
            background   : "white",
            border       : "1px solid #dde8e6",
            padding      : "14px 16px",
            boxShadow    : "0 4px 16px rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b8097" }}>
            {content.recoTitle}
          </div>

          <div style={{ marginTop:10, borderRadius:12, background:"#051738", padding:"11px 14px" }}>
            <div style={{ fontSize:19, fontWeight:800, color:"white", lineHeight:1.1 }}>{content.recoMain}</div>
            <p style={{ fontSize:10.5, lineHeight:1.55, color:"rgba(255,255,255,0.72)", margin:"5px 0 0" }}>
              {content.recoDesc}
            </p>
          </div>

          <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {content.recoTags.map((tag: string) => (
              <div
                key={tag}
                style={{
                  borderRadius:8, border:"1px solid #e2e8f0",
                  background:"#f7fafc", padding:"5px 8px",
                  fontSize:10, fontWeight:700, color:"#2C3A3E", textAlign:"center",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom carousel strip ── */}
      <ToolCarousel
        activeIdx={activeIdx}
        onSelect={(idx) => { goTo(idx); setIsPaused(true); }}
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
