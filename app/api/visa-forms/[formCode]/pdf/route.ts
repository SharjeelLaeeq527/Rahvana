import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canGenerateFullSmartForm } from "@/lib/forms/smartFormAccess";

/**
 * POST /api/visa-forms/{formCode}/pdf
 * Body: { data, scope?: "journey" | "standalone", journeyId?, journeyCategory?, candidateId? }
 *
 * Smart Form Filler PDF generation. The entitlement is decided HERE, not by the
 * client: without full access the backend is asked for page 1 only, whatever the
 * client wanted. The Python backend requires PDF_FILL_INTERNAL_TOKEN for a full
 * USCIS form fill, so the browser can no longer get one by calling it directly.
 * Response header `X-Pdf-Scope` is "full" or "first-page".
 */

const BACKEND_URL =
  process.env.PYTHON_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const FORM_CODE_RE = /^[a-z0-9_-]{1,40}$/;

export async function POST(request: NextRequest, { params }: { params: Promise<{ formCode: string }> }) {
  const { formCode: rawCode } = await params;
  const formCode = String(rawCode || "").toLowerCase();
  if (!FORM_CODE_RE.test(formCode)) {
    return NextResponse.json({ error: "Invalid form code" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const data = body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "data must be an object" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitors only ever get the page-1 demo.
  let full = false;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", user.id)
      .maybeSingle();
    const addons = profile?.profile_details?.purchased_addons;
    full = await canGenerateFullSmartForm(supabase, user.id, Array.isArray(addons) ? addons : [], {
      scope: body.scope,
      journeyId: typeof body.journeyId === "string" ? body.journeyId : null,
      journeyCategory: typeof body.journeyCategory === "string" ? body.journeyCategory : null,
      candidateId: typeof body.candidateId === "string" ? body.candidateId : null,
    });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.PDF_FILL_INTERNAL_TOKEN;
  if (full && token) headers["X-Internal-Token"] = token;

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/fill-pdf`, {
      method: "POST",
      headers,
      body: JSON.stringify({ formId: formCode, data, onlyFirstPage: !full }),
    });
  } catch {
    return NextResponse.json({ error: "PDF service is unreachable" }, { status: 502 });
  }

  if (!backendRes.ok) {
    return new NextResponse(await backendRes.text(), {
      status: backendRes.status >= 500 ? 502 : backendRes.status,
    });
  }

  return new NextResponse(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${formCode}_filled.pdf`,
      "Cache-Control": "no-store",
      "X-Pdf-Scope": full ? "full" : "first-page",
    },
  });
}
