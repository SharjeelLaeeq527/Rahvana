import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { parseDivorceText } from "@/lib/document-ocr/divorceParser";
import { asParser, runDocExtraction } from "@/lib/document-ocr/extractPipeline";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";
import { validateUploadedFile } from "@/lib/security/file-content";

// Reads a prior-marriage proof (divorce decree / Union Council divorce certificate /
// death certificate of a former spouse) for relationship.priorMarriage.* keys. Like
// the marriage cert it is dense / often bilingual with no machine-readable anchor, so
// vision is the authority and overwrites the free OCR text parse (no trusted text keys).

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error("[extract-divorce] Authentication failed:", authError);
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
      docType: "divorce",
      parse: asParser(parseDivorceText),
    });

    console.log("[extract-divorce] parsed", {
      source: result.source,
      keys: Object.keys(result.fields),
      warnings: result.warnings.length,
    });

    return NextResponse.json({ docType: "divorce", ...result });
  } catch (error) {
    console.error("[extract-divorce] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.UPLOAD_PROCESSING_FAILED) }, { status: 500 });
  }
}
