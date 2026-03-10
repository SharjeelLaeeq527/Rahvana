"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { usePDFStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/spinner";

import type * as PDFJS from "pdfjs-dist";

let pdfjsLib: typeof PDFJS | null = null;

async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import("pdfjs-dist/build/pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  pdfjsLib = pdfjs;
  return pdfjs;
}

export function PDFThumbnails() {
  const {
    currentPage,
    setCurrentPage,
    pdfFile,
    totalPages,
    pageModifications,
  } = usePDFStore();
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<
    Array<{ thumbnail: string; rotation: number; originalIndex: number }>
  >([]);

  useEffect(() => {
    if (!pdfFile) return;

    const generateThumbnails = async () => {
      try {
        setIsLoading(true);
        const pdfjs = await initPdfJs();
        const pdf = await pdfjs.getDocument(await pdfFile.arrayBuffer())
          .promise;

        // If no modifications yet, generate from original pages
        if (pageModifications.length === 0) {
          const thumbs: Array<{
            thumbnail: string;
            rotation: number;
            originalIndex: number;
          }> = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;
            thumbs.push({
              thumbnail: canvas.toDataURL(),
              rotation: 0,
              originalIndex: i - 1,
            });
          }

          setThumbnails(thumbs);
        } else {
          // Generate thumbnails based on modifications
          const thumbs: Array<{
            thumbnail: string;
            rotation: number;
            originalIndex: number;
          }> = [];

          for (const mod of pageModifications) {
            if (mod.deleted) continue;

            const page = await pdf.getPage(mod.originalIndex + 1);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;
            thumbs.push({
              thumbnail: canvas.toDataURL(),
              rotation: mod.rotation,
              originalIndex: mod.originalIndex,
            });
          }

          setThumbnails(thumbs);
        }
      } catch (error) {
        console.error("Error generating thumbnails:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnails();
  }, [pdfFile, totalPages, pageModifications]);

  if (!pdfFile) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader size="sm" />
      </div>
    );
  }

  if (thumbnails.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-2 bg-gray-50 p-2 overflow-y-auto h-full"
      style={{ width: "120px", minWidth: "120px" }}
    >
      {thumbnails.map((thumb, index) => (
        <button
          key={`${thumb.originalIndex}-${index}`}
          onClick={() => setCurrentPage(index)}
          className={cn(
            "relative rounded border overflow-hidden transition-all hover:border-blue-400 shrink-0",
            currentPage === index
              ? "border-2 border-blue-600 shadow-md"
              : "border border-gray-300",
          )}
          style={{ width: "104px", height: "140px" }}
        >
          <div className="relative w-full h-full flex items-center justify-center bg-white">
            <NextImage
              src={thumb.thumbnail || "/placeholder.svg"}
              alt={`Page ${index + 1}`}
              fill
              className="object-contain"
              style={{
                transform: `rotate(${thumb.rotation}deg)`,
                transition: "transform 0.2s ease",
              }}
              unoptimized
            />
          </div>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            {index + 1}
          </span>
        </button>
      ))}
    </div>
  );
}
