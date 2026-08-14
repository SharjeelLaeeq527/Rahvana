"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, RotateCw, Check, X, Info } from "lucide-react";
import domtoimage from "dom-to-image-more";
import { useLanguage } from "@/app/context/LanguageContext";
import { Loader } from "@/components/ui/spinner";

interface TiltCorrectionToolProps {
  processedImage: string;
  onApply: (correctedImage: string) => void;
  onCancel: () => void;
}

export default function TiltCorrectionTool({
  processedImage,
  onApply,
  onCancel,
}: TiltCorrectionToolProps) {
  const { t } = useLanguage();
  const [horizontalTilt, setHorizontalTilt] = useState(0); // Y-axis rotation (left-right)
  const [verticalTilt, setVerticalTilt] = useState(0); // X-axis rotation (up-down)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [isApplying, setIsApplying] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  // Load image once and get dimensions
  useEffect(() => {
    if (processedImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = processedImage;
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
    }
  }, [processedImage]);

  // Calculate perspective based on image size
  const getPerspective = useCallback(() => {
    if (!imageDimensions) return 1000;
    return Math.max(imageDimensions.width, imageDimensions.height) * 2;
  }, [imageDimensions]);

  // Get the CSS transform string
  const getTransformStyle = useCallback(() => {
    const perspective = getPerspective();
    return `perspective(${perspective}px) rotateX(${verticalTilt}deg) rotateY(${horizontalTilt}deg)`;
  }, [horizontalTilt, verticalTilt, getPerspective]);

  const handleApply = async () => {
    if (isApplying) return;

    setIsApplying(true);
    try {
      // If no tilt applied, return original image
      if (horizontalTilt === 0 && verticalTilt === 0) {
        onApply(processedImage);
        return;
      }

      // Use dom-to-image-more to capture the 3D transformed element
      if (captureContainerRef.current) {
        const dataUrl = await domtoimage.toPng(captureContainerRef.current, {
          bgcolor: "transparent",
          quality: 1,
          scale: 2,
        });
        onApply(dataUrl);
      } else {
        onApply(processedImage);
      }
    } catch (error) {
      console.error("Error applying tilt:", error);
      onApply(processedImage);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetHorizontal = () => {
    setHorizontalTilt(0);
  };

  const handleResetVertical = () => {
    setVerticalTilt(0);
  };

  const handleResetAll = () => {
    setHorizontalTilt(0);
    setVerticalTilt(0);
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-3xl bg-[#1b2b41] shadow-[0_20px_60px_rgba(12,26,45,0.35)]">
        {/* Top bar */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/5 px-4 py-4 sm:px-6">
          <button
            onClick={onCancel}
            disabled={isApplying}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t("pdfProcessing.editor.signature.cancel")}</span>
          </button>

          <h2 className="min-w-0 truncate text-center text-base font-bold text-white sm:text-xl">
            {t("pdfProcessing.editor.tilt.title")}
          </h2>

          <button
            onClick={handleApply}
            disabled={isApplying}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#7fe6ea] transition-colors hover:text-white disabled:opacity-50"
          >
            {isApplying ? (
              <Loader size="sm" text={t("pdfProcessing.editor.tilt.applying")} />
            ) : (
              <>
                <span className="hidden sm:inline">
                  {t("pdfProcessing.editor.tilt.applyContinue")}
                </span>
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Preview with CSS 3D Transform */}
        <div
          ref={previewContainerRef}
          className="flex min-h-[320px] items-center justify-center px-4 py-8 sm:min-h-[460px] sm:px-8 sm:py-14"
        >
          {imageDimensions && (
            <div
              style={{
                transform: getTransformStyle(),
                transformStyle: "preserve-3d",
                transition: "transform 0.15s ease-out",
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedImage}
                alt="Preview"
                className="max-h-[280px] max-w-full rounded-lg object-contain shadow-[0_16px_40px_rgba(0,0,0,0.45)] sm:max-h-[420px]"
              />
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="space-y-7 border-t border-white/5 bg-[#16233a] px-4 py-6 sm:px-8">
          {/* Horizontal */}
          <div>
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <label className="min-w-0 truncate text-sm font-semibold text-white/90">
                {t("pdfProcessing.editor.tilt.horizontalLabel")}
              </label>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md bg-[#7fe6ea] px-2.5 py-1 text-xs font-bold text-[#123f42]">
                  {horizontalTilt}°
                </span>
                <button
                  onClick={handleResetHorizontal}
                  className="p-1 text-white/50 transition hover:text-[#7fe6ea]"
                  title="Reset horizontal tilt"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={horizontalTilt}
              onChange={(e) => setHorizontalTilt(parseInt(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#7fe6ea]"
            />
            <div className="mt-2 flex justify-between text-[10px] text-white/40 sm:text-xs">
              <span>{t("pdfProcessing.editor.tilt.left")}</span>
              <span>{t("pdfProcessing.editor.tilt.center")}</span>
              <span>{t("pdfProcessing.editor.tilt.right")}</span>
            </div>
          </div>

          {/* Vertical */}
          <div>
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <label className="min-w-0 truncate text-sm font-semibold text-white/90">
                {t("pdfProcessing.editor.tilt.verticalLabel")}
              </label>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md bg-[#7fe6ea] px-2.5 py-1 text-xs font-bold text-[#123f42]">
                  {verticalTilt}°
                </span>
                <button
                  onClick={handleResetVertical}
                  className="p-1 text-white/50 transition hover:text-[#7fe6ea]"
                  title="Reset vertical tilt"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={verticalTilt}
              onChange={(e) => setVerticalTilt(parseInt(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#7fe6ea]"
            />
            <div className="mt-2 flex justify-between text-[10px] text-white/40 sm:text-xs">
              <span>{t("pdfProcessing.editor.tilt.up")}</span>
              <span>{t("pdfProcessing.editor.tilt.center")}</span>
              <span>{t("pdfProcessing.editor.tilt.down")}</span>
            </div>
          </div>

          {/* Quick rotate + reset */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setHorizontalTilt((prev) => Math.max(-30, prev - 1))}
              aria-label="Tilt left"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7fe6ea] text-[#123f42] shadow-md transition-colors hover:bg-white"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => setHorizontalTilt((prev) => Math.min(30, prev + 1))}
              aria-label="Tilt right"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7fe6ea] text-[#123f42] shadow-md transition-colors hover:bg-white"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={handleResetAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <RotateCcw className="h-4 w-4" />
            {t("pdfProcessing.editor.tilt.resetTilt")}
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#cde6e7] bg-[#EAF1FF] px-4 py-3.5 text-[12px] leading-relaxed text-[#645961]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0d7377]" />

        <p>{t("pdfProcessing.editor.tilt.subtitle")}</p>
      </div>

      {/* Hidden capture container - positioned offscreen but visible for html2canvas */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0px",
          opacity: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <div
          ref={captureContainerRef}
          style={{
            display: "inline-block",
            padding: "50px", // Extra padding to capture the full transformed image
            background: "transparent",
          }}
        >
          {imageDimensions && (
            <div
              style={{
                transform: getTransformStyle(),
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedImage}
                alt="Capture"
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                  display: "block",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
