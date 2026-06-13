import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parseBirthCertText } from "@/lib/document-ocr/birthCertParser";
import { callVisionFallback } from "@/lib/document-ocr/visionFallback";

// Mirrors app/api/documents/extract-marriage — same proven OCR.space (free) pattern.
// Reads a birth certificate (NADRA computerized cert / Form-B) and extracts the
// child's name, date of birth and place of birth for the beneficiary.* profile keys.
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
      console.error("[extract-birth] Authentication failed:", authError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }

    console.log(
      `[extract-birth] upload user=${authData.user.id} file=${file.name} size=${file.size}`
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
      console.error("[extract-birth] OCR_SPACE_API_KEY not configured");
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
      console.error("[extract-birth] OCR service request failed", {
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

    const parsed = parseBirthCertText(rawText);

    const fields: Record<string, string | undefined> = { ...parsed.fields };
    const confidence: Record<string, number> = { ...parsed.confidence };
    let source: string = parsed.source;
    const warnings = [...parsed.warnings];

    // Vision fallback: the free English OCR can't read an Urdu-only or handwritten
    // certificate. Fires when ANY critical field is missing — the parents' names
    // (DS-260 Section 2 / I-130A) are often Urdu-only even when the child's row is
    // printed in English. Vision only fills fields the text parser missed.
    if (
      !fields.dateOfBirth ||
      !fields["name.first"] ||
      !fields["father.name.first"] ||
      !fields["mother.name.first"]
    ) {
      const vision = await callVisionFallback(file, "birth");
      if (vision?.ok) {
        for (const [key, value] of Object.entries(vision.fields)) {
          if (fields[key]) continue; // keep what the text parser already read
          fields[key] = value;
          confidence[key] = vision.confidence[key] ?? 0.7;
        }
        source = "gemini-vision";
        const idx = warnings.findIndex((w) => /couldn't confidently read/i.test(w));
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

    console.log("[extract-birth] parsed", {
      source,
      keys: Object.keys(fields),
      warnings: warnings.length,
    });

    return NextResponse.json({
      docType: "birth",
      fields,
      confidence,
      source,
      warnings,
    });
  } catch (error) {
    console.error("[extract-birth] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
