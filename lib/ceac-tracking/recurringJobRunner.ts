// ============================================================
// lib/ceac-tracking/recurringJobRunner.ts
//
// Processes pending CEAC notifications whose fire_at has passed.
// Two entry points:
//
//   1. runCeacNotificationJob()
//      — Called from GET /api/cron/ceac-reminders (EasyCron, every 6hrs)
//      — Also registered as a node-cron job on server start
//
//   2. processSingleNotification(notif)  [private helper]
//      — Sends the notification, re-enqueues recurring ones
//
// Suppression is checked BEFORE each send — if the status has
// advanced past the reminder's trigger group, the row is cancelled
// instead of sent.
// ============================================================

// node-cron is NOT used in production (Next.js/Vercel has no persistent process).
// Production trigger = EasyCron calls GET /api/cron/ceac-reminders every 6 hours.
// import cron from 'node-cron'  ← disabled
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { CeacReminderEngine } from "./CeacReminderEngine";
import { UnifiedReminderEngine } from "@/lib/notifications/UnifiedReminderEngine";
import { getReminderById } from "@/lib/notifications/reminderRegistry";
import type { CeacScheduledNotification } from "./types";
import { getJourneyHrefByType } from "@/lib/constants/routes";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────────
// Supabase admin client (service role — bypasses RLS)
// ─────────────────────────────────────────────────────────────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN JOB — processes all due notifications
// Returns a summary object (used by the API cron route response)
// ─────────────────────────────────────────────────────────────

export async function runCeacNotificationJob(): Promise<{
  processed: number;
  sent: number;
  cancelled: number;
  failed: number;
}> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const stats = { processed: 0, sent: 0, cancelled: 0, failed: 0 };

  // Fetch all pending notifications whose fire_at has passed
  // Limit 100 per run to prevent timeout — EasyCron runs every 6hrs so backlog is small
  const { data: due, error } = await supabase
    .from("ceac_scheduled_notifications")
    .select("*")
    .eq("status", "pending")
    .lte("fire_at", now)
    .order("fire_at", { ascending: true })
    .limit(100);

  if (error || !due || due.length === 0) return stats;

  // Process each due notification (both CEAC and journey origin)
  for (const notif of due as (CeacScheduledNotification & {
    reminder_origin?: string;
    step_trigger_key?: string;
  })[]) {
    stats.processed++;

    try {
      // ── Suppression check — use the right engine per origin ──
      const isJourneyReminder = (notif as any).reminder_origin === "journey";

      if (isJourneyReminder) {
        const unifiedEngine = new UnifiedReminderEngine(supabase);
        await unifiedEngine.runSuppression(notif.journey_id);
      } else {
        const ceacEngine = new CeacReminderEngine(supabase);
        await ceacEngine.suppressionEngine(notif.journey_id);
      }

      // Re-fetch to see if suppression cancelled this specific row
      const { data: refreshed } = await supabase
        .from("ceac_scheduled_notifications")
        .select("status")
        .eq("id", notif.id)
        .single();

      if (refreshed?.status === "cancelled") {
        stats.cancelled++;
        continue;
      }

      // ── Deliver the notification ─────────────────────────────
      await _deliverNotification(supabase, notif);

      // ── Mark as sent ─────────────────────────────────────────
      await supabase
        .from("ceac_scheduled_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          recurrence_count: notif.recurrence_count + 1,
        })
        .eq("id", notif.id);

      stats.sent++;

      // ── Re-enqueue recurring reminders ────────────────────────
      // Check maxCount from registry for journey reminders
      if (notif.is_recurring && notif.interval_days) {
        let shouldRequeue = true;

        if (isJourneyReminder) {
          const def = getReminderById(notif.reminder_id);
          const maxCount = def?.recurring?.maxCount;
          if (maxCount != null && notif.recurrence_count + 1 >= maxCount) {
            shouldRequeue = false;
          }
        }

        if (shouldRequeue) {
          const nextFireAt = new Date();
          nextFireAt.setDate(nextFireAt.getDate() + notif.interval_days);

          await supabase.from("ceac_scheduled_notifications").insert({
            journey_id: notif.journey_id,
            reminder_id: notif.reminder_id,
            trigger_group: notif.trigger_group,
            reminder_type: notif.reminder_type,
            title: notif.title,
            message: notif.message,
            channel: notif.channel,
            fire_at: nextFireAt.toISOString(),
            status: "pending",
            is_recurring: true,
            interval_days: notif.interval_days,
            recurrence_count: notif.recurrence_count + 1,
            reminder_origin: (notif as any).reminder_origin ?? "ceac",
            step_trigger_key: (notif as any).step_trigger_key ?? null,
          });
        }
      }
    } catch (err: any) {
      // Log failure — mark as failed but do NOT crash the loop
      await supabase
        .from("ceac_scheduled_notifications")
        .update({ status: "failed", last_error: String(err?.message ?? err) })
        .eq("id", notif.id);

      stats.failed++;
      console.error(`[CeacJob] Failed to process notification ${notif.id}:`, err);
    }
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────
// DELIVERY
// Every notification does TWO things:
//   1. Saves to journey_reminders → appears in the bell icon inside the app
//   2. Sends email via Resend (only for URGENT / push_and_email channel)
//
// No external push provider needed — in-app + email is production-ready.
// ─────────────────────────────────────────────────────────────

