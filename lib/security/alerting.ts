/**
 * lib/security/alerting.ts
 *
 * Turns the audit_logs "diary" into active DETECTION. Logging records events;
 * this module WATCHES those events for suspicious patterns and emails a human.
 *
 * Prevention (rate limiting) closes the door. Detection tells you if someone
 * kept trying anyway - the difference between catching abuse in minutes vs.
 * discovering it by accident months later.
 *
 * Thresholds (from the security deck):
 *   - 5+ failed logins from one IP in 5 minutes  (brute force)
 *   - 5+ failed logins for one account in 5 min  (targeted attack)
 *   - 10+ blocked/rate-limited hits from one IP  (probing / spray)
 *
 * Server-only. Uses the service-role client to read all rows (bypasses RLS).
 */

import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Config ──────────────────────────────────────────────────────────────────
const FAILED_LOGIN_WINDOW_MIN = 5;
const FAILED_LOGIN_THRESHOLD = 5;
const BLOCKED_WINDOW_MIN = 10;
const BLOCKED_THRESHOLD = 10;

// Don't email the same finding more than once per cooldown (anti-spam).
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const lastAlertedAt = new Map<string, number>();

export interface SecurityFinding {
  type: "failed_login_ip" | "failed_login_account" | "blocked_ip";
  key: string; // the IP or email that tripped the threshold
  count: number;
  threshold: number;
  windowMin: number;
}

