import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parsePassportText } from "@/lib/document-ocr/passportParser";
import { asParser, runDocExtraction } from "@/lib/document-ocr/extractPipeline";

// Reads a passport's biographic page. The MRZ (the two machine-readable lines) is the
// most reliable source, so the free OCR text parse WINS for the MRZ-derived fields;
// vision fills the photo-page-only fields (issue date, place of issue, book number)
// and recovers everything if the MRZ couldn't be read (glare / odd scan / PDF).
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// MRZ-derived fields — keep the text parse value over vision when present.
const PASSPORT_TRUSTED_TEXT_KEYS = new Set([
  "name.first",
  "name.last",
  "dateOfBirth",
  "sex",
  "nationality",
  "passportNumber",
  "passportExpiry",
  "passportCountry",
]);

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
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: MAX_UPLOAD_BYTES / (1024 * 1024) }) },
        { status: 413 }
      );
    }

    console.log(
      `[extract-passport] upload user=${authData.user.id} file=${file.name} size=${file.size}`
    );

    const result = await runDocExtraction({
      file,
      docType: "passport",
      parse: asParser(parsePassportText),
      trustedTextKeys: PASSPORT_TRUSTED_TEXT_KEYS,
    });

    console.log("[extract-passport] parsed", {
      source: result.source,
      keys: Object.keys(result.fields),
      warnings: result.warnings.length,
    });

    return NextResponse.json({ docType: "passport", ...result });
  } catch (error) {
    console.error("[extract-passport] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
