"use client";

import dynamic from "next/dynamic";
import type { ToolModeProps } from "@/types/tool-mode";
import type { FormData, FormSelections, TwentyTwoOneGDraft } from "../types/221g";

// Dynamically import the CombinedIntakeForm to avoid hydration issues
const DynamicCombinedIntakeForm = dynamic(() => import("./CombinedIntakeForm"), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => (
    <div className="flex min-h-[400px] w-full items-center justify-center text-muted-foreground">
      Loading form...
    </div>
  ), // Optional loading component
});

export interface CombinedIntakeFormWrapperProps extends ToolModeProps {
  onSubmit?: (data: FormData, selected221gItems: FormSelections) => void;
  onSaveToProfile?: () => Promise<void>;
  initialData?: FormData | null;
  initialSelections?: FormSelections | null;
  initialStep?: number;
  initialOutputs?: {
    actionPlan: string;
    checklist: string;
  } | null;
  smartModeEnabled?: boolean;
  onProgressChange?: (draft: TwentyTwoOneGDraft) => void;
  onReset?: () => void;
}

export default function CombinedIntakeFormWrapper({
  onSubmit,
  onSaveToProfile,
  initialData,
  initialSelections,
  initialStep,
  initialOutputs,
  smartModeEnabled = false,
  mode,
  journeyContext,
  onProgressChange,
  onReset,
}: CombinedIntakeFormWrapperProps) {
  return (
    <DynamicCombinedIntakeForm
      onSubmit={onSubmit}
      onSaveToProfile={onSaveToProfile}
      initialData={initialData}
      initialSelections={initialSelections}
      initialStep={initialStep}
      initialOutputs={initialOutputs}
      smartModeEnabled={smartModeEnabled}
      mode={mode}
      journeyContext={journeyContext}
      onProgressChange={onProgressChange}
      onReset={onReset}
    />
  );
}
