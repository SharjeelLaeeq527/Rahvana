import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";
import { resolveJourneyScope } from "@/lib/portal-wallet/resolve-journey-scope";

export async function GET(req: Request, context: { params: Promise<{ portalType: string }> }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("portal-wallet [portalType] GET unauthorized");
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const { portalType } = await context.params;

    const url = new URL(req.url);

    const { error: scopeError, scope } = await resolveJourneyScope(
      supabase,
      user.id,
      url.searchParams.get("journeyId"),
      url.searchParams.get("candidateId")
    );

    if (scopeError || !scope) {
      return scopeError!;
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
    portal_wallet_security_questions (
      id,
      question
    )
  `
      )
      .eq("user_id", user.id)
      .eq("journey_id", scope.journeyId)
      .eq("candidate_id", scope.candidateId)
      .eq("portal_type", portalType)
      .maybeSingle();

    if (error || !data) {
      console.error("portal-wallet credential not found:", error);
      return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 404 });
    }

    const response = {
      ...data,
      password: data.portal_type === "NVC" ? null : "••••••••",
      security_questions:
        data.portal_type === "NVC"
          ? []
          : data.portal_wallet_security_questions?.map((q: any) => ({
              id: q.id,
              question: q.question,
              answer: "••••••",
            })) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching portal:", error);
    return NextResponse.json({ error: msg(E.PORTAL_WALLET_FETCH_FAILED) }, { status: 500 });
  }
}
