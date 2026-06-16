"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Wrench, Sparkles } from "lucide-react";

export default function TestOptionF() {
  const [hoveredCard, setHoveredCard] = useState<"beginners" | "experienced" | null>(null);

  const journeyHref = "/visa-category/ir-category/ir1-journey";
  const toolsHref = "/tools";

  const matrixCategories = [
    "Target Audience",
    "Primary Support Style",
    "Guidance & Flow"
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col justify-between py-6 px-6 relative overflow-hidden">
      {/* Decorative radial highlights */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
        aria-hidden="true"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(224,90,54,0.03), transparent 50%)",
        }}
      />

      {/* Top Navigation */}
      {/* <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
        >
          <ArrowLeft size={12} />
          Back to Homepage
        </Link>
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#e05a36] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
          Option D · Comparative Matrix
        </span>
      </div> */}

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-5xl mt-5 mx-auto flex-1 flex flex-col items-center justify-center">
        
        {/* Title matching the image exactly */}
        <h1 className="text-xl sm:text-2xl font-black text-[#2a2d32] tracking-tight leading-tight mb-4 text-center">
          How should I use Rahvana?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-medium mb-8 text-center">
            Select the support style that matches your visa experience. Follow our step-by-step roadmap or access advanced tools directly.
          </p>

        {/* Matrix Container */}
        <div className="w-full max-w-4xl mx-auto py-2">
          
          {/* Main Three-Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px_1fr] gap-6 lg:gap-0 items-center justify-center">
            
            {/* Left Card: Beginners Journey */}
            <Link href={journeyHref} className="no-underline">
              <motion.div
                className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300 ${
                  hoveredCard === "beginners"
                    ? "border-orange-500/55 shadow-md -translate-y-0.5"
                    : "hover:border-slate-300"
                }`}
                onMouseEnter={() => setHoveredCard("beginners")}
                onMouseLeave={() => setHoveredCard(null)}
                animate={hoveredCard === "experienced" ? { opacity: 0.5 } : { opacity: 1 }}
              >
                {/* Dark Gray Header */}
                <div className="bg-[#2b2d30] text-center py-3.5 px-4">
                  <h3 className="text-sm font-black text-[#e05a36] uppercase tracking-wider m-0">
                    Beginners Journey
                  </h3>
                </div>

                {/* Card Content Row */}
                <div className="grid grid-cols-[1fr_48px] items-stretch min-h-[220px]">
                  
                  {/* Left Column: Text Rows (Right-Aligned) */}
                  <div className="flex flex-col justify-between py-4 pr-3.5 pl-5 text-right gap-4">
                    
                    {/* Row 1 */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-black text-[#e05a36] leading-tight m-0">
                        Designed for those just starting their path.
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold m-0">
                        Guided roadmap for new users.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-black text-[#e05a36] leading-tight m-0">
                        Offers a structured, step-by-step guided roadmap.
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold m-0">
                        Provides comprehensive instructional support.
                      </p>
                    </div>

                    {/* Row 3 */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-black text-[#e05a36] leading-tight m-0">
                        Simple, milestone-driven path for peace of mind.
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold m-0">
                        Ensures you never miss a step or visa requirement.
                      </p>
                    </div>

                  </div>

                  {/* Right Column: Dark Vertical Bar with White Icons */}
                  <div className="bg-[#2b2d30] flex flex-col justify-between items-center py-4 text-white shrink-0">
                    
                    {/* Icon 1: Route Node */}
                    <div className="flex items-center justify-center h-[54px]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="6" height="6" rx="1" />
                        <rect x="15" y="15" width="6" height="6" rx="1" />
                        <path d="M9 6h6v9" />
                      </svg>
                    </div>

                    {/* Icon 2: Bonsai/Leaf Outline */}
                    <div className="flex items-center justify-center h-[54px]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22v-8M12 14c-2-1.5-4-1-4 1s2 2.5 4 1.5M12 12c2.5-1.5 4.5-1 4.5 1s-2 2.5-4.5 1.5" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>

                    {/* Icon 3: Dotted Flow path */}
                    <div className="flex items-center justify-center h-[54px]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3">
                        <path d="M6 4v8c0 2 2 4 4 4h4" strokeDasharray="none" />
                        <path d="M14 12l4 4-4 4" strokeDasharray="none" />
                      </svg>
                    </div>

                  </div>

                </div>

              </motion.div>
            </Link>

            {/* Middle Column: Floating Categories (Desktop only, hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-between py-6 items-center shrink-0 min-h-[220px] select-none">
              
              {/* Category 1 */}
              <div className="h-[54px] flex items-center justify-center">
                <span className="text-[11px] font-black text-[#e05a36] uppercase tracking-wider text-center">
                  Target Audience
                </span>
              </div>

              {/* Category 2 */}
              <div className="h-[54px] flex items-center justify-center">
                <span className="text-[11px] font-black text-[#e05a36] uppercase tracking-wider text-center">
                  Primary Support Style
                </span>
              </div>

              {/* Category 3 */}
              <div className="h-[54px] flex items-center justify-center">
                <span className="text-[11px] font-black text-[#e05a36] uppercase tracking-wider text-center">
                  Visual and UI Theme
                </span>
              </div>

            </div>

            {/* Right Card: Experienced Tools */}
            <Link href={toolsHref} className="no-underline">
              <motion.div
                className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300 ${
                  hoveredCard === "experienced"
                    ? "border-orange-500/55 shadow-md -translate-y-0.5"
                    : "hover:border-slate-300"
                }`}
                onMouseEnter={() => setHoveredCard("experienced")}
                onMouseLeave={() => setHoveredCard(null)}
                animate={hoveredCard === "beginners" ? { opacity: 0.5 } : { opacity: 1 }}
              >
                {/* Dark Gray Header */}
                <div className="bg-[#2b2d30] text-center py-3.5 px-4">
                  <h3 className="text-sm font-black text-[#e05a36] uppercase tracking-wider m-0">
                    Experienced Tools
                  </h3>
                </div>

                {/* Card Content Row */}
                <div className="grid grid-cols-[48px_1fr] items-stretch min-h-[220px]">
                  
                  {/* Left Column: Dark Vertical Bar with White Icons */}
                  <div className="bg-[#2b2d30] flex flex-col justify-between items-center py-4 text-white shrink-0">
                    
                    {/* Icon 1: Tools key */}
                    <div className="flex items-center justify-center h-[54px]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="18" cy="6" r="3" />
                        <path d="M9 8l6 8M15 8L9 16" />
                      </svg>
                    </div>

                    {/* Icon 2: Diamond Gem */}
                    <div className="flex items-center justify-center h-[54px]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12l3 5-9 13-9-13z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </div>

                    {/* Icon 3: Keys / tool picks */}
                    <div className="flex items-center justify-center h-[54px]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 3v18M12 3v18M19 3v18M5 7h4M12 11h4M19 15h4" />
                      </svg>
                    </div>

                  </div>

                  {/* Right Column: Text Rows (Left-Aligned) */}
                  <div className="flex flex-col justify-between py-4 pl-3.5 pr-5 text-left gap-4">
                    
                    {/* Row 1 */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-black text-[#e05a36] leading-tight m-0">
                        Tailored for users with prior experience.
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold m-0">
                        Focused tools for advanced users.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-black text-[#e05a36] leading-tight m-0">
                        Provides independent, focused resources for efficiency.
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold m-0">
                        Enables self-directed task execution.
                      </p>
                    </div>

                    {/* Row 3 */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[11.5px] font-black text-[#e05a36] leading-tight m-0">
                        On-demand, single-focus tools for speed and control.
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold m-0">
                        Skip the basics and execute tasks in any order.
                      </p>
                    </div>

                  </div>

                </div>

              </motion.div>
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}
