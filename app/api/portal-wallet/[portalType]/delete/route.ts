import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveJourneyScope } from "@/lib/portal-wallet/resolve-journey-scope";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ portalType: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { portalType } = await context.params;

    if (!portalType) {
      return NextResponse.json({ error: "portalType is required" }, { status: 400 });
    }

    // Resolve and validate the journey and candidate scope.
    const { error: scopeError, scope } = await resolveJourneyScope(
      supabase,
      user.id,
      req.nextUrl.searchParams.get("journeyId"),
      req.nextUrl.searchParams.get("candidateId")
    );

    if (scopeError || !scope) {
      return scopeError!;
    }

    // Find the credential within this specific journey and candidate.
    const { data: credential, error: fetchError } = await supabase
      .from("portal_wallet_credentials")
      .select("id")
      .eq("user_id", user.id)
      .eq("journey_id", scope.journeyId)
      .eq("candidate_id", scope.candidateId)
      .eq("portal_type", portalType)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching credential for deletion:", fetchError);

      return NextResponse.json({ error: "Failed to fetch credential" }, { status: 500 });
    }

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    if (fetchError || !credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    // Delete security questions first.
    const { error: questionDeleteError } = await supabase
      .from("portal_wallet_security_questions")
      .delete()
      .eq("credential_id", credential.id);

    if (questionDeleteError) {
      console.error("Error deleting security questions:", questionDeleteError);

      return NextResponse.json(
        { error: "Failed to delete credential security questions" },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabase
      .from("portal_wallet_credentials")
      .delete()
      .eq("id", credential.id)
      .eq("user_id", user.id)
      .eq("journey_id", scope.journeyId)
      .eq("candidate_id", scope.candidateId);

    if (deleteError) {
      console.error("Error deleting credential:", deleteError);

      return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Credential deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error deleting credential:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
