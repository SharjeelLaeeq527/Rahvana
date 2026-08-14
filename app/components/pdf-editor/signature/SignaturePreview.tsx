"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import { Download, RotateCcw, CheckCircle2, Crop, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import TiltCorrectionTool from "./TiltCorrectionTool";
import CropTool from "./CropTool";

interface SignaturePreviewProps {
  originalImage: string;
  processedImage: string;
  onDownload: () => void;
  onReset: () => void;
}

export default function SignaturePreview({
  originalImage,
  processedImage,
  // onDownload,
  onReset,
}: SignaturePreviewProps) {
  const { t } = useLanguage();
  const [showCropMode, setShowCropMode] = useState(false);
  const [showTiltMode, setShowTiltMode] = useState(false);

  // ✅ Step 1: Single State for the latest image
  const [editedImage, setEditedImage] = useState<string | null>(null);

  // ✅ Step 2: Determine which image to show
  const currentImage = editedImage || processedImage;

  const handleDownloadCropped = () => {
    const link = document.createElement("a");
    link.download = `signature-final-${new Date().getTime()}.png`;
    link.href = currentImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Note: Not calling onDownload() to prevent double download
  };

  const handleReset = () => {
    setEditedImage(null);
    onReset();
  };

  // ✅ Step 3: Callback when Tilt is applied
  const handleTiltApply = (newImage: string) => {
    console.log("📸 New Tilt Image Received, Length:", newImage.length);
    setEditedImage(newImage); // Update State
    setShowTiltMode(false); // Close Modal
  };

  // ✅ Step 4: Callback when Crop is applied
  const handleCropApply = (newImage: string) => {
    console.log("✂️ New Crop Image Received");
    setEditedImage(newImage);
    setShowCropMode(false);
  };

  if (showTiltMode) {
    return (
      <TiltCorrectionTool
        processedImage={currentImage} // Pass latest image
        onApply={handleTiltApply}
        onCancel={() => setShowTiltMode(false)}
      />
    );
  }

  if (showCropMode) {
    return (
      <CropTool
        currentImage={currentImage}
        onApplyCrop={handleCropApply}
        onToggleTilt={() => setShowTiltMode(true)}
        onExit={() => setShowCropMode(false)}
      />
    );
  }

  const checkerboard = {
    backgroundImage: `
      linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
    `,
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-2xl">
      {/* Success header */}
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00595C] shadow-[0_10px_28px_rgba(13,115,119,0.28)] sm:h-[72px] sm:w-[72px]">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-[#123f42] sm:text-3xl">
          {t("signatureProcessing.adjust")}
        </h2>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#eaf3fb] px-4 py-2 text-xs font-semibold text-[#00595C] sm:text-sm mt-3">
          <BadgeCheck className="h-4 w-4" />
          {t("signatureProcessing.transparentBg")}
        </span>
      </div>

      {/* Comparison card */}
      <div className="overflow-hidden rounded-3xl border border-[#e4eff2] bg-white shadow-[0_10px_40px_rgba(13,115,119,0.10)] lg:flex lg:flex-row">
        {/* Original */}
        <div className="relative flex-1">
          <span className="absolute top-3 left-3 z-10 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#123f42] uppercase shadow-sm">
            {t("signatureProcessing.originalPhoto")}
          </span>

          <div className="relative h-52 bg-[#f7fbfc] sm:h-64 lg:h-[360px]">
            <NextImage
              src={originalImage}
              alt="Original signature"
              fill
              className="object-contain p-6"
              unoptimized
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e4eff2] lg:h-auto lg:w-px" />

        {/* Result */}
        <div className="relative flex-1" style={checkerboard}>
          <span className="absolute top-3 left-3 z-10 rounded-md bg-[#00595C] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-sm">
            {editedImage
              ? t("signatureProcessing.finalSignature")
              : t("signatureProcessing.transparentBg")}
          </span>

          <div className="relative h-52 sm:h-64 lg:h-[360px]">
            <NextImage
              key={currentImage}
              src={currentImage}
              alt="Enhanced signature"
              fill
              className="object-contain p-6"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <button
          onClick={handleDownloadCropped}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#00595C] px-6 py-4 text-base font-bold text-white shadow-[0_10px_26px_rgba(13,115,119,0.25)] transition-all hover:bg-[#004a4c] hover:shadow-[0_10px_26px_rgba(13,115,119,0.32)] sm:text-lg"
        >
          <Download className="h-5 w-5" />
          {t("signatureProcessing.download")}
        </button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setShowCropMode(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#afdbdb] bg-white px-6 py-3.5 text-sm font-semibold text-[#00595C] transition-all hover:bg-[#f0f9fa] sm:text-base"
          >
            <Crop className="h-5 w-5" />
            {t("signatureProcessing.crop")}
          </button>
          <button
            onClick={() => setShowTiltMode(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#afdbdb] bg-white px-6 py-3.5 text-sm font-semibold text-[#00595C] transition-all hover:bg-[#f0f9fa] sm:text-base"
          >
            <RotateCcw className="h-5 w-5" />
            {t("signatureProcessing.tilt")}
          </button>
        </div>

        <button
          onClick={handleReset}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-3 text-sm font-semibold text-[#5c7b80] transition-colors hover:text-[#00595C] sm:text-base"
        >
          <RotateCcw className="h-4 w-4" />
          {t("signatureProcessing.startOver")}
        </button>
      </div>
    </div>
  );
}
