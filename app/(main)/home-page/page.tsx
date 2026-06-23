"use client";

import React, { useEffect, useRef, useState } from "react";
import { Caveat } from "next/font/google";
import * as Icons from "lucide-react";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});

// Scroll Reveal Component
function ScrollReveal({
  children,
  delayClass = "",
}: {
  children: React.ReactNode;
  delayClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div ref={ref} className={`reveal ${delayClass} ${visible ? "visible" : ""}`}>
      {children}
    </div>
  );
}

// Component to draw the dashed roadmap line
function RoadmapLine({
  type,
  color,
}: {
  type: "start" | "node" | "card" | "card-to-col6" | "end";
  color: "teal" | "amber" | "purple" | "rose" | "green";
}) {
  let path = "M 50,0 L 50,100";
  if (type === "start") {
    // Starts from leaf node (X=29, Y=30) and curves to bottom center-left (X=35, Y=100)
    path = "M 29,30 C 29,60 35,75 35,100";
  } else if (type === "node") {
    // Starts at X=35, curves into center node (50,50), exits left-ish to X=35 (consistent node-to-node S-curves)
    path = "M 35,0 C 35,20 50,30 50,50 C 50,70 35,80 35,100";
  } else if (type === "card") {
    // Starts at X=35, curves left to X=22 around the card, exits back to X=35
    path = "M 35,0 C 35,25 22,25 22,50 C 22,75 35,75 35,100";
  } else if (type === "card-to-col6") {
    // Starts at X=35, curves left to X=22 around card, exits right to X=57.14 to align with Section 17
    path = "M 35,0 C 35,25 22,25 22,50 C 22,75 57.14,75 57.14,100";
  } else if (type === "end") {
    // Enters center, curves into last node (50,50)
    path = "M 50,0 C 50,20 50,35 50,50";
  }

  const strokeColors = {
    teal: "#0d7377",
    amber: "#8a6200",
    purple: "#4a2d8a",
    rose: "#c0596a",
    green: "#15744f",
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden md:block"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path
        d={path}
        fill="none"
        stroke={strokeColors[color]}
        strokeWidth="2"
        strokeDasharray="4,4"
        vectorEffect="non-scaling-stroke"
        className="opacity-50"
      />
    </svg>
  );
}

// Annotation Label with hand-drawn arrow style
function Annotation({ text, direction = "left" }: { text: string; direction?: "left" | "right" }) {
  return (
    <div
      className={`absolute z-10 ${
        direction === "left"
          ? "left-[10%] md:left-[15%] top-[10%]"
          : "right-[10%] md:right-[15%] top-[15%]"
      } max-w-[160px] transform ${direction === "left" ? "-rotate-6" : "rotate-6"} pointer-events-none`}
    >
      <p
        className={`${caveat.className} text-slate-500 text-lg md:text-xl leading-tight font-medium`}
      >
        {text}
      </p>
      {direction === "left" ? (
        <svg
          className="w-10 h-10 text-slate-400/80 -mt-1 ml-6 rotate-[-25deg]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
          />
        </svg>
      ) : (
        <svg
          className="w-10 h-10 text-slate-400/80 -mt-1 mr-6 rotate-[75deg]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
          />
        </svg>
      )}
    </div>
  );
}