export interface SecurityScanResult {
  generatedAt: string;
  findings: SecurityFinding[];
  alerted: boolean;
  checked: { failedLogins: number; blocked: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sinceIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

/** Count occurrences of a field value across rows. */
function tally(
  rows: Array<Record<string, unknown>>,
  pick: (row: Record<string, unknown>) => string | undefined
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = pick(row);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function alertRecipient(): string | null {
  return (
    process.env.SECURITY_ALERT_EMAIL ||
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
    null
  );
}

// ── Alert email ─────────────────────────────────────────────────────────────

async function sendSecurityAlert(findings: SecurityFinding[]): Promise<boolean> {
  // Respect cooldown per finding so we don't spam on every scan.
  const now = Date.now();
  const fresh = findings.filter((f) => {
    const sig = `${f.type}:${f.key}`;
    const last = lastAlertedAt.get(sig) ?? 0;
    if (now - last < ALERT_COOLDOWN_MS) return false;
    lastAlertedAt.set(sig, now);
    return true;
  });

  if (fresh.length === 0) return false;

  const to = alertRecipient();
  const rows = fresh
    .map(
      (f) =>
        `<tr><td>${f.type}</td><td>${f.key}</td><td>${f.count}</td><td>&ge; ${f.threshold} in ${f.windowMin}m</td></tr>`
    )
    .join("");

  const html = `
    <h2>Rahvana security alert</h2>
    <p>Suspicious activity crossed a threshold:</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Type</th><th>Source</th><th>Count</th><th>Threshold</th></tr>
      ${rows}
    </table>
    <p>Check the admin audit-logs viewer for detail. Time: ${new Date().toISOString()}</p>
  `;

  // Always log to the server console (visible even if email isn't configured).
  console.warn("[security-alert]", JSON.stringify(fresh));

  if (!to) {
    console.warn("[security-alert] No SECURITY_ALERT_EMAIL/ADMIN_EMAILS set - email skipped.");
    return false;
  }

  await sendEmail({ to, subject: `[Rahvana] Security alert: ${fresh.length} finding(s)`, html });
  return true;
}

// ── Core scan ─────────────────────────────────────────────────────────────────

/**
 * Query recent audit_logs, evaluate every threshold, and email if anything
 * tripped. Returns a summary (so an API/cron caller can show what happened).
 * Called both by the periodic cron and fire-and-forget from the login route.
 */
export interface ScanOptions {
  /** Lookback window (minutes) for failed logins. Default 5. */
  failWindowMin?: number;
  /** Failed-login count that trips an alert. Default 5. */
  failThreshold?: number;
  /** Lookback window (minutes) for blocked hits. Default 10. */
  blockedWindowMin?: number;
  /** Blocked-hit count that trips an alert. Default 10. */
  blockedThreshold?: number;
}

export async function runSecurityScan(opts: ScanOptions = {}): Promise<SecurityScanResult> {
  // Real-time trigger uses the tight defaults; a once-a-day cron passes a wide
  // 24h window (with higher thresholds) so a single daily run is still useful
  const failWindowMin = opts.failWindowMin ?? FAILED_LOGIN_WINDOW_MIN;
  const failThreshold = opts.failThreshold ?? FAILED_LOGIN_THRESHOLD;
  const blockedWindowMin = opts.blockedWindowMin ?? BLOCKED_WINDOW_MIN;
  const blockedThreshold = opts.blockedThreshold ?? BLOCKED_THRESHOLD;

  const findings: SecurityFinding[] = [];

  // 1. Failed logins
  const { data: failRows } = await supabase
    .from("audit_logs")
    .select("ip_address, metadata")
    .eq("action", "auth.login")
    .eq("status", "failure")
    .gte("created_at", sinceIso(failWindowMin))
    // Safety cap: we only tally counts against small thresholds (5-20), so we
    // never need more than a few thousand rows. Without a limit a big attack
    // window would pull every matching row into memory (extra Disk IO).
    .limit(5000);

  const fails = (failRows ?? []) as Array<Record<string, unknown>>;

  for (const [ip, count] of tally(fails, (r) => r.ip_address as string)) {
    if (count >= failThreshold) {
      findings.push({
        type: "failed_login_ip",
        key: ip,
        count,
        threshold: failThreshold,
        windowMin: failWindowMin,
      });
    }
  }

  for (const [email, count] of tally(
    fails,
    (r) => (r.metadata as { email?: string } | null)?.email
  )) {
    if (count >= failThreshold) {
      findings.push({
        type: "failed_login_account",
        key: email,
        count,
        threshold: failThreshold,
        windowMin: failWindowMin,
      });
    }
  }

  // 2. Blocked / rate-limited hits
  const { data: blockedRows } = await supabase
    .from("audit_logs")
    .select("ip_address")
    .eq("status", "blocked")
    .gte("created_at", sinceIso(blockedWindowMin))
    // Same safety cap as the failed-login query above.
    .limit(5000);

  const blocked = (blockedRows ?? []) as Array<Record<string, unknown>>;

  for (const [ip, count] of tally(blocked, (r) => r.ip_address as string)) {
    if (count >= blockedThreshold) {
      findings.push({
        type: "blocked_ip",
        key: ip,
        count,
        threshold: blockedThreshold,
        windowMin: blockedWindowMin,
      });
    }
  }

  const alerted = findings.length > 0 ? await sendSecurityAlert(findings) : false;

  return {
    generatedAt: new Date().toISOString(),
    findings,
    alerted,
    checked: { failedLogins: fails.length, blocked: blocked.length },
  };
}

// ── Retention / pruning ───────────────────────────────────────────────────────
// audit_logs is append-only and was never cleaned up, so it grew forever. The
// bigger it gets, the more disk every scan/count has to read. We delete rows
// older than the retention window (default 90 days) once a day from the cron.
export async function pruneOldAuditLogs(retentionDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("audit_logs")
    .delete()
    .lt("created_at", cutoff)
    .select("id"); // ask for ids back so we can report how many were removed

  if (error) {
    console.error("[audit-log] prune failed:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

// ── Throttled trigger (for the login hot path) ────────────────────────────────
// A brute-force flood produces many failures; we must NOT run a scan on every
// one (that would amplify DB load). Self-throttle to at most once per interval
// per instance. The periodic cron is the reliable backstop.
let lastScanAt = 0;
const SCAN_MIN_INTERVAL_MS = 30 * 1000;

export async function maybeRunSecurityScan(): Promise<SecurityScanResult | null> {
  const now = Date.now();
  if (now - lastScanAt < SCAN_MIN_INTERVAL_MS) return null;
  lastScanAt = now;
  return runSecurityScan();
}
