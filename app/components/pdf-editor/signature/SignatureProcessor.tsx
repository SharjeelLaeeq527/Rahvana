"use client";
import { CheckCircle2 } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { useLanguage } from "@/app/context/LanguageContext";

interface SignatureProcessorProps {
  progress?: number;
}

export default function SignatureProcessor({ progress = 0 }: SignatureProcessorProps) {
  const { t } = useLanguage();
  const steps = [
    { id: 1, label: t("signatureProcessing.processing.steps.analyzing") },
    { id: 2, label: t("signatureProcessing.processing.steps.removing") },
    { id: 3, label: t("signatureProcessing.processing.steps.enhancing") },
    { id: 4, label: t("signatureProcessing.processing.steps.finalizing") },
  ];

  const currentStep = Math.min(Math.floor(progress / 25) + 1, 4);

  return (
    <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(13,115,119,0.10)] p-6 sm:p-12 text-center max-w-2xl mx-auto border border-[#e4eff2]">
      <div className="relative mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#eaf3fb] flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-[#123f42] mb-2">
        {t("signatureProcessing.processing.title")}
      </h2>
      <p className="text-[#6b8a8f] mb-8 text-sm">{t("signatureProcessing.processing.subtitle")}</p>

      <div className="mb-8">
        <div className="w-full bg-[#e6f1f4] rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#0d7377] h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#8aa5a8] mt-3">
          {t("signatureProcessing.processing.percentComplete", { percent: progress })}
        </p>
      </div>

      <div className="space-y-2 text-left">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              step.id === currentStep
                ? "bg-[#f0f9fa] border-[#afdbdb]"
                : step.id < currentStep
                  ? "bg-[#f7fbfc] border-[#e4eff2]"
                  : "bg-white border-[#eef4f5] opacity-60"
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              {step.id < currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-[#0d7377]" />
              ) : step.id === currentStep ? (
                <Loader size="sm" />
              ) : (
                <div className="w-3 h-3 bg-[#cfe2e5] rounded-full" />
              )}
            </div>
            <p
              className={`text-sm font-medium ${
                step.id === currentStep
                  ? "text-[#123f42]"
                  : step.id < currentStep
                    ? "text-[#3f6165]"
                    : "text-[#8aa5a8]"
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
