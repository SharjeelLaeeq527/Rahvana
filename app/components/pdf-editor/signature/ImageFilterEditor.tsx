// C:\Users\HP\Desktop\arachnie\Arachnie\app\components\signature-tool\ImageFilterEditor.tsx
"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { SignatureImageProcessor } from "@/lib/imageProcessor";

type Props = {
  imageSrc: string;
  onDone: (dataURL: string) => void;
  onCancel: () => void;
};

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageFilterEditor({ imageSrc, onDone, onCancel }: Props) {
  const [brightness] = useState(100);
  const [contrast] = useState(150);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Auto reprocess
  useEffect(() => {
    processImage();
  });

  // Auto detect signature bounds
  useEffect(() => {
    if (processedImage && imageRef.current) detectSignatureBounds();
  });

  const processImage = async () => {
    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      await img.decode();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";

      const filtered = canvas.toDataURL("image/png");
      const processor = new SignatureImageProcessor();
      const result = await processor.processImage(filtered, {
        threshold: 140,
        contrast: 2.5,
        darknessFactor: 0.3,
        noiseReduction: true,
        edgeSmoothing: true,
        aggressiveMode: true,
      });
      setProcessedImage(result);
      processor.destroy();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const detectSignatureBounds = () => {
    if (!processedImage || !imageRef.current) return;

    const img = new Image();
    img.src = processedImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (data[(y * canvas.width + x) * 4 + 3] > 50) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const padding = Math.min(canvas.width, canvas.height) * 0.06;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      const rect = imageRef.current!.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;

      setCropBox({
        x: minX * scaleX,
        y: minY * scaleY,
        width: (maxX - minX) * scaleX,
        height: (maxY - minY) * scaleY,
      });
    };
  };

  // Crop drag handlers
  const startDrag = (e: React.MouseEvent, type: typeof dragType) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const move = (e: MouseEvent) => {
      if (!previewRef.current || !dragType) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const rect = previewRef.current.getBoundingClientRect();

      setCropBox((prev) => {
        const box = { ...prev };
        const min = 60;

        if (dragType === "move") {
          box.x = Math.max(0, Math.min(rect.width - prev.width, prev.x + dx));
          box.y = Math.max(0, Math.min(rect.height - prev.height, prev.y + dy));
        } else if (dragType === "se") {
          box.width = Math.max(min, prev.width + dx);
          box.height = Math.max(min, prev.height + dy);
        } else if (dragType === "nw") {
          const nx = Math.max(0, prev.x + dx);
          const ny = Math.max(0, prev.y + dy);
          box.x = nx;
          box.y = ny;
          box.width = Math.max(min, prev.width - dx);
          box.height = Math.max(min, prev.height - dy);
        }
        // Add ne/sw if you want full 8-way resize (optional)
        return box;
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const up = () => {
      setIsDragging(false);
      setDragType(null);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [isDragging, dragType, dragStart]);

  const handleSave = () => {
    if (!processedImage || !imageRef.current) return;

    const img = new Image();
    img.src = processedImage;
    img.onload = () => {
      const display = imageRef.current!.getBoundingClientRect();
      const scaleX = img.width / display.width;
      const scaleY = img.height / display.height;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = cropBox.width * scaleX;
      canvas.height = cropBox.height * scaleY;

      ctx.drawImage(
        img,
        cropBox.x * scaleX,
        cropBox.y * scaleY,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      onDone(canvas.toDataURL("image/png"));
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Adjust & Crop Signature</h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-600">Original</p>
          <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-48">
            <NextImage
              src={imageSrc || "/placeholder.svg"}
              alt="Original"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Preview + Crop */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-600">
            Preview{" "}
            {isProcessing && <span className="text-blue-600 text-xs ml-2">Processing...</span>}
          </p>
          <div
            ref={previewRef}
            className="relative border-2 border-gray-300 rounded-lg bg-checkerboard h-48 overflow-hidden cursor-move select-none"
          >
            {processedImage && (
              <>
                <NextImage
                  src={processedImage || "/placeholder.svg"}
                  alt="Processed"
                  fill
                  className="object-contain pointer-events-none"
                  unoptimized
                />

                {/* Crop Box - Clean & Professional */}
                <div
                  className="absolute border-2 border-blue-600 bg-blue-600/5"
                  style={{
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: cropBox.height,
                  }}
                  onMouseDown={(e) => startDrag(e, "move")}
                >
                  {/* Simple corner handles only (SE & NW) */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 border-2 border-blue-600 bg-white cursor-se-resize translate-x-1/2 translate-y-1/2"
                    onMouseDown={(e) => startDrag(e, "se")}
                  />
                  <div
                    className="absolute top-0 left-0 w-4 h-4 border-2 border-blue-600 bg-white cursor-nw-resize -translate-x-1/2 -translate-y-1/2"
                    onMouseDown={(e) => startDrag(e, "nw")}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!processedImage || isProcessing}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Use Signature
        </button>
      </div>

      <style jsx>{`
        .bg-checkerboard {
          background-image:
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position:
            0 0,
            0 10px,
            10px -10px,
            -10px 0px;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
