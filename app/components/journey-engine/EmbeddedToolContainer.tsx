"use client";

import React, { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import { useCandidate } from "@/app/context/CandidateContext";

// Lazy-load mode-aware tool components
const SponsorshipCalculatorTool = React.lazy(
  () => import("@/components/tools/SponsorshipCalculatorTool")
);
const PassportPhotoTool = React.lazy(
  () => import("@/components/tools/PassportPhotoTool")
);
const PassportOcrTool = React.lazy(
  () => import("@/components/tools/PassportOcrTool")
);
const DocumentTranslationTool = React.lazy(
  () => import("@/components/tools/DocumentTranslationTool")
);
const InterviewPrepTool = React.lazy(
  () => import("./components/InterviewPrepTool").then((m) => ({ default: m.InterviewPrepTool }))
);
const Input221gTool = React.lazy(
  () => import("./components/Input221gTool").then((m) => ({ default: m.Input221gTool }))
);
const Respond221gTool = React.lazy(
  () => import("./components/Respond221gTool").then((m) => ({ default: m.Respond221gTool }))
);
const MedicalExamTool = React.lazy(
  () => import("./components/MedicalExamTool").then((m) => ({ default: m.MedicalExamTool }))
);
const PoliceClearanceTool = React.lazy(
  () => import("./components/PoliceClearanceTool").then((m) => ({ default: m.PoliceClearanceTool }))
);
const MedicalExamGuideTool = React.lazy(
  () => import("./components/MedicalExamGuideTool").then((m) => ({ default: m.MedicalExamGuideTool }))
);
const InterviewDayTool = React.lazy(
  () => import("./components/InterviewDayTool").then((m) => ({ default: m.InterviewDayTool }))
);

interface EmbeddedToolContainerProps {
  toolKey: string;
  onClose?: () => void;
  data?: unknown;
  state?: unknown;
  actions?: unknown;
  journeyTier?: string;
}

function ToolSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-6 p-8">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="h-4 w-96 rounded bg-slate-100" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function Journey221gEmbeddedTool({ state, actions }: { state: any; actions: any }) {
  const hasSavedSelections = Boolean(state?.metadata?.twentyTwoOneGSelections);
  const [isEditing, setIsEditing] = React.useState(!hasSavedSelections);

  return (
    <div className="flex flex-col gap-6">
      {isEditing || !hasSavedSelections ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              221(g) Refusal Worksheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the refusal reasons marked on your 221(g) slip to generate your custom action plan and document checklist.
            </p>
          </div>
          <Input221gTool
            tool={{ type: "input_221g" }}
            state={state || {}}
            actions={{
              ...actions,
              updateMetadata: (updates: any) => {
                actions?.updateMetadata?.(updates);
                setIsEditing(false);
              },
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Action Plan generated for your logged 221(g) requirements
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-[#0d7377] hover:underline dark:text-teal-400"
            >
              Edit 221(g) Selections
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <Respond221gTool
              tool={{ type: "respond_221g" }}
              state={state || {}}
              actions={actions || {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function EmbeddedToolContainer({
  toolKey,
  state,
  actions,
  journeyTier = "free",
}: EmbeddedToolContainerProps) {
  const { journeySlug, candidateId } = useJourneyEnvironment();
  const { activeCandidate } = useCandidate();

  const resolvedState = state as { backendId?: string } | undefined;
  const journeyContext = {
    journeyId: resolvedState?.backendId || journeySlug || "journey",
    candidateId: candidateId || activeCandidate?.id || "candidate-1",
    backendId: resolvedState?.backendId || "",
  };

  const renderToolComponent = () => {
    switch (toolKey) {
      case "sponsorship_calculator":
        return (
          <SponsorshipCalculatorTool
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={journeyTier}
          />
        );

      case "passport_photo":
        return (
          <PassportPhotoTool
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={journeyTier}
          />
        );

      case "passport_ocr":
        return (
          <PassportOcrTool
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={journeyTier}
          />
        );

      case "doc_translation":
        return (
          <DocumentTranslationTool
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={journeyTier}
          />
        );

      case "interview_prep":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <InterviewPrepTool
              mode="journey"
              journeyContext={journeyContext}
              journeyTier={journeyTier}
            />
          </div>
        );

      case "action_221g":
        return <Journey221gEmbeddedTool state={state} actions={actions} />;

      case "medical_appointment":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <MedicalExamTool state={state} actions={actions} />
          </div>
        );

      case "medical_guide":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <MedicalExamGuideTool state={state} actions={actions} />
          </div>
        );

      case "police_verification":
      case "pcc_guide":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <PoliceClearanceTool state={state} actions={actions} />
          </div>
        );

      case "interview_guide":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <InterviewDayTool state={state} actions={actions} />
          </div>
        );

      default:
        return (
          <div className="rounded-2xl border border-teal-500/20 bg-teal-50/50 p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-[#0d7377]" />
            <h3 className="text-lg font-bold text-slate-900">Journey Tool</h3>
            <p className="mt-1 text-sm text-slate-600">
              This tool is active in your journey environment and saves progress automatically.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-200">
      <Suspense fallback={<ToolSkeleton />}>{renderToolComponent()}</Suspense>
    </div>
  );
}
