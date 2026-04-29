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

  // Sync selected chapter from state, but keep view as 'dashboard' by default on load
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

  // Derive current step display number for breadcrumb
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
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Breadcrumbs — truncated on small screens */}
        <ol className="breadcrumbs" aria-label="Navigation">
          <li>
            <button
              className="breadcrumb-item breadcrumb-link"
              onClick={handleBackToDashboard}
            >
              <LayoutDashboard size={13} strokeWidth={3} aria-hidden="true" />
              <span className="breadcrumb-label">Dashboard</span>
            </button>
          </li>

          {(view === "chapter" || view === "step") && (
            <li className="breadcrumb-sep-item">
              <ChevronRight
                size={11}
                className="breadcrumb-sep"
                strokeWidth={3}
                aria-hidden="true"
              />
              <button
                className={`breadcrumb-item ${view === "chapter" ? "breadcrumb-current" : "breadcrumb-link"}`}
                onClick={view === "step" ? handleBackToChapter : undefined}
                disabled={view === "chapter"}
              >
                <span className="breadcrumb-label">
                  Ch. {selectedChapterIdx + 1}
                </span>
              </button>
            </li>
          )}

          {view === "step" && currentStepDisplayNum !== null && (
            <li className="breadcrumb-sep-item">
              <ChevronRight
                size={11}
                className="breadcrumb-sep"
                strokeWidth={3}
                aria-hidden="true"
              />
              <span className="breadcrumb-item breadcrumb-current">
                <span className="breadcrumb-label">
                  Step {currentStepDisplayNum}
                </span>
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
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" />
              <span className="complete-btn-label">
                {isStepDone ? "Done" : "Complete"}
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
            <X size={17} />
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
          min-height: 100dvh; /* dynamic viewport on mobile */
          width: 100%;
          max-width: 100%; /* never wider than viewport */
          overflow-x: hidden; /* hard stop for horizontal scroll */
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
          position: fixed;
          top: 55px;   /* keeps offset below your main header */
          left: 0;
          right: 0;
          width: 100%;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 52px;
          padding: 0 12px;
          background: #fff;
          border-bottom: 1px solid #d0e4f7;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Back button slot — fixed width so breadcrumbs don't jump */
        .nav-back-slot {
          flex: 0 0 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-btn {
          width: 30px;
          height: 30px;
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
          /* take remaining space, but allow shrinking and clipping */
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
          padding: 3px 4px;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: default;
          min-width: 0;
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

        /* Hide text labels on very small screens, keep icons */
        @media (max-width: 360px) {
          .breadcrumb-label {
            display: none;
          }
        }

        /* ─── Nav right actions ────────────────────────────────── */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-left: auto;
        }

        /* Complete Step button */
        .complete-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1.5px solid;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
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

        /* Hide button text on small screens, keep icon */
        @media (max-width: 480px) {
          .complete-btn-label {
            display: none;
          }
          .complete-btn {
            padding: 6px 8px;
          }
        }

        /* Reset button */
        .reset-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: #cbd5e1;
          cursor: pointer;
          transition:
            background 0.15s,
            color 0.15s;
          flex-shrink: 0;
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
          overflow-x: hidden;
          padding-top: 52px;
        }

        /* Ensure all direct child views don't break out */
        .roadmap-main > * {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
