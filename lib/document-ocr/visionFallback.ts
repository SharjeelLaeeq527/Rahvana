// lib/document-ocr/visionFallback.ts
//
// Server-side helper (used from the extract-* API routes) that calls the Python
// backend's Gemini Vision fallback. The free English OCR (OCR.space) can't read
// an Urdu Nikah Nama or a handwritten cert; when it returns nothing useful, the
// route calls this to have the vision model read the image directly.
//
// The backend (backend/app/api/v1/document_vision.py) returns canonical
// MasterProfile dot-path fields, so the result merges straight into the OCR
// result with no remapping.

import type { OcrDocType } from "./registry";

// Same backend the document upload/compression route already targets. Server-side
// only — falls back to localhost in dev.
const PYTHON_API_URL =
  process.env.PYTHON_API_URL ??
  process.env.COMPRESSION_API_URL ??
  "http://localhost:8000/api/v1";

// Vision (LLM) calls are slower than OCR.space; cap the wait so a hung backend
// never blocks the upload flow indefinitely.
const VISION_TIMEOUT_MS = 60_000;

export interface VisionFallbackResult {
  ok: boolean;
  fields: Record<string, string>;
  confidence: Record<string, number>;
  warnings: string[];
  source?: string;
}

/**
 * Ask the backend to read the document image with the vision model.
 * Returns null on any failure (network, timeout, bad response) — the caller
 * simply keeps whatever OCR.space produced.
 */
export async function callVisionFallback(
  file: File,
  docType: OcrDocType
): Promise<VisionFallbackResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("doc_type", docType);

    const res = await fetch(`${PYTHON_API_URL}/documents/vision-extract`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const json = await res.json().catch(() => null);
    if (!json) return null;

    return {
      ok: Boolean(json.ok),
      fields: (json.fields as Record<string, string>) || {},
      confidence: (json.confidence as Record<string, number>) || {},
      warnings: Array.isArray(json.warnings) ? (json.warnings as string[]) : [],
      source: typeof json.source === "string" ? json.source : undefined,
    };
  } catch (error) {
    console.error("[visionFallback] backend vision call failed:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
