import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getBlogAnnouncementEmailHtml } from "@/lib/email/resend";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";
import { getArticleBySlug, ARTICLES } from "@/data/articles";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

async function checkAdminRole(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { isAdmin: false, error: msg(E.AUTH_UNAUTHORIZED), user: null };
  if (!user.email || !ADMIN_EMAILS.includes(user.email))
    return { isAdmin: false, error: msg(E.AUTH_UNAUTHORIZED_ADMIN), user: null };

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
    return { isAdmin: false, error: "Profile verification failed", user: null };
  }

  if (!profile || profile.role !== "admin")
    return { isAdmin: false, error: msg(E.AUTH_UNAUTHORIZED_ADMIN), user: null };

  return { isAdmin: true, error: null, user };
}

// GET: Returns active subscriber count and available articles for admin modal
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await checkAdminRole(request);
  if (!isAdmin) return NextResponse.json({ error }, { status: 403 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { count } = await supabase
    .from("blog_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const articlesSummary = ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
    readTime: a.readTime,
    updatedAt: a.updatedAt,
  }));

  return NextResponse.json({
    activeSubscribers: count || 0,
    articles: articlesSummary,
  });
}

// POST: Broadcasts guide to active subscribers with batching and rate limiting
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, error: authError, user: adminUser } = await checkAdminRole(request);
    if (!isAdmin) return NextResponse.json({ error: authError || "Admin access required" }, { status: 403 });

    const { slug, customTitle, customDescription, isTestOnly } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Article slug is required" }, { status: 400 });
    }

    const article = getArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: `Article with slug '${slug}' not found` }, { status: 404 });
    }

    const title = customTitle || article.title;
    const description = customDescription || article.bluf || article.description;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com";
    const articleUrl = `${appUrl}/blog/${article.slug}`;

    // Test send preview only
    if (isTestOnly) {
      await sendEmail({
        to: adminUser?.email || "admin@rahvana.com",
        subject: `[TEST PREVIEW] New Guide: ${title}`,
        html: getBlogAnnouncementEmailHtml({
          title,
          description,
          articleUrl,
          category: article.category,
          readTime: article.readTime,
          unsubscribeUrl: `${appUrl}/api/blog/unsubscribe?token=test-token`,
        }),
      });

      return NextResponse.json({ success: true, message: `Test email sent to ${adminUser?.email}` });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // 1. Fetch already notified subscriber IDs for this article
    const { data: alreadyLogged } = await supabase
      .from("blog_broadcast_logs")
      .select("subscriber_id")
      .eq("article_slug", slug);

    const notifiedIds = new Set((alreadyLogged || []).map((l) => l.subscriber_id));

    // 2. Fetch active subscribers ONLY
    const { data: subscribers, error: subError } = await supabase
      .from("blog_subscribers")
      .select("id, email, unsubscribe_token")
      .eq("status", "active");

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

    const targets = (subscribers || []).filter((s) => !notifiedIds.has(s.id));

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All active subscribers have already received this guide notification.",
        totalSubscribers: subscribers?.length || 0,
        sent: 0,
      });
    }

    // 3. Send emails in batches respecting rate limit (2 emails/sec)
    const RATE_LIMIT = 2;
    const DELAY = 1000 / RATE_LIMIT;
    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const sub = targets[i];
      const unsubscribeUrl = `${appUrl}/api/blog/unsubscribe?token=${sub.unsubscribe_token}`;

      try {
        await sendEmail({
          to: sub.email,
          subject: `New Immigration Guide: ${title}`,
          html: getBlogAnnouncementEmailHtml({
            title,
            description,
            articleUrl,
            category: article.category,
            readTime: article.readTime,
            unsubscribeUrl,
          }),
        });

        await supabase.from("blog_broadcast_logs").insert({
          subscriber_id: sub.id,
          article_slug: slug,
          status: "sent",
        });
        sentCount++;
      } catch (err: unknown) {
        console.error("Failed to send blog email to", sub.email, err);
        await supabase.from("blog_broadcast_logs").insert({
          subscriber_id: sub.id,
          article_slug: slug,
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
        });
        failCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, DELAY));
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast complete! Successfully sent to ${sentCount} subscriber(s). Failed: ${failCount}`,
      sent: sentCount,
      failed: failCount,
    });
  } catch (error) {
    console.error("Admin blog broadcast error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
