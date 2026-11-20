"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import { Download, RotateCcw, Crop, Check } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
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

const CropTool = dynamic(() => import("@/app/components/pdf-editor/signature/CropTool"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center p-8">
      <Loader size="md" />
    </div>
  ),
});

export interface SnapAndSignToolProps extends ToolModeProps {
  showHeader?: boolean;
  showTips?: boolean;
  className?: string;
}

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #f0eee8 25%, transparent 25%, transparent 75%, #f0eee8 75%), linear-gradient(45deg, #f0eee8 25%, transparent 25%, transparent 75%, #f0eee8 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 8px 8px",
};

const PHOTO_BEFORE_STYLE: React.CSSProperties = {
  background: "linear-gradient(160deg, #f2efe7, #ddd6c6 70%, #cfc6b3)",
};

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
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropMode, setShowCropMode] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Active signature is either the user-cropped version or the auto-processed version
  const activeImage = editedImage || processedImage;

  // Determine effective plan tier: in journey mode, evaluate against journey's tier, otherwise account tier
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
    setEditedImage(null);
    setImageDimensions(null);
    setShowCropMode(false);

    const validation = imageProcessor.validateImageFile(file);
    if (!validation.valid) {
      showToast(
        validation.error || t("pdfProcessing.errors.invalidFile") || "Invalid image file",
        "error"
      );
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

      if (typeof window !== "undefined") {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = processed;
      }

      setTimeout(() => {
        setIsProcessing(false);
      }, 350);
    } catch (err) {
      console.error("Processing error:", err);
      showToast(t("signatureProcessing.errors.failed") || "Failed to process image.", "error");
      setIsProcessing(false);
    }
  };

  const handleApplyCrop = (croppedDataUrl: string) => {
    setEditedImage(croppedDataUrl);
    setShowCropMode(false);

    if (typeof window !== "undefined") {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = croppedDataUrl;
    }
  };

  const handleDownload = () => {
    if (activeImage) {
      const timestamp = new Date().getTime();
      imageProcessor.downloadImage(activeImage, `signature-transparent-${timestamp}.png`);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setEditedImage(null);
    setImageDimensions(null);
    setShowCropMode(false);
  };

  // ── Work Section (Left Column) ─────────────────────────────────────────
  const workContent = (
    <div className="flex h-full flex-col">
      {/* Section Kicker & Title */}
      <div className="mb-6">
        <div className="text-xs font-bold tracking-wider text-slate-500 uppercase">
          Your signature
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#16302C] sm:text-2xl lg:text-[26px]">
          From a photo of paper to a clean signature
        </h2>
      </div>

      {/* State 1: Dropzone for image upload */}
      {!originalImage && !isProcessing && (
        <div className="py-2">
          <FileUpload
            fieldName="signature"
            accept="image/*"
            variant="premium"
            showPreview
            title={t("signatureProcessing.uploader.uploadTitle") || "Upload Signature Photo"}
            description={
              t("signatureProcessing.uploader.browse") ||
              "Drag and drop or click to browse your files"
            }
            buttonText={t("signatureProcessing.uploader.chooseFile") || "Choose File"}
            helperText={
              t("signatureProcessing.uploader.supported") || "Supported: JPG, PNG, HEIC • Max 10MB"
            }
            onFileUpload={(_, file) => {
              if (file instanceof File) {
                handleFileSelect(file);
              }
            }}
          />
        </div>
      )}

      {/* State 2: Processing in progress */}
      {isProcessing && (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDD9CE] bg-[#F6F4EF]/40 p-12 text-center">
          <Loader size="lg" />
          <h3 className="mt-5 text-base font-semibold text-[#16302C]">
            Isolating signature and removing background...
          </h3>
          <p className="mt-1.5 max-w-sm text-xs text-slate-500">
            Detecting ink strokes, removing background paper textures, and creating a transparent
            PNG.
          </p>
        </div>
      )}

      {/* State 3: Signature Ready (Side-by-side or Crop Tool) */}
      {activeImage && originalImage && !isProcessing && (
        <>
          {showCropMode ? (
            <div className="rounded-2xl border border-[#DDD9CE] bg-white p-4">
              <CropTool
                currentImage={activeImage}
                onApplyCrop={handleApplyCrop}
                onExit={() => setShowCropMode(false)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option C sig-pair preview */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Before: Original Photo */}
                <figure className="m-0">
                  <div
                    className="relative aspect-[8/3] w-full overflow-hidden rounded-xl border border-[#DDD9CE] shadow-inner sm:aspect-[16/10]"
                    style={PHOTO_BEFORE_STYLE}
                  >
                    <NextImage
                      src={originalImage}
                      alt="Your photo"
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs font-semibold text-slate-600">
                    Your photo
                  </figcaption>
                </figure>

                {/* After: Clean Transparent Signature */}
                <figure className="m-0">
                  <div
                    className="relative aspect-[8/3] w-full overflow-hidden rounded-xl border border-[#DDD9CE] shadow-inner sm:aspect-[16/10]"
                    style={CHECKERBOARD_STYLE}
                  >
                    <NextImage
                      key={activeImage}
                      src={activeImage}
                      alt="Clean, no background"
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs font-semibold text-[#7A5A3A]">
                    Clean, no background
                  </figcaption>
                </figure>
              </div>

              {/* Adjustments toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DDD9CE]/60 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCropMode(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#DDD9CE] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-[#F6F4EF]"
                >
                  <Crop className="h-3.5 w-3.5 text-[#7A5A3A]" />
                  Adjust crop & tilt
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Upload different photo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Answer / Verdict Aside (Right Column) ──────────────────────────────
  const answerContent = (
    <div className="flex h-full flex-col justify-between gap-6">
      {/* Verdict Header */}
      <div>
        <div className="text-xs font-bold tracking-wider text-slate-500 uppercase">The result</div>
        <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[#16302C] sm:text-3xl">
          {processedImage ? "Ready to use" : "Awaiting signature"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {processedImage
            ? "A transparent image you can place on any PDF."
            : "Upload a photo of your signature to isolate it and remove paper background."}
        </p>
      </div>

      {/* Right Content: Tips prior to upload; Verified Specs & Compliance Note once processed */}
      {!processedImage ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#DDD9CE]/80 bg-white/75 p-4 shadow-2xs">
            <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              For best results
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  <strong className="text-slate-800">White paper:</strong> Plain, unlined paper without grids
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Dark ink:</strong> Blue or black pen for strong contrast
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Even lighting:</strong> Flat lighting without shadows or glare
                </span>
              </li>
            </ul>
          </div>

          <div className="divide-y divide-[#16302C]/10 border-t border-[#16302C]/10 text-xs sm:text-sm">
            <div className="flex items-baseline justify-between py-2">
              <span className="text-slate-500">Output format</span>
              <b className="font-semibold text-slate-700">PNG, transparent</b>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Specification Rows */}
          <div className="divide-y divide-[#16302C]/10 border-t border-[#16302C]/10 text-sm">
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Background</span>
              <b className="font-semibold text-emerald-700">Removed</b>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Cropped and straightened</span>
              <b className="font-semibold text-emerald-700">
                {editedImage ? "Custom adjusted" : "Yes"}
              </b>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <span className="text-slate-600">Format</span>
              <b className="font-semibold text-slate-800">
                {imageDimensions
                  ? `PNG, ${imageDimensions.width} × ${imageDimensions.height} px`
                  : "PNG, transparent"}
              </b>
            </div>
          </div>

          {/* Note Card */}
          <div className="rounded-xl border border-[#DDD9CE]/80 bg-white/70 p-3.5 text-xs leading-relaxed text-slate-700 shadow-2xs sm:text-sm">
            <strong className="font-bold text-amber-800">Check the form.</strong> Paper USCIS forms need
            a signature in pen. Use this where a scanned or typed signature is accepted.
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        {processedImage ? (
          <ResultGate feature="snap_sign" planTier={effectiveTier}>
            <button
              type="button"
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16302C] px-5 py-3.5 text-sm font-bold text-white shadow transition-all hover:bg-[#0e1d1b] sm:text-base"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
          </ResultGate>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-bold text-slate-400 sm:text-base"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
        )}

      </div>
    </div>
  );

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
      layout="split"
      answer={answerContent}
      showHeader={showHeader}
      className={className}
    >
      {workContent}
    </ToolLayout>
  );
}
