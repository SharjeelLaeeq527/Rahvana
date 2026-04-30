"use client";

import React, { useState, useEffect } from "react";
import { RoadmapData } from "../types";
import { DashboardView } from "./DashboardView";
import { ChapterView } from "./ChapterView";
import { StepView } from "./StepView";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  ChevronRight,
  ArrowLeft,
  Check,
  LayoutDashboard,
  X,
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

  useEffect(() => {
    if (state.currentStage !== undefined && state.currentStage !== -1) {
      setSelectedChapterIdx(state.currentStage);
    }
  }, [state.currentStage]);

  const handleSelectChapter = (idx: number) => {
    setSelectedChapterIdx(idx);
    actions.setStage(idx);
    setView("chapter");
    actions.setCurrentStep(-1);
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
      return state.completedSteps.has(sId);
    })();

  const handleToggleComplete = () => {
    const chapter = data.chapters?.[state.currentStage];
    const step = chapter?.steps[state.currentStep || 0];
    const sKey = step?.step_key;
    if (sKey) actions.toggleComplete(sKey);
  };

  const currentStepDisplayNum = (() => {
    if (
      view !== "step" ||
      state.currentStep === null ||
      state.currentStep === -1
    )
      return null;
    const chapter = data.chapters?.[state.currentStage];
    const step = chapter?.steps[state.currentStep];
    const filingMethod = state.metadata?.filingMethod || state.filingType;
    const activeSteps =
      chapter?.steps.filter(
        (s: any) =>
          !s.branch || s.branch === "both" || s.branch === filingMethod,
      ) ?? [];
    return step
      ? activeSteps.findIndex(
          (s: any) =>
            (s.step_key || s.id) === (step.step_key || (step as any).id),
        ) + 1
      : state.currentStep + 1;
  })();

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-[#f4f7fb] font-sans text-[#1c2b3a] animate-in fade-in duration-500"
    >
      {/* Top Navigation */}
      <nav className="sticky top-[55px] h-[52px] bg-white border-b border-[#d0e4f7] flex items-center px-5 gap-3 shrink-0 z-40 pt-2">
        {/* Dynamic Back / Logo */}
        <div className="flex items-center gap-3">
          {view !== "dashboard" && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full border border-[#d0e4f7] flex items-center justify-center text-[#6b8097] hover:bg-[#f4f7fb] hover:text-primary transition-all active:scale-95 cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Breadcrumbs */}
        <ol className="breadcrumbs" aria-label="Navigation">
          <li>
            <button
              className="breadcrumb-item breadcrumb-link"
              onClick={handleBackToDashboard}
            >
              <LayoutDashboard size={12} strokeWidth={3} aria-hidden="true" />
              <span className={`bc-text${view !== "dashboard" ? " bc-text--dashboard" : ""}`}>
                Dashboard
              </span>
            </button>
          </li>

          {(view === "chapter" || view === "step") && (
            <li className="breadcrumb-sep-item">
              <ChevronRight size={10} className="breadcrumb-sep" strokeWidth={3} aria-hidden="true" />
              <button
                className={`breadcrumb-item ${view === "chapter" ? "breadcrumb-current" : "breadcrumb-link"}`}
                onClick={view === "step" ? handleBackToChapter : undefined}
                disabled={view === "chapter"}
              >
                <span className="bc-text">Ch. {selectedChapterIdx + 1}</span>
              </button>
            </li>
          )}

          {view === "step" && currentStepDisplayNum !== null && (
            <li className="breadcrumb-sep-item">
              <ChevronRight size={10} className="breadcrumb-sep" strokeWidth={3} aria-hidden="true" />
              <span className="breadcrumb-item breadcrumb-current">
                <span className="bc-text">Step {currentStepDisplayNum}</span>
              </span>
            </li>
          )}
        </ol>

        {/* Right-side toolbar */}
        <div className="nav-actions">
          {view === "step" && (
            <button
              onClick={handleToggleComplete}
              className={`complete-btn ${isStepDone ? "complete-btn--done" : "complete-btn--idle"}`}
              aria-pressed={!!isStepDone}
              title={isStepDone ? "Mark incomplete" : "Mark complete"}
            >
              <Check size={12} strokeWidth={3} aria-hidden="true" />
              <span className="complete-label complete-label--full">
                {isStepDone ? "Done" : "Complete"}
              </span>
              <span className="complete-label complete-label--short">
                {isStepDone ? "Done" : "Done?"}
              </span>
            </button>
          )}

          <button
            onClick={async () => {
              if (
                confirm(
                  "Are you sure you want to reset your progress? This cannot be undone.",
                )
              ) {
                await actions.resetProgress();
                window.location.reload();
              }
            }}
            className="reset-btn"
            title="Reset Journey"
            aria-label="Reset progress"
          >
            <X size={14} />
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="roadmap-main">
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

      {/* ── Scoped styles ── */}
      <style jsx>{`
        /* ─── Layout shell ─────────────────────────────────────── */
        .roadmap-root {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          width: 100%;
          max-width: 100%;
          background: #f4f7fb;
          font-family: sans-serif;
          color: #1c2b3a;
          animation: fadeIn 0.4s ease both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ─── Nav bar ──────────────────────────────────────────── */
        .roadmap-nav {
          position: sticky;
          top: 55px;
          z-index: 100;
          width: 100%;
          overflow-x: hidden;
          overflow-y: visible;
          background: #fff;
          box-shadow: 0 2px 16px 0 rgba(16,30,54,0.08), 0 1.5px 4px 0 rgba(16,30,54,0.04);
          transition: box-shadow 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 12px;
          box-sizing: border-box;
        }

        /* Back button slot — fixed width so breadcrumbs don't jump */
        .nav-back-slot {
          flex: 0 0 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid #d0e4f7;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b8097;
          cursor: pointer;
          transition:
            background 0.15s,
            color 0.15s,
            transform 0.1s;
          flex-shrink: 0;
          padding: 0;
          line-height: 1;
        }
        .back-btn:hover {
          background: #f4f7fb;
          color: var(--primary, #2563eb);
        }
        .back-btn:active {
          transform: scale(0.93);
        }

        /* ─── Breadcrumbs ──────────────────────────────────────── */
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0;
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
        }

        .breadcrumb-sep-item {
          display: flex;
          align-items: center;
          min-width: 0;
          overflow: hidden;
        }

        .breadcrumb-sep {
          opacity: 0.3;
          flex-shrink: 0;
          margin: 0 1px;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #6b8097;
          background: transparent;
          border: none;
          padding: 3px 5px;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: default;
          min-width: 0;
          min-height: 24px;
          line-height: 1;
        }

        .breadcrumb-link {
          cursor: pointer;
          transition: color 0.15s;
        }
        .breadcrumb-link:hover {
          color: var(--primary, #2563eb);
        }

        .breadcrumb-current {
          color: #3a4f63;
        }

        /* ─── Breadcrumb label responsive tiers ────────────────── */
        .bc-text {
          display: inline;
        }

        @media (max-width: 480px) {
          .bc-text--dashboard {
            display: none;
          }
        }

        /* ─── Nav right actions ────────────────────────────────── */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
          padding-right: 2px;
        }

        /* ─── Complete button ──────────────────────────────────── */
        .complete-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 26px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1.5px solid;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
          background: none;
          line-height: 1;
        }

        .complete-btn--idle {
          background: #fff;
          border-color: #d0e4f7;
          color: #3a4f63;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .complete-btn--idle:hover {
          border-color: var(--primary, #2563eb);
          color: var(--primary, #2563eb);
        }

        .complete-btn--done {
          background: #eaf7f2;
          border-color: #b5e0d0;
          color: #1a7a5e;
        }

        /*
          ≥560px   → full label
          480–559px → short label
          <480px   → icon only, circle
        */
        .complete-label--full  { display: inline; }
        .complete-label--short { display: none; }

        @media (max-width: 559px) {
          .complete-label--full  { display: none; }
          .complete-label--short { display: inline; }
        }

        @media (max-width: 479px) {
          .complete-label--short { display: none; }
          .complete-btn {
            width: 26px;
            height: 26px;
            padding: 0;
            border-radius: 50%;
          }
        }

        /* ─── Reset button ─────────────────────────────────────── */
        .reset-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          padding: 0;
          border: none;
          background: transparent;
          border-radius: 50%;
          color: #cbd5e1;
          cursor: pointer;
          transition:
            background 0.15s,
            color 0.15s;
          flex-shrink: 0;
          line-height: 1;
        }
        .reset-btn:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        /* ─── Main content ─────────────────────────────────────── */
        .roadmap-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .roadmap-main > * {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
