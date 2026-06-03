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

            {/* Center Split SVG Graphic */}
            <div className="relative flex justify-center items-center w-full max-w-[320px] lg:max-w-none mx-auto py-1">
              
              {/* Symmetrical Curved SVG Split Arrows */}
              <svg
                width="320"
                height="160"
                viewBox="0 0 320 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_8px_16px_rgba(22,33,38,0.06)]"
              >
                {/* Left Arrow Path */}
                <motion.path
                  d="M 152,160 C 152,100 135,60 60,60 L 60,75 L 25,50 L 60,25 L 60,40 C 145,40 168,90 168,160 Z"
                  fill={hoveredSide === "left" ? "#0d7377" : "#1e293b"}
                  className="transition-colors duration-300"
                  whileHover={{ scale: 1.01 }}
                  style={{ cursor: "pointer" }}
                  onClick={() => window.location.href = journeyHref}
                  onMouseEnter={() => setHoveredSide("left")}
                  onMouseLeave={() => setHoveredSide(null)}
                />
                
                {/* Right Arrow Path */}
                <motion.path
                  d="M 168,160 C 168,100 185,60 260,60 L 260,75 L 295,50 L 260,25 L 260,40 C 175,40 152,90 152,160 Z"
                  fill={hoveredSide === "right" ? "#b5451b" : "#4a5c62"}
                  className="transition-colors duration-300"
                  whileHover={{ scale: 1.01 }}
                  style={{ cursor: "pointer" }}
                  onClick={() => window.location.href = toolsHref}
                  onMouseEnter={() => setHoveredSide("right")}
                  onMouseLeave={() => setHoveredSide(null)}
                />
              </svg>

              {/* Icon Overlay inside Left Arrow Curve */}
              <div 
                className={`absolute left-[54px] top-[40px] flex items-center justify-center w-8 h-8 rounded-full pointer-events-none transition-all duration-300 ${
                  hoveredSide === "left" ? "bg-white text-teal-600 scale-110 shadow-md" : "text-white/80"
                }`}
              >
                <Compass size={16} className={hoveredSide === "left" ? "animate-spin-slow" : ""} />
              </div>

              {/* Icon Overlay inside Right Arrow Curve */}
              <div 
                className={`absolute right-[54px] top-[40px] flex items-center justify-center w-8 h-8 rounded-full pointer-events-none transition-all duration-300 ${
                  hoveredSide === "right" ? "bg-white text-orange-600 scale-110 shadow-md" : "text-white/80"
                }`}
              >
                <PenTool size={16} />
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
