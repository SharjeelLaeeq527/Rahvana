import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail, getBlogWelcomeEmailHtml } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Check if email already exists
    const { data: existing } = await supabase
      .from("blog_subscribers")
      .select("id, status, unsubscribe_token")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing && existing.status === "active") {
      return NextResponse.json({
        success: true,
        message: "You are already subscribed to our immigration guides!",
      });
    }

    let unsubToken = existing?.unsubscribe_token;

    if (existing && existing.status === "unsubscribed") {
      // Re-activate
      const { error: updateErr } = await supabase
        .from("blog_subscribers")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (updateErr) {
        console.error("Error re-activating subscriber:", updateErr);
        return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 });
      }
    } else {
      // Insert new subscriber
      const { data: newSub, error: insertErr } = await supabase
        .from("blog_subscribers")
        .insert([{ email: cleanEmail, status: "active", source: "blog_newsletter_cta" }])
        .select("unsubscribe_token")
        .single();

      if (insertErr) {
        console.error("Error inserting subscriber:", insertErr);
        return NextResponse.json({ error: "Subscription failed. Please try again." }, { status: 500 });
      }
      unsubToken = newSub.unsubscribe_token;
    }

    // Send Welcome Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com";
    const unsubscribeUrl = `${appUrl}/api/blog/unsubscribe?token=${unsubToken}`;

    try {
      await sendEmail({
        to: cleanEmail,
        subject: "Welcome to Rahvana Knowledge Center!",
        html: getBlogWelcomeEmailHtml(unsubscribeUrl),
      });
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully! Please check your inbox for your confirmation.",
    });
  } catch (err) {
    console.error("Subscription API error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
