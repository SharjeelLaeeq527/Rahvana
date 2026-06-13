import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parseMarriageText } from "@/lib/document-ocr/marriageParser";
import { callVisionFallback } from "@/lib/document-ocr/visionFallback";

// Mirrors app/api/documents/extract-passport — same proven OCR.space (free) pattern.
// Reads a marriage document (NADRA MRC / Nikah Nama English translation) and
// extracts the marriage date (+ best-effort place) for relationship.* profile keys.
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
      console.error("[extract-marriage] Authentication failed:", authError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }

    console.log(
      `[extract-marriage] upload user=${authData.user.id} file=${file.name} size=${file.size}`
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
      console.error("[extract-marriage] OCR_SPACE_API_KEY not configured");
      return NextResponse.json({ error: "OCR_SPACE_API_KEY is not configured." }, { status: 500 });
    }

    const ocrFormData = new FormData();
    ocrFormData.append("file", file, file.name);
    ocrFormData.append("language", "eng");
    ocrFormData.append("isOverlayRequired", "false");
    ocrFormData.append("detectOrientation", "true");
    ocrFormData.append("scale", "true");
    // Certificates are semi-tabular; engine 2 handles mixed layouts better.
    ocrFormData.append("OCREngine", "2");

    const ocrResponse = await fetch(OCR_SPACE_ENDPOINT, {
      method: "POST",
      headers: { apikey: ocrApiKey },
      body: ocrFormData,
    });

    const responseJson = (await ocrResponse.json().catch(() => null)) as OcrSpaceResponse | null;
    if (!ocrResponse.ok || !responseJson) {
      console.error("[extract-marriage] OCR service request failed", {
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

    // NOTE: we no longer hard-fail (422) when OCR.space reads nothing — that is
    // exactly the Urdu Nikah Nama case the vision fallback below is meant to catch.
    const parsed = parseMarriageText(rawText);

    const fields: Record<string, string | undefined> = { ...parsed.fields };
    const confidence: Record<string, number> = { ...parsed.confidence };
    let source: string = parsed.source;
    const warnings = [...parsed.warnings];

    // Vision fallback: the free English OCR can't read an Urdu Nikah Nama or a
    // handwritten cert, so when no marriage date was found we ask the backend
    // vision model to read the image directly. Only fires when needed (cost).
    if (!fields["relationship.marriageDate"]) {
      const vision = await callVisionFallback(file, "marriage");
      if (vision?.ok) {
        Object.assign(fields, vision.fields);
        Object.assign(confidence, vision.confidence);
        source = "gemini-vision";
        // The text parser's "not detected" hint is no longer true.
        const idx = warnings.findIndex((w) => /not confidently detected/i.test(w));
        if (idx !== -1) warnings.splice(idx, 1);
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

    console.log("[extract-marriage] parsed", {
      source,
      keys: Object.keys(fields),
      warnings: warnings.length,
    });

    return NextResponse.json({
      docType: "marriage",
      fields,
      confidence,
      source,
      warnings,
    });
  } catch (error) {
    console.error("[extract-marriage] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
