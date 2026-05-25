import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidReceiptNumber, normalizeReceipt } from "@/lib/register-receipt";

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";
const OCR_FREE_FILE_LIMIT_BYTES = 1 * 1024 * 1024;

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

type ReceiptOcrResponse = {
  receiptNumber: string | null;
  noticeDate: string | null;
  priorityDate: string | null;
  caseLabel: string | null;
  rawText: string;
  warnings: string[];
};

type OcrSpaceResponse = {
  ParsedResults?: Array<{ ParsedText?: string }>;
  OCRExitCode?: string | number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
};

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function toIsoDate(month: number, day: number, year: number): string | null {
  const normalizedYear = year < 100 ? (year >= 70 ? 1900 + year : 2000 + year) : year;
  const date = new Date(Date.UTC(normalizedYear, month - 1, day));

  if (
    date.getUTCFullYear() !== normalizedYear ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function extractDateFromText(text: string): string | null {
  const slashOrDash = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (slashOrDash) {
    return toIsoDate(Number(slashOrDash[1]), Number(slashOrDash[2]), Number(slashOrDash[3]));
  }

  const monthName = text.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,)?\s+(\d{2,4})\b/i
  );
  if (monthName) {
    const month = MONTHS[monthName[1].toLowerCase()];
    return toIsoDate(month, Number(monthName[2]), Number(monthName[3]));
  }

  const iso = text.match(/\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/);
  if (iso) {
    return toIsoDate(Number(iso[2]), Number(iso[3]), Number(iso[1]));
  }

  return null;
}

function extractDateNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    if (!labelPattern.test(lines[index])) continue;

    const searchWindow = [lines[index], lines[index + 1], lines[index + 2]]
      .filter(Boolean)
      .join(" ");

    const date = extractDateFromText(searchWindow);
    if (date) return date;
  }

  return null;
}

function extractAllDates(text: string): string[] {
  const dates = new Set<string>();
  const chunks = text.split(/[^A-Za-z0-9,/.\-]+/).filter(Boolean);

  for (const chunk of chunks) {
    const date = extractDateFromText(chunk);
    if (date) dates.add(date);
  }

  return Array.from(dates);
}

function extractReceiptNumber(text: string, lines: string[]): string | null {
  const receiptRegex = /\b(?:IOE|MSC|WAC|LIN|SRC|EAC|YSC|NBC|TSC)[A-Z0-9]?\d{9,10}\b/i;

  for (const line of lines) {
    const match = line.match(receiptRegex);
    if (match && isValidReceiptNumber(normalizeReceipt(match[0]))) {
      return normalizeReceipt(match[0]);
    }
  }

  const fallback = text.match(receiptRegex);
  if (fallback && isValidReceiptNumber(normalizeReceipt(fallback[0]))) {
    return normalizeReceipt(fallback[0]);
  }

  return null;
}

function extractCaseLabel(lines: string[]): string | null {
  const preferredPatterns = [
    /form\s+i-797c/i,
    /notice of action/i,
    /petition for alien relative/i,
    /adjustment of status/i,
    /petition to remove conditions/i,
    /employment authorization/i,
    /travel document/i,
    /reentry permit/i,
    /receipt notice/i,
    /uscis/i,
  ];

  for (const line of lines) {
    if (/receipt number|notice date|priority date/i.test(line)) continue;

    if (
      preferredPatterns.some((pattern) => pattern.test(line)) ||
      /\bI-\d{3}[A-Z]?\b/i.test(line)
    ) {
      return line.slice(0, 120);
    }
  }

  return null;
}

