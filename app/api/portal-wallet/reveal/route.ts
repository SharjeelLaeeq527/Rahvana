import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { E, msg } from "@/lib/errors";

const revealEncryptedValue = (value: string | null) => {
  if (!value) return "";
  return value.startsWith("gcm:") ? decrypt(value) : value;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await req.json();
    const { portalType, type, questionId, credentialId, candidateId } = body;

    if (!portalType || !type) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[portalType, type]" }) },
        { status: 400 }
      );
    }

    let query = supabase
      .from("portal_wallet_credentials")
      .select(
        `
        id,
        encrypted_password,
        nvc_case_number,
        nvc_invoice_id,
        portal_wallet_security_questions (
          id,
          question,
          encrypted_answer
        )
      `
      )
      .eq("user_id", user.id)
      .eq("portal_type", portalType);

    if (credentialId) {
      query = query.eq("id", credentialId);
    } else if (candidateId) {
      if (candidateId === "ir1") {
        query = query.or("candidate_id.eq.ir1,candidate_id.is.null");
      } else {
        query = query.eq("candidate_id", candidateId);
      }
    }

    const { data: credential, error } = await query.maybeSingle();

    if (error || !credential) {
      // Return 200 with null instead of 404 to avoid console errors in the browser
      // when a user hasn't saved credentials yet.
      return NextResponse.json(
        { value: null, details: null, message: "Credentials not found" },
        { status: 200 }
      );
    }

    // Return all details for dashboard
    if (type === "all_details") {
      return NextResponse.json({
        details: {
          nvcCaseNum: revealEncryptedValue(credential.nvc_case_number),
          nvcInvoice: revealEncryptedValue(credential.nvc_invoice_id),
        },
      });
    }

    // FULL EDIT REVEAL (for editing credentials)
    if (type === "full_edit") {
      const password = credential.encrypted_password
        ? decrypt(credential.encrypted_password)
        : "";
      const securityQuestions =
        credential.portal_wallet_security_questions?.map((q: any) => ({
          id: q.id,
          question: q.question,
          answer: q.encrypted_answer ? decrypt(q.encrypted_answer) : "",
        })) || [];

      return NextResponse.json({
        password,
        securityQuestions,
      });
    }

    // NVC case number reveal
    if (type === "nvc_case_number") {
      const value = revealEncryptedValue(credential.nvc_case_number);
      return NextResponse.json({ value });
    }

    // NVC invoice ID reveal
    if (type === "nvc_invoice_id") {
      const value = revealEncryptedValue(credential.nvc_invoice_id);
      return NextResponse.json({ value });
    }

    // PASSWORD REVEAL
    if (type === "password") {
      const password = decrypt(credential.encrypted_password);

      return NextResponse.json({
        value: password,
      });
    }

    // ANSWER REVEAL
    if (type === "answer") {
      const question = credential.portal_wallet_security_questions?.find(
        (q: any) => q.id === questionId
      );

      if (!question) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }

      const answer = decrypt(question.encrypted_answer);

      return NextResponse.json({
        value: answer,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Reveal error:", error);

    return NextResponse.json({ error: "Failed to reveal credentials" }, { status: 500 });
  }
}
