"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, ChevronRight, LayoutGrid, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TwoWaysVisual } from "../../components/home-page/Components";

export const journeyHref = "/visa-category/ir-category/ir1-journey";
export const toolsHref = "/resources";

type TwoWaysIndex = 0 | 1;

// Scale helper to fit the 680x560 scene in the card width dynamically
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
    <div ref={wrapRef} className="w-full relative overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center" style={{ height: Math.max(160, Math.round(340 * scale)) }}>
      <div
        className="origin-top-left shrink-0"
        style={{
          width: 680,
          height: 560,
          transform: `scale(${scale * 0.88}) translate(${(el => el ? (el.offsetWidth - 680 * scale * 0.88) / 2 : 0)()}px, 10px)`,
          transformOrigin: "top left",
        }}
      >
        <TwoWaysVisual index={index} />
      </div>
    </div>
  );
}

export default function TestOptionAPage() {
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
          <button
            type="button"
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-teal-950 shadow-sm flex items-center gap-1.5"
          >
            <LayoutGrid size={13} className="text-teal-600" />
            Option A: Cards
          </button>
          <Link
            href="/test-option-b"
            className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1.5 no-underline"
          >
            <Layers size={13} />
            Option B: Split View
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 md:px-8">
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-teal-600 mb-3">
            Two Ways to Move Forward
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Choose how you want to use Rahvana
          </h1>
          <p className="text-[15px] md:text-base text-slate-500 leading-relaxed font-medium">
            Whether you want end-to-end guided visa navigation or focused access to individual forms and tools, select the path that matches what you need today.
          </p>
        </div>

        {/* 2-Card Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Card 1: Guided Visa Journey */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-teal-100/80 bg-gradient-to-b from-teal-50/20 via-white to-white p-6 sm:p-8 shadow-sm hover:shadow-[0_24px_50px_rgba(13,115,119,0.06)] hover:border-teal-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col gap-6">
              
              {/* Badge & Title */}
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-teal-700 bg-teal-100/60 w-fit">
                  <Sparkles size={10} />
                  Recommended for Beginners
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  Guided Visa Journey
                </h3>
                <p className="text-xs font-semibold tracking-wide text-teal-600">
                  Ideal for first-time applicants • Step-by-step roadmap
                </p>
              </div>

              {/* Animated Live Visual wrapper */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-teal-50 bg-white/80 p-2 shadow-inner">
                <ResponsiveVisual index={0} />
              </div>

              {/* Best for box */}
              <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3.5 border border-teal-100 bg-teal-50/30 text-teal-950">
                <span className="font-extrabold text-sm text-teal-600 mt-0.5">•</span>
                <p className="text-[12px] leading-relaxed font-semibold">
                  <strong>Best for:</strong> Beginners wanting a clear, stress-free step-by-step plan.
                </p>
              </div>

              {/* Highlights */}
              <div className="flex flex-col gap-2.5 mt-2">
                {[
                  "Complete step-by-step path with chapters and visual progress",
                  "Built-in warnings, timelines, and checklist tracking",
                  "Autoform filler guides you contextually through required forms",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-[13px] text-slate-600 font-medium leading-normal">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={journeyHref}
              className="mt-8 inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl text-[14px] font-black text-white bg-teal-600 hover:bg-teal-700 shadow-[0_8px_20px_rgba(13,115,119,0.2)] hover:shadow-[0_12px_28px_rgba(13,115,119,0.35)] transition-all duration-200 no-underline"
            >
              Start the Roadmap
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Card 2: Tools & Resources */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50/20 via-white to-white p-6 sm:p-8 shadow-sm hover:shadow-[0_24px_50px_rgba(15,23,42,0.06)] hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col gap-6">
              
              {/* Badge & Title */}
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/60 w-fit">
                  <Layers size={10} />
                  For Targeted Help
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  Tools & Resources
                </h3>
                <p className="text-xs font-semibold tracking-wide text-indigo-600">
                  For experienced users • Direct access to features
                </p>
              </div>

              {/* Animated Live Visual wrapper */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 bg-white/80 p-2 shadow-inner">
                <ResponsiveVisual index={1} />
              </div>

              {/* Best for box */}
              <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3.5 border border-indigo-100/60 bg-indigo-50/10 text-slate-950">
                <span className="font-extrabold text-sm text-indigo-600 mt-0.5">•</span>
                <p className="text-[12px] leading-relaxed font-semibold">
                  <strong>Best for:</strong> Anyone wanting immediate, targeted help with a specific task.
                </p>
              </div>

              {/* Highlights */}
              <div className="flex flex-col gap-2.5 mt-2">
                {[
                  "Direct access to I-130 Autoform, visa fee calculators, and timelines",
                  "Verify and prepare required paperwork with structured checklists",
                  "Use tools independently or alongside the roadmap at your own pace",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-[13px] text-slate-600 font-medium leading-normal">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={toolsHref}
              className="mt-8 inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl text-[14px] font-black text-white bg-slate-800 hover:bg-slate-900 shadow-[0_8px_20px_rgba(30,41,59,0.12)] hover:shadow-[0_12px_28px_rgba(30,41,59,0.25)] transition-all duration-200 no-underline"
            >
              Browse Resources
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
