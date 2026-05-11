"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Caveat } from "next/font/google";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  HelpCircle,
  Layers,
  Lightbulb,
  LayoutDashboard,
  Lock,
  Mic,
  Plus,
  Signpost,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { getFormConfig } from "@/lib/formConfig";
import { FormStep } from "@/app/components/forms/auto-visaform-filling/FormStep";
import { ProgressBar } from "@/app/components/forms/auto-visaform-filling/ProgressBar";
import GetInTouch from "@/app/components/Contact/GetInTouch";
import { AuthRequiredModal } from "@/app/components/shared/AuthRequiredModal";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { FAQS } from "@/data/home-page-data";

const journeyHref = "/visa-category/ir-category/ir1-journey";
const toolsHref = "/tools";
const heroI130PreviewDisplay = {
  width: 520,
  height: 673,
} as const;
const heroI130PreviewNatural = {
  width: 1040,
  height: 1346,
} as const;
const heroAnnotationFont = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
});

const accent = {
  teal: "#0d7377",
  ink: "#162126",
  body: "#2C3A3E",
  dashboard: "#051738",
  chapter1: "#8284BF",
  chapter1Dark: "#4E518C",
  chapter1Tint: "#F0F1FB",
  chapter1Border: "#B9BBE2",
  chapter2: "#520A50",
  chapter2Tint: "#F4E6F3",
  chapter2Border: "#8B4388",
  chapter3: "#051738",
  chapter3Tint: "#E8ECF3",
  chapter3Border: "#31415F",
  rose: "#db8090",
};

const chapters = [
  {
    number: 1,
    name: "USCIS Petition Filing",
    description:
      "File Form I-130 with USCIS to begin the IR-1 spouse visa process for your Pakistani spouse.",
    pct: 41,
    color: accent.chapter1,
    border: "border-[#B9BBE2]",
    tint: "bg-[#F0F1FB]",
    text: "text-[#4E518C]",
    steps: [
      ["step_1_1", "Determine Eligibility", "Confirm IR-1 qualification", "done"],
      ["step_1_2", "Gather Required Documents", "Pakistan-specific full checklist", "done"],
      ["step_1_3", "Review Filing Methods", "Online $625 or Paper $675", "current"],
      ["step_1_4", "Fill Form I-130", "via Rahvana wizard", "locked"],
      ["step_1_5", "Fill Form I-130A", "via Rahvana wizard", "locked"],
      ["step_1_8", "Upload Forms & Evidence", "PDF/JPG, 12 MB max", "locked"],
    ],
  },
  {
    number: 2,
    name: "NVC / CEAC Processing",
    description:
      "Pay fees, complete DS-260, prepare civil and financial documents, and track documentary qualification.",
    pct: 28,
    color: accent.chapter2,
    border: "border-[#8B4388]",
    tint: "bg-[#F4E6F3]",
    text: "text-[#520A50]",
    steps: [
      ["step_2_1", "Access CEAC Case", "Secure case details & sign in", "done"],
      ["step_2_2", "Pay NVC Fees", "AOS & IV fee payment", "current"],
      ["step_2_3", "Complete Form DS-260", "Immigrant visa application", "todo"],
      ["step_2_4", "Prepare Civil Documents", "Gather required records", "todo"],
      ["step_2_5", "Affidavit of Support", "Determine and prepare sponsorship", "locked"],
      ["step_2_10", "Record Documentary Qualification", "Record DQ date & activate tracking", "locked"],
    ],
  },
  {
    number: 3,
    name: "Medical + Interview",
    description:
      "Prepare medical clearance, courier registration, original documents, interview readiness, and outcome tracking.",
    pct: 9,
    color: accent.chapter3,
    border: "border-[#31415F]",
    tint: "bg-[#E8ECF3]",
    text: "text-[#051738]",
    steps: [
      ["step_3_1", "Schedule Medical Examination", "Official medical clearance", "current"],
      ["step_3_2", "Obtain Polio Vaccination Certificate", "Required for Pakistan applicants", "todo"],
      ["step_3_3", "Obtain Fresh Police Clearance Certificate", "Required for interview", "todo"],
      ["step_3_6", "Gather Original Documents", "Official document compilation", "todo"],
      ["step_3_7", "Prepare for Interview", "Practice questions and build confidence", "locked"],
      ["step_3_10", "Track Visa Issuance", "Passport delivery and visa issuance", "locked"],
    ],
  },
] as const;

const milestones = [
  ["Eligibility confirmed", true],
  ["Documents gathered", true],
  ["Filing method selected", true],
  ["I-130 submitted to USCIS", false],
  ["NVC fees paid", false],
  ["DS-260 submitted", false],
  ["Documents submitted to NVC", false],
  ["Documentarily Qualified", false],
  ["Interview scheduled", false],
  ["Visa interview attended", false],
] as const;

