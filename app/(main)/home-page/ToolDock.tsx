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
  Icon: LucideIcon;
  tint: string;
  accent: string;
  glow: string;
  scenario: { title: string; body: string };
  href: string;
};

const tools: Tool[] = [
  {
    id: "action-planner",
    name: "221(g) Action Planner",
    tag: "Executive Tool",
    Icon: ShieldCheck,
    tint: "bg-violet-50",
    accent: "text-violet-600",
    glow: "rgba(167,139,250,0.35)",
    scenario: {
      title: "Got a 221(g) and feeling lost?",
      body: "We turn that scary blue slip into a simple checklist of what to send, where, and when — so you can move forward today.",
    },
    href: "/221g-action-planner",
  },
  {
    id: "interview",
    name: "Interview Prep",
    tag: "AI Interview Coach",
    Icon: MessagesSquare,
    tint: "bg-rose-50",
    accent: "text-rose-600",
    glow: "rgba(251,113,133,0.35)",
    scenario: {
      title: "Interview in a few days?",
      body: "Practice with realistic questions, get instant feedback on your answers, and walk in calm and ready.",
    },
    href: "/interview-prep",
  },
  {
    id: "pdf",
    name: "PDF Tool Kit",
    tag: "All-in-One",
    Icon: FileText,
    tint: "bg-sky-50",
    accent: "text-sky-600",
    glow: "rgba(56,189,248,0.35)",
    scenario: {
      title: "Files too big to upload?",
      body: "Merge, shrink and rearrange your documents into the exact format the portal accepts. No tech skills needed.",
    },
    href: "/pdf-processing",
  },
  {
    id: "photo",
    name: "Photo Booth",
    tag: "Minutes, Not Studios",
    Icon: Camera,
    tint: "bg-amber-50",
    accent: "text-amber-600",
    glow: "rgba(251,191,36,0.35)",
    scenario: {
      title: "Need a passport photo tonight?",
      body: "Snap one with your phone. We auto-fix the background, size, and lighting so it passes on the first try.",
    },
    href: "/passport",
  },
  {
    id: "form-filler",
    name: "Smart Form Filler",
    tag: "Automation",
    Icon: FormInput,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(52,211,153,0.35)",
    scenario: {
      title: "Tired of typing the same info?",
      body: "Fill it once. We auto-fill every USCIS form for you and hand back a ready-to-upload PDF.",
    },
    href: "/visa-forms",
  },
  {
    id: "snap-sign",
    name: "Snap & Sign",
    tag: "Clean Signatures",
    Icon: PenLine,
    tint: "bg-pink-50",
    accent: "text-pink-600",
    glow: "rgba(244,114,182,0.35)",
    scenario: {
      title: "Signature looks messy on scans?",
      body: "Take a photo of your handwritten signature — we give you a clean, background-free version ready to drop on any form.",
    },
    href: "/signature-image-processing",
  },
  {
    id: "sponsor",
    name: "Sponsorship Calculator",
    tag: "Most Useful",
    Icon: Calculator,
    tint: "bg-emerald-50",
    accent: "text-emerald-700",
    glow: "rgba(16,185,129,0.35)",
    scenario: {
      title: "Not sure if you earn enough?",
      body: "Tell us your income and household. We check it against the I-864 rules and say exactly where you stand.",
    },
    href: "/affidavit-support-calculator",
  },
  {
    id: "medical",
    name: "Book Medical Appointment",
    tag: "Done-For-You",
    Icon: Stethoscope,
    tint: "bg-rose-50",
    accent: "text-rose-700",
    glow: "rgba(225,29,72,0.30)",
    scenario: {
      title: "Don't know which panel doctor to call?",
      body: "We book your panel physician medical exam and coordinate the schedule for you. You just show up.",
    },
    href: "/book-appointment",
  },
  {
    id: "translation",
    name: "Document Translation",
    tag: "Certified",
    Icon: Languages,
    tint: "bg-amber-50",
    accent: "text-amber-700",
    glow: "rgba(217,119,6,0.30)",
    scenario: {
      title: "Documents in the wrong language?",
      body: "Get certified, embassy-ready translations for your CNIC, birth certificate, and other civil documents.",
    },
    href: "/document-translation",
  },
  {
    id: "consultation",
    name: "Expert Consultation",
    tag: "1-on-1 Expert",
    Icon: Users,
    tint: "bg-sky-50",
    accent: "text-sky-700",
    glow: "rgba(2,132,199,0.30)",
    scenario: {
      title: "Need someone who's seen your case before?",
      body: "Book a focused 30-minute video session with a specialist for clear, situation-specific guidance.",
    },
    href: "/book-consultation",
  },
  {
    id: "pcc",
    name: "PCC Filing (Sindh)",
    tag: "Done-For-You",
    Icon: FileCheck2,
    tint: "bg-emerald-50",
    accent: "text-emerald-700",
    glow: "rgba(5,150,105,0.30)",
    scenario: {
      title: "PCC process making your head spin?",
      body: "We handle the police character certificate filing in Sindh end-to-end on your behalf.",
    },
    href: "/police-verification/apply?province=Sindh",
  },
  {
    id: "birth-guide",
    name: "Birth Certificate Guide",
    tag: "Step-by-Step",
    Icon: ScrollText,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(16,185,129,0.30)",
    scenario: {
      title: "Need a CRBC and don't know where to start?",
      body: "A simple Union Council walkthrough for registering, correcting, or replacing your birth certificate.",
    },
    href: "/guides/birth-certificate-guide",
  },
  {
    id: "cnic-guide",
    name: "CNIC Guide",
    tag: "Step-by-Step",
    Icon: IdCard,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(16,185,129,0.30)",
    scenario: {
      title: "First CNIC, fix, or renewal?",
      body: "The exact NADRA workflow — what to bring, which counter, and how long it really takes.",
    },
    href: "/guides/cnic-guide",
  },
  {
    id: "frc-guide",
    name: "FRC Guide",
    tag: "Step-by-Step",
    Icon: FileBadge,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(16,185,129,0.30)",
    scenario: {
      title: "Embassy asking for an FRC?",
      body: "Follow the NADRA Family Registration Certificate steps and double-check your family record before applying.",
    },
    href: "/guides/frc-guide",
  },
  {
    id: "marriage-guide",
    name: "Marriage Registration Guide",
    tag: "Step-by-Step",
    Icon: Heart,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(16,185,129,0.30)",
    scenario: {
      title: "Nikah Nama but no MRC yet?",
      body: "Register your marriage at the Union Council and get a NADRA MRC, with attestation steps spelled out.",
    },
    href: "/guides/nikah-nama-guide",
  },
  {
    id: "passport-guide",
    name: "Passport Guide",
    tag: "Step-by-Step",
    Icon: Globe,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(16,185,129,0.30)",
    scenario: {
      title: "New passport, renewal, or lost one?",
      body: "A clear DGIP roadmap for MRP and ePassport applications — what to file and what to skip.",
    },
    href: "/guides/passport-guide",
  },
  {
    id: "pcc-guide",
    name: "Police Character Certificate Guide",
    tag: "Step-by-Step",
    Icon: BookOpen,
    tint: "bg-emerald-50",
    accent: "text-emerald-600",
    glow: "rgba(16,185,129,0.30)",
    scenario: {
      title: "Need a PCC in your province?",
      body: "Province-by-province PCC workflow with required documents, fee tiers, and verification steps.",
    },
    href: "/guides/police-verification-guide",
  },
];

