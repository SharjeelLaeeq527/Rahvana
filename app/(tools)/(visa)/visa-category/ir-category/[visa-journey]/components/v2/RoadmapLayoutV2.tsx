"use client";

import React, { useState, useEffect } from "react";
import { RoadmapData } from "../types";
import { DashboardView } from "./DashboardView";
import { ChapterView } from "./ChapterView";
import { StepView } from "./StepView";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  ChevronRight,
  Settings,
} from "lucide-react";

interface RoadmapLayoutV2Props {
  data: RoadmapData;
  state: WizardState;
  actions: {
    toggleComplete: (id: string) => void;
    setCurrentStep: (idx: number | null) => void;
    setStage: (idx: number) => void;
    updateAnswers: (answers: Record<string, any>) => void;
    updateMetadata: (metadata: Record<string, any>) => void;
    resetProgress: () => Promise<void>;
  };
}

type ViewType = "dashboard" | "chapter" | "step";

export default function RoadmapLayoutV2({
  data,
  state,
  actions,
}: RoadmapLayoutV2Props) {
  const [view, setView] = useState<ViewType>("dashboard");
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);

  // Sync view from state if needed
  useEffect(() => {
    if (state.currentStep !== null && state.currentStep !== -1) {
      setView("step");
    }
  }, [state.currentStep]);

  const handleSelectChapter = (idx: number) => {
    setSelectedChapterIdx(idx);
    setView("chapter");
    actions.setCurrentStep(-1); // Reset step in case one was open
  };

  const handleSelectStep = (cIdx: number, sIdx: number) => {
    setSelectedChapterIdx(cIdx);
    actions.setStage(cIdx);
    actions.setCurrentStep(sIdx);
    setView("step");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    actions.setCurrentStep(-1);
  };

  const handleBackToChapter = () => {
    setView("chapter");
    actions.setCurrentStep(-1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fb] font-sans text-[#1c2b3a] animate-in fade-in duration-500">
      {/* Top Navigation */}
      <nav className="h-[52px] bg-white border-b border-[#d0e4f7] flex items-center px-5 gap-2.5 shrink-0 z-50">
        <div className="font-serif text-[17px] text-[#0c1b33] mr-4">Rahvana</div>

        <div className="flex items-center gap-1.25 text-[12px] text-[#6b8097]">
          <div 
            className="cursor-pointer hover:text-primary transition-colors px-1 py-0.5 rounded"
            onClick={handleBackToDashboard}
          >
            Dashboard
          </div>

          {(view === "chapter" || view === "step") && (
            <>
              <ChevronRight size={12} className="opacity-30" />
              <div
                className={`px-1 py-0.5 rounded ${
                  view === "chapter" 
                    ? "text-[#3a4f63] cursor-default" 
                    : "cursor-pointer hover:text-primary transition-colors"
                }`}
                onClick={handleBackToChapter}
              >
                Chapter {selectedChapterIdx + 1}
              </div>
            </>
          )}

          {view === "step" && state.currentStep !== null && state.currentStep !== -1 && (
            <>
              <ChevronRight size={12} className="opacity-30" />
              <div className="text-[#3a4f63] px-1 py-0.5 rounded cursor-default">
                Step {state.currentStep + 1}
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to reset your progress? This cannot be undone.")) {
                actions.resetProgress();
              }
            }}
            className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors group"
            title="Reset Journey"
          >
            <Settings size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {view === "dashboard" && (
          <DashboardView
            data={data}
            state={state}
            onSelectChapter={handleSelectChapter}
            actions={actions}
          />
        )}

        {view === "chapter" && (
          <ChapterView
            data={data}
            chapterIdx={selectedChapterIdx}
            state={state}
            onBack={handleBackToDashboard}
            onSelectStep={handleSelectStep}
          />
        )}

        {view === "step" && (
          <StepView
            data={data}
            state={state}
            onBack={handleBackToChapter}
            actions={actions}
          />
        )}
      </main>
    </div>
  );
}
