"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Wrench, Sparkles } from "lucide-react";

export default function TestOptionE() {
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);

  const journeyHref = "/visa-category/ir-category/ir1-journey";
  const toolsHref = "/tools";

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
      {/* <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
        >
          <ArrowLeft size={12} />
          Back to Homepage
        </Link>
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#e05a36] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
          Option C · Arrow Split Choice
        </span>
      </div> */}

      {/* Main Content Card */}
      <div className="relative z-10 mt-5 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center">
        
        {/* Title matching the image exactly */}
        <h1 className="text-xl sm:text-2xl font-black text-[#2a2d32] tracking-tight leading-tight mb-4 text-center">
          How should I use Rahvana?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-medium mb-6 text-center">
            Select the support style that matches your visa experience. Follow our step-by-step roadmap or access advanced tools directly.
          </p>

        {/* Content Row: Left Text - Center SVG - Right Text */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_320px_1fr] gap-6 md:gap-4 items-center justify-center py-2 max-w-3xl">
          
          {/* Left Option: Follow IR-1 Roadmap */}
          <Link
            href={journeyHref}
            className="no-underline group md:translate-y-[26px]"
            onMouseEnter={() => setHoveredSide("left")}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <motion.div
              className="text-center md:text-right flex flex-col md:items-end justify-center transition-all duration-300"
              animate={hoveredSide === "right" ? { opacity: 0.4, scale: 0.98 } : { opacity: 1, scale: 1 }}
            >
              <h2 className="text-base sm:text-lg font-black text-[#e05a36] leading-snug mb-1 transition-colors group-hover:text-orange-600">
                Follow IR-1 Roadmap
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold max-w-[210px] md:ml-auto">
                Ideal for beginners seeking structured guidance and support.
              </p>
            </motion.div>
          </Link>

          {/* Center Graphic: Symmetrical Split Curved Arrows */}
          <div className="relative flex justify-center items-center w-[320px] h-[160px] mx-auto select-none">
            
            <svg
              width="320"
              height="160"
              viewBox="0 0 320 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_4px_10px_rgba(22,33,38,0.04)]"
            >
              {/* Left Arrow Path: curve down-left, thick stem split from top center */}
              <motion.path
                d="M 155, 15 L 155, 45 C 155, 95, 120, 125, 50, 125 L 50, 140 L 15, 110 L 50, 80 L 50, 95 C 95, 95, 115, 75, 115, 45 L 115, 15 Z"
                fill={hoveredSide === "left" ? "#e05a36" : "#2b2d30"}
                className="transition-colors duration-300 cursor-pointer"
                whileHover={{ scale: 1.015 }}
                onClick={() => window.location.href = journeyHref}
                onMouseEnter={() => setHoveredSide("left")}
                onMouseLeave={() => setHoveredSide(null)}
              />
              
              {/* Right Arrow Path: curve down-right, mirrored exactly around x=160 */}
              <motion.path
                d="M 165, 15 L 165, 45 C 165, 95, 200, 125, 270, 125 L 270, 140 L 305, 110 L 270, 80 L 270, 95 C 225, 95, 205, 75, 205, 45 L 205, 15 Z"
                fill={hoveredSide === "right" ? "#e05a36" : "#2b2d30"}
                className="transition-colors duration-300 cursor-pointer"
                whileHover={{ scale: 1.015 }}
                onClick={() => window.location.href = toolsHref}
                onMouseEnter={() => setHoveredSide("right")}
                onMouseLeave={() => setHoveredSide(null)}
              />
            </svg>

            {/* Icon inside Left Arrow Curve */}
            <div 
              className={`absolute left-[54px] top-[94px] flex items-center justify-center w-8 h-8 rounded-full pointer-events-none transition-all duration-300 ${
                hoveredSide === "left" ? "scale-110" : ""
              } text-white`}
            >
              <Compass size={16} className={hoveredSide === "left" ? "animate-spin-slow" : ""} />
            </div>

            {/* Icon inside Right Arrow Curve */}
            <div 
              className={`absolute right-[54px] top-[94px] flex items-center justify-center w-8 h-8 rounded-full pointer-events-none transition-all duration-300 ${
                hoveredSide === "right" ? "scale-110" : ""
              } text-white`}
            >
              <Wrench size={16} />
            </div>

          </div>

          {/* Right Option: Use Independent Tools */}
          <Link
            href={toolsHref}
            className="no-underline group md:translate-y-[26px]"
            onMouseEnter={() => setHoveredSide("right")}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <motion.div
              className="text-center md:text-left flex flex-col md:items-start justify-center transition-all duration-300"
              animate={hoveredSide === "left" ? { opacity: 0.4, scale: 0.98 } : { opacity: 1, scale: 1 }}
            >
              <h2 className="text-base sm:text-lg font-black text-[#e05a36] leading-snug mb-1 transition-colors group-hover:text-orange-600">
                Use Independent Tools
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold max-w-[210px] md:mr-auto">
                Suitable for experienced users who prefer flexibility and self-direction.
              </p>
            </motion.div>
          </Link>

        </div>

      </div>
    </div>
  );
}
