import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ portalType: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      `,
      )
      .eq("user_id", user.id)
      .eq("portal_type", (await context.params).portalType)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 },
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
