import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing unsubscribe token", { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: sub, error } = await supabase
    .from("blog_subscribers")
    .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();

  if (error || !sub) {
    return new NextResponse("Invalid or expired unsubscribe link", { status: 404 });
  }

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"><title>Unsubscribed · Rahvana</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:60px 20px; text-align:center;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; padding:40px; border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="color:#0f2e2b; margin-top:0;">You have been unsubscribed</h2>
        <p style="color:#64748b; font-size:15px; line-height:1.6;">
          <strong>${sub.email}</strong> will no longer receive new guide email notifications from Rahvana.
        </p>
        <p style="color:#94a3b8; font-size:13px; margin-top:24px;">
          You can re-subscribe anytime from the <a href="/blog" style="color:#0d7377; font-weight:600;">Rahvana Blog</a>.
        </p>
      </div>
    </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