function parseReceiptOcrText(text: string): ReceiptOcrResponse {
  const cleanedText = text.replace(/\u0000/g, "").trim();
  const lines = normalizeLines(cleanedText);
  const warnings: string[] = [];

  const receiptNumber = extractReceiptNumber(cleanedText, lines);
  let noticeDate = extractDateNearLabel(lines, /notice\s*date/i);
  let priorityDate = extractDateNearLabel(lines, /priority\s*date/i);

  if (!noticeDate || !priorityDate) {
    const allDates = extractAllDates(cleanedText);
    if (!noticeDate && allDates.length > 0) {
      noticeDate = allDates[0];
    }
    if (!priorityDate && allDates.length > 1) {
      priorityDate = allDates.find((date) => date !== noticeDate) ?? allDates[1] ?? null;
    }
  }

  const caseLabel = extractCaseLabel(lines);

  if (!receiptNumber) warnings.push("Receipt number was not confidently detected.");
  if (!noticeDate) warnings.push("Notice date was not confidently detected.");
  if (!priorityDate) warnings.push("Priority date was not confidently detected.");
  if (!caseLabel) warnings.push("Case label was not confidently detected.");

  return {
    receiptNumber,
    noticeDate,
    priorityDate,
    caseLabel,
    rawText: cleanedText,
    warnings,
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("[receipt/ocr] POST request received");

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      console.log("[receipt/ocr] Authentication failed:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[receipt/ocr] User authenticated:", authData.user.id);

    const formData = await request.formData();
    const file = formData.get("file");

    console.log(
      "[receipt/ocr] FormData received, file:",
      file instanceof File ? { name: file.name, size: file.size, type: file.type } : "not a file"
    );

    if (!(file instanceof File)) {
      console.log("[receipt/ocr] File validation failed: not a File instance");
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    console.log(
      `[receipt/ocr] Received upload from user=${authData.user?.id ?? "unknown"} file=${file.name} size=${file.size}`
    );

    if (file.size > OCR_FREE_FILE_LIMIT_BYTES) {
      console.log(
        "[receipt/ocr] File too large:",
        file.size,
        "bytes (limit:",
        OCR_FREE_FILE_LIMIT_BYTES,
        ")"
      );
      return NextResponse.json(
        {
          error:
            "OCR.space free API supports files up to 1 MB. This file is too large for automatic receipt extraction, but you can still save it manually after entering the fields.",
        },
        { status: 413 }
      );
    }

    const ocrApiKey = process.env.OCR_SPACE_API_KEY;
    if (!ocrApiKey) {
      console.log("[receipt/ocr] OCR_SPACE_API_KEY not configured in environment");
      return NextResponse.json({ error: "OCR_SPACE_API_KEY is not configured." }, { status: 500 });
    }

    console.log("[receipt/ocr] Calling OCR.space API...");

    const ocrFormData = new FormData();
    ocrFormData.append("file", file, file.name);
    ocrFormData.append("language", "eng");
    ocrFormData.append("isOverlayRequired", "false");
    ocrFormData.append("detectOrientation", "true");
    ocrFormData.append("scale", "true");
    ocrFormData.append("isTable", "true");
    ocrFormData.append("OCREngine", "2");

    const ocrResponse = await fetch(OCR_SPACE_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: ocrApiKey,
      },
      body: ocrFormData,
    });

    console.log("[receipt/ocr] OCR.space response:", ocrResponse.status, ocrResponse.statusText);

    const responseJson = (await ocrResponse.json().catch(() => null)) as OcrSpaceResponse | null;
    if (!ocrResponse.ok || !responseJson) {
      console.log("[receipt/ocr] OCR service request failed");
      return NextResponse.json({ error: "OCR service request failed." }, { status: 502 });
    }

    const parsedResults = Array.isArray(responseJson.ParsedResults)
      ? responseJson.ParsedResults
      : [];

    const rawText = parsedResults
      .map((result) => result?.ParsedText || "")
      .join("\n")
      .trim();

    console.log("[receipt/ocr] Extracted text length:", rawText.length);

    if (!rawText && responseJson.IsErroredOnProcessing) {
      console.log(
        "[receipt/ocr] OCR processing error:",
        responseJson.ErrorMessage || responseJson.ErrorDetails
      );
      return NextResponse.json(
        {
          error:
            responseJson.ErrorMessage ||
            responseJson.ErrorDetails ||
            "OCR could not read this receipt notice.",
        },
        { status: 422 }
      );
    }

    const extracted = parseReceiptOcrText(rawText);
    console.log("[receipt/ocr] Extraction results:", {
      receiptNumber: extracted.receiptNumber,
      noticeDate: extracted.noticeDate,
      priorityDate: extracted.priorityDate,
      caseLabel: extracted.caseLabel,
      warnings: extracted.warnings,
    });

    const warnings = [...extracted.warnings];

    if (responseJson.IsErroredOnProcessing) {
      warnings.push(
        responseJson.ErrorMessage ||
          responseJson.ErrorDetails ||
          "OCR.space returned a partial-processing warning."
      );
    }

    console.log("[receipt/ocr] Sending response with extracted data");

    return NextResponse.json({
      receiptNumber: extracted.receiptNumber,
      noticeDate: extracted.noticeDate,
      priorityDate: extracted.priorityDate,
      caseLabel: extracted.caseLabel,
      rawText: extracted.rawText,
      warnings,
    });
  } catch (error) {
    console.error("[receipt/ocr] Unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to run OCR on the uploaded receipt notice." },
      { status: 500 }
    );
  }
}
