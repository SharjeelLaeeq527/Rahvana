"use client";

import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Zap } from "lucide-react";

interface InterviewModeTabsProps {
  mode: "prep" | "rapid" | "mock";
  onPrep: () => void;
  onRapid: () => void;
  onMock: () => void;
}

export function InterviewModeTabs({ mode, onPrep, onRapid, onMock }: InterviewModeTabsProps) {
  return (
    <>
      {/* Mobile: Segmented Control */}
      <div className="flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 md:hidden">
        {/* Prep */}
        <button
          type="button"
          onClick={onPrep}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 ${
            mode === "prep" ? "bg-[#0d7377] text-white shadow-sm" : "text-[#0d7377] hover:bg-white"
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Prep</span>
        </button>

        {/* Rapid */}
        <button
          type="button"
          onClick={onRapid}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 ${
            mode === "rapid" ? "bg-[#6b5b7b] text-white shadow-sm" : "text-[#6b5b7b] hover:bg-white"
          }`}
        >
          <Zap className="h-4 w-4 shrink-0" />
          <span>Rapid</span>
        </button>

        {/* Mock */}
        <button
          type="button"
          onClick={onMock}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 ${
            mode === "mock" ? "bg-[#db8090] text-white shadow-sm" : "text-[#db8090] hover:bg-white"
          }`}
        >
          <Mic className="h-4 w-4 shrink-0" />
          <span>Mock</span>
        </button>
      </div>

      {/* Desktop: Full Buttons */}
      <div className="mx-auto hidden items-center justify-center gap-3 md:flex">
        {/* Prep Mode */}
        <Button
          onClick={onPrep}
          variant={mode === "prep" ? "default" : "outline"}
          className={`w-full transition-all duration-200 md:w-auto ${
            mode === "prep"
              ? "bg-[#0d7377] shadow-[0_4px_16px_-4px_rgba(13,115,119,0.4)] hover:bg-[#0a5a5d]"
              : "border-[#afdbdb] bg-[#f4fbfb] text-[#0d7377] hover:border-[#afdbdb] hover:bg-[#f4fbfb] hover:text-[#0d7377]"
          }`}
        >
          <BookOpen
            className={`mr-2 h-4 w-4 ${mode === "prep" ? "text-white" : "text-[#0d7377]"}`}
          />
          Prep Mode
        </Button>

        {/* Rapid Fire */}
        <Button
          onClick={onRapid}
          variant={mode === "rapid" ? "default" : "outline"}
          className={`w-full transition-all duration-200 md:w-auto ${
            mode === "rapid"
              ? "bg-[#6b5b7b] shadow-[0_4px_16px_-4px_rgba(107,91,123,0.4)] hover:bg-[#5a4a6a]"
              : "border-[#cdadcc] bg-[#faf8fb] text-[#6b5b7b] hover:border-[#cdadcc] hover:bg-[#faf8fb] hover:text-[#6b5b7b]"
          }`}
        >
          <Zap className={`mr-2 h-4 w-4 ${mode === "rapid" ? "text-white" : "text-[#cdadcc]"}`} />
          Rapid Fire Mode
        </Button>

        {/* Mock Interview */}
        <Button
          onClick={onMock}
          variant={mode === "mock" ? "default" : "outline"}
          className={`w-full transition-all duration-200 md:w-auto ${
            mode === "mock"
              ? "bg-[#db8090] shadow-[0_4px_16px_-4px_rgba(219,128,144,0.45)] hover:bg-[#c96f80]"
              : "border-[#f0c7cf] bg-[#fff7f8] text-[#db8090] hover:border-[#f0c7cf] hover:bg-[#fff7f8] hover:text-[#db8090]"
          }`}
        >
          <Mic className={`mr-2 h-4 w-4 ${mode === "mock" ? "text-white" : "text-[#db8090]"}`} />
          Mock Interview Mode
        </Button>
      </div>
    </>
  );
}
