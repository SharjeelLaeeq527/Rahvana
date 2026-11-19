"use client";

import React, { useState } from "react";
import { Loader } from "@/components/ui/spinner";
import dynamic from "next/dynamic";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import FileUpload from "@/app/components/shared/FileUpload";
import { useToast } from "@/app/components/shared/ToastProvider";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import { ToolLayout } from "./layout";
import * as imageProcessor from "@/lib/imageProcessor";

const SignaturePreview = dynamic(
  () => import("@/app/components/pdf-editor/signature/SignaturePreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <Loader size="md" />
      </div>
    ),
  }
);

export interface SnapAndSignToolProps extends ToolModeProps {
  showHeader?: boolean;
  showTips?: boolean;
  className?: string;
}

export default function SnapAndSignTool({
  showHeader = true,
  className = "",
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: SnapAndSignToolProps) {
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  const { t } = useLanguage();
  const accountPlan = usePlan();
  const { showToast } = useToast();

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine effective plan tier: in journey mode, evaluate against the specific journey's tier, otherwise account tier
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const effectiveTier: PlanTier = React.useMemo(() => {
    if (isJourney) {
      if (rawJourneyTier) {
        return normalizePlanTier(rawJourneyTier);
      }
      if (
        journeyContext?.journeyCategory &&
        accountPlan.journeyTiers[journeyContext.journeyCategory]
      ) {
        return accountPlan.journeyTiers[journeyContext.journeyCategory];
      }
    }
    return accountPlan.tier;
  }, [isJourney, rawJourneyTier, journeyContext, accountPlan.journeyTiers, accountPlan.tier]);

  const handleFileSelect = async (file: File) => {
    setOriginalImage(null);
    setProcessedImage(null);

    const validation = imageProcessor.validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error || t("pdfProcessing.errors.invalidFile"), "error");
      return;
    }

    try {
      setIsProcessing(true);

      const imageData = await imageProcessor.readFileAsDataURL(file);
      setOriginalImage(imageData);

      const processor = new imageProcessor.SignatureImageProcessor();

      const processed = await processor.processImage(imageData, {
        threshold: 140,
        darknessFactor: 0.3,
        contrast: 2.5,
        noiseReduction: true,
        edgeSmoothing: true,
        aggressiveMode: true,
      });

      setProcessedImage(processed);
      processor.destroy();

      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      console.error("Processing error:", err);
      showToast(t("signatureProcessing.errors.failed"), "error");
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const timestamp = new Date().getTime();
      imageProcessor.downloadImage(processedImage, `signature-transparent-${timestamp}.png`);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
  };

  const toolContent = (
    <div className="mx-auto max-w-2xl py-2">
      {!originalImage && !isProcessing && (
        <FileUpload
          fieldName="signature"
          accept="image/*"
          variant="premium"
          showPreview
          title={t("signatureProcessing.uploader.uploadTitle")}
          description={t("signatureProcessing.uploader.browse")}
          buttonText={t("signatureProcessing.uploader.chooseFile")}
          helperText={t("signatureProcessing.uploader.supported")}
          onFileUpload={(_, file) => {
            if (file instanceof File) {
              handleFileSelect(file);
            }
          }}
        />
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <Loader size="lg" />
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Isolating signature and removing background...
          </p>
        </div>
      )}

      {processedImage && originalImage && !isProcessing && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <ResultGate feature="snap_sign" planTier={effectiveTier}>
            <SignaturePreview
              originalImage={originalImage}
              processedImage={processedImage}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </ResultGate>
        </div>
      )}
    </div>
  );

  // When used inline or in journey overlays without standalone header
  if (!showHeader) {
    return <div className={`w-full ${className}`}>{toolContent}</div>;
  }

  // Standalone mode: standardized Option C ToolLayout
  return (
    <ToolLayout
      theme="sign"
      title={t("signatureProcessing.title") || "Snap & Sign"}
      tagline={
        t("signatureProcessing.subtitle") ||
        "Turn a photo of your signature into a clean image for your documents."
      }
      priceOrDuration="Included in Premium · about 1 min"
      quickAccessItem={{
        id: "snap-sign",
        title: "Snap & Sign",
        href: "/signature-image-processing",
        icon_name: "PenTool",
      }}
      rules={[
        { label: "Paper", value: "Plain white, no lines or grids" },
        { label: "Pen", value: "Dark blue or black ink" },
        { label: "Lighting", value: "Even, without harsh shadows" },
        { label: "Orientation", value: "Straight and centered" },
      ]}
      faqs={[
        {
          question: "Can I use it on USCIS forms?",
          answer:
            "Paper USCIS forms need an original signature in pen. Use this digital signature where a scanned or typed signature is accepted.",
        },
        {
          question: "Is my signature stored?",
          answer:
            "No. Signature processing is performed locally in your browser and is not stored unless you save it to your Document Vault.",
        },
        {
          question: "What output format will I receive?",
          answer:
            "A high-resolution transparent PNG image that can be placed directly on any PDF or document.",
        },
      ]}
      sources={[
        {
          title: "Signatures on USCIS Forms",
          domain: "uscis.gov",
          url: "https://www.uscis.gov/policy-manual/volume-1-part-b-chapter-2",
        },
      ]}
      disclaimer="Some paper USCIS forms require a handwritten signature in pen."
      layout="single"
      className={className}
    >
      {toolContent}
    </ToolLayout>
  );
}
