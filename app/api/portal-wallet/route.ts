import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/encryption";
import { E, msg } from "@/lib/errors";
import { auditLog } from "@/lib/security/audit-log";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("portal-wallet GET unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("portal_wallet_credentials")
      .select(
        `
        id,
        portal_type,
        username,
        nvc_case_number,
        nvc_invoice_id,
        created_at,
        updated_at,
        portal_wallet_security_questions (
          id,
          question
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching credentials:", error);
      return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 500 });
    }

    const response =
      data?.map((cred) => ({
        id: cred.id,
        portal_type: cred.portal_type,

        username: cred.username,
        nvc_case_number:
          cred.nvc_case_number && cred.nvc_case_number.startsWith("gcm:")
            ? decrypt(cred.nvc_case_number)
            : cred.nvc_case_number,
        nvc_invoice_id:
          cred.nvc_invoice_id && cred.nvc_invoice_id.startsWith("gcm:")
            ? decrypt(cred.nvc_invoice_id)
            : cred.nvc_invoice_id,

        password: cred.portal_type === "NVC" ? null : "••••••••",

        security_questions:
          cred.portal_type === "NVC"
            ? []
            : cred.portal_wallet_security_questions?.map((q: any) => ({
                id: q.id,
                question: q.question,
                answer: "••••••",
              })) || [],
      })) || [];

    auditLog({
      userId: user.id,
      action: "portal_wallet.view",
      resource: "portal_wallet_credentials",
      request,
      metadata: { count: response.length },
      status: "success",
    });

    return NextResponse.json({ credentials: response });
  } catch (error) {
    console.error("Unexpected error in GET portal-wallet:", error);
    return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("portal-wallet POST unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await req.json();

    const { portalType, username, password, securityQuestions, nvcCaseNumber, nvcInvoiceId } = body;

    if (!portalType) {
      return NextResponse.json({ error: "Portal type required" }, { status: 400 });
      return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 400 });
    }

    const { data: existingCred } = await supabase
      .from("portal_wallet_credentials")
      .select("encrypted_password")
      .eq("user_id", user.id)
      .eq("portal_type", portalType)
      .single();

    if (portalType === "NVC") {
      if (!nvcCaseNumber || !nvcInvoiceId) {
        return NextResponse.json(
          { error: "NVC Case Number and Invoice ID required" },
          { status: 400 }
        );
        return NextResponse.json({ error: msg(E.ADMIN_INVALID_INPUT) }, { status: 400 });
      }
    } else {
      // For USCIS/COURIER, username is required. Password is required for ADD, optional for EDIT.
      if (!username || (!password && !existingCred)) {
        return NextResponse.json({ error: "Username and password required" }, { status: 400 });
        return NextResponse.json({ error: msg(E.ADMIN_INVALID_INPUT) }, { status: 400 });
      }
    }

    const encryptedPassword = password
      ? encrypt(password)
      : existingCred?.encrypted_password || null;
    const encryptedCaseNumber = nvcCaseNumber ? encrypt(nvcCaseNumber) : null;
    const encryptedInvoiceId = nvcInvoiceId ? encrypt(nvcInvoiceId) : null;

    const { data: credential, error } = await supabase
      .from("portal_wallet_credentials")
      .upsert(
        {
          user_id: user.id,
          portal_type: portalType,
          username: username || null,
          encrypted_password: encryptedPassword,
          nvc_case_number: encryptedCaseNumber,
          nvc_invoice_id: encryptedInvoiceId,
        },
        { onConflict: "user_id,portal_type" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving credentials:", error);
      return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
      return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 500 });
    }

    if (portalType !== "NVC" && securityQuestions?.length) {
      await supabase
        .from("portal_wallet_security_questions")
        .delete()
        .eq("credential_id", credential.id);

      const rows = securityQuestions.map((q: any) => ({
        credential_id: credential.id,
        question: q.question,
        encrypted_answer: encrypt(q.answer),
      }));

      const { error: questionError } = await supabase
        .from("portal_wallet_security_questions")
        .insert(rows);

      if (questionError) {
        console.error("Error saving questions:", questionError);
      }
    }

    auditLog({
      userId: user.id,
      action: "portal_wallet.save",
      resource: "portal_wallet_credentials",
      resourceId: credential.id,
      request: req,
      metadata: { portalType },
      status: "success",
    });

    return NextResponse.json({ success: true, credentialId: credential.id });
  } catch (error) {
    console.error("Unexpected error in POST portal-wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 500 });
  }
}
