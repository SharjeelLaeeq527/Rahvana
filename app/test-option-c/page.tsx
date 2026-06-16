"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, PenTool, Milestone, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export default function TestOptionC() {
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);
  const [roadmapImageIdx, setRoadmapImageIdx] = useState(0);
  const [toolsImageIdx, setToolsImageIdx] = useState(0);

  const journeyHref = "/visa-category/ir-category/ir1-journey";
  const toolsHref = "/tools";

  const roadmapImages = [
    "/assets/images/guided_roadmap_image.png",
    "/assets/images/guided_roadmap_image2.png"
  ];
  const toolsImages = [
    "/assets/images/tool_icons_image.png",
    "/assets/images/tool_icons_image2.png"
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
      {/* <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
        >
          <ArrowLeft size={14} />
          Back to Homepage
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0d7377] bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100/50">
          Design Concept Review · Option C
        </span>
      </div> */}

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-start pt-9">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mb-6">
          <h1 className="text-xl sm:text-3xl font-extrabold text-[#162126] tracking-tight leading-tight mb-2">
            How should I use Rahvana?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
            Select the support style that matches your visa experience. Follow our step-by-step roadmap or access advanced tools directly.
          </p>
        </div>

        {/* Arrow Split Layout */}
        <div className="w-full bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 sm:px-8 sm:py-6 lg:px-10 shadow-xl shadow-slate-100/40 flex flex-col items-center justify-center relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-center w-full max-w-4xl">
            
            {/* Left Side Option: Follow Roadmap */}
            <motion.div
              className={`flex flex-col items-center text-center lg:items-end lg:text-right transition-all duration-300 p-4 rounded-2xl border ${
                hoveredSide === "left"
                  ? "border-teal-500/30 bg-teal-50/20 shadow-md shadow-teal-500/5"
                  : "border-transparent bg-transparent"
              }`}
              onMouseEnter={() => setHoveredSide("left")}
              onMouseLeave={() => setHoveredSide(null)}
              animate={hoveredSide === "right" ? { opacity: 0.5, scale: 0.98 } : { opacity: 1, scale: 1 }}
            >
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0d7377] mb-1.5 px-2 py-0.5 bg-teal-50 border border-teal-100 rounded-full">
                Beginners
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-2">
                Follow IR-1 Roadmap
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-[280px]">
                Ideal for beginners seeking structured, step-by-step guidance and progress tracking.
              </p>
              <Link
                href={journeyHref}
                className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 text-white transition-all duration-200 no-underline mb-5"
              >
                Start Roadmap
                <ArrowRight size={14} />
              </Link>

              {/* Image Preview Block with Cycle controls */}
              <div className="w-full max-w-[280px] flex flex-col items-center lg:items-end">
                <div className="relative w-full aspect-video flex items-center justify-center">
                  <img
                    src={roadmapImages[roadmapImageIdx]}
                    alt="Guided Roadmap Preview"
                    className="w-full h-full object-contain transition-all duration-300"
                  />
                </div>
                {/* Control Arrows Bar */}
                <div className="flex items-center justify-between w-full mt-2 px-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setRoadmapImageIdx((prev) => (prev === 0 ? roadmapImages.length - 1 : prev - 1));
                    }}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-teal-800 border border-slate-200 transition-all flex items-center justify-center"
                    title="Previous Image"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    Roadmap Variant {roadmapImageIdx + 1}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setRoadmapImageIdx((prev) => (prev === roadmapImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-teal-800 border border-slate-200 transition-all flex items-center justify-center"
                    title="Next Image"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Center Split Signpost Graphic */}
            <div className="relative flex justify-center items-center w-full max-w-[320px] lg:max-w-none mx-auto py-2 h-[180px]">
              
              {/* Vertical Pole */}
              <div className="absolute top-0 bottom-0 w-2.5 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 border-x border-slate-400/20 rounded-full left-1/2 -translate-x-1/2 z-0" />
              
              {/* Signpost Stack */}
              <div className="relative flex flex-col justify-between items-center w-[250px] h-full z-10 py-1">
                
                {/* Top Arrow: Points Left (Roadmap) */}
                <motion.div
                  className="relative w-[230px] h-[52px] cursor-pointer drop-shadow-md select-none"
                  onClick={() => window.location.href = journeyHref}
                  onMouseEnter={() => setHoveredSide("left")}
                  onMouseLeave={() => setHoveredSide(null)}
                  animate={
                    hoveredSide === "left"
                      ? { x: -8, scale: 1.02 }
                      : hoveredSide === "right"
                      ? { x: 4, scale: 0.98, opacity: 0.6 }
                      : { x: 0, scale: 1, opacity: 1 }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="tealArrowGradC" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0d7377" />
                        <stop offset="100%" stopColor="#14a0a6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 40,4 L 228,4 A 4,4 0 0 1 232,8 L 232,40 A 4,4 0 0 1 228,44 L 40,44 L 16,24 Z"
                      fill={hoveredSide === "left" ? "url(#tealArrowGradC)" : "#f0faf9"}
                      stroke={hoveredSide === "left" ? "#0d7377" : "#b2dedb"}
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center pl-7 pr-3 gap-2">
                    <Compass 
                      size={16} 
                      className={`transition-colors duration-300 ${
                        hoveredSide === "left" ? "text-white animate-spin-slow" : "text-[#0d7377]"
                      }`} 
                    />
                    <span 
                      className={`text-[12px] font-black tracking-widest transition-colors duration-300 ${
                        hoveredSide === "left" ? "text-white" : "text-[#0d7377]"
                      }`}
                    >
                      ROADMAP
                    </span>
                  </div>
                </motion.div>

                {/* Bottom Arrow: Points Right (Tools) */}
                <motion.div
                  className="relative w-[230px] h-[52px] cursor-pointer drop-shadow-md select-none"
                  onClick={() => window.location.href = toolsHref}
                  onMouseEnter={() => setHoveredSide("right")}
                  onMouseLeave={() => setHoveredSide(null)}
                  animate={
                    hoveredSide === "right"
                      ? { x: 8, scale: 1.02 }
                      : hoveredSide === "left"
                      ? { x: -4, scale: 0.98, opacity: 0.6 }
                      : { x: 0, scale: 1, opacity: 1 }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="orangeArrowGradC" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#b5451b" />
                        <stop offset="100%" stopColor="#d96b43" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 200,4 L 12,4 A 4,4 0 0 0 8,8 L 8,40 A 4,4 0 0 0 12,44 L 200,44 L 224,24 Z"
                      fill={hoveredSide === "right" ? "url(#orangeArrowGradC)" : "#fdf6f3"}
                      stroke={hoveredSide === "right" ? "#b5451b" : "#f5d5c9"}
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center pl-3 pr-7 gap-2">
                    <span 
                      className={`text-[12px] font-black tracking-widest transition-colors duration-300 ${
                        hoveredSide === "right" ? "text-white" : "text-[#b5451b]"
                      }`}
                    >
                      TOOLS
                    </span>
                    <PenTool 
                      size={16} 
                      className={`transition-colors duration-300 ${
                        hoveredSide === "right" ? "text-white" : "text-[#b5451b]"
                      }`} 
                    />
                  </div>
                </motion.div>

              </div>

              {/* Symmetrical OR Center Badge */}
              <div 
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 shadow-md transition-all duration-300 pointer-events-none select-none ${
                  hoveredSide === "left" 
                    ? "border-[#0d7377] scale-110 shadow-teal-500/10" 
                    : hoveredSide === "right" 
                    ? "border-[#b5451b] scale-110 shadow-orange-500/10" 
                    : "border-slate-200"
                }`}
              >
                <span 
                  className={`text-[11px] font-extrabold tracking-wider transition-colors duration-300 ${
                    hoveredSide === "left" 
                      ? "text-[#0d7377]" 
                      : hoveredSide === "right" 
                      ? "text-[#b5451b]" 
                      : "text-slate-400"
                  }`}
                >
                  OR
                </span>
              </div>

            </div>

            {/* Right Side Option: Use Tools */}
            <motion.div
              className={`flex flex-col items-center text-center lg:items-start lg:text-left transition-all duration-300 p-4 rounded-2xl border ${
                hoveredSide === "right"
                  ? "border-orange-500/30 bg-orange-50/10 shadow-md shadow-orange-500/5"
                  : "border-transparent bg-transparent"
              }`}
              onMouseEnter={() => setHoveredSide("right")}
              onMouseLeave={() => setHoveredSide(null)}
              animate={hoveredSide === "left" ? { opacity: 0.5, scale: 0.98 } : { opacity: 1, scale: 1 }}
            >
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#b5451b] mb-1.5 px-2 py-0.5 bg-orange-50 border border-orange-100 rounded-full">
                Experienced
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-2">
                Use Independent Tools
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-[280px]">
                Suitable for experienced users who prefer flexibility and focused self-direction.
              </p>
              <Link
                href={toolsHref}
                className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-900 shadow-md shadow-slate-800/10 hover:shadow-lg hover:shadow-slate-800/20 text-white transition-all duration-200 no-underline mb-5"
              >
                Browse Resources
                <ArrowRight size={14} />
              </Link>

              {/* Image Preview Block with Cycle controls */}
              <div className="w-full max-w-[280px] flex flex-col items-center lg:items-start">
                <div className="relative w-full aspect-video flex items-center justify-center">
                  <img
                    src={toolsImages[toolsImageIdx]}
                    alt="Independent Tools Preview"
                    className="w-full h-full object-contain transition-all duration-300"
                  />
                </div>
                {/* Control Arrows Bar */}
                <div className="flex items-center justify-between w-full mt-2 px-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setToolsImageIdx((prev) => (prev === 0 ? toolsImages.length - 1 : prev - 1));
                    }}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center"
                    title="Previous Image"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    Tools Variant {toolsImageIdx + 1}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setToolsImageIdx((prev) => (prev === toolsImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center"
                    title="Next Image"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
