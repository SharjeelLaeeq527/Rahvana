// app/api/candidate/create/route.ts
// ============================================================================
// Create or update a candidate on user_profiles.profile_details.candidates.
//
// Create:  { candidate: { relation, visaCategory?, fullName? }, activate?: boolean }
// Update:  { action: "update", candidateId, updates: { ...editable fields } }
//
// The server owns identity and billing: it assigns `id` (one above the highest id ever
// issued, never reused), `categorySlot` (lowest free slot in the category pool whose
// journey key holds no leftover data), `label`, `isPrimary`, `tier` ("free") and
// `isPreview`. Client values for those are ignored on create AND on update.
//
// Business rules:
//  - Only ONE spouse (IR-1 / CR-1 pool) per petitioner.
//  - Several IR-5 parents / IR-2 + CR-2 children are allowed.
// The roster is written with the service-role client after auth: it is a server-owned
// profile key (S1, migration 20261113_01).
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import type { CandidateProfile, CandidateRelation } from "@/types/candidate";
import {
  createNewCandidate,
  getVisaCategoryForRelation,
} from "@/lib/candidate/candidateSyncService";
import {
  candidateIdNumber,
  getJourneyKeyForCandidate,
  isSamePool,
  slotPool,
} from "@/lib/candidate/candidateKeys";
import {
  CANDIDATE_ID_HIGH_WATER_KEY,
  loadAllocationState,
} from "@/lib/candidate/candidateAllocation";
import { UNKNOWN_VISA_CATEGORY } from "@/lib/candidate/visaCategory";
import { journeyService } from "@/lib/journey/service";
import { hasJourneyConfig, journeyConfigPathFor } from "@/lib/journey/journeyConfig";

const RELATIONS: ReadonlySet<CandidateRelation> = new Set([
  "Mother",
  "Father",
  "Stepparent",
  "AdoptiveParent",
  "Child",
  "Spouse",
  "Other",
]);

/** Fields a client may change on an existing candidate. Everything else is server-owned. */
const EDITABLE_FIELDS = [
  "fullName",
  "name",
  "dateOfBirth",
  "placeOfBirth",
  "cnic",
  "passportNumber",
  "receiptNumber",
  "caseNumber",
  "nvcInvoice",
  "caseStatus",
  "interviewDate",
  "notes",
  "colorTag",
  "avatarUrl",
  "customName",
  "journeyName",
  "journeyImage",
  "relation",
] as const;

function pickEditable(input: Record<string, unknown>): Partial<CandidateProfile> {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = input[key];
  }
  return out as Partial<CandidateProfile>;
}

/** Category a new candidate gets: from the relation, or the client's choice in the same pool (CR-2). */
function resolveCategory(relation: CandidateRelation, requested: unknown): string | null {
  const fromRelation = getVisaCategoryForRelation(relation, "");
  const wanted = typeof requested === "string" ? requested.trim() : "";
  if (relation === "Other") {
    return wanted && slotPool(wanted) !== UNKNOWN_VISA_CATEGORY ? wanted : null;
  }
  if (!wanted) return fromRelation;
  return isSamePool(wanted, fromRelation) ? wanted : null;
}

function isSpousePool(c: Pick<CandidateProfile, "relation" | "visaCategory">): boolean {
  return c.relation === "Spouse" || slotPool(c.visaCategory) === "IR-1";
}

