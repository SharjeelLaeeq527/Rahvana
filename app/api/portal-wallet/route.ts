import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("portal_wallet_credentials")
      .select(`
        id,
        portal_type,
        username,
        created_at,
        updated_at,
        portal_wallet_security_questions (
          id,
          question
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching credentials:", error);
      return NextResponse.json(
        { error: "Failed to fetch portal credentials" },
        { status: 500 }
      );
    }

    const response =
      data?.map((cred) => ({
        id: cred.id,
        portal_type: cred.portal_type,
        username: cred.username,
        password: "••••••••",
        security_questions:
          cred.portal_wallet_security_questions?.map((q: any) => ({
            id: q.id,
            question: q.question,
            answer: "••••••",
          })) || [],
      })) || [];

    return NextResponse.json({ credentials: response });
  } catch (error) {
    console.error("Unexpected error in GET portal-wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { portalType, username, password, securityQuestions } = body;

    if (!portalType || !username || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedPassword = encrypt(password);

    const { data: credential, error } = await supabase
      .from("portal_wallet_credentials")
      .upsert(
        {
          user_id: user.id,
          portal_type: portalType,
          username,
          encrypted_password: encryptedPassword,
        },
        { onConflict: "user_id,portal_type" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving credentials:", error);
      return NextResponse.json(
        { error: "Failed to save credentials" },
        { status: 500 }
      );
    }

    if (securityQuestions?.length) {
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

    return NextResponse.json({
      success: true,
      message: "Credentials saved successfully",
    });
  } catch (error) {
    console.error("Unexpected error in POST portal-wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}