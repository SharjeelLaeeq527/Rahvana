import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { portalType, type, questionId } = body;

    if (!portalType || !type) {
      return NextResponse.json(
        { error: "portalType and type required" },
        { status: 400 }
      );
    }

    const { data: credential, error } = await supabase
      .from("portal_wallet_credentials")
      .select(`
        encrypted_password,
        nvc_case_number,
        nvc_invoice_id,
        portal_wallet_security_questions (
          id,
          question,
          encrypted_answer
        )
      `)
      .eq("user_id", user.id)
      .eq("portal_type", portalType)
      .single();

    if (error || !credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    // NVC case number reveal
    if (type === "nvc_case_number") {
      const value = decrypt(credential.nvc_case_number);
    
      return NextResponse.json({
        value,
      });
    }
    
    // NVC invoice ID reveal
    if (type === "nvc_invoice_id") {
      const value = decrypt(credential.nvc_invoice_id);
    
      return NextResponse.json({
        value,
      });
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
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      const answer = decrypt(question.encrypted_answer);

      return NextResponse.json({
        value: answer,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Reveal error:", error);

    return NextResponse.json(
      { error: "Failed to reveal credentials" },
      { status: 500 }
    );
  }
}