async function writeProfile(
  userId: string,
  exists: boolean,
  profileDetails: Record<string, unknown>
): Promise<string | null> {
  const now = new Date().toISOString();
  const { error } = exists
    ? await supabaseAdmin
        .from("user_profiles")
        .update({ profile_details: profileDetails, updated_at: now })
        .eq("id", userId)
    : await supabaseAdmin.from("user_profiles").insert({
        id: userId,
        subscription_tier: "core",
        subscription_status: "active",
        profile_details: profileDetails,
        created_at: now,
        updated_at: now,
      });
  return error ? error.message : null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      candidateId?: unknown;
      updates?: unknown;
      candidate?: Record<string, unknown> | null;
      activate?: unknown;
    };

    // 2. Current roster
    const { data: profileRow, error: fetchError } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[candidate/create] Error fetching profile:", fetchError);
      return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }

    const profileDetails = (profileRow?.profile_details || {}) as Record<string, unknown>;
    const roster: CandidateProfile[] = Array.isArray(profileDetails.candidates)
      ? (profileDetails.candidates as CandidateProfile[])
      : [];

    // ── Update an existing candidate ─────────────────────────────────────────
    if (body.action === "update") {
      const updateId = typeof body.candidateId === "string" ? body.candidateId : null;
      const index = updateId ? roster.findIndex((c) => c.id === updateId) : -1;
      if (index < 0) {
        return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
      }
      const current = roster[index];
      const updates = pickEditable(
        body.updates && typeof body.updates === "object"
          ? (body.updates as Record<string, unknown>)
          : {}
      );

      if (updates.relation !== undefined) {
        if (!RELATIONS.has(updates.relation)) {
          return NextResponse.json({ error: "Invalid relation." }, { status: 400 });
        }
        // A relation may change only inside the candidate's category pool: moving a
        // parent to "Child" would silently re-point their journey and plan.
        const relationCategory = getVisaCategoryForRelation(updates.relation, "");
        if (updates.relation !== "Other" && !isSamePool(relationCategory, current.visaCategory)) {
          return NextResponse.json(
            { error: "This relation belongs to a different visa category." },
            { status: 400 }
          );
        }
      }

      const updatedCandidates = [...roster];
      updatedCandidates[index] = { ...current, ...updates };
      const saveError = await writeProfile(user.id, Boolean(profileRow), {
        ...profileDetails,
        candidates: updatedCandidates,
      });
      if (saveError) {
        console.error("[candidate/create] Error updating candidate:", saveError);
        return NextResponse.json({ error: "Failed to save candidate." }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        candidate: updatedCandidates[index],
        candidates: updatedCandidates,
        activeCandidateId: profileDetails.activeCandidateId ?? null,
      });
    }

    // ── Create a new candidate ───────────────────────────────────────────────
    // Any client `id` is ignored: a create never touches an existing candidate.
    const input: Record<string, unknown> =
      body.candidate && typeof body.candidate === "object" ? body.candidate : {};
    const relation = input.relation as CandidateRelation;
    if (!relation || !RELATIONS.has(relation)) {
      return NextResponse.json({ error: "A valid relation is required." }, { status: 400 });
    }
    const visaCategory = resolveCategory(relation, input.visaCategory);
    if (!visaCategory) {
      return NextResponse.json(
        { error: "The visa category does not match this relation." },
        { status: 400 }
      );
    }

    // Only ONE spouse (IR-1 / CR-1) per petitioner.
    if (
      isSpousePool({ relation, visaCategory }) &&
      roster.some((c) => isSpousePool(c))
    ) {
      return NextResponse.json(
        { error: "Only one spouse (IR-1) can be sponsored at a time. A spouse candidate already exists." },
        { status: 409 }
      );
    }

    let allocation;
    try {
      allocation = await loadAllocationState(supabase, user.id, profileDetails, roster);
    } catch (err) {
      console.error("[candidate/create] Could not check existing journey data:", err);
      return NextResponse.json(
        { error: "Could not add the candidate right now. Please try again." },
        { status: 503 }
      );
    }

    const fullName = typeof input.fullName === "string" ? input.fullName.trim().slice(0, 200) : "";
    const newCandidate = createNewCandidate(roster, {
      relation,
      fullName,
      visaCategory,
      highWater: allocation.highWater,
      blockedKeys: allocation.blockedKeys,
    });

    const updatedCandidates = [...roster, newCandidate];
    const activate = body.activate !== false;
    const nextActiveId = activate
      ? newCandidate.id
      : (profileDetails.activeCandidateId as string | undefined) ?? newCandidate.id;

    const saveError = await writeProfile(user.id, Boolean(profileRow), {
      ...profileDetails,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
      [CANDIDATE_ID_HIGH_WATER_KEY]: Math.max(
        allocation.highWater,
        candidateIdNumber(newCandidate.id) ?? 0
      ),
    });
    if (saveError) {
      console.error("[candidate/create] Error saving candidate:", saveError);
      return NextResponse.json({ error: "Failed to save candidate to profile." }, { status: 500 });
    }

    // Seed the candidate's journey when its key has no row yet. The slot was chosen so
    // that no leftover row exists under this key, so the new candidate never inherits
    // another person's progress. A seeding failure is non-fatal: initialize seeds lazily.
    const journeyKey = getJourneyKeyForCandidate(newCandidate);
    try {
      const hasRow = allocation.journeys.some(
        (j) => (j.journey_type || "").toLowerCase().replace(/[^a-z0-9_]/g, "") === journeyKey
      );
      if (!hasRow && hasJourneyConfig(visaCategory) && newCandidate.categorySlot !== 1) {
        await journeyService.createJourneyFromConfig(
          journeyConfigPathFor(visaCategory),
          { journey_type: journeyKey },
          { supabase, user }
        );
      }
    } catch (err) {
      console.warn("[candidate/create] Non-fatal journey seeding warning:", err);
    }

    return NextResponse.json({
      success: true,
      candidate: newCandidate,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
      journeyKey,
    });
  } catch (error) {
    console.error("[candidate/create] Unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
