"use client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

interface SignatureProcessorProps {
  progress?: number;
}

export default function SignatureProcessor({
  progress = 0,
}: SignatureProcessorProps) {
  const { t } = useLanguage();
  const steps = [
    { id: 1, label: t("signatureProcessing.processing.steps.analyzing") },
    { id: 2, label: t("signatureProcessing.processing.steps.removing") },
    { id: 3, label: t("signatureProcessing.processing.steps.enhancing") },
    { id: 4, label: t("signatureProcessing.processing.steps.finalizing") },
  ];

  const currentStep = Math.min(Math.floor(progress / 25) + 1, 4);

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto border border-slate-200">
      <div className="relative mb-8">
        <div className="w-16 h-16 mx-auto">
          <div className="absolute inset-0 bg-slate-900 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        {t("signatureProcessing.processing.title")}
      </h2>
      <p className="text-slate-600 mb-8 text-sm">
        {t("signatureProcessing.processing.subtitle")}
      </p>

      <div className="mb-8">
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-slate-900 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {t("signatureProcessing.processing.percentComplete", { percent: progress })}
        </p>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded transition-all ${
              step.id === currentStep
                ? "bg-slate-100 border border-slate-300"
                : step.id < currentStep
                  ? "bg-slate-50 border border-slate-200"
                  : "bg-white border border-slate-200 opacity-50"
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              {step.id < currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
              ) : step.id === currentStep ? (
                <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
              ) : (
                <div className="w-3 h-3 bg-slate-300 rounded-full" />
              )}
            </div>
            <p
              className={`text-sm font-medium ${
                step.id === currentStep
                  ? "text-slate-900"
                  : step.id < currentStep
                    ? "text-slate-700"
                    : "text-slate-500"
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