const AUTOPLAY_MS = 8000;
const VISIBLE = 5; // odd number — active is centered

export function ToolsDock() {
  const [index, setIndex] = useState(0);
  const [iconInFront, setIconInFront] = useState(true);
  const active = tools[index];

  const [isMobile, setIsMobile] = useState(false);

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
    <section className="relative flex h-screen max-h-screen w-full flex-col justify-center overflow-hidden bg-slate-50/50 px-6 py-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col justify-center">
        {/* Eyebrow + headline */}
        <div className="mx-auto mb-4 md:mb-6 max-w-2xl text-center shrink-0">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            Do it yourself
          </span>
          <h2 className="text-balance text-2xl md:text-4xl font-medium leading-[1.1] tracking-tight text-zinc-900">
            Already know what you're doing?{" "}
            <span className="text-zinc-400">You just need the right tools.</span>
          </h2>
          <p className="mx-auto mt-2 md:mt-3 max-w-lg text-[13px] md:text-[15px] leading-relaxed text-zinc-500">
            Tools, expert services, and country-specific guides — all in one place.
          </p>
        </div>

        {/* Stage */}
        <div className="relative mx-auto flex h-[240px] sm:h-[280px] md:h-[320px] w-full max-w-3xl items-center justify-center shrink-0">
          {/* Halo glow */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] md:h-[420px] md:w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            animate={{
              background: `radial-gradient(circle, ${active.glow} 0%, rgba(255,255,255,0) 65%)`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Two overlapping cards — both always visible, swap front/back */}
          <div className="relative h-[220px] sm:h-[260px] md:h-[300px] w-[460px] max-w-full">
            {/* Icon card — full-bleed icon, no wasted space */}
            <motion.div
              animate={{
                x: isMobile ? 0 : (iconInFront ? -85 : 70),
                y: isMobile ? (iconInFront ? 10 : -10) : (iconInFront ? 8 : -8),
                rotate: isMobile ? (iconInFront ? -2 : 2) : (iconInFront ? -5 : 4),
                scale: isMobile ? (iconInFront ? 1 : 0.9) : (iconInFront ? 1 : 0.9),
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
                    className={`group relative flex h-[180px] sm:h-[220px] md:h-[240px] w-[150px] sm:w-[170px] md:w-[190px] flex-col overflow-hidden rounded-[24px] border border-black/[0.06] ${active.tint} shadow-[0_20px_45px_-15px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-[1.02]`}
                  >
                    {/* Big icon fills the card */}
                    <motion.div
                      key={active.id + "-icon"}
                      initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 18 }}
                      className="flex flex-1 items-center justify-center"
                    >
                      <active.Icon className={`h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 ${active.accent}`} strokeWidth={1.4} />
                    </motion.div>
                    {/* Label strip at bottom */}
                    <div className="border-t border-black/5 bg-white/70 px-3 py-2 backdrop-blur-sm">
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
                        {active.tag}
                      </span>
                      <h3 className="mt-0.5 text-[12px] md:text-[13px] font-medium leading-tight tracking-tight text-zinc-900">
                        {active.name}
                      </h3>
                    </div>
                    {/* Glassmorphic Hover Overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] rounded-[24px]">
                      <div className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-zinc-950 shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span>Open Tool</span>
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  className={`relative flex h-[180px] sm:h-[220px] md:h-[240px] w-[150px] sm:w-[170px] md:w-[190px] flex-col overflow-hidden rounded-[24px] border border-black/[0.06] ${active.tint} shadow-[0_20px_45px_-15px_rgba(0,0,0,0.25)]`}
                >
                  {/* Big icon fills the card */}
                  <motion.div
                    key={active.id + "-icon"}
                    initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className="flex flex-1 items-center justify-center"
                  >
                    <active.Icon className={`h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 ${active.accent}`} strokeWidth={1.4} />
                  </motion.div>
                  {/* Label strip at bottom */}
                  <div className="border-t border-black/5 bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
                      {active.tag}
                    </span>
                    <h3 className="mt-0.5 text-[12px] md:text-[13px] font-medium leading-tight tracking-tight text-zinc-900">
                      {active.name}
                    </h3>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Scenario card — tight, animated text */}
            <motion.div
              animate={{
                x: isMobile ? 0 : (iconInFront ? 85 : -70),
                y: isMobile ? (iconInFront ? -10 : 10) : (iconInFront ? -8 : 8),
                rotate: isMobile ? (iconInFront ? 2 : -2) : (iconInFront ? 4 : -5),
                scale: isMobile ? (iconInFront ? 0.9 : 1) : (iconInFront ? 0.92 : 1),
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
                  <div className="group relative flex h-[190px] sm:h-[220px] md:h-[240px] w-[200px] sm:w-[230px] md:w-[250px] flex-col justify-between rounded-[24px] border border-black/[0.06] bg-white p-4 md:p-5 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_28px_60px_-15px_rgba(0,0,0,0.22)]">
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="absolute left-4 top-4 md:left-5 md:top-5 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-500">
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
                        <h4 className="text-pretty text-[13px] md:text-[16px] font-medium leading-snug tracking-tight text-zinc-900">
                          {active.scenario.title}
                        </h4>
                        <p className="mt-1 md:mt-2 text-[11px] md:text-[12px] leading-relaxed text-zinc-500 text-left line-clamp-4">
                          {active.scenario.body}
                        </p>
                      </motion.div>
                    </div>
                    {/* Always visible CTA at bottom of card text */}
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                      <span>Open Tool</span>
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative flex h-[190px] sm:h-[220px] md:h-[240px] w-[200px] sm:w-[230px] md:w-[250px] flex-col justify-center rounded-[24px] border border-black/[0.06] bg-white p-4 md:p-5 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.18)]">
                  <span className="absolute left-4 top-4 md:left-5 md:top-5 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-500">
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
                    <h4 className="text-pretty text-[13px] md:text-[16px] font-medium leading-snug tracking-tight text-zinc-900">
                      {active.scenario.title}
                    </h4>
                    <p className="mt-1 md:mt-2 text-[11px] md:text-[12px] leading-relaxed text-zinc-500 text-left line-clamp-4">
                      {active.scenario.body}
                    </p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Curved icon strip — windowed */}
        <div className="shrink-0">
          <CurvedDock
            tools={tools}
            activeIndex={index}
            onSelect={(i) => {
              setIndex(i);
              setIconInFront((f) => !f);
            }}
            isMobile={isMobile}
          />
        </div>
      </div>
    </section>
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
    for (let o = -half; o <= half; o++) {
      const idx = (activeIndex + o + tools.length) % tools.length;
      out.push({ tool: tools[idx], idx, offset: o });
    }
    return out;
  }, [activeIndex, tools, half]);

  const width = 680;
  const height = 80;
  const cx = width / 2;
  const cy = height + 220;
  const r = cy - 20;
  const slot = (width - 80) / (VISIBLE - 1);

  /** Convert an offset (-half … +half) to { left%, top } along the arc */
  const arcPos = (offset: number, isActive: boolean) => {
    const x = cx + offset * slot;
    const dx = x - cx;
    const y = cy - Math.sqrt(r * r - dx * dx);
    const half2 = isActive
      ? (isMobile ? 18 : 24)
      : (isMobile ? 14 : 19);
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="relative flex-1 aspect-[680/80] overflow-visible">
        {/* Arc guide line */}
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full block" aria-hidden>
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
                  className="group absolute"
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
                        isActive ? `h-4 w-4 md:h-6 md:w-6 ${tool.accent}` : `h-3.5 w-3.5 md:h-4 md:w-4 ${tool.accent}`
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ToolsDock;