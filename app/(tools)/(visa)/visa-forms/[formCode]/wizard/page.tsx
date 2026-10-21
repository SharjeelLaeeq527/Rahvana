"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const MultiStepForm = dynamic(
  () =>
    import("@/app/components/forms/auto-visaform-filling/MultiStepForm").then(
      (mod) => mod.MultiStepForm
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0d7377] border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading form wizard...</p>
        </div>
      </div>
    ),
  }
);

type Props = {
  params: Promise<{ formCode: string }>;
};

export default function FormWizardPage({ params }: Props) {
  const resolvedParams = use(params);
  const { formCode } = resolvedParams;
  const normalizedCode = formCode.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <main className="min-h-screen">
      <MultiStepForm formCode={normalizedCode} mode="standalone" />
    </main>
  );
}
