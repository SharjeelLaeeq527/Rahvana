import { NextRequest, NextResponse } from "next/server";
import { runSecurityScan } from "@/lib/security/alerting";

/**
 * GET /api/cron/security-scan
 *
 * Periodic detection sweep over audit_logs. Runs the threshold checks and
 * emails an alert if anything tripped. Intended to be called by Vercel Cron
 * (see vercel.json), which sends `Authorization: Bearer <CRON_SECRET>`.
 *
 * NOTE (Vercel Hobby/free plan): cron may only run ONCE PER DAY. So this cron
 * scans a wide 24h window (with higher thresholds) - a daily security digest.
 * Fast, near-real-time detection does NOT rely on this cron: the login route
 * itself runs a throttled scan on failed logins with tight 5-minute windows.
 * On a Pro plan you can shorten both the schedule and these windows.
 *
 * Protection: if CRON_SECRET is set, the bearer token must match. If it is not
 * set (local dev), the route is open so it can be tested - set the secret in
 * production so the endpoint cannot be triggered by anyone.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Daily digest: look back 24h, use higher thresholds so a single daily run
    // is meaningful (a 5-min window would miss almost everything once a day).
    const result = await runSecurityScan({
      failWindowMin: 1440,
      failThreshold: 20,
      blockedWindowMin: 1440,
      blockedThreshold: 30,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[security-scan] error:", err);
    return NextResponse.json({ ok: false, error: "scan_failed" }, { status: 500 });
  }
}
