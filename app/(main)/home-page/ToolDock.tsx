import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
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
  },
];

const AUTOPLAY_MS = 8000;
const VISIBLE = 7; // odd number — active is centered

export function ToolsDock() {
  const [index, setIndex] = useState(0);
  const [iconInFront, setIconInFront] = useState(true);
  const active = tools[index];

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
    <section className="relative w-full overflow-hidden bg-slate-50/50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Eyebrow + headline */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
          Do it yourself
          </span>
          <h2 className="text-balance text-4xl font-medium leading-[1.1] tracking-tight text-zinc-900 md:text-5xl">
            Already know what you're doing?{" "}
            <span className="text-zinc-400">
              You just need the right tools.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-500">
            Tools, expert services, and country-specific guides — all in one place.
          </p>
        </div>

        {/* Stage */}
        <div className="relative mx-auto flex h-[440px] w-full max-w-3xl items-center justify-center">
          {/* Halo glow */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            animate={{
              background: `radial-gradient(circle, ${active.glow} 0%, rgba(255,255,255,0) 65%)`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Two overlapping cards — both always visible, swap front/back */}
          <div 
            className="relative h-[380px] w-[560px] max-w-full cursor-pointer"
            onClick={() => setIconInFront((f) => !f)}
          >
            {/* Icon card — full-bleed icon, no wasted space */}
            <motion.div
              animate={{
                x: iconInFront ? -110 : 90,
                y: iconInFront ? 10 : -10,
                rotate: iconInFront ? -5 : 4,
                scale: iconInFront ? 1 : 0.9,
                zIndex: iconInFront ? 20 : 10,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 18 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className={`relative flex h-[300px] w-[240px] flex-col overflow-hidden rounded-[28px] border border-black/[0.06] ${active.tint} shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]`}
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
                    className={`h-32 w-32 ${active.accent}`}
                    strokeWidth={1.4}
                  />
                </motion.div>
                {/* Label strip at bottom */}
                <div className="border-t border-black/5 bg-white/70 px-5 py-3 backdrop-blur-sm">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                    {active.tag}
                  </span>
                  <h3 className="mt-0.5 text-[15px] font-medium leading-tight tracking-tight text-zinc-900">
                    {active.name}
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* Scenario card — tight, animated text */}
            <motion.div
              animate={{
                x: iconInFront ? 110 : -90,
                y: iconInFront ? -10 : 10,
                rotate: iconInFront ? 4 : -5,
                scale: iconInFront ? 0.92 : 1,
                zIndex: iconInFront ? 10 : 20,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 18 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative flex h-[300px] w-[320px] flex-col justify-center rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.18)]">
                <motion.span
                  className="absolute left-7 top-6 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-zinc-50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active.accent.replace("text-", "bg-")}`} />
                  How you use it
                </motion.span>
                <motion.div
                  key={active.id + "-text"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <h4 className="text-pretty text-[22px] font-medium leading-snug tracking-tight text-zinc-900">
                    {active.scenario.title}
                  </h4>
                  <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">
                    {active.scenario.body}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Curved icon strip — windowed */}
        <CurvedDock
          tools={tools}
          activeIndex={index}
          onSelect={(i) => {
            setIndex(i);
            setIconInFront((f) => !f);
          }}
        />
      </div>
    </section>
  );
}

function CurvedDock({
  tools,
  activeIndex,
  onSelect,
}: {
  tools: Tool[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  // Windowed view: show only VISIBLE items, centered on active
  const visibleItems = useMemo(() => {
    const half = Math.floor(VISIBLE / 2);
    const out: { tool: Tool; idx: number; offset: number }[] = [];
    for (let o = -half; o <= half; o++) {
      const idx = (activeIndex + o + tools.length) % tools.length;
      out.push({ tool: tools[idx], idx, offset: o });
    }
    return out;
  }, [activeIndex, tools]);

  const width = 680;
  const height = 110;
  const cx = width / 2;
  const cy = height + 320;
  const r = cy - 25;
  const slot = (width - 80) / (VISIBLE - 1);

  const prev = () =>
    onSelect((activeIndex - 1 + tools.length) % tools.length);
  const next = () => onSelect((activeIndex + 1) % tools.length);

  return (
    <div className="mx-auto mt-10 flex w-full max-w-[820px] items-center gap-3">
      <button
        onClick={prev}
        aria-label="Previous"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="relative flex-1 overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-[110px] w-full"
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
        <div className="absolute inset-0">
          {visibleItems.map(({ tool, idx, offset }) => {
            const x = cx + offset * slot;
            const dx = x - cx;
            const y = cy - Math.sqrt(r * r - dx * dx);
            const isActive = idx === activeIndex;
            const dist = Math.abs(offset);
            const opacity = 1 - dist * 0.18;
            return (
              <motion.button
                key={`${tool.id}-${offset}`}
                layout
                onClick={() => onSelect(idx)}
                aria-label={tool.name}
                aria-pressed={isActive}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity,
                  scale: isActive ? 1.3 : 1 - dist * 0.06,
                  left: `calc(${(x / width) * 100}% - 22px)`,
                  top: `${y - 22}px`,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="group absolute"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.05] ${tool.tint} ${
                    isActive
                      ? "shadow-[0_14px_30px_-10px_rgba(0,0,0,0.28)]"
                      : ""
                  }`}
                >
                  <tool.Icon className={`h-5 w-5 ${tool.accent}`} />
                </div>
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {tool.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <button
        onClick={next}
        aria-label="Next"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ToolsDock;
