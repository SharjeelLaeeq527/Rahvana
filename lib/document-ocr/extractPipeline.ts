// lib/document-ocr/extractPipeline.ts
//
// One shared extraction pipeline behind every /api/documents/extract-* route, so all
// document types behave identically and a fix lands everywhere at once (no more "fixed
// the birth cert but the others still misbehave").
//
// Flow:
//   1. Cheap first pass — the free OCR.space text engine — but ONLY for images within
//      its 1 MB limit. PDFs and large files skip it entirely.
//   2. The Gemini vision model — ALWAYS — because it is the only reader that handles
//      PDFs, large files, Urdu-only / handwritten / template docs, and it corrects the
//      free OCR's mistakes. By default vision OVERWRITES the text-parse values; pass
//      `trustedTextKeys` for fields where the text parse is more reliable (a passport's
//      MRZ fields, a CNIC's 13-digit number) so those keep their text value.

import type { OcrDocType } from "./registry";
import { canUseOcrSpace, ocrSpaceExtract } from "./ocrSpace";
import { applyVisionResult, callVisionFallback } from "./visionFallback";

export interface DocExtractionResult {
  fields: Record<string, string | undefined>;
  confidence: Record<string, number>;
  source: string;
  warnings: string[];
}

interface ParserOutput {
  fields: Record<string, string | undefined>;
  confidence: Record<string, number | undefined>;
  warnings: string[];
  source: string;
}

/**
 * Adapt a narrowly-typed text parser (which returns a doc-specific interface like
 * PassportFields) to the pipeline's loose record shape. Keeps the route call sites a
 * clean one-liner — `parse: asParser(parsePassportText)` — without per-route casts.
 */
export function asParser<
  T extends { fields: object; confidence: object; warnings: string[]; source: string },
>(fn: (rawText: string) => T): (rawText: string) => ParserOutput {
  return (rawText) => {
    const r = fn(rawText);
    return {
      fields: r.fields as Record<string, string | undefined>,
      confidence: r.confidence as Record<string, number | undefined>,
      warnings: r.warnings,
      source: r.source,
    };
  };
}

export interface DocExtractionOptions {
  file: File;
  docType: OcrDocType;
  /** Turns OCR.space raw text into canonical fields (the per-doc text parser). */
  parse: (rawText: string) => ParserOutput;
  /** OCR.space engine ("2" handles mixed layouts / MRZ better). */
  ocrEngine?: string;
  /** Fields where the text parse beats vision; kept if already filled by text. */
  trustedTextKeys?: ReadonlySet<string>;
}

// The text parsers emit "we couldn't read X" hints; once vision fills in, drop them.
const NOISE_WARNING =
  /not confidently detected|couldn't confidently read|could not (?:read|be read)|not detected|please fill it in/i;

export async function runDocExtraction(opts: DocExtractionOptions): Promise<DocExtractionResult> {
  const { file, docType, parse, ocrEngine = "2", trustedTextKeys } = opts;

  const fields: Record<string, string | undefined> = {};
  const confidence: Record<string, number> = {};
  const warnings: string[] = [];
  let source = "none";

  // 1) Cheap first pass — free OCR text engine (images < 1 MB only).
  if (canUseOcrSpace(file)) {
    const rawText = await ocrSpaceExtract(file, ocrEngine, warnings);
    if (rawText) {
      const parsed = parse(rawText);
      Object.assign(fields, parsed.fields);
      for (const [k, v] of Object.entries(parsed.confidence)) {
        if (typeof v === "number") confidence[k] = v;
      }
      warnings.push(...parsed.warnings);
      source = parsed.source;
    }
  }

  // 2) Vision — always. The reliable reader for PDFs / large / Urdu / messy docs.
  const vision = await callVisionFallback(file, docType);
  if (applyVisionResult(fields, confidence, vision, trustedTextKeys)) {
    source = "gemini-vision";
    for (let i = warnings.length - 1; i >= 0; i -= 1) {
      if (NOISE_WARNING.test(warnings[i])) warnings.splice(i, 1);
    }
  }
  if (vision?.warnings?.length) warnings.push(...vision.warnings);

  return { fields, confidence, source, warnings };
}
