"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Crop, Check, RotateCcw, RotateCw, X, Info } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import * as Errors from "@/lib/errors";

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropToolProps {
  currentImage: string;
  onApplyCrop: (croppedDataUrl: string) => void;
  onExit: () => void;
  isApplying?: boolean;
}

export default function CropTool({
  currentImage,
  onApplyCrop,
  onExit,
  isApplying = false,
}: CropToolProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "nw" | "ne" | "sw" | "se" | "rotate" | null>(
    null
  );
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // When image loads, set up initial crop box
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const displayedWidth = img.offsetWidth;
    const displayedHeight = img.offsetHeight;

    setImageBounds({ width: displayedWidth, height: displayedHeight });
    setImageLoaded(true);

    // Auto-detect signature bounds
    detectSignatureBounds(displayedWidth, displayedHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImage]);

  const detectSignatureBounds = useCallback(
    (displayedWidth: number, displayedHeight: number) => {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = currentImage;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          // Fallback: set crop box to full image
          setCropBox({ x: 0, y: 0, width: displayedWidth, height: displayedHeight });
          return;
        }

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const alpha = data[i + 3];

            if (alpha > 50) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Add padding
        const padding = Math.min(canvas.width, canvas.height) * 0.05;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width, maxX + padding);
        maxY = Math.min(canvas.height, maxY + padding);

        // Scale from original pixels to displayed pixels
        const scaleX = displayedWidth / canvas.width;
        const scaleY = displayedHeight / canvas.height;

        setCropBox({
          x: minX * scaleX,
          y: minY * scaleY,
          width: (maxX - minX) * scaleX,
          height: (maxY - minY) * scaleY,
        });
      };

      img.onerror = () => {
        // Fallback
        setCropBox({ x: 0, y: 0, width: displayedWidth, height: displayedHeight });
      };
    },
    [currentImage]
  );

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "move" | "nw" | "ne" | "sw" | "se" | "rotate"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "rotate") {
      setIsRotating(true);
      setDragType("rotate");
    } else {
      setIsDragging(true);
      setDragType(type);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if ((!isDragging && !isRotating) || !dragType || !containerRef.current) return;

      if (dragType === "rotate") {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + cropBox.x + cropBox.width / 2;
        const centerY = rect.top + cropBox.y + cropBox.height / 2;

        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const degrees = (angle * 180) / Math.PI;
        setRotation(Math.round(degrees));
        return;
      }

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const maxWidth = imageBounds.width;
      const maxHeight = imageBounds.height;

      setCropBox((prev) => {
        let newBox = { ...prev };
        const minSize = 30;

        if (dragType === "move") {
          newBox.x = Math.max(0, Math.min(maxWidth - prev.width, prev.x + deltaX));
          newBox.y = Math.max(0, Math.min(maxHeight - prev.height, prev.y + deltaY));
        } else {
          if (dragType === "nw") {
            const newX = Math.max(0, prev.x + deltaX);
            const newY = Math.max(0, prev.y + deltaY);
            const newWidth = prev.width - (newX - prev.x);
            const newHeight = prev.height - (newY - prev.y);
            if (newWidth >= minSize && newHeight >= minSize) {
              newBox = { x: newX, y: newY, width: newWidth, height: newHeight };
            }
          } else if (dragType === "ne") {
            const newY = Math.max(0, prev.y + deltaY);
            const newWidth = Math.min(maxWidth - prev.x, Math.max(minSize, prev.width + deltaX));
            const newHeight = prev.height - (newY - prev.y);
            if (newHeight >= minSize) {
              newBox = { ...prev, y: newY, width: newWidth, height: newHeight };
            }
          } else if (dragType === "sw") {
            const newX = Math.max(0, prev.x + deltaX);
            const newWidth = prev.width - (newX - prev.x);
            const newHeight = Math.min(maxHeight - prev.y, Math.max(minSize, prev.height + deltaY));
            if (newWidth >= minSize) {
              newBox = { x: newX, y: prev.y, width: newWidth, height: newHeight };
            }
          } else if (dragType === "se") {
            newBox = {
              ...prev,
              width: Math.min(maxWidth - prev.x, Math.max(minSize, prev.width + deltaX)),
              height: Math.min(maxHeight - prev.y, Math.max(minSize, prev.height + deltaY)),
            };
          }
        }

        return newBox;
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, isRotating, dragType, dragStart, cropBox, imageBounds]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsRotating(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (!(isDragging || isRotating)) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isRotating, handleMouseMove, handleMouseUp]);

  const handleApplyCrop = async () => {
    if (!currentImage || !imageRef.current) return;

    try {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = currentImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const displayedWidth = imageRef.current.offsetWidth;
      const displayedHeight = imageRef.current.offsetHeight;

      // Scale from displayed size to actual image size
      const scaleX = img.naturalWidth / displayedWidth;
      const scaleY = img.naturalHeight / displayedHeight;

      // Convert crop box from displayed coordinates to actual image coordinates
      const actualCropX = Math.round(cropBox.x * scaleX);
      const actualCropY = Math.round(cropBox.y * scaleY);
      const actualCropWidth = Math.round(cropBox.width * scaleX);
      const actualCropHeight = Math.round(cropBox.height * scaleY);

      // Clamp to image bounds
      const finalX = Math.max(0, Math.min(actualCropX, img.naturalWidth - 1));
      const finalY = Math.max(0, Math.min(actualCropY, img.naturalHeight - 1));
      const finalWidth = Math.min(actualCropWidth, img.naturalWidth - finalX);
      const finalHeight = Math.min(actualCropHeight, img.naturalHeight - finalY);

      let finalImageData: string;

      if (rotation !== 0) {
        // First rotate the entire image
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d", { alpha: true });
        if (!tempCtx) throw new Error("Canvas context unavailable");

        const radians = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        const rotatedWidth = img.naturalWidth * cos + img.naturalHeight * sin;
        const rotatedHeight = img.naturalWidth * sin + img.naturalHeight * cos;

        tempCanvas.width = rotatedWidth;
        tempCanvas.height = rotatedHeight;

        // Clear with transparent background
        tempCtx.clearRect(0, 0, rotatedWidth, rotatedHeight);

        tempCtx.save();
        tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        tempCtx.restore();

        // Then crop from the rotated image
        const finalCanvas = document.createElement("canvas");
        const finalCtx = finalCanvas.getContext("2d", { alpha: true });
        if (!finalCtx) throw new Error("Final canvas context unavailable");

        finalCanvas.width = finalWidth;
        finalCanvas.height = finalHeight;

        // Clear with transparent background
        finalCtx.clearRect(0, 0, finalWidth, finalHeight);

        const offsetX = (rotatedWidth - img.naturalWidth) / 2;
        const offsetY = (rotatedHeight - img.naturalHeight) / 2;

        finalCtx.drawImage(
          tempCanvas,
          finalX + offsetX,
          finalY + offsetY,
          finalWidth,
          finalHeight,
          0,
          0,
          finalWidth,
          finalHeight
        );
        finalImageData = finalCanvas.toDataURL("image/png");
      } else {
        // Simple crop without rotation
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) throw new Error("Canvas context unavailable");

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Clear with transparent background
        ctx.clearRect(0, 0, finalWidth, finalHeight);

        ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight);
        finalImageData = canvas.toDataURL("image/png");
      }

      onApplyCrop(finalImageData);
    } catch (error) {
      console.error("Crop error:", error);
      showToast(Errors.msg(Errors.E.PDF_CROP_FAILED), "error");
    }
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-3xl bg-[#1b2b41] shadow-[0_20px_60px_rgba(12,26,45,0.35)]">
        {/* Top bar */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/5 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onExit}
            disabled={isApplying}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t("pdfProcessing.editor.signature.cancel")}</span>
          </button>

          <h2 className="min-w-0 truncate text-center text-base font-bold text-white sm:text-xl">
            {t("pdfProcessing.editor.crop.title")}
          </h2>

          <button
            onClick={async () => {
              // Apply crop first, then exit
              await handleApplyCrop();
              setRotation(0);
            }}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#7fe6ea] transition-colors hover:text-white"
          >
            <span className="hidden sm:inline">{t("signatureProcessing.done")}</span>
            <Check className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex min-h-[320px] items-center justify-center px-4 py-8 sm:min-h-[440px] sm:px-8 sm:py-12">
          {/* This container wraps ONLY the image and crop overlay - they share exact same size */}
          <div
            ref={containerRef}
            className="relative inline-block"
            style={{
              width: imageLoaded ? `${imageBounds.width}px` : "auto",
              height: imageLoaded ? `${imageBounds.height}px` : "auto",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={currentImage}
              alt="Signature"
              className="block max-h-[300px] max-w-full rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.45)] select-none sm:max-h-[440px]"
              draggable={false}
              onLoad={handleImageLoad}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isRotating ? "none" : "transform 0.1s ease-out",
              }}
            />

            {imageLoaded && (
              <>
                {/* Dark overlay with cutout for crop area */}
                {/* Crop overlay — keeps the selected area completely clear */}
                <div className="pointer-events-none absolute inset-0 rounded-lg">
                  {/* Top */}
                  <div
                    className="absolute top-0 right-0 left-0 bg-[#0c1626]/25"
                    style={{
                      height: `${cropBox.y}px`,
                    }}
                  />

                  {/* Bottom */}
                  <div
                    className="absolute right-0 bottom-0 left-0 bg-[#0c1626]/25"
                    style={{
                      height: `${imageBounds.height - cropBox.y - cropBox.height}px`,
                    }}
                  />

                  {/* Left */}
                  <div
                    className="absolute left-0 bg-[#0c1626]/25"
                    style={{
                      top: `${cropBox.y}px`,
                      width: `${cropBox.x}px`,
                      height: `${cropBox.height}px`,
                    }}
                  />

                  {/* Right */}
                  <div
                    className="absolute right-0 bg-[#0c1626]/25"
                    style={{
                      top: `${cropBox.y}px`,
                      width: `${imageBounds.width - cropBox.x - cropBox.width}px`,
                      height: `${cropBox.height}px`,
                    }}
                  />
                </div>

                {/* Crop box */}
                <div
                  className="absolute cursor-move border border-white/70"
                  style={{
                    left: `${cropBox.x}px`,
                    top: `${cropBox.y}px`,
                    width: `${cropBox.width}px`,
                    height: `${cropBox.height}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "move")}
                >
                  {/* Corner handles */}
                  <div
                    className="absolute -top-1 -left-1 z-10 h-5 w-5 cursor-nwse-resize border-t-4 border-l-4 border-[#7fe6ea] sm:h-6 sm:w-6"
                    onMouseDown={(e) => handleMouseDown(e, "nw")}
                  />
                  <div
                    className="absolute -top-1 -right-1 z-10 h-5 w-5 cursor-nesw-resize border-t-4 border-r-4 border-[#7fe6ea] sm:h-6 sm:w-6"
                    onMouseDown={(e) => handleMouseDown(e, "ne")}
                  />
                  <div
                    className="absolute -bottom-1 -left-1 z-10 h-5 w-5 cursor-nesw-resize border-b-4 border-l-4 border-[#7fe6ea] sm:h-6 sm:w-6"
                    onMouseDown={(e) => handleMouseDown(e, "sw")}
                  />
                  <div
                    className="absolute -right-1 -bottom-1 z-10 h-5 w-5 cursor-nwse-resize border-r-4 border-b-4 border-[#7fe6ea] sm:h-6 sm:w-6"
                    onMouseDown={(e) => handleMouseDown(e, "se")}
                  />

                  {/* Rotation handle */}
                  <div
                    className="absolute left-1/2 z-20 flex -translate-x-1/2 cursor-grab flex-col items-center active:cursor-grabbing"
                    style={{ top: "-56px" }}
                    onMouseDown={(e) => handleMouseDown(e, "rotate")}
                  >
                    <div className="h-9 w-px bg-[#7fe6ea]/70"></div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7fe6ea] shadow-lg transition-transform hover:scale-110">
                      <svg
                        className="h-4 w-4 text-[#123f42]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    {isRotating && (
                      <div className="absolute -bottom-9 rounded-md bg-[#7fe6ea] px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[#123f42] shadow-lg">
                        {rotation}°
                      </div>
                    )}
                  </div>

                  {/* Grid lines */}
                  <div className="absolute top-1/3 right-0 left-0 h-px bg-white/25" />
                  <div className="absolute top-2/3 right-0 left-0 h-px bg-white/25" />
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/25" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/25" />
                </div>

                {/* Rotation indicator */}
                {rotation !== 0 && !isRotating && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-[#7fe6ea] px-3 py-1.5 text-xs font-semibold text-[#123f42] shadow-lg sm:text-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t("editor.crop.rotated", { degrees: rotation })}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRotation(0);
                      }}
                      className="ml-1 rounded bg-[#123f42]/15 px-2 py-0.5 text-[11px] font-bold transition hover:bg-[#123f42]/25"
                    >
                      {t("editor.crop.reset")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom control bar */}
        <div className="border-t border-white/5 bg-[#16233a] px-4 py-5 sm:px-8">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 truncate text-sm font-semibold text-white/90">
              {t("pdfProcessing.editor.crop.tilt")}
            </p>
            <span className="shrink-0 rounded-md bg-[#7fe6ea] px-2.5 py-1 text-xs font-bold text-[#123f42]">
              {rotation}°
            </span>
          </div>

          <input
            type="range"
            min="-45"
            max="45"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#7fe6ea]"
            aria-label="Tilt"
          />

          <div className="mt-2 flex justify-between text-[10px] text-white/40 sm:text-xs">
            <span>-45°</span>
            <span>-15°</span>
            <span>0°</span>
            <span>15°</span>
            <span>45°</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setRotation((prev) => prev - 1)}
              aria-label="Rotate left"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7fe6ea] text-[#123f42] shadow-md transition-colors hover:bg-white"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => setRotation((prev) => prev + 1)}
              aria-label="Rotate right"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7fe6ea] text-[#123f42] shadow-md transition-colors hover:bg-white"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#cde6e7] bg-[#EAF1FF] px-4 py-3.5 text-[12px] leading-relaxed text-[#645961]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0d7377]" />

        <p>
          Adjust the crop box to include only your signature. Use the corner handles to resize, drag
          to reposition, and rotate if needed. Click Done when you&apos;re satisfied.
        </p>
      </div>
    </div>
  );
}
