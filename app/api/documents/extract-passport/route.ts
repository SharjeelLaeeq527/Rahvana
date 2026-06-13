import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parsePassportText } from "@/lib/document-ocr/passportParser";
import { callVisionFallback } from "@/lib/document-ocr/visionFallback";

// Mirrors app/api/receipt/ocr/route.ts — same proven OCR.space (free) pattern.
const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";
const OCR_FREE_FILE_LIMIT_BYTES = 1 * 1024 * 1024;

type OcrSpaceResponse = {
  ParsedResults?: Array<{ ParsedText?: string }>;
  OCRExitCode?: string | number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      console.error("[extract-passport] Authentication failed:", authError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }

    console.log(
      `[extract-passport] upload user=${authData.user.id} file=${file.name} size=${file.size}`
    );

    if (file.size > OCR_FREE_FILE_LIMIT_BYTES) {
      return NextResponse.json(
        {
          error: msg(E.UPLOAD_FILE_TOO_LARGE, {
            maxSize: OCR_FREE_FILE_LIMIT_BYTES / (1024 * 1024),
          }),
        },
        { status: 413 }
      );
    }

    const ocrApiKey = process.env.OCR_SPACE_API_KEY;
    if (!ocrApiKey) {
      console.error("[extract-passport] OCR_SPACE_API_KEY not configured");
      return NextResponse.json({ error: "OCR_SPACE_API_KEY is not configured." }, { status: 500 });
    }

    const ocrFormData = new FormData();
    ocrFormData.append("file", file, file.name);
    ocrFormData.append("language", "eng");
    ocrFormData.append("isOverlayRequired", "false");
    ocrFormData.append("detectOrientation", "true");
    ocrFormData.append("scale", "true");
    // Passports are not tabular; engine 2 reads the MRZ block better.
    ocrFormData.append("OCREngine", "2");

    const ocrResponse = await fetch(OCR_SPACE_ENDPOINT, {
      method: "POST",
      headers: { apikey: ocrApiKey },
      body: ocrFormData,
    });

    const responseJson = (await ocrResponse.json().catch(() => null)) as OcrSpaceResponse | null;
    if (!ocrResponse.ok || !responseJson) {
      console.error("[extract-passport] OCR service request failed", {
        status: ocrResponse.status,
        statusText: ocrResponse.statusText,
      });
      return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 502 });
    }

    const parsedResults = Array.isArray(responseJson.ParsedResults)
      ? responseJson.ParsedResults
      : [];

    const rawText = parsedResults
      .map((result) => result?.ParsedText || "")
      .join("\n")
      .trim();

    const parsed = parsePassportText(rawText);

    const fields: Record<string, string | undefined> = { ...parsed.fields };
    const confidence: Record<string, number> = { ...parsed.confidence };
    let source: string = parsed.source;
    const warnings = [...parsed.warnings];

    // Vision fallback: the free English OCR can fail on a glare-heavy or
    // unusual scan. When nothing was read, ask the backend vision model to read
    // the image directly. Only fires when the text OCR found nothing (cost).
    if (parsed.source === "none") {
      const vision = await callVisionFallback(file, "passport");
      if (vision?.ok) {
        Object.assign(fields, vision.fields);
        Object.assign(confidence, vision.confidence);
        source = "gemini-vision";
      }
      if (vision?.warnings?.length) warnings.push(...vision.warnings);
    }

    if (responseJson.IsErroredOnProcessing) {
      warnings.push(
        responseJson.ErrorMessage ||
          responseJson.ErrorDetails ||
          "OCR.space returned a partial-processing warning."
      );
    }

    console.log("[extract-passport] parsed", {
      source,
      keys: Object.keys(fields),
      warnings: warnings.length,
    });

    return NextResponse.json({
      docType: "passport",
      fields,
      confidence,
      source,
      warnings,
    });
  } catch (error) {
    console.error("[extract-passport] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
