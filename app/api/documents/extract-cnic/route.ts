import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parseCnicText } from "@/lib/document-ocr/cnicParser";
import { asParser, runDocExtraction } from "@/lib/document-ocr/extractPipeline";

// Reads a Pakistani CNIC. The 13-digit identity number is printed clearly in Latin
// digits, so the free OCR text parse WINS for it (kept over vision). Vision fills the
// rest — including the Urdu-script full name the English OCR can't read — and recovers
// everything for an Urdu-only / low-quality card or a PDF.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const CNIC_TRUSTED_TEXT_KEYS = new Set(["cnic"]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error("[extract-cnic] Authentication failed:", authError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: msg(E.UPLOAD_NO_FILE) }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: MAX_UPLOAD_BYTES / (1024 * 1024) }) },
        { status: 413 }
      );
    }

    console.log(
      `[extract-cnic] upload user=${authData.user.id} file=${file.name} size=${file.size}`
    );

    const result = await runDocExtraction({
      file,
      docType: "cnic",
      parse: asParser(parseCnicText),
      trustedTextKeys: CNIC_TRUSTED_TEXT_KEYS,
    });

    console.log("[extract-cnic] parsed", {
      source: result.source,
      keys: Object.keys(result.fields),
      warnings: result.warnings.length,
    });

    return NextResponse.json({ docType: "cnic", ...result });
  } catch (error) {
    console.error("[extract-cnic] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
