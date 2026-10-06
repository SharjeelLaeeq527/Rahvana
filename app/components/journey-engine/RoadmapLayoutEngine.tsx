"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { RoadmapDataV3 } from "./types";
import { DashboardView } from "./DashboardView";
import { EmbeddedToolContainer } from "./EmbeddedToolContainer";
import { getAppGroupItemLabel } from "@/lib/constants/journey-app-groups";
import { JourneyPlanBadge } from "@/app/components/shared/JourneyPlanBadge";
import { ChapterView } from "./ChapterView";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { getActiveStepsForStage } from "./journeyHelpers";
import { resolveCaseStrengthProfile } from "@/lib/case-strength/categories";
import { ChevronRight, ArrowLeft, Check, X, LayoutDashboard } from "lucide-react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useAuth } from "@/app/context/AuthContext";
import { useInitDocumentVault } from "@/lib/document-vault/useInitDocumentVault";

/** Lazy-load StepView — only fetched when user navigates to a step */
const LazyStepView = React.lazy(() =>
  import("./StepView").then((mod) => ({ default: mod.StepView }))
);

function StepSkeleton() {
  return (
    <div className="flex-1 animate-pulse overflow-hidden p-4 sm:p-6 md:p-10">
      <div className="mb-4 h-5 w-48 max-w-full rounded bg-slate-200" />
      <div className="mb-3 h-8 w-full max-w-xs rounded bg-slate-200" />
      <div className="mb-2 h-4 w-full max-w-lg rounded bg-slate-100" />
      <div className="mb-8 h-4 w-full max-w-md rounded bg-slate-100" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

interface RoadmapLayoutEngineProps {
  data: RoadmapDataV3;
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

export default function RoadmapLayoutEngine({ data, state, actions }: RoadmapLayoutEngineProps) {
  const [view, setView] = useState<ViewType>("dashboard");
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [activeToolKey, setActiveToolKey] = useState<string | null>(null);

  // Resolve the case-strength profile ONCE from the journey's category. Every
  // case-strength surface (dashboard alerts, per-step health panel) gets this
  // profile's step-checker registry — so IR-5 renders parent-child checks while
  // IR-1 keeps its spouse checks, with no per-category branching in the UI.
  const csProfile = useMemo(
    () => resolveCaseStrengthProfile(data.journey_type),
    [data.journey_type]
  );

  const { showToast } = useToast();
  const { user } = useAuth();

  const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";

  // Prefetch the document vault as soon as the journey opens (on the dashboard),
  // not when the lazy StepView mounts. This is why the "Get Required Documents"
  // step shows uploaded/not-uploaded instantly and the case-strength ring is
  // already populated by the time the user reaches any step.
  useInitDocumentVault({
    journeyType: data.journey_type,
    backendId: state.backendId,
    metadata: state.metadata,
    userId: user?.id,
  });

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
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  const handleSelectStep = (cIdx: number, sIdx: number) => {
    const chapters = data.chapters || [];
    const targetStep = chapters[cIdx]?.steps[sIdx];
    const targetKey = targetStep?.step_key;

    // Sequential navigation guard: Step 1.1 -> Step 1.2
    if (targetKey === "step_1_2" && !state.completedSteps.has("step_1_1")) {
      showToast(
        "Please complete Step 1 (Determine Eligibility) before accessing Step 2.\n\nYour eligibility answers are used to customize the document checklist for your situation.",
        "error",
        {
          duration: 5000,
        }
      );
      return;
    }

    setSelectedChapterIdx(cIdx);
    actions.setStage(cIdx);
    actions.setCurrentStep(sIdx);
    setView("step");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    actions.setCurrentStep(-1);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  const handleBackToChapter = () => {
    setView("chapter");
    actions.setCurrentStep(-1);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
    if (state.currentStep == null || state.currentStep === -1) return;
    const chapter = data.chapters?.[state.currentStage];
    const step = chapter?.steps[state.currentStep ?? 0];
    const sKey = step?.step_key;
    // if (sKey) actions.toggleComplete(sKey);
    if (sKey) {
      if (state.completedSteps.has(sKey)) return;
      actions.toggleComplete(sKey);
    }
  };

  const currentStepDisplayNum = (() => {
    if (view !== "step" || state.currentStep === null || state.currentStep === -1) return null;
    const chapter = data.chapters?.[state.currentStage];
    const step = chapter?.steps[state.currentStep ?? 0];
    const activeSteps = chapter
      ? getActiveStepsForStage(data, state.currentStage ?? 0, state.metadata, state.filingType)
      : [];
    return step
      ? activeSteps.findIndex(
          (s: any) => (s.step_key || s.id) === (step.step_key || (step as any).id)
        ) + 1
      : (state.currentStep ?? 0) + 1;
  })();

  return (
    <div className="animate-in fade-in flex min-h-screen w-full flex-col bg-[#f4f7fb] pt-10 font-sans text-[#1c2b3a] duration-500">
      {/* Top Navigation */}
      <nav className="sticky top-15 z-40 flex h-[52px] shrink-0 items-center gap-3 border-b border-[#d0e4f7] bg-white px-5">
        {/* Dynamic Back / Logo */}
        <div className="flex items-center gap-3">
          {(view !== "dashboard" || activeToolKey) && (
            <button
              onClick={activeToolKey ? () => setActiveToolKey(null) : handleBack}
              className="hover:text-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#d0e4f7] text-[#6b8097] transition-all hover:bg-[#f4f7fb] active:scale-95"
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
              className={`breadcrumb-item ${view === "dashboard" && !activeToolKey ? "breadcrumb-current" : "breadcrumb-link"}`}
              onClick={activeToolKey ? () => setActiveToolKey(null) : view !== "dashboard" ? handleBackToDashboard : undefined}
              disabled={view === "dashboard" && !activeToolKey}
            >
              <LayoutDashboard size={12} strokeWidth={3} aria-hidden="true" />
              <span className={`bc-text${view !== "dashboard" || activeToolKey ? " bc-text--dashboard" : ""}`}>
                Dashboard
              </span>
            </button>
          </li>

          {activeToolKey && (
            <li className="breadcrumb-sep-item">
              <ChevronRight
                size={10}
                className="breadcrumb-sep"
                strokeWidth={3}
                aria-hidden="true"
              />
              <span className="breadcrumb-item breadcrumb-current">
                <span className="bc-text">{getAppGroupItemLabel(activeToolKey)}</span>
              </span>
            </li>
          )}

          {!activeToolKey && (view === "chapter" || view === "step") && (
            <li className="breadcrumb-sep-item">
              <ChevronRight
                size={10}
                className="breadcrumb-sep"
                strokeWidth={3}
                aria-hidden="true"
              />
              <button
                className={`breadcrumb-item ${view === "chapter" ? "breadcrumb-current" : "breadcrumb-link"}`}
                onClick={view === "step" ? handleBackToChapter : undefined}
                disabled={view === "chapter"}
              >
                <span className="bc-text">Ch. {selectedChapterIdx + 1}</span>
              </button>
            </li>
          )}

          {!activeToolKey && view === "step" && currentStepDisplayNum !== null && (
            <li className="breadcrumb-sep-item">
              <ChevronRight
                size={10}
                className="breadcrumb-sep"
                strokeWidth={3}
                aria-hidden="true"
              />
              <span className="breadcrumb-item breadcrumb-current">
                <span className="bc-text">Step {currentStepDisplayNum}</span>
              </span>
            </li>
          )}
        </ol>

        <div className="ml-auto shrink-0">
          <JourneyPlanBadge tier={state.subscriptionTier} />
        </div>

        {/* Right-side toolbar */}
        <div className="nav-actions">
          {activeToolKey && (
            <button
              onClick={() => setActiveToolKey(null)}
              className="reset-btn"
              title="Close Tool and Return to Dashboard"
              aria-label="Close Tool"
            >
              <X size={14} />
            </button>
          )}
          {view === "step" && !activeToolKey && (
            <button
            onClick={handleToggleComplete}
            className={`complete-btn ${
              isStepDone ? "complete-btn--done" : "complete-btn--idle"
            }`}
            aria-pressed={!!isStepDone}
            title={isStepDone ? "Completed" : "Mark complete"}
          >
            {/* Icon: visible on all screen sizes */}
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          
            {/* Text: hidden on mobile, visible from md */}
            <span className="hidden md:inline">
              {isStepDone ? "Done" : "Complete"}
            </span>
          </button>
          )}
          {/* DEV ONLY — reset button */}
          {isDevelopment && !activeToolKey && (
            <button
              onClick={async () => {
                if (
                  confirm("Are you sure you want to reset your progress? This cannot be undone.")
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
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="roadmap-main">
        {/* If a tool was launched from the App Group folder, render it embedded */}
        {activeToolKey ? (
          <EmbeddedToolContainer
            toolKey={activeToolKey}
            onClose={() => setActiveToolKey(null)}
            data={data}
            state={state}
            actions={actions}
          />
        ) : (
          <>
            {/* Candidate switcher now lives in the global SiteHeader (app-wide, IR-5/IR-2 only),
                so it is not duplicated on the dashboard. */}
            {view === "dashboard" && (
              <DashboardView
                data={data}
                state={state}
                registry={csProfile.stepCheckers}
                consistency={csProfile.consistency}
                evidence={csProfile.evidence}
                onSelectChapter={handleSelectChapter}
                onSelectStep={handleSelectStep}
                onLaunchTool={(toolKey) => setActiveToolKey(toolKey)}
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
              <Suspense fallback={<StepSkeleton />}>
                <LazyStepView
                  data={data}
                  state={state}
                  registry={csProfile.stepCheckers}
                  onBack={handleBackToChapter}
                  onSelectChapter={handleSelectChapter}
                  onSelectStep={handleSelectStep}
                  actions={actions}
                />
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* ── Scoped styles ── */}
      <style jsx>{`
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

        .roadmap-nav {
          position: sticky;
          top: 70px;
          z-index: 100;
          width: 100%;
          overflow-x: hidden;
          overflow-y: visible;
          background: #fff;
          box-shadow:
            0 2px 16px 0 rgba(16, 30, 54, 0.08),
            0 1.5px 4px 0 rgba(16, 30, 54, 0.04);
          transition: box-shadow 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 12px;
          box-sizing: border-box;
        }

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

        .bc-text {
          display: inline;
        }

        @media (max-width: 480px) {
          .bc-text--dashboard {
            display: none;
          }
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
          padding-right: 2px;
        }

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
          cursor: default;
        }

        .complete-label--full {
          display: inline;
        }
        .complete-label--short {
          display: none;
        }

        @media (max-width: 559px) {
          .complete-label--full {
            display: none;
          }
          .complete-label--short {
            display: inline;
          }
        }

        @media (max-width: 479px) {
          .complete-label--short {
            display: inline;
          }
          .complete-btn {
            width: auto;
            padding: 0 10px;
            border-radius: 999px;
          }
        }

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