// Interactive pulsing Node Circle
function NodeCircle({
  icon: Icon,
  label,
  badgeNum,
  color,
}: {
  icon: React.ComponentType<any>;
  label?: string;
  badgeNum?: string;
  color: "teal" | "amber" | "purple" | "rose" | "green";
}) {
  const colorClasses = {
    teal: {
      bg: "bg-[#0d7377]",
      border: "border-[#0d7377]/20",
      badge: "bg-[#0d5053] text-white",
      glow: "shadow-[#0d7377]/10 hover:shadow-[#0d7377]/30",
    },
    amber: {
      bg: "bg-[#8a6200]",
      border: "border-[#8a6200]/20",
      badge: "bg-[#644700] text-white",
      glow: "shadow-[#8a6200]/10 hover:shadow-[#8a6200]/30",
    },
    purple: {
      bg: "bg-[#4a2d8a]",
      border: "border-[#4a2d8a]/20",
      badge: "bg-[#331c63] text-white",
      glow: "shadow-[#4a2d8a]/10 hover:shadow-[#4a2d8a]/30",
    },
    rose: {
      bg: "bg-[#c0596a]",
      border: "border-[#c0596a]/20",
      badge: "bg-[#8e3c4a] text-white",
      glow: "shadow-[#c0596a]/10 hover:shadow-[#c0596a]/30",
    },
    green: {
      bg: "bg-[#15744f]",
      border: "border-[#15744f]/20",
      badge: "bg-[#0e5136] text-white",
      glow: "shadow-[#15744f]/10 hover:shadow-[#15744f]/30",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center relative py-12 z-10">
      {/* Glow Rings */}
      {/* <div className="absolute w-24 h-24 rounded-full bg-slate-100 border border-dashed border-slate-200 flex items-center justify-center opacity-60 pointer-events-none scale-110" /> */}
      <div className="relative group flex items-center justify-center">
        <div
          className={`w-16 h-16 rounded-full ${colorClasses[color].bg} text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 cursor-pointer relative z-10`}
        >
          <Icon className="w-7 h-7" />
          {/* {badgeNum && (
            <span
              className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${colorClasses[color].badge} border-2 border-white`}
            >
              {badgeNum}
            </span>
          )} */}
        </div>
      </div>
      <div className="mt-3 text-center">
        <h4 className="font-bold text-slate-800 text-lg">{label}</h4>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pb-20 ${caveat.variable}`}>
      {/* Spacer for Hero Section to be designed later */}
      <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-linear-to-br from-teal-500/10 via-transparent to-amber-500/10 border-b border-slate-100">
        <div className="absolute inset-0 guide-grid-bg opacity-30 pointer-events-none" />
        <div className="text-center px-4 relative z-10 max-w-2xl">
          <h2 className="text-slate-400 text-xl font-medium mt-4">[Hero Section Placeholder]</h2>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 relative">
        {/* Continuous roadmap visual line on desktop starts at Section 2 */}

        {/* SECTION 1 */}
        <div className="py-16 md:py-24 flex items-center justify-center text-center relative">
          <ScrollReveal>
            <div className="max-w-xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4 leading-tight tracking-tight">
                Where do I even start?
              </h2>
              <p className="text-lg md:text-xl text-slate-500 max-w-md mx-auto leading-relaxed">
                If only someone could show me the right order.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* SECTION 2 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="start" color="teal" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Let&apos;s take it one step at a time.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Rahvana will guide you through your journey.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 relative h-48 flex items-center justify-center">
            <Annotation text="A clear path. No more guessing." direction="right" />
            {/* Small leaf starting node */}
            <div className="absolute top-[30%] md:left-[29%] right-[35%] md:right-auto transform md:-translate-x-1/2 z-10">
              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600"></div>
            </div>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="node" color="teal" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Everything starts with the petition.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                This is where your journey begins.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7">
            <ScrollReveal>
              <NodeCircle icon={Icons.FileText} label="Petition" badgeNum="1" color="teal" />
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="teal" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Wait... these forms look intimidating.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Long. Confusing. Full of questions I don&apos;t understand.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-1">
              {/* Confusing Forms Illustration Placeholder */}
              <div className="relative h-[300px] w-[500px] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm overflow-hidden group hover:border-teal-500/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="teal" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Rahvana breaks it down for you.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                One section at a time. Clear. Simple. Guided.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-2">
              {/* Wizard progress workflow illustration placeholder */}
              <div className="relative h-[300px] w-[500px] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm overflow-hidden group hover:border-[#0d7377]/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 6 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="node" color="teal" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                That wasn&apos;t so bad.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Petition submitted! One step down. Many more to go.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 relative">
            <ScrollReveal>
              <NodeCircle icon={Icons.Check} badgeNum="1" color="teal" />
              <Annotation text="Progress feels good. 💖" direction="left" />
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 7 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="node" color="amber" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                What&apos;s next?
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                The next important step is your documents.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7">
            <ScrollReveal>
              <NodeCircle icon={Icons.FolderOpen} label="Documents" badgeNum="2" color="amber" />
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 8 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="amber" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                So many documents... what if I miss something important?
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                I don&apos;t want to get delayed later.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-1">
              {/* Messy docs illustration mockup placeholder */}
              <div className="relative h-[300px] w-[500px] max-w-sm h-52 bg-white border border-slate-200 shadow-xl rounded-2xl p-5 overflow-hidden group hover:border-amber-500/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 9 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="amber" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Rahvana tells you exactly what you need.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Upload, review, and keep everything in one place.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-2">
              {/* Document checklist mockup placeholder */}
              <div className="bg-white h-[300px] w-[500px] border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-amber-500/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 10 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="node" color="amber" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Finally, I know I have everything.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                One less thing to worry about.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 relative">
            <ScrollReveal>
              <NodeCircle icon={Icons.FolderCheck} badgeNum="2" color="amber" />
              <Annotation text="This feels relieving. 💖" direction="right" />
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 11 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="node" color="purple" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Next up, the financial part.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Let&apos;s make sense of it.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7">
            <ScrollReveal>
              <NodeCircle icon={Icons.Calculator} label="Finance" badgeNum="3" color="purple" />
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 12 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="purple" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Do I qualify? What if I don&apos;t make enough?
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                The rules are confusing and everyone says something different.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-1">
              {/* Financial confusion visual mockup placeholder */}
              <div className="bg-white border h-[300px] w-[500px] border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-purple-500/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 13 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="purple" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Rahvana gives you a clear answer.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                We&apos;ll calculate it for your situation so you know where you stand.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-2">
              {/* Financial calculator visual placeholder */}
              <div className="bg-white border h-[300px] w-[500px] border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-purple-500/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 14 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="node" color="rose" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Almost there.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Now let&apos;s get you ready for the interview.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7">
            <ScrollReveal>
              <NodeCircle icon={Icons.Users} label="Interview" badgeNum="4" color="rose" />
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 15 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card" color="rose" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                The interview makes me nervous.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                What if they ask something I don&apos;t know? What if I forget everything?
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-1">
              {/* Interview anxiety scene placeholder */}
              <div className="bg-white h-[300px] w-[500px] border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-rose-500/20 transition-all duration-300 relative overflow-hidden"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 16 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px] ">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-5" />
            <div className="col-span-7 relative h-full">
              <RoadmapLine type="card-to-col6" color="rose" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-3 leading-tight">
                Rahvana helps you prepare with confidence.
              </h3>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                Practice, get feedback, and walk in ready.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-7 flex justify-center">
            <ScrollReveal delayClass="reveal-delay-2">
              {/* Interview prep helper mockup placeholder */}
              <div className="bg-white h-[300px] w-[500px] border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-rose-500/20 transition-all duration-300"></div>
            </ScrollReveal>
          </div>
        </div>

        {/* SECTION 17 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
          <div className="absolute inset-0 grid grid-cols-12 gap-8 pointer-events-none z-0 hidden md:grid">
            <div className="col-span-6" />
            <div className="col-span-6 relative h-full">
              <RoadmapLine type="end" color="green" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 md:pr-6">
            <ScrollReveal>
              <h3 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 mt-1 mb-4 leading-tight">
                Navigate your spouse visa journey with clarity and confidence
              </h3>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
                Whether you&apos;re completing your application, gathering documents, preparing for
                an interview, or moving to the next step, Rahvana helps you understand where you
                are, what to do and what comes next.
              </p>
            </ScrollReveal>
          </div>
          <div className="col-span-12 md:col-span-6 relative">
            <ScrollReveal>
              <NodeCircle
                icon={Icons.ThumbsUp}
                label="Welcome to the USA!"
                badgeNum="5"
                color="green"
              />
              <Annotation text="Reunited at last!" direction="left" />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
