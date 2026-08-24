import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parseCnicText } from "@/lib/document-ocr/cnicParser";
import { asParser, runDocExtraction } from "@/lib/document-ocr/extractPipeline";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";
import { validateUploadedFile } from "@/lib/security/file-content";

// Reads a Pakistani CNIC. The 13-digit identity number is printed clearly in Latin
// digits, so the free OCR text parse WINS for it (kept over vision). Vision fills the
// rest — including the Urdu-script full name the English OCR can't read — and recovers
// everything for an Urdu-only / low-quality card or a PDF.
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

    const checked = await validateUploadedFile(file, UPLOAD_PROFILES.ocrExtract);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: checked.status });
    }

    const safeArrayBuffer = new ArrayBuffer(checked.buffer.byteLength);

    new Uint8Array(safeArrayBuffer).set(checked.buffer);

    const safeFile = new File([safeArrayBuffer], file.name, {
      type: checked.detectedMime,
    });

    const result = await runDocExtraction({
      file: safeFile,
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
