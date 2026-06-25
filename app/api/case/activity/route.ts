// app/api/case/activity/route.ts
// GET ?journeyId=&page=&pageSize=&aggregationWindowMinutes= - shared case activity feed.
// Raw audit rows stay append-only; aggregation is presentation-only.

import { NextRequest, NextResponse } from "next/server";
import { verifyJourneyAccess, errorResponse, successResponse } from "@/lib/api/journey-auth";
import { getAdminClient } from "@/lib/case-collaboration/helpers";

const ACTIVITY_PAGE_SIZE = 25;
const QUERY_BATCH_SIZE = 1000;
const DEFAULT_AGGREGATION_WINDOW_MINUTES = 5;
const MAX_AGGREGATION_WINDOW_MINUTES = 60;

const CATEGORY_ACTIONS = {
  documents: ["document.upload", "document.delete", "document.update"],
  forms: ["form.save", "form.complete"],
  steps: ["step.complete", "step.reopen"],
  roles: ["role.assign"],
} as const;

interface ActivityRow {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  target_label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ActorIdentity {
  name: string | null;
  email: string | null;
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function parsePageSize(value: string | null): number {
  const parsed = parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : ACTIVITY_PAGE_SIZE;
}

function categoryForAction(action: string): keyof typeof CATEGORY_ACTIONS | "other" {
  for (const [category, actions] of Object.entries(CATEGORY_ACTIONS)) {
    if ((actions as readonly string[]).includes(action)) {
      return category as keyof typeof CATEGORY_ACTIONS;
    }
  }

  return "other";
}

function targetKey(row: ActivityRow): string {
  const metadata = row.metadata ?? {};
  const stableTarget =
    metadata.document_id ??
    metadata.document_def_id ??
    metadata.form_code ??
    metadata.step_key ??
    metadata.chosen_role ??
    row.target_label ??
    "";

  return String(stableTarget);
}

function aggregateRows(
  rows: ActivityRow[],
  actorById: Map<string, ActorIdentity>,
  currentUserId: string,
  windowMinutes: number
) {
  const windowMs = windowMinutes * 60 * 1000;
  const groups: Array<{
    rows: ActivityRow[];
    newestMs: number;
    key: string;
  }> = [];

  for (const row of rows) {
    const createdMs = new Date(row.created_at).getTime();
    const safeCreatedMs = Number.isNaN(createdMs) ? 0 : createdMs;
    const key = [row.actor_user_id ?? "unknown", row.action, targetKey(row)].join("|");
    const latestGroup = groups[groups.length - 1];

    if (
      latestGroup &&
      latestGroup.key === key &&
      latestGroup.newestMs - safeCreatedMs <= windowMs
    ) {
      latestGroup.rows.push(row);
    } else {
      groups.push({
        rows: [row],
        newestMs: safeCreatedMs,
        key,
      });
    }
  }

  return groups.map((group) => {
    const newest = group.rows[0];
    const actor = newest.actor_user_id ? actorById.get(newest.actor_user_id) : null;

    return {
      id: newest.id,
      action: newest.action,
      category: categoryForAction(newest.action),
      actorRole: newest.actor_role,
      targetLabel: newest.target_label,
      metadata: newest.metadata ?? {},
      createdAt: newest.created_at,
      lastActivityAt: group.rows[group.rows.length - 1]?.created_at ?? newest.created_at,
      actorUserId: newest.actor_user_id,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      isYou: newest.actor_user_id === currentUserId,
      aggregateCount: group.rows.length,
      activityIds: group.rows.map((row) => row.id),
    };
  });
}

async function fetchAllActivityRows(
  admin: ReturnType<typeof getAdminClient>,
  journeyId: string
): Promise<{ rows: ActivityRow[]; error: unknown }> {
  const rows: ActivityRow[] = [];
  let from = 0;

  while (true) {
    const to = from + QUERY_BATCH_SIZE - 1;
    const { data, error } = await admin
      .from("case_activity")
      .select("id, actor_user_id, actor_role, action, target_label, metadata, created_at")
      .eq("journey_id", journeyId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return { rows, error };

    const batch = (data as ActivityRow[]) || [];
    rows.push(...batch);

    if (batch.length < QUERY_BATCH_SIZE) {
      return { rows, error: null };
    }

    from += QUERY_BATCH_SIZE;
  }
}

export async function GET(req: NextRequest) {
  try {
    const journeyId = req.nextUrl.searchParams.get("journeyId") || "";
    if (!journeyId) {
      return NextResponse.json(errorResponse("VALIDATION", "journeyId is required"), {
        status: 400,
      });
    }

    const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
    const pageSize = parsePageSize(req.nextUrl.searchParams.get("pageSize"));
    const aggregationWindowMinutes = parsePositiveInt(
      req.nextUrl.searchParams.get("aggregationWindowMinutes") ||
        process.env.CASE_ACTIVITY_AGGREGATION_WINDOW_MINUTES ||
        "",
      DEFAULT_AGGREGATION_WINDOW_MINUTES,
      MAX_AGGREGATION_WINDOW_MINUTES
    );

    const access = await verifyJourneyAccess(journeyId);
    if (access.error) return access.error;
    const { user } = access;

    const admin = getAdminClient();

    const [activityRes, collabRes] = await Promise.all([
      fetchAllActivityRows(admin, journeyId),
      admin
        .from("case_collaborators")
        .select("user_id, membership_role, case_role")
        .eq("journey_id", journeyId)
        .eq("status", "active"),
    ]);

    if (activityRes.error) {
      console.error("[case/activity] activity query error:", activityRes.error);
      return NextResponse.json(errorResponse("INTERNAL", "Could not load activity"), {
        status: 500,
      });
    }

    const rows = activityRes.rows;

    const actorIds = Array.from(
      new Set(rows.map((r) => r.actor_user_id).filter((id): id is string => !!id))
    );
    const actorById = new Map<string, ActorIdentity>();

    if (actorIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", actorIds);

      for (const profile of (profiles as Array<Record<string, unknown>>) || []) {
        actorById.set(profile.id as string, {
          name: ((profile.full_name as string | null) || "").trim() || null,
          email: ((profile.email as string | null) || "").trim() || null,
        });
      }
    }

    await Promise.all(
      actorIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        const existing = actorById.get(id) ?? { name: null, email: null };
        const metadataName =
          ((data?.user?.user_metadata?.full_name as string | undefined) || "").trim() ||
          ((data?.user?.user_metadata?.name as string | undefined) || "").trim() ||
          null;

        actorById.set(id, {
          name: existing.name ?? metadataName,
          email: existing.email ?? data?.user?.email ?? null,
        });
      })
    );

    const aggregatedActivity = aggregateRows(rows, actorById, user.id, aggregationWindowMinutes);
    const totalAggregatedItems = aggregatedActivity.length;
    const totalPages = Math.max(1, Math.ceil(totalAggregatedItems / pageSize));
    const normalizedPage = Math.min(page, totalPages);
    const pageStart = (normalizedPage - 1) * pageSize;
    const activity = aggregatedActivity.slice(pageStart, pageStart + pageSize);

    const members = ((collabRes.data as Array<Record<string, unknown>>) || []).map((c) => ({
      userId: c.user_id as string,
      membershipRole: c.membership_role as string,
      caseRole: (c.case_role as string) ?? null,
      isYou: (c.user_id as string) === user.id,
    }));

    return NextResponse.json(
      successResponse({
        activity,
        members,
        pagination: {
          page: normalizedPage,
          pageSize,
          totalItems: totalAggregatedItems,
          totalPages,
          hasPreviousPage: normalizedPage > 1,
          hasNextPage: normalizedPage < totalPages,
          returnedCount: activity.length,
          rawAuditCount: rows.length,
        },
        aggregation: {
          windowMinutes: aggregationWindowMinutes,
        },
      })
    );
  } catch (error) {
    console.error("[case/activity] GET error:", error);
    return NextResponse.json(errorResponse("INTERNAL", "Unexpected error"), { status: 500 });
  }
}
