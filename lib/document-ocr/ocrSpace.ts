// lib/document-ocr/ocrSpace.ts
//
// Thin server-side wrapper around the free OCR.space text engine, shared by every
// /api/documents/extract-* route. OCR.space is only a CHEAP FIRST PASS: it reads the
// Latin/English text off an image and only accepts images under 1 MB. PDFs, large
// files, Urdu-only docs and messy layouts are handled by the Gemini vision model
// instead (see visionFallback.ts) — so this helper never throws: on any problem it
// returns "" and the caller falls back to vision.

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";

/** OCR.space free tier only accepts images at or under 1 MB. */
export const OCR_SPACE_LIMIT_BYTES = 1 * 1024 * 1024;

/** True when OCR.space can be used for this file (an image within its size limit). */
export function canUseOcrSpace(file: File): boolean {
  return file.type.startsWith("image/") && file.size <= OCR_SPACE_LIMIT_BYTES;
}

type OcrSpaceResponse = {
  ParsedResults?: Array<{ ParsedText?: string }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
};

/**
 * Run OCR.space on an image and return its raw text ("" on any failure).
 * Soft warnings from a partial read are pushed onto `warnings`.
 */
export async function ocrSpaceExtract(
  file: File,
  ocrEngine: string,
  warnings: string[]
): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    // Not fatal — the route will fall back to the vision model.
    console.warn("[ocrSpace] OCR_SPACE_API_KEY not configured; skipping free OCR pass");
    return "";
  }

  try {
    const ocrFormData = new FormData();
    ocrFormData.append("file", file, file.name);
    ocrFormData.append("language", "eng");
    ocrFormData.append("isOverlayRequired", "false");
    ocrFormData.append("detectOrientation", "true");
    ocrFormData.append("scale", "true");
    ocrFormData.append("OCREngine", ocrEngine);

    const res = await fetch(OCR_SPACE_ENDPOINT, {
      method: "POST",
      headers: { apikey: apiKey },
      body: ocrFormData,
    });

    const json = (await res.json().catch(() => null)) as OcrSpaceResponse | null;
    if (!res.ok || !json) return "";

    if (json.IsErroredOnProcessing) {
      const w = json.ErrorMessage || json.ErrorDetails;
      if (w) warnings.push(Array.isArray(w) ? w.join(" ") : String(w));
    }

    return (Array.isArray(json.ParsedResults) ? json.ParsedResults : [])
      .map((r) => r?.ParsedText || "")
      .join("\n")
      .trim();
  } catch (error) {
    console.error("[ocrSpace] request failed:", error);
    return "";
  }
}
