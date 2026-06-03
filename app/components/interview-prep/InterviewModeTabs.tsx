"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Zap } from "lucide-react";

interface InterviewModeTabsProps {
  mode: "prep" | "rapid" | "mock";
  plan: {
    tier: string;
  };
  onPrep: () => void;
  onRapid: () => void;
  onMock: () => void;
}

export function InterviewModeTabs({
  mode,
  plan,
  onPrep,
  onRapid,
  onMock,
}: InterviewModeTabsProps) {
  return (
    <div className="flex flex-col md:flex-row justify-center gap-4 mb-4">
      {/* Prep Mode */}
      <Button
        onClick={onPrep}
        variant={mode === "prep" ? "default" : "outline"}
        className={`w-full md:w-auto transition-all duration-200 ${
          mode === "prep"
            ? "bg-[#0d7377] hover:bg-[#0a5a5d] shadow-[0_4px_16px_-4px_rgba(13,115,119,0.4)]"
            : "bg-[#f4fbfb] border-[#afdbdb] text-[#0d7377] hover:bg-[#f4fbfb] hover:text-[#0d7377] hover:border-[#afdbdb]"
        }`}
      >
        <BookOpen
          className={`h-4 w-4 mr-2 ${
            mode === "prep" ? "text-white" : "text-[#0d7377]"
          }`}
        />
        Prep Mode
      </Button>

      {/* Rapid Fire */}
      <div className="relative w-full md:w-auto">
        <Button
          onClick={onRapid}
          variant={mode === "rapid" ? "default" : "outline"}
          className={`w-full md:w-auto transition-all duration-200 ${
            mode === "rapid"
              ? "bg-[#6b5b7b] hover:bg-[#5a4a6a] shadow-[0_4px_16px_-4px_rgba(107,91,123,0.4)]"
              : "bg-[#faf8fb] border-[#cdadcc] text-[#6b5b7b] hover:bg-[#faf8fb] hover:text-[#6b5b7b] hover:border-[#cdadcc]"
          }`}
        >
          <Zap
            className={`h-4 w-4 mr-2 ${
              mode === "rapid" ? "text-white" : "text-[#cdadcc]"
            }`}
          />
          Rapid Fire Mode
        </Button>

        {plan.tier === "basic" && (
          <div className="absolute -top-2 -right-4 z-20 pointer-events-none">
            <Image
              src="/icons/ribbon.png"
              alt="Premium feature ribbon"
              width={52}
              height={52}
              className="object-contain drop-shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Mock Interview */}
      <div className="relative w-full md:w-auto">
        <Button
          onClick={onMock}
          variant={mode === "mock" ? "default" : "outline"}
          className={`w-full md:w-auto transition-all duration-200 ${
            mode === "mock"
              ? "bg-[#db8090] hover:bg-[#c96f80] shadow-[0_4px_16px_-4px_rgba(219,128,144,0.45)]"
              : "bg-[#fff7f8] border-[#f0c7cf] text-[#db8090] hover:bg-[#fff7f8] hover:text-[#db8090] hover:border-[#f0c7cf]"
          }`}
        >
          <Mic
            className={`h-4 w-4 mr-2 ${
              mode === "mock" ? "text-white" : "text-[#db8090]"
            }`}
          />
          Mock Interview Mode
        </Button>

        {(plan.tier === "basic" || plan.tier === "premium") && (
          <div className="absolute -top-2 -right-4 z-20 pointer-events-none">
            <Image
              src="/icons/ribbon.png"
              alt="Executive feature ribbon"
              width={52}
              height={52}
              className="object-contain drop-shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}