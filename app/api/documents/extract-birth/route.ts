import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parseBirthCertText } from "@/lib/document-ocr/birthCertParser";
import { asParser, runDocExtraction } from "@/lib/document-ocr/extractPipeline";
import { validateUploadedFile } from "@/lib/security/file-content";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";

// Reads a birth certificate (NADRA cert / Form-B / translated template). No
// machine-readable anchor and often bilingual/template-based, so the free OCR text
// parse is unreliable (it slides headings like "PROVINCE OF…" into the name slots) —
// vision is the authority and overwrites it (no trusted text keys).

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
      docType: "birth",
      parse: asParser(parseBirthCertText),
    });

    console.log("[extract-birth] parsed", {
      source: result.source,
      keys: Object.keys(result.fields),
      warnings: result.warnings.length,
    });

    return NextResponse.json({ docType: "birth", ...result });
  } catch (error) {
    console.error("[extract-birth] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