const caseFields = [
  ["Filing method", "Online"],
  ["Receipt number", "Pending"],
  ["NVC case number", "Unavailable"],
  ["NVC invoice ID", "Unavailable"],
  ["DQ date", "Not recorded"],
  ["Interview date", "Not scheduled"],
] as const;

const heroAnnotations = [
  "A smart dashboard keeps your IR-1 journey, progress, and next actions in one place.",
  "Open the chapter you're working on and pick up right where you left off.",
  "Completed steps stay organized, so the next step is always clear.",
  "Built-in tools appear exactly where you need them in the journey.",
  "Simple auto form filling helps you move faster with less manual work.",
  "Review the completed form before moving forward with confidence.",
  "Return to your roadmap with progress updated and your next step ready.",
] as const;

function getHeroSceneIndex(phase: number) {
  if (phase >= 12) return 6;
  if (phase >= 11) return 5;
  if (phase >= 9) return 4;
  if (phase >= 6) return 3;
  if (phase >= 4) return 2;
  if (phase >= 3) return 1;
  return 0;
}

function ProductFrame({
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

function StepStatusIcon({
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

function StepRow({
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
            isDone ? "text-white/90" : isLocked ? "opacity-60" : "text-[#2C3A3E]"
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
        <ChevronRight className="shrink-0 text-[#b3a6b3] opacity-35" size={14} strokeWidth={3} />
      )}
    </motion.div>
  );
}

function RealDashboardScene({
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

  const cursorStates: Record<number, { opacity: number; x: number; y: number; scale: number }> = {
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
      animate={reduceMotion ? undefined : { y: [0, 0, -4, -4, 0], scale: [1, 1, 1.004, 1.004, 1] }}
      transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }}
    >
      <ProductFrame
        className={
          compact
            ? "h-full w-full min-w-0 backdrop-blur-2xl"
            : ""
        }
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
                    scale: phase === 1 || phase === 2 || phase === 4 || phase === 5 || phase === 7 || phase === 8 || phase === 10 ? 1.012 : 1,
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
                  animate={{ opacity: 1, scale: phase === 1 || phase === 2 ? 1.012 : 1 }}
                  exit={{ opacity: 0, scale: 1.01, y: -8 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroDashboardPanel completedI130={false} chapterTargeted={phase === 1 || phase === 2} />
                </motion.div>
              )}
              {view === "chapter" && (
                <motion.div
                  key="chapter"
                  className="absolute inset-0 p-5"
                  initial={{ opacity: 0, scale: 0.986, y: 16 }}
                  animate={{ opacity: 1, scale: phase === 4 || phase === 5 ? 1.01 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.01, y: -10 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroChapterOnePanel stepTargeted={phase === 4 || phase === 5} />
                </motion.div>
              )}
              {view === "step" && (
                <motion.div
                  key="step"
                  className="absolute inset-0 overflow-hidden bg-white"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0, scale: phase === 7 || phase === 8 ? 1.01 : 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                  <HeroI130StepPanel launchTargeted={phase === 7 || phase === 8} />
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
              scale: { duration: isClicking ? 0.22 : 0.5, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <svg
              aria-hidden="true"
              className="size-9 overflow-visible"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 2px 0 rgba(255,255,255,0.9)) drop-shadow(0 8px 14px rgba(5,23,56,0.30))" }}
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

function HeroDashboardPanel({
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
    <div className="grid h-full gap-4 lg:grid-cols-[1.08fr_0.92fr]">
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

        <div className="grid gap-3 md:grid-cols-3">
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
              <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.08em] ${chapter.tint} ${chapter.border} ${chapter.text}`}>
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
              <div key={label} className="rounded-xl border border-[#d0e4f7] bg-[#f4f7fb] p-3">
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

function HeroChapterOnePanel({ stepTargeted = false }: { stepTargeted?: boolean }) {
  return (
    <div className="mx-auto h-full max-w-[680px] overflow-hidden pt-2">
      <motion.div
        className="ir1-card-primary mb-4 rounded-3xl border-[#B9BBE2] p-[32px_32px]"
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
          File Form I-130 with USCIS to begin the IR-1 spouse visa process for your Pakistani spouse.
        </p>
        <div className="flex items-center gap-2.5">
          <div className="h-[7px] flex-1 overflow-hidden rounded-[13px] bg-[#F0F1FB]">
            <div className="h-full rounded-[13px] bg-[#8284BF] shadow-[0_2.5px_12px_rgba(36,42,66,0.18)]" style={{ width: "41%" }} />
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
          const status = index < 3 ? "done" : index === 3 ? "current" : "locked";
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
                step={[chapterStep[0], chapterStep[1], chapterStep[2], status] as const}
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

function HeroI130StepPanel({ launchTargeted = false }: { launchTargeted?: boolean }) {
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
            Use Rahvana&apos;s guided Autoform Filler to complete the I-130 Petition for Alien Relative — with structured step-by-step support, clear prompts, and a built-in review flow.
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
            <div className="absolute left-0 right-0 top-0 h-[2px] opacity-70" style={{ background: "linear-gradient(90deg, #c0596a 0%, #28151c 100%)" }} />
            <div className="p-[36px_36px_32px]">
              <div className="mb-[26px] flex items-start gap-[16px]">
                <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] border border-[#c0596a] bg-[#c0596a]">
                  <FileText size={22} className="text-white" strokeWidth={1.6} />
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
                  <div key={feat} className="flex items-start gap-[10px] rounded-[10px] border border-[#c0596a]/30 bg-[#3a232a] p-[12px_14px]">
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
                      ? { scale: 1.018, boxShadow: "0 8px 32px rgba(192,89,106,0.35)" }
                      : { scale: 1, boxShadow: "0 4px 20px rgba(192,89,106,0.25)" }
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

function HeroAutoformPanel({ playPhase }: { playPhase: number }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fillStage, setFillStage] = useState(0);
  const config = useMemo(() => getFormConfig("i130"), []);
  const fields = useMemo(
    () =>
      config?.formFields
        .filter((field) => field.section === "Part 2. Information About You (Petitioner)")
        .filter((field) => ["family_name", "given_name", "middle_name"].includes(field.key))
        .filter((field) => !field.condition || field.condition(formData))
        .slice(0, 4) ?? [],
    [config, formData],
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
      window.setTimeout(() => setFormData((prev) => ({ ...prev, given_name: "Amina" })), 2300),
      window.setTimeout(() => {
        setFillStage(3);
        setFormData((prev) => ({ ...prev, middle_name: "Noor" }));
      }, 3100),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [playPhase]);

  return (
    <div className="h-full w-full overflow-hidden bg-white">
      <div className="bg-linear-to-r from-primary to-primary p-4 text-white shadow-lg md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold md:text-3xl">
              Form I-130
            </h1>
            <p className="mt-1 text-sm text-white/90 md:text-base">
              Petition for Alien Relative
            </p>
          </div>
        </div>
      </div>
      <motion.div
        className="flex gap-6 p-5"
        animate={{ y: fillStage >= 2 ? -28 : 0, scale: fillStage >= 1 ? 1.015 : 1 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-semibold text-gray-900">Progress</h3>
            <ProgressBar current={fillStage >= 3 ? 3 : fillStage >= 2 ? 2 : 1} total={18} progress={fillStage >= 3 ? 17 : fillStage >= 2 ? 11 : 6} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="rounded-xl bg-white p-4 shadow-lg md:p-8">
            <FormStep
              stepNumber={1}
              sectionTitle="Part 2. Information About You (Petitioner)"
              fields={fields}
              formData={formData}
              onInputChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  [event.target.name]: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HeroPdfPreviewPanel() {
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
            style={{ width: heroI130PreviewDisplay.width, minHeight: heroI130PreviewDisplay.height }}
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

function TwoWaysScene() {
  return <TwoWaysSection />;
}

// --- data ---------------------------------------------------------------------

const twoWaysPaths = [
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

// --- main section -------------------------------------------------------------

function TwoWaysSection() {
  const [activeIndex, setActiveIndex] = useState<TwoWaysIndex>(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current === 0 ? 1 : 0));
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion, activeIndex]);

  const selectPath = (index: TwoWaysIndex) => {
    setActiveIndex(index);
  };

  return (
    <>
      {/* -- Desktop: sticky scroll story (xl+) ---------------------------- */}
      <section
        id="path"
        aria-label="Two ways to use Rahvana"
        className="relative hidden xl:block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
        style={{
          minHeight: "min(920px, 100svh)",
          padding: "96px 0",
          background: "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
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

        <div className="overflow-hidden">
          <div
            className="relative mx-auto grid"
            style={{
              maxWidth: 1360,
              paddingLeft: 40,
              paddingRight: 40,
              gridTemplateColumns: "minmax(320px, 440px) minmax(0, 1fr)",
              columnGap: 80,
              alignItems: "center",
            }}
          >
            {/* -- Left: static anchoring content + dynamic step indicators -- */}
            <div style={{ alignSelf: "center" }}>
              {/* Eyebrow */}
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#0d7377",
                  margin: 0,
                }}
              >
                TWO WAYS TO MOVE FORWARD
              </p>

              {/* Heading */}
              <h2
                style={{
                  fontSize: "clamp(44px,4.6vw,64px)",
                  lineHeight: 0.98,
                  fontWeight: 800,
                  color: "#162126",
                  marginTop: 18,
                  marginBottom: 0,
                  maxWidth: 440,
                }}
              >
                Choose how you want to use Rahvana.
              </h2>

              {/* Support paragraph */}
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.68,
                  color: "#4a5c62",
                  marginTop: 18,
                  marginBottom: 0,
                  maxWidth: 420,
                }}
              >
                Follow the guided IR-1 roadmap, use focused tools and resources
                independently, and choose the support style that fits what you
                need right now.
              </p>

              {/* Active scene label — fixed-height container prevents layout shift */}
              <div style={{ minHeight: 88, marginTop: 24, overflow: "hidden" }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeIndex}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.11em",
                        textTransform: "uppercase",
                        color: "#0d7377",
                        margin: 0,
                      }}
                    >
                      {twoWaysPaths[activeIndex].eyebrow}
                    </p>
                    <h3
                      style={{
                        fontSize: 21,
                        lineHeight: 1.2,
                        fontWeight: 800,
                        color: "#162126",
                        maxWidth: 420,
                        margin: "7px 0 0 0",
                      }}
                    >
                      {twoWaysPaths[activeIndex].shortTitle}
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step selector — fixed height per row, no expanding content */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {twoWaysPaths.map((path, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <button
                      key={path.title}
                      type="button"
                      onClick={() => selectPath(i as TwoWaysIndex)}
                      aria-current={isActive ? "true" : undefined}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: isActive
                          ? "1.5px solid #0d7377"
                          : "1px solid #e2ebe8",
                        background: isActive ? "#f4fbfa" : "transparent",
                        boxShadow: isActive
                          ? "0 5px 18px rgba(13,115,119,0.10)"
                          : "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition:
                          "background 0.22s, border-color 0.22s, box-shadow 0.22s",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {/* Number pill */}
                      <span
                        style={{
                          flexShrink: 0,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 800,
                          background: isActive ? "#0d7377" : "transparent",
                          color: isActive ? "white" : "#9aaeac",
                          border: isActive ? "none" : "1.5px solid #c8d5d3",
                          transition:
                            "background 0.22s, color 0.22s, border-color 0.22s",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {/* Label + teaser */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            lineHeight: 1.25,
                            color: isActive ? "#0d7377" : "#162126",
                            transition: "color 0.22s",
                          }}
                        >
                          {path.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            lineHeight: 1.4,
                            color: isActive ? "#4a5c62" : "#9aaeac",
                            marginTop: 2,
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
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={journeyHref}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    height: 42,
                    paddingLeft: 18,
                    paddingRight: 18,
                    borderRadius: 13,
                    background: "#0d7377",
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "white",
                    textDecoration: "none",
                    boxShadow: "0 10px 24px rgba(13,115,119,0.22)",
                  }}
                >
                  Start the Roadmap
                  <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
                <Link
                  href={toolsHref}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 42,
                    paddingLeft: 16,
                    paddingRight: 16,
                    borderRadius: 13,
                    border: "1.5px solid #c8d5d3",
                    background: "white",
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#162126",
                    textDecoration: "none",
                  }}
                >
                  Browse Resources
                </Link>
              </div>
            </div>

            {/* -- Right: support copy + visual stage */}
            <div
              style={{
                alignSelf: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
              }}
            >
              {reduceMotion ? (
                <>
                  <TwoWaysSupportText path={twoWaysPaths[activeIndex]} />
                  <TwoWaysVisual index={activeIndex} />
                </>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeIndex}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 22,
                    }}
                    initial={{ opacity: 0, y: 18, scale: 0.988 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.992 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TwoWaysSupportText path={twoWaysPaths[activeIndex]} />
                    <TwoWaysVisual index={activeIndex} />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -- Mobile / tablet (below xl) — stacked narrative cards -- */}
      <section
        aria-label="Two ways to use Rahvana"
        className="block xl:hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
        style={{
          padding: "64px 20px 72px",
          background: "linear-gradient(180deg,#ffffff 0%,#f7fbfa 52%,#ffffff 100%)",
          borderTop: "1px solid #e1ebe8",
          borderBottom: "1px solid #e1ebe8",
        }}
      >
        <TwoWaysMobile activeIndex={activeIndex} onSelect={selectPath} />
      </section>
    </>
  );
}

function TwoWaysSupportText({
  path,
}: {
  path: (typeof twoWaysPaths)[number];
}) {
  return (
    <div
      style={{
        width: 680,
        maxWidth: "100%",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.2,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#0d7377",
        }}
      >
        {path.supportEyebrow}
      </p>
      <h3
        style={{
          margin: "7px 0 0 0",
          fontSize: 24,
          lineHeight: 1.18,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#162126",
        }}
      >
        {path.supportLead}
      </h3>
      <p
        style={{
          margin: "8px 0 0 0",
          maxWidth: 520,
          fontSize: 15,
          lineHeight: 1.62,
          color: "#4a5c62",
        }}
      >
        {path.supportText}
      </p>
    </div>
  );
}

// Wraps each visual scene in a stable 680x560 relative container so
// internal absolute-positioned children render correctly.
function TwoWaysVisual({ index }: { index: TwoWaysIndex }) {
  return (
    <div style={{ position: "relative", width: 680, height: 560 }}>
      {index === 0 ? (
        <GuidedRoadmapScene />
      ) : (
        <IndividualToolsScene />
      )}
    </div>
  );
}

function TwoWaysMobile({
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
        Use the full IR-1 roadmap, or jump into focused tools and resources
        when you need targeted help.
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
function GuidedRoadmapScene() {
  const reduceMotion = useReducedMotion();

  return (
    <div
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
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        overflow: "hidden",
      }}
    >
      {/* left rail */}
      <div
        style={{
          padding: "24px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          borderRight: "1px solid #eef2f6",
          background: "#f9fafb",
        }}
      >
        {chapters.map((ch, i) => (
          <div
            key={ch.number}
            style={{
              borderRadius: 18,
              minHeight: 74,
              padding: "12px 12px",
              border: i === 0 ? "1.5px solid #0d7377" : "1px solid #e2e8f0",
              background: i === 0 ? "white" : "transparent",
              boxShadow: i === 0 ? "0 4px 16px rgba(13,115,119,0.10)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#6b8097",
              }}
            >
              Chapter {ch.number}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.3,
                color: i === 0 ? "#0d7377" : "#162126",
              }}
            >
              {ch.name}
            </div>
          </div>
        ))}
      </div>

      {/* main panel */}
      <div
        style={{
          padding: "22px 18px 16px 18px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* status row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              borderRadius: 999,
              border: "1px solid #B9BBE2",
              background: "#F0F1FB",
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#4E518C",
            }}
          >
            ACTIVE CHAPTER
          </span>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid #b5e0d0",
              background: "#e8f5ef",
              padding: "5px 12px",
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#15744f",
              }}
            >
              PROGRESS
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#162126",
                lineHeight: 1.2,
              }}
            >
              41%
            </div>
          </div>
        </div>

        {/* title */}
        <h3
          style={{
            fontSize: 26,
            lineHeight: 1.15,
            fontWeight: 800,
            maxWidth: 300,
            color: "#162126",
            marginTop: 10,
            marginBottom: 0,
          }}
        >
          USCIS Petition Filing
        </h3>

        {/* support text */}
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.65,
            color: "#4a5c62",
            maxWidth: 320,
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          File Form I-130 with USCIS to begin the IR-1 spouse visa process with
          the next task already surfaced.
        </p>

        {/* progress bar */}
        <div
          style={{
            width: "100%",
            height: 7,
            borderRadius: 999,
            background: "#eef1f7",
            marginTop: 10,
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{ height: "100%", borderRadius: 999, background: "#0d7377" }}
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: "41%" }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }
            }
          />
        </div>

        {/* step stack */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 7,
            flex: 1,
          }}
        >
          {chapters[0].steps.slice(0, 4).map((step, idx) => {
            const [, name, desc, status] = step;
            const isCurrent = status === "current";
            const isDone = status === "done";
            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderRadius: 14,
                  border: isCurrent ? "1.5px solid #0d7377" : "1px solid #e2e8f0",
                  background: isCurrent ? "#f4fbfa" : "white",
                  padding: "7px 10px",
                  boxShadow: isCurrent ? "0 4px 14px rgba(13,115,119,0.09)" : "none",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: isDone ? "#15744f" : isCurrent ? "#0d7377" : "#f0f3f7",
                    color: isDone || isCurrent ? "white" : "#6b8097",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {isDone ? (
                    <Check style={{ width: 11, height: 11 }} strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#162126",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5c62", marginTop: 1 }}>
                    {desc}
                  </div>
                </div>
                {isCurrent && (
                  <span
                    style={{
                      borderRadius: 999,
                      background: "#0d7377",
                      color: "white",
                      padding: "3px 8px",
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      flexShrink: 0,
                    }}
                  >
                    CURRENT
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* next action */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderRadius: 16,
            border: "1px solid #b5e0d0",
            background: "#e8f5ef",
            padding: "10px 14px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#15744f",
              }}
            >
              NEXT ACTION
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#162126",
                marginTop: 2,
              }}
            >
              Continue with filing method review
            </div>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 12,
              background: "#0d7377",
              color: "white",
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Continue
            <ArrowRight style={{ width: 12, height: 12 }} />
          </span>
        </div>
      </div>
    </div>
  );
}

function IndividualToolsScene() {
  return (
    <div
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
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* hero tool card */}
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 28,
            width: 300,
            height: 300,
            borderRadius: 28,
            background: "white",
            border: "2px solid #0d7377",
            boxShadow: "0 16px 48px rgba(13,115,119,0.13)",
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              borderRadius: 999,
              border: "1px solid #b5e0d0",
              background: "#e8f5ef",
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#15744f",
              alignSelf: "flex-start",
            }}
          >
            Focused task
          </span>
          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#162126",
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            Affidavit Support Calculator
          </h3>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#4a5c62",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Determine sponsorship setup and likely form path.
          </p>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            {[
              ["Sponsor income", "$48,000"],
              ["Required income", "$25,550"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#f7fafc",
                  padding: "7px 12px",
                }}
              >
                <span style={{ fontSize: 12, color: "#4a5c62", fontWeight: 600 }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#162126" }}>
                  {value}
                </span>
              </div>
            ))}
            <div
              style={{
                borderRadius: 12,
                border: "1px solid #b5e0d0",
                background: "#e8f5ef",
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#15744f",
                }}
              >
                <Check style={{ width: 12, height: 12 }} strokeWidth={3} />
                <span style={{ fontSize: 12, fontWeight: 800 }}>
                  Income appears sufficient
                </span>
              </div>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: "#4a5c62",
                  marginTop: 3,
                  marginBottom: 0,
                }}
              >
                The calculator recommends the likely form path and supporting
                evidence to prepare next.
              </p>
            </div>
          </div>
        </div>

        {/* related tools label */}
        <div
          style={{
            position: "absolute",
            left: 356,
            top: 30,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#a0b0b8",
          }}
        >
          Related tools
        </div>

        {/* supporting card 1 */}
        <div
          style={{
            position: "absolute",
            left: 350,
            top: 52,
            width: 100,
            height: 86,
            borderRadius: 18,
            background: "white",
            border: "1px solid #dde8e6",
            padding: "12px 10px",
            boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "#162126", lineHeight: 1.2 }}>
            PDF Toolkit
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: "#6b8097", marginTop: 4 }}>
            Prepare upload-ready files
          </div>
        </div>

        {/* supporting card 2 */}
        <div
          style={{
            position: "absolute",
            left: 468,
            top: 52,
            width: 108,
            height: 86,
            borderRadius: 18,
            background: "white",
            border: "1px solid #dde8e6",
            padding: "12px 10px",
            boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "#162126", lineHeight: 1.2 }}>
            Interview Prep
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: "#6b8097", marginTop: 4 }}>
            Practice one focused task
          </div>
        </div>

        {/* form recommendation card */}
        <div
          style={{
            position: "absolute",
            left: 344,
            top: 160,
            width: 236,
            borderRadius: 22,
            background: "white",
            border: "1px solid #dde8e6",
            padding: "14px 16px",
            boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#6b8097",
            }}
          >
            Likely form recommendation
          </div>
          <div
            style={{
              marginTop: 10,
              borderRadius: 14,
              background: "#051738",
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1.1 }}>
              Form I-864EZ
            </div>
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.72)",
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Suggested when the petitioner is the only sponsor and income is
              enough from qualifying employment.
            </p>
          </div>
          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}
          >
            {["Tax transcript", "Pay stubs"].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#f7fafc",
                  padding: "6px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#2C3A3E",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* bottom-right background fill */}
        <div
          style={{
            position: "absolute",
            left: 344,
            top: 360,
            right: 0,
            bottom: 0,
            background: "#f7faf9",
          }}
        />
      </div>
    </div>
  );
}

function ConsultationBanner({ onConsultationClick }: { onConsultationClick: () => void }) {
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
            If the roadmap feels like too much or a tool isn't enough, book a consultation for one-on-one help with your case.
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

        <Sparkles
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-9 -right-4 size-12 text-white/70 drop-shadow-[0_0_20px_rgba(255,255,255,0.82)] sm:size-14 lg:-bottom-11 lg:-right-8"
          strokeWidth={1.6}
        />
      </motion.div>
    </section>
  );
}

function ConsultationPreviewVisual() {
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
    <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_254px] md:gap-5 lg:grid-cols-[minmax(0,460px)_254px]">
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
            <Calendar className="size-[22px] text-[#154f50]" strokeWidth={1.8} />
            <h4 className="m-0 text-[17px] font-black uppercase tracking-[-0.01em] text-[#101b27]">
              Availability
            </h4>
          </div>
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
            <Sparkles className="mt-0.5 size-6 shrink-0 text-[#154f50]" strokeWidth={1.7} />
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

function OriginalHomepageFaq({
  openFAQ,
  setOpenFAQ,
}: {
  openFAQ: number | null;
  setOpenFAQ: (index: number | null) => void;
}) {
  const { t } = useLanguage();

  return (
    <section className="py-8 md:py-12" id="faq" style={{background: 'linear-gradient(180deg,#f7fffd 0%,#f3f8ff 30%,#fffafc 100%)'}}>
      <div className="mx-auto w-full px-6 sm:px-8 md:px-12 2xl:px-30">
        <div className="mx-auto mb-5 w-full text-center md:w-3/4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-rahvana-primary-pale px-4 py-1.5 text-sm font-semibold text-rahvana-primary"
          >
            <HelpCircle className="h-4 w-4" />
            {t("homePage.faqBadge")}
          </motion.span>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            {t("homePage.faqTitle") || "Frequently Asked Questions"}
          </h2>
        </div>

        <div className="mx-auto w-full space-y-4 md:w-3/4">
          {FAQS.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className={`rounded-2xl border transition-all ${
                openFAQ === i
                  ? "border-rahvana-primary bg-rahvana-primary-pale/30 shadow-md"
                  : "border-border bg-card hover:border-rahvana-primary/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-6 text-left md:px-8"
              >
                <span className="pr-4 text-lg font-bold text-foreground md:pr-8">
                  {t(`homePage.faqs.q${i + 1}.q`) || faq.q}
                </span>
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all md:h-8 md:w-8 ${
                    openFAQ === i
                      ? "rotate-45 border-rahvana-primary bg-rahvana-primary text-white"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </div>
              </button>
              <AnimatePresence>
                {openFAQ === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-rahvana-primary/10 px-8 pb-6 pt-4 leading-relaxed text-muted-foreground">
                      {t(`homePage.faqs.q${i + 1}.a`) || faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function RahvanaIr1Homepage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heroScene, setHeroScene] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  const handleConsultationClick = () => {
    if (user) {
      router.push("/book-consultation");
      return;
    }

    setShowAuthModal(true);
  };

  return (
    <main className="overflow-x-hidden bg-[#fbfaf7] text-[#162126]">
      <section className="relative overflow-hidden border-b border-[#d9e2e1] bg-[#fbfaf7] lg:h-screen lg:min-h-[720px]">
        <div className="absolute inset-0">
          <Image
            src="/assets/images/heroimage.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[58%_48%]"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.24),transparent_27%),radial-gradient(circle_at_71%_52%,rgba(13,115,119,0.16),transparent_30%),radial-gradient(circle_at_center,rgba(5,12,22,0)_38%,rgba(5,12,22,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,22,0)_34%,rgba(5,12,22,0.22)_64%,rgba(5,12,22,0.88)_100%)]" />

        <div className="hidden lg:block">
          <h1 className="absolute left-1/2 top-[104px] z-10 w-full -translate-x-1/2 whitespace-nowrap text-center text-[clamp(48px,5vw,76px)] font-extrabold leading-[1.08] tracking-[-0.045em] text-white [text-shadow:0_8px_28px_rgba(5,12,22,0.42)] xl:top-[108px]">
            <span className="inline-block pb-2">
              Navigate your IR-1 journey with clarity.
            </span>
          </h1>

          <div className="absolute left-[5vw] top-[40vh] z-20 w-[300px] rounded-[22px] border border-white/40 bg-white/[0.18] px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[18px] xl:left-[10vw] xl:top-[38vh] xl:w-[350px] xl:px-8 xl:py-[30px] 2xl:left-[13vw] 2xl:w-[390px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={heroScene}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className={`${heroAnnotationFont.className} text-[28px] leading-[1.44] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.34)] xl:text-[31px] xl:leading-[1.46]`}
              >
                {heroAnnotations[heroScene]}
              </motion.p>
            </AnimatePresence>
          </div>

          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-[27vw] top-[46vh] z-10 h-[118px] w-[32vw] overflow-visible xl:left-[33vw] xl:top-[45vh] xl:w-[25vw] 2xl:left-[34vw]"
            viewBox="0 0 470 140"
            fill="none"
          >
            <defs>
              <filter id="heroConnectorGlow" x="-40%" y="-80%" width="180%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M8 86 C92 84 118 18 196 35 C275 52 300 111 462 58"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2"
              strokeDasharray="4 8"
              strokeLinecap="round"
            />
            <circle cx="216" cy="40" r="4.5" fill="rgba(255,255,255,0.96)" filter="url(#heroConnectorGlow)" />
            <circle cx="216" cy="40" r="12" fill="rgba(255,255,255,0.15)" />
          </svg>

          <div className="absolute right-[3vw] top-[24vh] z-20 h-[clamp(470px,50vh,560px)] w-[clamp(560px,54vw,720px)] xl:right-[6vw] xl:top-[23vh] xl:h-[clamp(500px,52vh,590px)] xl:w-[clamp(650px,47vw,760px)] 2xl:right-[11vw] 2xl:w-[clamp(700px,47vw,860px)]">
            <RealDashboardScene compact onSceneChange={setHeroScene} />
          </div>

          <div className="absolute bottom-[34px] left-[6vw] right-[6vw] z-20 flex items-center justify-between gap-8 xl:left-[15vw] xl:right-[15vw] xl:gap-8">
            <h1 className="sr-only">
              Navigate your IR-1 journey with clarity.
            </h1>
            <p className="max-w-[820px] text-[16px] leading-[1.65] text-white/88 [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] xl:text-[17px]">
              <span className="block xl:whitespace-nowrap">
                Rahvana gives you a structured step-by-step IR-1 roadmap —
                from petition filing to interview readiness —
              </span>
              <span className="block xl:whitespace-nowrap">
                with guided steps, document organization, progress tracking,
                and focused tools when you need them.
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-3.5">
              <Link
                href={journeyHref}
                className="inline-flex min-h-[57px] items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#0d7377,#18a6a2)] px-8 text-base font-black text-white shadow-[0_18px_44px_rgba(13,115,119,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(13,115,119,0.46)]"
              >
                Start IR-1 Journey
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-[57px] items-center justify-center rounded-[18px] border border-white/55 bg-[#08111f]/34 px-8 text-base font-black text-white shadow-[0_14px_32px_rgba(0,0,0,0.20)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/12"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-screen flex-col gap-7 px-5 pb-10 pt-24 sm:px-7 lg:hidden">
          <h1 className="text-center text-[clamp(2.4rem,8.6vw,4.6rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-white [text-shadow:0_8px_28px_rgba(5,12,22,0.42)]">
            <span className="inline-block pb-2">
              Navigate your IR-1 journey with clarity.
            </span>
          </h1>

          <div className="mx-auto h-[460px] w-full max-w-[760px] sm:h-[520px]">
            <RealDashboardScene compact onSceneChange={setHeroScene} />
          </div>

          <div className="mx-auto w-full max-w-[640px] rounded-[22px] border border-white/40 bg-white/[0.18] px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.26),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[18px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={heroScene}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className={`${heroAnnotationFont.className} text-[29px] leading-[1.35] text-white/95 [text-shadow:0_2px_12px_rgba(0,0,0,0.28)]`}
              >
                {heroAnnotations[heroScene]}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
            <p className="text-base leading-7 text-white/88 [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] sm:text-lg">
              <span className="block">
                Rahvana gives you a structured step-by-step IR-1 roadmap —
                from petition filing to interview readiness —
              </span>
              <span className="block">
                with guided steps, document organization, progress tracking,
                and focused tools when you need them.
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={journeyHref}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#0d7377,#18a6a2)] px-8 text-base font-black text-white shadow-[0_18px_44px_rgba(13,115,119,0.34)] transition hover:-translate-y-0.5"
              >
                Start IR-1 Journey
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-[56px] items-center justify-center rounded-[18px] border border-white/55 bg-[#08111f]/34 px-8 text-base font-black text-white shadow-[0_14px_32px_rgba(0,0,0,0.20)] backdrop-blur-xl transition hover:-translate-y-0.5"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className="relative isolate overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg,#ffffff 0%,#eef8f7 18%,#dff2ef 42%,#fbf0df 74%,#fffaf4 100%)",
        }}
      >
        {/* Shared layered background to add depth while keeping the transition continuous */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-[-12%] h-[34rem] w-[34rem] rounded-full blur-[110px]"
          style={{ background: "rgba(13,115,119,0.18)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8rem] top-[10%] h-[28rem] w-[28rem] rounded-full blur-[120px]"
          style={{ background: "rgba(11,102,106,0.11)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[8%] bottom-[-10rem] h-[30rem] w-[30rem] rounded-full blur-[120px]"
          style={{ background: "rgba(176,125,91,0.14)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 14% 18%, rgba(13,115,119,0.18), transparent 26%),' +
              'radial-gradient(circle at 86% 22%, rgba(11,102,106,0.10), transparent 22%),' +
              'radial-gradient(circle at 68% 78%, rgba(176,125,91,0.13), transparent 24%),' +
              'radial-gradient(circle at 38% 62%, rgba(255,255,255,0.42), transparent 34%)',
            mixBlendMode: 'normal',
          }}
        />

        <TwoWaysScene />

        <ConsultationBanner onConsultationClick={handleConsultationClick} />
      </div>

      <OriginalHomepageFaq openFAQ={openFAQ} setOpenFAQ={setOpenFAQ} />

      <motion.div
        id="contact"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <GetInTouch />
      </motion.div>

      <AnimatePresence>
        {showAuthModal && (
          <AuthRequiredModal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            redirectTo="/book-consultation"
          />
        )}
      </AnimatePresence>
    </main>
  );
}