async function _deliverNotification(
  supabase: ReturnType<typeof getAdminClient>,
  notif: CeacScheduledNotification
): Promise<void> {
  // Fetch user_id + email + journey type for this journey in one query
  const { data: journeyRow } = await supabase
    .from("journeys")
    .select("user_id, journey_type")
    .eq("id", notif.journey_id)
    .single();

  let userEmail: string | null = null;
  if (journeyRow?.user_id) {
    const { data: authData } = await supabase.auth.admin.getUserById(journeyRow.user_id);
    userEmail = authData?.user?.email ?? null;
  }

  // ── 1. In-app notification (bell icon in the app) ────────────
  const isJourneyOrigin = (notif as any).reminder_origin === "journey";
  const def = isJourneyOrigin ? getReminderById(notif.reminder_id) : null;

  const stepKey = isJourneyOrigin
    ? ((notif as any).step_trigger_key ?? def?.actionUrl ?? null)
    : "step_3_9";

  const priority: "critical" | "high" | "normal" | "low" =
    notif.reminder_type === "URGENT"
      ? "high"
      : notif.reminder_type === "ACTION"
        ? "high"
        : (def?.priority ?? "normal");

  const defaultActionUrl = getJourneyHrefByType(journeyRow?.journey_type);

  await supabase.from("journey_reminders").upsert(
    {
      journey_id: notif.journey_id,
      reminder_type: isJourneyOrigin ? "step_pending_too_long" : "ceac_status_update",
      priority,
      title: notif.title,
      body: notif.message,
      step_key: stepKey,
      action_url:
        def?.actionUrl === undefined || def?.actionUrl === null
          ? defaultActionUrl
          : def?.actionUrl,
      action_label: def?.actionLabel ?? "View in Journey",
      is_dismissed: false,
      dedup_key: `${notif.journey_id}:${isJourneyOrigin ? "journey" : "ceac"}:${notif.reminder_id}:${notif.recurrence_count}`,
    },
    { onConflict: "dedup_key", ignoreDuplicates: true }
  );

  // ── 2. Email (only for URGENT reminders — push_and_email channel) ──
  if (notif.channel === "push_and_email" && userEmail) {
    await resend.emails.send({
      from: "Rahvana <noreply@rahvana.com>",
      to: userEmail,
      subject: notif.title,
      html: _buildEmailHtml(notif.title, notif.message, notif.reminder_type, journeyRow?.journey_type),
    });
  }
}

// ─────────────────────────────────────────────────────────────
// EMAIL HTML BUILDER — minimal, clean template
// ─────────────────────────────────────────────────────────────

function _buildEmailHtml(title: string, message: string, type: string, journeyType?: string | null): string {
  const urgentColor = type === "URGENT" ? "#dc2626" : "#2563eb";
  const rawType = journeyType ?? "IR1";
  const formattedType = rawType.trim().toUpperCase().replace(/^(IR|CR)(\d)$/, "$1-$2");
  const actionUrl = getJourneyHrefByType(journeyType);
  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://rahvana.com"}${actionUrl}`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#0c1b33;border-radius:12px;padding:20px 24px;margin-bottom:20px">
        <p style="color:#ffffff80;font-size:11px;font-weight:700;text-transform:uppercase;
                  letter-spacing:.1em;margin:0 0 6px">Rahvana · ${formattedType} Journey Update</p>
        <h1 style="color:#ffffff;font-size:20px;font-weight:900;margin:0;line-height:1.3">
          ${title}
        </h1>
      </div>
      <p style="color:#3a4f63;font-size:14px;line-height:1.7;margin:0 0 24px">
        ${message}
      </p>
      <a href="${fullUrl}"
         style="display:inline-block;background:${urgentColor};color:#fff;font-size:13px;
                font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none">
        Open Rahvana →
      </a>
      <p style="color:#9ca3af;font-size:11px;margin-top:32px">
        You are receiving this because you have an active ${formattedType} journey on Rahvana.
      </p>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// PRODUCTION TRIGGER = EasyCron
// EasyCron calls GET /api/cron/ceac-reminders every 6 hours.
// That route calls runCeacNotificationJob() above.
// No node-cron needed — works on Vercel/serverless perfectly.
//
// EasyCron setup (one-time, already done for update-tracking):
//   URL:     https://your-domain.com/api/cron/ceac-reminders
//   Method:  GET
//   Header:  X-Cron-Secret: [your CRON_SECRET env value]
//   Schedule: Every 6 hours
// ─────────────────────────────────────────────────────────────
