// app/api/admin/announce-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFeatureAnnouncementEmailHtml } from "@/lib/email/resend";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";

// Specific admin emails - ONLY these emails can access admin panel
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

interface FeatureAnnouncementRequest {
  title: string;
  description: string;
  featureUrl: string;
}

async function checkAdminRole(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { isAdmin: false, error: msg(E.AUTH_UNAUTHORIZED) };
  if (!user.email || !ADMIN_EMAILS.includes(user.email))
    return { isAdmin: false, error: msg(E.AUTH_UNAUTHORIZED_ADMIN) };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { isAdmin: false, error: "Profile verification failed" };
  }

  if (!profile || profile.role !== "admin")
    return { isAdmin: false, error: msg(E.AUTH_UNAUTHORIZED_ADMIN) };

  return { isAdmin: true, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(request);
    if (!isAdmin)
      return NextResponse.json({ error: authError || "Admin access required" }, { status: 403 });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { title, description, featureUrl }: FeatureAnnouncementRequest = await request.json();

    if (!title || !description || !featureUrl)
      return NextResponse.json(
        { error: "Title, description, and feature URL are required" },
        { status: 400 }
      );

    if (title.length < 3)
      return NextResponse.json(
        { error: "Title length should be greater than 3 characters" },
        { status: 400 }
      );

    if (description.length < 10)
      return NextResponse.json(
        { error: "Description length should be greater than 10 characters" },
        { status: 400 }
      );

    const urlRegex = /^https:\/\/www\.rahvana\.com(\/[^\s]*)?$/;
    if (!urlRegex.test(featureUrl))
      return NextResponse.json(
        { error: "Invalid feature URL. Must start with https://rahvana.com" },
        { status: 400 }
      );

    // 1. Create feature announcement
    const { data: announcement, error: announcementError } = await supabase
      .from("feature_announcements")
      .insert([{ title, description, feature_url: featureUrl }])
      .select()
      .single();

    if (announcementError) {
      console.error("Error creating announcement:", announcementError);
      return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
    }

    // 2. Fetch already notified user IDs
    const { data: notifiedUsers } = await supabase
      .from("user_notifications")
      .select("user_id")
      .eq("feature_id", announcement.id);

    const notifiedIds = (notifiedUsers || []).map((u) => u.user_id);

    // 3. Fetch users who haven't been notified yet
    const { data: allUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id,email");

    if (usersError) console.error("Error fetching users:", usersError);

    const usersToNotify = (allUsers || []).filter((u) => !notifiedIds.includes(u.id));

    console.log(`Users to notify: ${usersToNotify.length}`);

    // 4. Send emails in batches
    const RATE_LIMIT = 2; // 2 emails per second
    const DELAY = 1000 / RATE_LIMIT; // milliseconds between requests

    for (let i = 0; i < usersToNotify.length; i++) {
      const user = usersToNotify[i];
      try {
        await sendEmail({
          to: user.email,
          subject: `New Feature: ${announcement.title}`,
          html: getFeatureAnnouncementEmailHtml(
            announcement.title,
            announcement.description,
            announcement.feature_url
          ),
        });

        await supabase.from("user_notifications").insert({
          user_id: user.id,
          feature_id: announcement.id,
          status: "sent",
          email_sent_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to send email to", user.email, err);
        await supabase.from("user_notifications").insert({
          user_id: user.id,
          feature_id: announcement.id,
          status: "failed",
        });
      }

      // Wait to respect rate limit
      await new Promise((resolve) => setTimeout(resolve, DELAY));
    }

    return NextResponse.json({
      success: true,
      message: `Feature announcement created and notifications sent to ${usersToNotify.length} users`,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
