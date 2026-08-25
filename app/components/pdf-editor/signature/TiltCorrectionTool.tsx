"use client";

import React from "react";
import CropTool from "./CropTool";

interface TiltCorrectionToolProps {
  processedImage: string;
  onApply: (correctedImage: string) => void;
  onCancel: () => void;
}

/**
 * Backwards-compatible adapter for existing tilt-editor imports.
 * The editing experience is now unified in CropTool so crop, tilt, and
 * rotation share one preview and one control panel.
 */
export default function TiltCorrectionTool({
  processedImage,
  onApply,
  onCancel,
}: TiltCorrectionToolProps) {
  return <CropTool currentImage={processedImage} onApplyCrop={onApply} onExit={onCancel} />;
}
