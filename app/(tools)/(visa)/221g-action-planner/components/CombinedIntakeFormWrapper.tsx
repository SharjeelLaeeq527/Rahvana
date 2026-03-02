"use client";

import dynamic from "next/dynamic";

// Dynamically import the CombinedIntakeForm to avoid hydration issues
const DynamicCombinedIntakeForm = dynamic(
  () => import("./CombinedIntakeForm"),
  {
    ssr: false, // Disable server-side rendering for this component
    loading: () => (
      <div className="flex min-h-[400px] w-full items-center justify-center text-muted-foreground">
        Loading form...
      </div>
    ), // Optional loading component
  },
);

interface CombinedIntakeFormWrapperProps {
  onSubmit: (
    data: import("../types/221g").FormData,
    selected221gItems: import("../types/221g").FormSelections,
  ) => void;
  onSaveToProfile?: () => Promise<void>;
  initialData?: import("../types/221g").FormData | null;
  initialSelections?: import("../types/221g").FormSelections | null;
  smartModeEnabled?: boolean;
}

export default function CombinedIntakeFormWrapper({
  onSubmit,
  onSaveToProfile,
  initialData,
  initialSelections,
  smartModeEnabled = false,
}: CombinedIntakeFormWrapperProps) {
  return (
    <DynamicCombinedIntakeForm
      onSubmit={onSubmit}
      onSaveToProfile={onSaveToProfile}
      initialData={initialData}
      initialSelections={initialSelections}
      smartModeEnabled={smartModeEnabled}
    />
  );
}