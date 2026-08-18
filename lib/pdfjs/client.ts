"use client";

import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";

export type { PDFDocumentProxy, PDFPageProxy, RenderTask };

/** Mitigates CVE-2026-16633 / GHSA-hq66-cqwq-w95j (PDF JavaScript execution). */
const SECURE_DOCUMENT_PARAMS = {
  enableScripting: false,
  isEvalSupported: false,
} as const;

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function configureWorker(
  pdfjs: typeof import("pdfjs-dist")
): Promise<void> {
  if (pdfjs.GlobalWorkerOptions.workerSrc) {
    return;
  }

  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

/**
 * Initialize pdf.js once per tab.
 * Worker is served from /public (pinned at install).
 */
export async function initPdfJs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsLib) {
    return pdfjsLib;
  }

  const pdfjs = await import("pdfjs-dist");

  await configureWorker(pdfjs);

  pdfjsLib = pdfjs;

  return pdfjs;
}

export type LoadPdfDocumentOptions = {
  password?: string;
};

/**
 * Load an untrusted PDF with scripting disabled.
 */
export async function loadPdfDocument(
  data: ArrayBuffer | Uint8Array,
  options: LoadPdfDocumentOptions = {}
): Promise<PDFDocumentProxy> {
  const pdfjs = await initPdfJs();

  return pdfjs
    .getDocument({
      ...SECURE_DOCUMENT_PARAMS,
      data,
      ...options,
    })
    .promise;
}

/**
 * Render a PDF page to a canvas.
 */
export function renderPdfPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  viewport: ReturnType<PDFPageProxy["getViewport"]>
): RenderTask {
  const canvasContext = canvas.getContext("2d");

  if (!canvasContext) {
    throw new Error("Failed to acquire 2D canvas context for PDF render");
  }

  return page.render({
    canvasContext,
    viewport,
    canvas,
  });
}