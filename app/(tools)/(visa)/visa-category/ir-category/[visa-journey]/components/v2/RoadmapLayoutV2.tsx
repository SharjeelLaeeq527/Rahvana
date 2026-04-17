"use client";

import React, { useState, useEffect } from "react";
import { RoadmapData } from "../types";
import { DashboardView } from "./DashboardView";
import { ChapterView } from "./ChapterView";
import { StepView } from "./StepView";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { ChevronRight, ArrowLeft, Check, LayoutDashboard, Bell, X } from "lucide-react";
import { getDisplayStepNumber } from "./journeyHelpers";
import NotificationCenter from "./NotificationCenter";

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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sync selected chapter from state, but keep view as 'dashboard' by default on load
  useEffect(() => {
    if (state.currentStage !== undefined && state.currentStage !== -1) {
      setSelectedChapterIdx(state.currentStage);
    }
  }, [state.currentStage]);

  const handleSelectChapter = (idx: number) => {
    setSelectedChapterIdx(idx);
    actions.setStage(idx); // Update backend state with new chapter
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

  const handleBack = () => {
    if (view === "step") handleBackToChapter();
    else if (view === "chapter") handleBackToDashboard();
  };

  const isStepDone =
    view === "step" &&
    state.currentStep !== null &&
    state.currentStep !== -1 &&
    (() => {
      const chapter = data.chapters?.[state.currentStage];
      const step = chapter?.steps[state.currentStep];
      const sId = step?.step_key;
      // console.log("[RoadmapLayoutV2] isStepDone:", { stage: state.currentStage, step: state.currentStep, sId, completed: state.completedSteps.has(sId) });
      return state.completedSteps.has(sId);
    })();

  const handleToggleComplete = () => {
    const chapter = data.chapters?.[state.currentStage];
    const step = chapter?.steps[state.currentStep || 0];
    const sKey = step?.step_key;
    console.log("[RoadmapLayoutV2] handleToggleComplete attempt:", { 
      currentStage: state.currentStage, 
      currentStep: state.currentStep, 
      chapterKey: chapter?.chapter_key,
      sKey 
    });
    if (sKey) actions.toggleComplete(sKey);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fb] font-sans text-[#1c2b3a] animate-in fade-in duration-500">
      {/* Top Navigation */}
      <nav className="sticky top-[55px] h-[52px] bg-white border-b border-[#d0e4f7] flex items-center px-5 gap-3 shrink-0 z-40">
        {/* Dynamic Back / Logo */}
        <div className="flex items-center gap-3">
          {view !== "dashboard" && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full border border-[#d0e4f7] flex items-center justify-center text-[#6b8097] hover:bg-[#f4f7fb] hover:text-primary transition-all active:scale-95 cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.25 text-[11px] font-bold tracking-[0.05em] text-[#6b8097]">
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors px-1 py-0.5 rounded"
            onClick={handleBackToDashboard}
          >
            <LayoutDashboard size={14} strokeWidth={3} />
            Dashboard
          </div>

          {(view === "chapter" || view === "step") && (
            <>
              <ChevronRight size={12} className="opacity-30" strokeWidth={3} />
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

          {view === "step" &&
            state.currentStep !== null &&
            state.currentStep !== -1 && (() => {
              const chapter = data.chapters?.[state.currentStage];
              const step = chapter?.steps[state.currentStep];
              const displayNum = step ? getDisplayStepNumber(step) : (state.currentStep + 1);
              return (
                <>
                  <ChevronRight
                    size={12}
                    className="opacity-30"
                    strokeWidth={3}
                  />
                  <div className="text-[#3a4f63] px-1 py-0.5 rounded cursor-default">
                    Step {displayNum}
                  </div>
                </>
              );
            })()}
        </div>

        {/* Global Toolbar / Context Actions */}
        <div className="ml-auto flex items-center gap-3">
          {view === "step" && (
            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-[1.5px] transition-all font-bold text-[11px] uppercase tracking-[0.03em] shadow-xs cursor-pointer
                ${
                  isStepDone
                    ? "bg-[#eaf7f2] border-[#b5e0d0] text-[#1a7a5e]"
                    : "bg-white border-[#d0e4f7] text-[#3a4f63] hover:border-primary hover:text-primary"
                }`}
            >
              <Check size={14} strokeWidth={3} />
              <span>{isStepDone ? "Completed" : "Complete Step"}</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer relative
                ${isNotificationOpen ? "bg-primary text-white" : "text-[#6b8097] hover:bg-[#f4f7fb] hover:text-primary border border-[#d0e4f7]"}`}
            >
              <Bell size={18} strokeWidth={2.5} />
              {state.metadata?.tracking_status && Object.keys(state.metadata.tracking_status).length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
              )}
            </button>
          </div>

          <button
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to reset your progress? This cannot be undone.",
                )
              ) {
                actions.resetProgress();
              }
            }}
            className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Reset Journey"
          >
            <X size={18} />
          </button>
        </div>
      </nav>

      {/* Notification Drawer Overlay */}
      {isNotificationOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] animate-in fade-in duration-300"
            onClick={() => setIsNotificationOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 z-[70]">
            <NotificationCenter 
              userId={state.backendId}
              journeyId="ir-1"
              trackingStatus={state.metadata?.tracking_status}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {view === "dashboard" && (
          <DashboardView
            data={data}
            state={state}
            onSelectChapter={handleSelectChapter}
            onSelectStep={handleSelectStep}
            actions={{
              setCurrentStep: actions.setCurrentStep,
              setStage: actions.setStage,
              updateMetadata: actions.updateMetadata,
            }}
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
