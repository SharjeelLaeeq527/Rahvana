import { NextRequest, NextResponse } from "next/server";
import { runSecurityScan } from "@/lib/security/alerting";

/**
 * GET /api/cron/security-scan
 *
 * Periodic detection sweep over audit_logs. Runs the threshold checks and
 * emails an alert if anything tripped. Intended to be called by Vercel Cron
 * (see vercel.json), which sends `Authorization: Bearer <CRON_SECRET>`.
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
    const result = await runSecurityScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[security-scan] error:", err);
    return NextResponse.json({ ok: false, error: "scan_failed" }, { status: 500 });
  }
}
