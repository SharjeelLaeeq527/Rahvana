import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import {
  USCIS_BASE_URL,
  getUscisAccessToken,
  uscisPortalHeaders,
  invalidateUscisToken,
} from "@/lib/uscis/portalClient";
import {
  buildUscisDocumentPayload,
  UscisDocumentError,
  type UscisDocumentInput,
  type UscisDocumentPayload,
} from "@/lib/uscis/documentUpload";

// Path of the portal's document-submit endpoint for our registered app.
// The portal issues this with your app credentials (per the demo checklist);
// until it is configured we fail gracefully instead of guessing a URL.
const DOC_SUBMIT_PATH = process.env.USCIS_DOC_SUBMIT_PATH ?? "";

/** Forward a USCIS portal error (4xx/5xx) as a clean, structured 4xx to the UI. */
async function portalErrorResponse(res: Response): Promise<NextResponse> {
  const body = await res.json().catch(() => null);
  const status = res.status === 401 ? 502 : res.status; // our token failed upstream → our-side gateway error
  return NextResponse.json(
    {
      error: {
        code: body?.code ?? res.status,
        message:
          body?.message ?? "USCIS returned an error while processing the document upload.",
      },
    },
    { status }
  );
}

/**
 * POST /api/uscis-case-status/documents
 *
 * Accepts { fileName, fileType, fileContent } (Base64, no data-URL prefix),
 * validates it against the USCIS Developer Portal attachment criteria, and
 * submits it to the portal as the required encoded JSON payload:
 *   { document: { fileName, fileType, fileContent } }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    if (!DOC_SUBMIT_PATH) {
      return NextResponse.json(
        {
          error: {
            code: 501,
            message:
              "USCIS document submission is not configured yet (USCIS_DOC_SUBMIT_PATH is missing).",
          },
        },
        { status: 501 }
      );
    }

    const input = (await req.json()) as UscisDocumentInput;

    let payload: UscisDocumentPayload;
    try {
      payload = buildUscisDocumentPayload(input);
    } catch (err) {
      if (err instanceof UscisDocumentError) {
        return NextResponse.json({ error: { code: err.status, message: err.message } }, {
          status: err.status,
        });
      }
      throw err;
    }

    let accessToken = await getUscisAccessToken();
    let uscisRes = await fetch(`${USCIS_BASE_URL}${DOC_SUBMIT_PATH}`, {
      method: "POST",
      headers: {
        ...uscisPortalHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Expired-token recovery: refresh once and retry transparently.
    if (uscisRes.status === 401) {
      invalidateUscisToken();
      accessToken = await getUscisAccessToken();
      uscisRes = await fetch(`${USCIS_BASE_URL}${DOC_SUBMIT_PATH}`, {
        method: "POST",
        headers: {
          ...uscisPortalHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!uscisRes.ok) {
      console.error("USCIS Document Upload Error:", {
        status: uscisRes.status,
        fileName: payload.document.fileName,
      });
      return portalErrorResponse(uscisRes);
    }

    const data = await uscisRes.json().catch(() => ({}));

    // Never echo the Base64 content back to the client.
    return NextResponse.json({
      ok: true,
      fileName: payload.document.fileName,
      fileType: payload.document.fileType,
      sizeBytes: Math.floor((payload.document.fileContent.length * 3) / 4),
      receipt: data?.receipt ?? data?.documentId ?? data?.id ?? null,
      data,
    });
  } catch (err: unknown) {
    console.error("USCIS Document Upload Route Error:", err);
    return NextResponse.json(
      {
        error: {
          code: 500,
          message: err instanceof Error ? err.message : msg(E.USCIS_UNEXPECTED_ERROR),
        },
      },
      { status: 500 }
    );
  }
}
