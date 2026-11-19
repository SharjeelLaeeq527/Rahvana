import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveJourneyScope } from "@/lib/portal-wallet/resolve-journey-scope";
import { auditLog } from "@/lib/security/audit-log";
import { E, msg } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("copy-uscis unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await req.json();
    const { targetJourneyId, targetCandidateId, sourceCredentialId } = body;

    if (!targetJourneyId) {
      return NextResponse.json({ error: "targetJourneyId is required" }, { status: 400 });
    }

    const { error: scopeError, scope } = await resolveJourneyScope(
      supabase,
      user.id,
      targetJourneyId,
      targetCandidateId
    );

    if (scopeError || !scope) {
      return scopeError!;
    }

    // Locate the source USCIS credentials
    let sourceQuery = supabase
      .from("portal_wallet_credentials")
      .select(
        `
        id,
        user_id,
        username,
        encrypted_password,
        portal_wallet_security_questions (
          question,
          encrypted_answer
        )
      `
      )
      .eq("user_id", user.id)
      .eq("portal_type", "USCIS");

    if (sourceCredentialId) {
      sourceQuery = sourceQuery.eq("id", sourceCredentialId);
    } else {
      sourceQuery = sourceQuery.order("updated_at", { ascending: false }).limit(1);
    }

    const { data: sourceCreds, error: sourceError } = await sourceQuery;
    const sourceCred = Array.isArray(sourceCreds) ? sourceCreds[0] : sourceCreds;

    if (sourceError || !sourceCred) {
      console.error("No source USCIS credentials found:", sourceError);
      return NextResponse.json(
        { error: "No saved USCIS credentials found to copy" },
        { status: 404 }
      );
    }

    // Upsert into target journey and candidate
    const { data: targetCred, error: upsertError } = await supabase
      .from("portal_wallet_credentials")
      .upsert(
        {
          user_id: user.id,
          journey_id: scope.journeyId,
          candidate_id: scope.candidateId,
          portal_type: "USCIS",
          username: sourceCred.username,
          encrypted_password: sourceCred.encrypted_password,
        },
        {
          onConflict: "user_id,journey_id,candidate_id,portal_type",
        }
      )
      .select()
      .single();

    if (upsertError || !targetCred) {
      console.error("Failed to copy USCIS credentials:", upsertError);
      return NextResponse.json({ error: "Failed to copy USCIS credentials" }, { status: 500 });
    }

    // Copy security questions
    const questions = sourceCred.portal_wallet_security_questions || [];
    if (questions.length > 0) {
      await supabase
        .from("portal_wallet_security_questions")
        .delete()
        .eq("credential_id", targetCred.id);

      const rows = questions.map((q: any) => ({
        credential_id: targetCred.id,
        question: q.question,
        encrypted_answer: q.encrypted_answer,
      }));

      const { error: qError } = await supabase
        .from("portal_wallet_security_questions")
        .insert(rows);

      if (qError) {
        console.error("Failed to copy security questions:", qError);
      }
    }

    auditLog({
      userId: user.id,
      action: "portal_wallet.copy_uscis",
      resource: "portal_wallet_credentials",
      resourceId: targetCred.id,
      request: req,
      metadata: {
        sourceCredentialId: sourceCred.id,
        targetJourneyId: scope.journeyId,
        targetCandidateId: scope.candidateId,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      credentialId: targetCred.id,
      username: targetCred.username,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/portal-wallet/copy-uscis:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
