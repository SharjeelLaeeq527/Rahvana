import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

const VALID_REASONS = [
  "journey_completed",
  "no_longer_needed",
  "couldnt_find_needed",
  "missing_features",
  "technical_problem",
  "privacy_security_concern",
  "found_alternative",
  "other",
] as const;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await request.json();

    const { reason, additional_comments } = body;

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
      return NextResponse.json(
        { error: "Please select a valid reason for deleting your account." },
        { status: 400 }
      );
    }

    // Validate optional comments
    if (
      additional_comments !== undefined &&
      additional_comments !== null &&
      typeof additional_comments !== "string"
    ) {
      return NextResponse.json({ error: "Invalid additional comments." }, { status: 400 });
    }

    const { error: insertError } = await supabase.from("account_deletion_feedback").insert({
      user_id: user.id,
      reason,
      additional_comments: additional_comments?.trim() || null,
    });

    if (insertError) {
      console.error("[account-deletion-feedback] Insert error:", insertError);

      return NextResponse.json(
        { error: "Failed to save account deletion feedback." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account-deletion-feedback] Unexpected error:", err);

    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
