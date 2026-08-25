import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import {
  Camera,
  FileText,
  FormInput,
  Calculator,
  MessagesSquare,
  ShieldCheck,
  PenLine,
  Stethoscope,
  Languages,
  Users,
  FileCheck2,
  ScrollText,
  IdCard,
  FileBadge,
  Heart,
  BookOpen,
  Globe,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

type Tool = {
  id: string;
  name: string;
  tag: string;
  category: "diy" | "services" | "guides";
  Icon: LucideIcon;
  tint: string;
  accent: string;
  glow: string;
  scenario: { title: string; body: string };
  href: string;
  ctaText?: string;
};

const tools: Tool[] = [
  {
    id: "action-planner",
    name: "221(g) Action Planner",
    tag: "Executive Tool",
    category: "diy",
    Icon: ShieldCheck,
    tint: "bg-violet-50",
    accent: "text-violet-600",
    glow: "rgba(167,139,250,0.35)",
    scenario: {
      title: "Got a 221(g) and feeling lost?",
      body: "We turn that scary blue slip into a simple checklist of what to send, where, and when, so you can move forward today.",
    },
    href: "/221g-action-planner",
    ctaText: "Open Planner",
  },
  {
    id: "interview",
    name: "Interview Prep",
    tag: "AI Coach",
    category: "diy",
    Icon: MessagesSquare,
    tint: "bg-rose-50",
    accent: "text-rose-600",
    glow: "rgba(251,113,133,0.35)",
    scenario: {
      title: "Interview in a few days?",
      body: "Practice with realistic questions, get instant feedback on your answers, and walk in calm and ready.",
    },
    href: "/interview-prep",
    ctaText: "Start Prep",
  },
  {
    id: "pdf",
    name: "PDF Tool Kit",
    tag: "All-in-One",
    category: "diy",
    Icon: FileText,
    tint: "bg-sky-50",
    accent: "text-sky-600",
    glow: "rgba(56,189,248,0.35)",
    scenario: {
      title: "Files too big to upload?",
      body: "Merge, shrink and rearrange your documents into the exact format the portal accepts. No tech skills needed.",
    },
    href: "/pdf-processing",
    ctaText: "Open Tool Kit",
  },
  {
    id: "photo",
    name: "Photo Booth",
    tag: "Studio Quality",
    category: "diy",
    Icon: Camera,
    tint: "bg-amber-50",
    accent: "text-amber-600",
    glow: "rgba(251,191,36,0.35)",
    scenario: {
      title: "Need a passport photo tonight?",
      body: "Snap one with your phone. We auto-fix the background, size, and lighting so it passes on the first try.",
    },
    href: "/passport",
    ctaText: "Open Photo Booth",
  },
  {
    id: "form-filler",
    name: "Smart Form Filler",
    tag: "Automation",
    category: "diy",
    Icon: FormInput,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(52,211,153,0.35)",
    scenario: {
      title: "Tired of typing the same info?",
      body: "Fill it once. We auto-fill every USCIS form for you and hand back a ready-to-upload PDF.",
    },
    href: "/visa-forms",
    ctaText: "Start Form Filler",
  },
  {
    id: "snap-sign",
    name: "Snap & Sign",
    tag: "Clean Signatures",
    category: "diy",
    Icon: PenLine,
    tint: "bg-pink-50",
    accent: "text-pink-600",
    glow: "rgba(244,114,182,0.35)",
    scenario: {
      title: "Signature looks messy on scans?",
      body: "Take a photo of your handwritten signature, we give you a clean, background-free version ready to drop on any form.",
    },
    href: "/signature-image-processing",
    ctaText: "Create Signature",
  },
  {
    id: "sponsor",
    name: "Sponsorship Calculator",
    tag: "Financial Rules",
    category: "diy",
    Icon: Calculator,
    tint: "bg-emerald-50",
    accent: "text-emerald-700",
    glow: "rgba(16,185,129,0.35)",
    scenario: {
      title: "Not sure if you earn enough?",
      body: "Tell us your income and household. We check it against the I-864 rules and say exactly where you stand.",
    },
    href: "/affidavit-support-calculator",
    ctaText: "Calculate Sponsorship",
  },
  {
    id: "medical",
    name: "Book Medical Exam",
    tag: "Done-For-You",
    category: "services",
    Icon: Stethoscope,
    tint: "bg-rose-50",
    accent: "text-rose-700",
    glow: "rgba(225,29,72,0.30)",
    scenario: {
      title: "Don't know which panel doctor to call?",
      body: "We book your panel physician medical exam and coordinate the schedule for you. You just show up.",
    },
    href: "/book-appointment",
    ctaText: "Book Medical Exam",
  },
  {
    id: "translation",
    name: "Document Translation",
    tag: "Certified",
    category: "services",
    Icon: Languages,
    tint: "bg-amber-50",
    accent: "text-amber-700",
    glow: "rgba(217,119,6,0.30)",
    scenario: {
      title: "Documents in the wrong language?",
      body: "Get certified, embassy-ready translations for your CNIC, birth certificate, and other civil documents.",
    },
    href: "/document-translation",
    ctaText: "Get Translation",
  },
  {
    id: "consultation",
    name: "Expert Consultation",
    tag: "1-on-1 Expert",
    category: "services",
    Icon: Users,
    tint: "bg-sky-50",
    accent: "text-sky-700",
    glow: "rgba(2,132,199,0.30)",
    scenario: {
      title: "Need someone who's seen your case before?",
      body: "Book a focused 30-minute video session with a specialist for clear, situation-specific guidance.",
    },
    href: "/book-consultation",
    ctaText: "Book Consultation",
  },
  {
    id: "pcc",
    name: "PCC Filing (Sindh)",
    tag: "Done-For-You",
    category: "services",
    Icon: FileCheck2,
    tint: "bg-emerald-50",
    accent: "text-emerald-700",
    glow: "rgba(5,150,105,0.30)",
    scenario: {
      title: "PCC process making your head spin?",
      body: "We handle the police character certificate filing in Sindh end-to-end on your behalf.",
    },
    href: "/police-verification/apply?province=Sindh",
    ctaText: "Apply for PCC",
  },
  {
    id: "guides-hub",
    name: "Document & Official Guides",
    tag: "Complete Hub",
    category: "guides",
    Icon: BookOpen,
    tint: "bg-teal-50",
    accent: "text-teal-700",
    glow: "rgba(13,148,136,0.35)",
    scenario: {
      title: "Confused by NADRA, Union Council, or Embassy rules?",
      body: "Step-by-step official roadmaps for CNIC, FRC, Birth Certificates, Marriage Registration, Passports, and Police Clearance.",
    },
    href: "/guides",
    ctaText: "Explore Guides",
  },
];

const AUTOPLAY_MS = 4000;
const VISIBLE = 5; // odd number — active is centered

export function ToolsDock() {
  const [index, setIndex] = useState(0);
  const [iconInFront, setIconInFront] = useState(true);
  const active = tools[index];

  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum horizontal swipe distance of 35px & dominant horizontal movement
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swipe Left -> Next Tool
        setIndex((i) => (i + 1) % tools.length);
        setIconInFront(true);
      } else {
        // Swipe Right -> Prev Tool
        setIndex((i) => (i - 1 + tools.length) % tools.length);
        setIconInFront(true);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Each tool gets two beats: icon in front → scenario in front → next tool
  useEffect(() => {
    const id = setInterval(() => {
      setIconInFront((f) => {
        if (f) {
          // First beat done (icon was front). Flip to scenario front, stay on same tool.
          return false;
        } else {
          // Second beat done (scenario was front). Advance to next tool, reset to icon front.
          setIndex((i) => (i + 1) % tools.length);
          return true;
        }
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex w-full flex-col justify-center overflow-hidden bg-slate-50/50 px-6 pt-10 pb-10 md:pt-14 md:pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col justify-center">
        {/* Eyebrow + headline */}
        <div className="mx-auto mb-6 md:mb-8 max-w-2xl text-center shrink-0">
          <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Do it yourself
          </span>
          <h2 className="text-balance text-2xl md:text-4xl font-medium leading-[1.1] tracking-tight text-zinc-400">
            Already know what you're doing?{" "}
            <span className="text-zinc-900">You just need the right tools.</span>
          </h2>
          <p className="mx-auto mt-2 md:mt-3 max-w-lg text-[13px] md:text-[15px] leading-relaxed text-zinc-500">
            Tools, expert services, and country-specific guides, all in one place.
          </p>
        </div>

        {/* Stage with touch swipe support */}
        {isMobile ? (
          /* Mobile Single Card Stage with Touch Swipe & Segmented Pill Switcher */
          <div
            className="relative mx-auto flex flex-col items-center justify-center w-full max-w-[340px] px-2 touch-pan-y select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Halo glow */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              animate={{
                background: `radial-gradient(circle, ${active.glow} 0%, rgba(255,255,255,0) 65%)`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Segmented View Switcher with Sliding Active Pill */}
            <div className="relative z-20 mb-5 flex items-center gap-1 rounded-full border border-black/[0.08] bg-white/80 p-1 backdrop-blur-xl shadow-md">
              <button
                type="button"
                onClick={() => setIconInFront(true)}
                className={`relative flex items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                  iconInFront ? "text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {iconInFront && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-full bg-zinc-900 shadow-md"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Tool</span>
              </button>
              <button
                type="button"
                onClick={() => setIconInFront(false)}
                className={`relative flex items-center justify-center rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                  !iconInFront ? "text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {!iconInFront && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-full bg-zinc-900 shadow-md"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">How to Use</span>
              </button>
            </div>

            {/* Single Hero Card with 3D Depth Flip */}
            <div className="relative z-10 w-full py-5 [perspective:1000px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id + (iconInFront ? "-icon" : "-text")}
                  initial={{ opacity: 0, rotateY: iconInFront ? -15 : 15, scale: 0.95 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, rotateY: iconInFront ? 15 : -15, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                >
                  <Link href={active.href} className="block group">
                    <div
                      className={`relative flex h-[240px] w-full flex-col justify-between overflow-hidden rounded-[28px] border border-black/[0.08] ${
                        iconInFront ? active.tint : "bg-white"
                      } p-5 shadow-[0_22px_50px_-15px_rgba(0,0,0,0.18)] transition-transform duration-200 active:scale-[0.99]`}
                    >
                      {iconInFront ? (
                        /* Tool View Content — Rich Hero Card */
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span
                                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                                  style={{ backgroundColor: active.glow.replace("0.35)", "0.8)").replace("0.30)", "0.8)") }}
                                />
                                <span
                                  className="relative inline-flex rounded-full h-2 w-2"
                                  style={{ backgroundColor: active.glow.replace("0.35)", "1)").replace("0.30)", "1)") }}
                                />
                              </span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-medium">
                                {active.tag}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400">
                              {index + 1} / {tools.length}
                            </span>
                          </div>

                          <div className="flex flex-1 items-center justify-between gap-4 my-2">
                            <div className="flex-1 text-left">
                              <h3 className="text-lg font-bold text-zinc-800 tracking-tight leading-snug">
                                {active.name}
                              </h3>
                              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
                                {active.scenario.title}
                              </p>
                            </div>
                            <motion.div
                              initial={{ scale: 0.85, rotate: -6 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200, damping: 18 }}
                              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-[0_10px_25px_-8px_rgba(0,0,0,0.10)] border border-black/5 backdrop-blur-sm"
                            >
                              <active.Icon
                                className={`h-9 w-9 ${active.accent}`}
                                strokeWidth={1.5}
                              />
                            </motion.div>
                          </div>

                          <div className="flex items-center justify-between border-t border-black/[0.07] pt-3">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                              {active.category === "guides" ? "Official Guide" : "Interactive Tool"}
                            </span>
                            <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-800 shadow-sm backdrop-blur-sm transition-transform group-active:scale-95">
                              <span>{active.ctaText || "Open Tool"}</span>
                              <ArrowRight className={`h-3 w-3 ${active.accent}`} strokeWidth={2.5} />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Scenario Mode Content */
                        <>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-100 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-700 font-semibold">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: active.glow.replace("0.35)", "1)").replace("0.30)", "1)") }}
                              />
                              How you use it
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                              {active.name}
                            </span>
                          </div>

                          <div className="mt-2 flex-1 flex flex-col justify-center">
                            <h4 className="text-[15px] font-semibold leading-snug text-zinc-800">
                              {active.scenario.title}
                            </h4>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600 line-clamp-3">
                              {active.scenario.body}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-black/[0.07] pt-3">
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {index + 1} / {tools.length}
                            </span>
                            <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-transform group-active:scale-95">
                              <span>{active.ctaText || "Open Tool"}</span>
                              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Desktop 3D Dual-Card Overlapping Stage (UNTOUCHED) */
          <div
            className="relative mx-auto flex h-[320px] w-full max-w-3xl items-center justify-center shrink-0 select-none"
          >
            {/* Halo glow */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              animate={{
                background: `radial-gradient(circle, ${active.glow} 0%, rgba(255,255,255,0) 65%)`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Two overlapping cards — both always visible, swap front/back */}
            <div className="relative h-[300px] w-[460px] max-w-full">
              {/* Icon card — full-bleed icon, no wasted space */}
              <motion.div
                animate={{
                  x: iconInFront ? -85 : 70,
                  y: iconInFront ? 8 : -8,
                  rotate: iconInFront ? -5 : 4,
                  scale: iconInFront ? 1 : 0.9,
                  zIndex: iconInFront ? 20 : 10,
                }}
                transition={{ type: "spring", stiffness: 50, damping: 18 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onClick={(e) => {
                  if (!iconInFront) {
                    e.stopPropagation();
                    setIconInFront(true);
                  }
                }}
              >
                {iconInFront ? (
                  <Link href={active.href} className="block">
                    <div
                      className={`group relative flex h-[240px] w-[190px] flex-col overflow-hidden rounded-[24px] border border-black/[0.06] ${active.tint} shadow-[0_20px_45px_-15px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-[1.02]`}
                    >
                      {/* Big icon fills the card */}
                      <motion.div
                        key={active.id + "-icon"}
                        initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 180, damping: 18 }}
                        className="flex flex-1 items-center justify-center"
                      >
                        <active.Icon
                          className={`h-20 w-20 ${active.accent}`}
                          strokeWidth={1.4}
                        />
                      </motion.div>
                      {/* Label strip at bottom */}
                      <div className="border-t border-black/5 bg-white/70 px-3 py-2 backdrop-blur-sm">
                        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
                          {active.tag}
                        </span>
                        <h3 className="mt-0.5 text-[13px] font-medium leading-tight tracking-tight text-zinc-900 truncate">
                          {active.name}
                        </h3>
                      </div>
                      {/* Glassmorphic Hover Overlay */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] rounded-[24px]">
                        <div className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-zinc-950 shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <span>{active.ctaText || "Open Tool"}</span>
                          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    className={`relative flex h-[240px] w-[190px] flex-col overflow-hidden rounded-[24px] border border-black/[0.06] ${active.tint} shadow-[0_20px_45px_-15px_rgba(0,0,0,0.25)]`}
                  >
                    {/* Big icon fills the card */}
                    <motion.div
                      key={active.id + "-icon"}
                      initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 18 }}
                      className="flex flex-1 items-center justify-center"
                    >
                      <active.Icon
                        className={`h-20 w-20 ${active.accent}`}
                        strokeWidth={1.4}
                      />
                    </motion.div>
                    {/* Label strip at bottom */}
                    <div className="border-t border-black/5 bg-white/70 px-3 py-2 backdrop-blur-sm">
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
                        {active.tag}
                      </span>
                      <h3 className="mt-0.5 text-[13px] font-medium leading-tight tracking-tight text-zinc-900 truncate">
                        {active.name}
                      </h3>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Scenario card — tight, animated text */}
              <motion.div
                animate={{
                  x: iconInFront ? 85 : -70,
                  y: iconInFront ? -8 : 8,
                  rotate: iconInFront ? 4 : -5,
                  scale: iconInFront ? 0.92 : 1,
                  zIndex: iconInFront ? 10 : 20,
                }}
                transition={{ type: "spring", stiffness: 50, damping: 18 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onClick={(e) => {
                  if (iconInFront) {
                    e.stopPropagation();
                    setIconInFront(false);
                  }
                }}
              >
                {!iconInFront ? (
                  <Link href={active.href} className="block">
                    <div className="group relative flex h-[240px] w-[250px] flex-col justify-between rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_28px_60px_-15px_rgba(0,0,0,0.22)]">
                      <div className="flex-1 flex flex-col justify-center">
                        <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-500 font-medium">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${active.accent.replace("text-", "bg-")}`}
                          />
                          How you use it
                        </span>
                        <motion.div
                          key={active.id + "-text"}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className="mt-3"
                        >
                          <h4 className="text-pretty text-[16px] font-medium leading-snug tracking-tight text-zinc-900">
                            {active.scenario.title}
                          </h4>
                          <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 text-left line-clamp-4">
                            {active.scenario.body}
                          </p>
                        </motion.div>
                      </div>
                      {/* Always visible CTA at bottom of card text */}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                        <span>{active.ctaText || "Open Tool"}</span>
                        <ArrowRight
                          className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5"
                          strokeWidth={2.5}
                        />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="relative flex h-[240px] w-[250px] flex-col justify-center rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.18)]">
                    <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-500 font-medium">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${active.accent.replace("text-", "bg-")}`}
                      />
                      How you use it
                    </span>
                    <motion.div
                      key={active.id + "-text"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="mt-3"
                    >
                      <h4 className="text-pretty text-[16px] font-medium leading-snug tracking-tight text-zinc-900">
                        {active.scenario.title}
                      </h4>
                      <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 text-left line-clamp-4">
                        {active.scenario.body}
                      </p>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Dock navigation */}
        <div className="shrink-0 mt-3 pb-3 md:mt-5 md:pb-0">
          {isMobile ? (
            <MobileDock tools={tools} activeIndex={index} onSelect={(i) => setIndex(i)} />
          ) : (
            <CurvedDock
              tools={tools}
              activeIndex={index}
              onSelect={(i) => {
                setIndex(i);
                setIconInFront((f) => !f);
              }}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function MobileDock({
  tools,
  activeIndex,
  onSelect,
}: {
  tools: Tool[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // rAF ensures the DOM has repainted (critical for auto-switch) before we read offsetLeft
    const raf = requestAnimationFrame(() => {
      const activeEl = container.children[activeIndex] as HTMLElement;
      if (!activeEl) return;
      const targetScrollLeft =
        activeEl.offsetLeft - container.clientWidth / 2 + activeEl.offsetWidth / 2;
      container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  const prev = () => onSelect((activeIndex - 1 + tools.length) % tools.length);
  const next = () => onSelect((activeIndex + 1) % tools.length);

  return (
    <div className="relative mx-auto flex w-full max-w-[340px] items-center gap-2 px-1">
      {/* Floating Glass Prev Button */}
      <motion.button
        type="button"
        onClick={prev}
        aria-label="Previous tool"
        whileTap={{ scale: 0.85 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/90 text-zinc-700 shadow-md backdrop-blur-md transition-shadow hover:bg-white active:bg-zinc-100 touch-manipulation"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
      </motion.button>

      {/* Track Container with Glass Border */}
      <div className="relative flex-1 overflow-hidden rounded-full border border-black/10 bg-white/60 p-1.5 backdrop-blur-xl shadow-inner">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none snap-x select-none px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tools.map((tool, idx) => {
            const isActive = idx === activeIndex;
            return (
              <motion.button
                key={tool.id + "-icon-only"}
                type="button"
                onClick={() => onSelect(idx)}
                aria-label={tool.name}
                whileTap={{ scale: 0.88 }}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full snap-center touch-manipulation"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMobileIconRing"
                    className={`absolute inset-0 rounded-full border border-black/10 ${tool.tint} shadow-md`}
                    style={{
                      boxShadow: `0 8px 20px -4px ${tool.glow}`,
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  />
                )}
                <tool.Icon
                  className={`relative z-10 h-5 w-5 transition-transform duration-200 ${
                    isActive ? `${tool.accent} scale-110` : "text-zinc-400 hover:text-zinc-700"
                  }`}
                  strokeWidth={isActive ? 2 : 1.6}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Floating Glass Next Button */}
      <motion.button
        type="button"
        onClick={next}
        aria-label="Next tool"
        whileTap={{ scale: 0.85 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/90 text-zinc-700 shadow-md backdrop-blur-md transition-shadow hover:bg-white active:bg-zinc-100 touch-manipulation"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
      </motion.button>
    </div>
  );
}

function CurvedDock({
  tools,
  activeIndex,
  onSelect,
  isMobile,
}: {
  tools: Tool[];
  activeIndex: number;
  onSelect: (i: number) => void;
  isMobile: boolean;
}) {
  const half = Math.floor(VISIBLE / 2);

  // Track direction of spin: +1 = forward (right→left), -1 = backward (left→right)
  const prevIndexRef = useRef(activeIndex);
  const dirRef = useRef<1 | -1>(1);
  if (prevIndexRef.current !== activeIndex) {
    // Detect shortest-path direction around the ring
    const fwd = (activeIndex - prevIndexRef.current + tools.length) % tools.length;
    dirRef.current = fwd <= tools.length / 2 ? 1 : -1;
    prevIndexRef.current = activeIndex;
  }

  // Visible window keyed by tool.id so Framer Motion tracks across renders
  const visibleItems = useMemo(() => {
    const out: { tool: Tool; idx: number; offset: number }[] = [];
    if (tools.length === 0) return out;
    const effectiveVisible = Math.min(VISIBLE, tools.length);
    const h = Math.floor(effectiveVisible / 2);

    for (let o = -h; o <= h; o++) {
      const idx = (activeIndex + o + tools.length) % tools.length;
      out.push({ tool: tools[idx], idx, offset: o });
    }
    return out;
  }, [activeIndex, tools]);

  const width = 680;
  const height = 90;
  const cx = width / 2;
  const cy = height + 320;
  const r = cy - 25;
  const slot = (width - 80) / (VISIBLE - 1);

  /** Convert an offset (-half … +half) to { left%, top } along the arc */
  const arcPos = (offset: number, isActive: boolean) => {
    const x = cx + offset * slot;
    const dx = x - cx;
    const y = cy - Math.sqrt(r * r - dx * dx);
    const half2 = isActive ? (isMobile ? 18 : 24) : isMobile ? 14 : 19;
    return {
      left: `calc(${(x / width) * 100}% - ${half2}px)`,
      top: `calc(${(y / height) * 100}% - ${half2}px)`,
    };
  };

  /** Off-screen entry / exit position — one slot beyond the edge of the arc */
  const edgePos = (side: "left" | "right") => {
    const edgeOffset = side === "right" ? half + 1.5 : -(half + 1.5);
    const x = cx + edgeOffset * slot;
    const clamped = Math.min(Math.abs(x - cx), r - 1);
    const dx = x > cx ? clamped : -clamped;
    const y = cy - Math.sqrt(r * r - dx * dx);
    const half2 = isMobile ? 14 : 19;
    return {
      left: `calc(${(x / width) * 100}% - ${half2}px)`,
      top: `calc(${(y / height) * 100}% - ${half2}px)`,
    };
  };

  const prev = () => onSelect((activeIndex - 1 + tools.length) % tools.length);
  const next = () => onSelect((activeIndex + 1) % tools.length);

  return (
    <div className="mx-auto mt-3 md:mt-5 flex w-full max-w-[820px] items-center gap-1.5 md:gap-3">
      <button
        onClick={prev}
        aria-label="Previous"
        className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900 active:scale-95 touch-manipulation"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="relative flex-1 aspect-[680/90] overflow-visible">
        {/* Arc guide line */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full block"
          aria-hidden
        >
          <path
            d={`M 40 ${cy - Math.sqrt(r * r - (cx - 40) * (cx - 40))} A ${r} ${r} 0 0 1 ${width - 40} ${
              cy - Math.sqrt(r * r - (cx - (width - 40)) * (cx - (width - 40)))
            }`}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={1}
          />
        </svg>

        {/* Icons — each keyed by tool.id so Framer animates them along the arc */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence initial={false}>
            {visibleItems.map(({ tool, idx, offset }) => {
              const isActive = idx === activeIndex;
              const dist = Math.abs(offset);
              const opacity = 1 - dist * 0.18;
              const pos = arcPos(offset, isActive);

              // Entering from the side the wheel is spinning FROM
              const enterSide = dirRef.current === 1 ? "right" : "left";
              const exitSide = dirRef.current === 1 ? "left" : "right";
              const enterPos = edgePos(enterSide);
              const exitPos = edgePos(exitSide);

              return (
                <motion.button
                  key={tool.id}
                  onClick={() => onSelect(idx)}
                  aria-label={tool.name}
                  aria-pressed={isActive}
                  initial={{ opacity: 0, left: enterPos.left, top: enterPos.top, scale: 0.7 }}
                  animate={{
                    opacity,
                    left: pos.left,
                    top: pos.top,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, left: exitPos.left, top: exitPos.top, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 240, damping: 26 }}
                  className="group absolute touch-manipulation p-1"
                >
                  <div
                    className={`flex items-center justify-center border border-black/[0.05] ${
                      tool.tint
                    } transition-all duration-300 ${
                      isActive
                        ? "h-9 w-9 md:h-12 md:w-12 rounded-2xl shadow-[0_14px_28px_-10px_rgba(0,0,0,0.32)]"
                        : "h-7 w-7 md:h-9 md:w-9 rounded-lg md:rounded-xl"
                    }`}
                  >
                    <tool.Icon
                      className={`transition-all duration-300 ${
                        isActive
                          ? `h-4 w-4 md:h-6 md:w-6 ${tool.accent}`
                          : `h-3.5 w-3.5 md:h-4 md:w-4 ${tool.accent}`
                      }`}
                    />
                  </div>
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {tool.name}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={next}
        aria-label="Next"
        className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900 active:scale-95 touch-manipulation"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ToolsDock;
