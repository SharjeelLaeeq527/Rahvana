"use client";

import Tesseract from "tesseract.js";
import { E, msg } from "@/lib/errors";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { type PDFPageProxy } from "pdfjs-dist/types/src/display/api";

// Configure PDF.js worker (use your local worker)
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

/**
 * Convert PDF page to canvas image data
 */
async function pdfPageToImageData(pdfPage: PDFPageProxy): Promise<string> {
  const viewport = pdfPage.getViewport({ scale: 2.0 }); // higher scale = better OCR

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(msg(E.TOOL_OCR_CANVAS_FAILED));
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await pdfPage.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL("image/png");
}

/**
 * Extract text from PDF using OCR
 */
async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: {
    page: number;
    totalPages: number;
    ocrProgress: number;
  }) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  let fullText = "";

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const imageData = await pdfPageToImageData(page);

    const {
      data: { text },
    } = await Tesseract.recognize(imageData, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress({
            page: pageNum,
            totalPages,
            ocrProgress: m.progress,
          });
        }
      },
    });

    fullText += text + "\n\n";
  }

  return fullText;
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imageUrl, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(m.progress);
        }
      },
    });

    return text;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Main OCR processor
 */
export async function processDocumentOCR(
  file: File,
  onProgress?: (progress: {
    current: number;
    total: number;
    status: string;
  }) => void
): Promise<string> {
  const fileType = file.type;

  if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
    throw new Error(msg(E.TOOL_FILE_TYPE_UNSUPPORTED));
  }

  try {
    if (fileType === "application/pdf") {
      onProgress?.({
        current: 0,
        total: 100,
        status: "Processing PDF...",
      });

      return await extractTextFromPDF(file, (pdfProgress) => {
        const overallProgress =
          ((pdfProgress.page - 1) / pdfProgress.totalPages) * 100 +
          (pdfProgress.ocrProgress / pdfProgress.totalPages) * 100;

        onProgress?.({
          current: Math.round(overallProgress),
          total: 100,
          status: `Processing page ${pdfProgress.page} of ${pdfProgress.totalPages}`,
        });
      });
    }

    // Image case
    onProgress?.({
      current: 0,
      total: 100,
      status: "Processing image...",
    });

    return await extractTextFromImage(file, (imageProgress) => {
      onProgress?.({
        current: Math.round(imageProgress * 100),
        total: 100,
        status: "Extracting text...",
      });
    });
  } catch (error: unknown) {
    console.error("OCR processing failed:", error);

    if (error instanceof Error && error.message?.includes("PDF")) {
      throw new Error(msg(E.TOOL_OCR_PROCESS_FAILED));
    }

    throw new Error(error instanceof Error ? error.message : msg(E.TOOL_OCR_PROCESS_FAILED));
  }
}
