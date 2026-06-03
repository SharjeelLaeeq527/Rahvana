"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, Settings, Sparkles, User, Palette, Briefcase, Milestone, ShieldCheck, Activity } from "lucide-react";

export default function TestOptionD() {
  const [hoveredCard, setHoveredCard] = useState<"beginners" | "experienced" | null>(null);

  const journeyHref = "/visa-category/ir-category/ir1-journey";
  const toolsHref = "/tools";

  const beginnersJourneyRows = [
    {
      title: "Designed for those just starting their path.",
      sub: "Guided roadmap for new users.",
      icon: User,
      iconColor: "text-teal-600 bg-teal-50 border-teal-100",
    },
    {
      title: "Offers a structured, step-by-step guided roadmap.",
      sub: "Provides comprehensive instructional support.",
      icon: Compass,
      iconColor: "text-teal-600 bg-teal-50 border-teal-100",
    },
    {
      title: "Simple, milestone-driven path for peace of mind.",
      sub: "Ensures you never miss a step or visa requirement.",
      icon: Milestone,
      iconColor: "text-teal-600 bg-teal-50 border-teal-100",
    },
  ];

  const experiencedToolsRows = [
    {
      title: "Tailored for users with prior experience.",
      sub: "Focused tools for advanced users.",
      icon: ShieldCheck,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Provides independent, focused resources for efficiency.",
      sub: "Enables self-directed task execution.",
      icon: Settings,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "On-demand, single-focus tools for speed and control.",
      sub: "Skip the basics and execute tasks in any order.",
      icon: Activity,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  const matrixCategories = [
    "Target Audience",
    "Primary Support Style",
    "Guidance & Flow"
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5fdf9_50%,#ffffff_100%)] font-sans text-slate-800 flex flex-col justify-between py-6 px-6 sm:px-8 relative overflow-hidden">
      {/* Decorative radial highlights */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 16% 0%,rgba(13,115,119,0.06),transparent 35%)," +
            "radial-gradient(circle at 86% 14%,rgba(219,128,144,0.05),transparent 30%)",
        }}
      />

      {/* Top Navigation */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
        >
          <ArrowLeft size={14} />
          Back to Homepage
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0d7377] bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100/50">
          Design Concept Review · Option D
        </span>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mb-6">
          <h1 className="text-xl sm:text-3xl font-extrabold text-[#162126] tracking-tight leading-tight mb-2">
            How should I use Rahvana?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
            Review the side-by-step matrix below to compare our structured beginners path and the flexible advanced tools.
          </p>
        </div>

        {/* Matrix Comparison Layout */}
        <div className="w-full bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-100/40 relative">
          
          {/* Main Three-Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_1fr] gap-6 lg:gap-0 items-stretch w-full max-w-4xl mx-auto">
            
            {/* Left Card: Beginners Journey */}
            <motion.div
              className={`flex flex-col justify-between rounded-3xl border p-4 sm:p-5 transition-all duration-300 bg-white shadow-sm lg:rounded-r-none lg:border-r-0 ${
                hoveredCard === "beginners"
                  ? "border-teal-500 shadow-lg shadow-teal-500/5 -translate-y-0.5 z-10"
                  : "border-slate-200"
              }`}
              onMouseEnter={() => setHoveredCard("beginners")}
              onMouseLeave={() => setHoveredCard(null)}
              animate={hoveredCard === "experienced" ? { opacity: 0.6 } : { opacity: 1 }}
            >
              <div>
                {/* Header */}
                <div className="w-full bg-slate-900 text-teal-400 font-extrabold text-[11px] uppercase tracking-widest text-center py-2 px-3 rounded-lg mb-4">
                  Beginners Journey
                </div>

                {/* Rows */}
                <div className="flex flex-col gap-4 md:gap-6">
                  {beginnersJourneyRows.map((row, idx) => {
                    const Icon = row.icon;
                    return (
                      <div key={idx} className="flex gap-3 items-start text-left relative min-h-[52px]">
                        <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 border ${row.iconColor}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-teal-950 leading-tight">
                            {row.title}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal font-semibold">
                            {row.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={journeyHref}
                className="mt-4 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 text-white transition-all duration-200 no-underline"
              >
                Start Roadmap
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Middle Column: Vertical Axis Labels */}
            <div className="hidden lg:flex flex-col justify-between py-4 items-center shrink-0 bg-slate-50/50 border-y border-slate-200 relative z-20">
              {/* Top Spacing corresponding to headers */}
              <div className="h-[32px] flex items-center justify-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                VS
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-4 md:gap-6 w-full">
                {matrixCategories.map((cat, idx) => (
                  <div key={idx} className="h-[52px] flex items-center justify-center px-2">
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#0d7377] bg-white border border-teal-100 rounded-full px-3 py-1.5 shadow-sm text-center">
                      {cat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Spacing */}
              <div className="h-[28px]" />
            </div>

            {/* Right Card: Experienced Tools */}
            <motion.div
              className={`flex flex-col justify-between rounded-3xl border p-4 sm:p-5 transition-all duration-300 bg-white shadow-sm lg:rounded-l-none lg:border-l-0 ${
                hoveredCard === "experienced"
                  ? "border-indigo-500 shadow-lg shadow-indigo-500/5 -translate-y-0.5 z-10"
                  : "border-slate-200"
              }`}
              onMouseEnter={() => setHoveredCard("experienced")}
              onMouseLeave={() => setHoveredCard(null)}
              animate={hoveredCard === "beginners" ? { opacity: 0.6 } : { opacity: 1 }}
            >
              <div>
                {/* Header */}
                <div className="w-full bg-slate-900 text-orange-400 font-extrabold text-[11px] uppercase tracking-widest text-center py-2 px-3 rounded-lg mb-4">
                  Experienced Tools
                </div>

                {/* Rows */}
                <div className="flex flex-col gap-4 md:gap-6">
                  {experiencedToolsRows.map((row, idx) => {
                    const Icon = row.icon;
                    return (
                      <div key={idx} className="flex gap-3 items-start text-left relative min-h-[52px]">
                        <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 border ${row.iconColor}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-slate-950 leading-tight">
                            {row.title}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal font-semibold">
                            {row.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={toolsHref}
                className="mt-4 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-900 shadow-md shadow-slate-800/10 hover:shadow-lg hover:shadow-slate-800/20 text-white transition-all duration-200 no-underline"
              >
                Browse Resources
                <ArrowRight size={14} />
              </Link>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
