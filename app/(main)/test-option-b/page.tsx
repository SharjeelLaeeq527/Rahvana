"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, LayoutGrid, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TwoWaysVisual } from "../../components/home-page/Components";

export const journeyHref = "/visa-category/ir-category/ir1-journey";
export const toolsHref = "/resources";

type TwoWaysIndex = 0 | 1;

// Overhauled, structured paths data with high-converting details directly accessible
const updatedWaysPaths = [
  {
    title: "Guided Visa Journey",
    eyebrow: "01 - GUIDED ROADMAP",
    shortTitle: "Follow the guided step-by-step IR-1 roadmap",
    teaser: "Ideal for first-time applicants wanting a structured, guided roadmap.",
    bestFor: "Beginners who want an end-to-end plan to navigate the visa process without stress.",
    bestForColor: "text-teal-700 bg-teal-50 border-teal-100/60",
    themeColor: "#0d7377",
    hoverBg: "#f4fbfa",
    bulletColor: "text-teal-600",
    bullets: [
      "Move step-by-step through the IR-1 process with clear, trackable chapters.",
      "Stay ahead with built-in requirements, checklists, and deadline alerts.",
    ],
    cta: "Start the Roadmap",
    href: journeyHref,
  },
  {
    title: "Tools & Resources",
    eyebrow: "02 - DIRECT ACCESS",
    shortTitle: "Jump directly into focused tools and resources",
    teaser: "For experienced users wanting immediate help with a specific task.",
    bestFor: "Applicants who already know the IR-1 process well and need targeted help.",
    bestForColor: "text-indigo-700 bg-indigo-50/40 border-indigo-100/60",
    themeColor: "#1e293b",
    hoverBg: "#f8fafc",
    bulletColor: "text-indigo-600",
    bullets: [
      "Launch directly I-130 Autoform, sponsorship fee calculator, and other tools.",
      "Use tools independently at your own pace alongside your manual progress.",
    ],
    cta: "Browse Resources",
    href: toolsHref,
  },
] as const;

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

  // The Roadmap visual is 560px high; the Tools visual is 460px high.
  // Using dynamic heights and clipping the empty space solves the layout gap.
  const visualHeight = index === 0 ? 560 : 460;

  return (
    <div 
      ref={wrapRef} 
      className="w-full overflow-hidden" 
      style={{ height: Math.round(visualHeight * scale) }}
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

export default function TestOptionBPage() {
  const [activeIndex, setActiveIndex] = useState<TwoWaysIndex>(0);

  const activePath = updatedWaysPaths[activeIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fbfb] via-white to-[#f4f8f8] pb-24 pt-28 font-sans">
      {/* Floating Comparison Banner */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-white/80 backdrop-blur-md border border-teal-100 rounded-full px-5 py-3 shadow-[0_12px_30px_rgba(13,115,119,0.08)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
            Design Preview
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full">
          <Link
            href="/test-option-a"
            className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1.5 no-underline"
          >
            <LayoutGrid size={13} />
            Option A: Cards
          </Link>
          <button
            type="button"
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-teal-950 shadow-sm flex items-center gap-1.5"
          >
            <Layers size={13} className="text-teal-600" />
            Option B: Split View
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1300px] px-6 md:px-12">
        {/* 2-Column Split-View Grid - Styled to match the original 380px/1fr layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12 lg:gap-16 xl:gap-24 items-start">
          
          {/* Left Column: Headings, Selectors, and CTAs */}
          <div className="flex flex-col">
            
            {/* Header Block */}
            <div className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d7377] mb-2">
                Two Ways to Move Forward
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#162126] tracking-tight leading-[1.08] mb-4">
                Choose how you want to use Rahvana
              </h1>
              <p className="text-[14px] text-[#4a5c62] leading-relaxed font-medium">
                Follow the guided IR-1 roadmap, use focused tools and resources independently, and choose the support style that fits what you need right now.
              </p>
            </div>
            
            {/* Options Selector Container */}
            <div className="flex flex-col gap-3">
              {updatedWaysPaths.map((path, i) => {
                const isActive = activeIndex === i;
                const isJourney = i === 0;
                
                return (
                  <button
                    key={path.title}
                    type="button"
                    onClick={() => setActiveIndex(i as TwoWaysIndex)}
                    aria-current={isActive ? "true" : undefined}
                    className={`group flex w-full flex-col text-left p-4.5 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? isJourney
                          ? "border-teal-500 bg-teal-50/40 shadow-[0_8px_20px_rgba(13,115,119,0.06)]"
                          : "border-slate-800 bg-slate-50 shadow-[0_8px_20px_rgba(30,41,59,0.05)]"
                        : "border-slate-200 bg-transparent hover:border-slate-300"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Top Row: Eyebrow + Pill */}
                    <div className="flex items-center justify-between gap-3 w-full mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? "text-teal-600" : "text-slate-400"}`}>
                        {path.eyebrow}
                      </span>
                      <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                        isActive
                          ? isJourney
                            ? "bg-teal-100 text-teal-800 border-teal-200"
                            : "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {isJourney ? "Beginners" : "Experienced"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-base font-black transition-colors ${
                      isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-950"
                    }`}>
                      {path.title}
                    </h3>

                    {/* Subtitle / Teaser */}
                    <p className={`text-xs mt-1 leading-relaxed transition-colors ${
                      isActive ? "text-slate-600" : "text-slate-400 group-hover:text-slate-500"
                    }`}>
                      {path.teaser}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Context-Aware Primary CTA Button */}
            <div className="border-t border-slate-100 pt-5 mt-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.18 }}
                >
                  <Link
                    href={activePath.href}
                    className={`inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl text-[14px] font-black text-white shadow-md transition-all duration-200 no-underline ${
                      activeIndex === 0
                        ? "bg-teal-600 hover:bg-teal-700 shadow-[0_8px_20px_rgba(13,115,119,0.18)]"
                        : "bg-slate-800 hover:bg-slate-950 shadow-[0_8px_20px_rgba(30,41,59,0.12)]"
                    }`}
                  >
                    {activePath.cta}
                    <ArrowRight size={15} />
                  </Link>
                  <p className="text-center text-[11px] text-slate-400 mt-3 font-semibold">
                    Not sure yet? Choose an option to compare details.
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* Right Column: Dynamic Visual & Bullet Benefits */}
          <div className="flex flex-col gap-6 w-full min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeIndex}
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                
                {/* Descriptive content header */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">
                    {activePath.eyebrow} DETAILS
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                    {activePath.shortTitle}
                  </h2>
                </div>

                {/* Best for box */}
                <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 border text-slate-900 ${activePath.bestForColor}`}>
                  <span className="font-extrabold text-sm text-teal-600 mt-0.5">•</span>
                  <p className="text-[11px] leading-relaxed font-semibold">
                    <strong>Best for:</strong> {activePath.bestFor}
                  </p>
                </div>

                {/* Live Visual Scene - Placed high up to be visible without scrolling */}
                <ResponsiveVisual index={activeIndex} />

                {/* Bullet Features list - Shifted below the visual section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 mt-2">
                  {activePath.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
                      <CheckCircle2 size={16} className={`${activePath.bulletColor} shrink-0`} />
                      <p className="text-[12px] leading-relaxed text-slate-500 font-semibold">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
