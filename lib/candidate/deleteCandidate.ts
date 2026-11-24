// lib/candidate/deleteCandidate.ts (handler behind POST /api/candidate/delete)
// ============================================================================
// Delete a candidate.
//
// Rules (plan v3):
//  - candidate-1 is never deletable.
//  - A candidate whose journey is paid cannot be deleted: a journey row with a tier
//    other than free, a roster tier other than free, or a stripe_subscription_id whose
//    Stripe status is live. If Stripe cannot be reached the delete is refused (fail
//    closed). "Cancel this candidate's plan before removing them."
//  - The slot-1 candidate of a category pool can be deleted only when it is the last
//    candidate in that pool (slot 1 owns the category's base journey).
//
// Cleanup is by the candidate's EXACT journey key (canonical form), never a suffix
// match, so deleting IR-5 candidate 2 can never touch `ir2_candidate2`. Removed: the
// journey row(s) (chapters, steps, case_data, documents, reminders, CEAC cascade),
// visa_forms_draft rows for the key, the legacy stored journeyTiers entry,
// journeyCustomizations for the candidate / key / row, user_guides for the candidate,
// then the roster entry. A failed step is logged; the leftover data keeps that slot
// blocked for new candidates (lib/candidate/candidateAllocation.ts).
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import type { CandidateProfile } from "@/types/candidate";
import {
  canonicalJourneyKey,
  candidateIdNumber,
  getCandidateSlot,
  getJourneyKeyForCandidate,
  poolMembers,
} from "@/lib/candidate/candidateKeys";
import { CANDIDATE_ID_HIGH_WATER_KEY } from "@/lib/candidate/candidateAllocation";

export const PAID_CANDIDATE_MESSAGE = "Cancel this candidate's plan before removing them.";

type LiveCheck = (subscriptionId: string) => Promise<boolean>;

/** True when the subscription is live (or its state cannot be confirmed). */
async function defaultLiveCheck(subscriptionId: string): Promise<boolean> {
  try {
    const [{ stripe }, { LIVE_SUB_STATUSES }] = await Promise.all([
      import("@/lib/stripe/config"),
      import("@/lib/stripe/subscriptionCleanup"),
    ]);
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return LIVE_SUB_STATUSES.includes(sub.status);
  } catch (err: unknown) {
    // A subscription Stripe does not know is not live; anything else fails closed.
    const e = err as { code?: string; statusCode?: number } | null;
    if (e?.code === "resource_missing" || e?.statusCode === 404) return false;
    return true;
  }
}

function isPaidTier(tier: unknown): boolean {
  return typeof tier === "string" && tier.trim() !== "" && tier.trim().toLowerCase() !== "free";
}

function withoutKeys(
  value: unknown,
  drop: (key: string) => boolean
): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!drop(k)) out[k] = v;
  }
  return out;
}

export async function handleCandidateDelete(
  request: Request,
  liveCheck: LiveCheck = defaultLiveCheck
) {
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

    const { candidateId } = await request.json().catch(() => ({}));

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json({ error: "Candidate ID is required." }, { status: 400 });
    }

    if (candidateId === "candidate-1") {
      return NextResponse.json(
        { error: "Cannot delete the primary candidate profile." },
        { status: 400 }
      );
    }

    // 2. Current roster
    const { data: profileRow, error: fetchError } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("[candidate/delete] Error fetching profile:", fetchError);
      return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }

    const profileDetails = (profileRow?.profile_details || {}) as Record<string, unknown>;
    const roster: CandidateProfile[] = Array.isArray(profileDetails.candidates)
      ? (profileDetails.candidates as CandidateProfile[])
      : [];

    if (roster.length <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the only candidate profile." },
        { status: 400 }
      );
    }

    const target = roster.find((c) => c.id === candidateId);
    if (!target) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const journeyKey = getJourneyKeyForCandidate(target);
    const slot = getCandidateSlot(target);

    // 3. Slot 1 owns the category's base journey: only removable as the last of its pool.
    if (slot === 1 && poolMembers(roster, target.visaCategory).length > 1) {
      return NextResponse.json(
        {
          error:
            "This is the first candidate in this visa category. Remove the other candidates in this category first.",
          code: "CATEGORY_PRIMARY",
        },
        { status: 409 }
      );
    }

    // 4. Paid journeys are never deleted.
    const { data: journeyRows, error: journeysError } = await supabase
      .from("journeys")
      .select("id, journey_type, subscription_tier, stripe_subscription_id")
      .eq("user_id", user.id);
    if (journeysError) {
      console.error("[candidate/delete] Error reading journeys:", journeysError);
      return NextResponse.json({ error: "Failed to delete candidate." }, { status: 500 });
    }
    const ownRows = (journeyRows ?? []).filter(
      (j) => canonicalJourneyKey(j.journey_type) === journeyKey
    );

    let paid = isPaidTier(target.tier) || ownRows.some((j) => isPaidTier(j.subscription_tier));
    if (!paid) {
      for (const row of ownRows) {
        if (row.stripe_subscription_id && (await liveCheck(row.stripe_subscription_id))) {
          paid = true;
          break;
        }
      }
    }
    if (paid) {
      return NextResponse.json(
        { error: PAID_CANDIDATE_MESSAGE, code: "CANDIDATE_HAS_PLAN" },
        { status: 409 }
      );
    }

    // 5. Cleanup by exact key. Each step is independent; a failure leaves the data in
    //    place, which keeps this slot blocked for new candidates.
    const rowIds = ownRows.map((j) => j.id);
    if (rowIds.length > 0) {
      const { error } = await supabase
        .from("journeys")
        .delete()
        .eq("user_id", user.id)
        .in("id", rowIds);
      if (error) console.warn("[candidate/delete] journeys cleanup failed:", error.message);
    }

    try {
      const { data: drafts, error } = await supabase
        .from("visa_forms_draft")
        .select("journey_key")
        .eq("user_id", user.id);
      if (error) throw error;
      const draftKeys = Array.from(
        new Set(
          (drafts ?? [])
            .map((d: { journey_key?: string | null }) => d.journey_key || "")
            .filter((k) => k && canonicalJourneyKey(k) === journeyKey)
        )
      );
      if (draftKeys.length > 0) {
        const { error: delError } = await supabase
          .from("visa_forms_draft")
          .delete()
          .eq("user_id", user.id)
          .in("journey_key", draftKeys);
        if (delError) throw delError;
      }
    } catch (err) {
      console.warn("[candidate/delete] visa_forms_draft cleanup failed:", err);
    }

    try {
      const { error } = await supabase
        .from("user_guides")
        .delete()
        .eq("user_id", user.id)
        .eq("candidate_id", candidateId);
      if (error) throw error;
    } catch (err) {
      console.warn("[candidate/delete] user_guides cleanup failed:", err);
    }

    // 6. Roster + profile maps (service role: the roster is a server-owned key).
    const updatedCandidates = roster.filter((c) => c.id !== candidateId);
    let nextActiveId = profileDetails.activeCandidateId as string | undefined;
    if (!nextActiveId || nextActiveId === candidateId || !updatedCandidates.some((c) => c.id === nextActiveId)) {
      nextActiveId = updatedCandidates[0]?.id || "candidate-1";
    }

    const customizationKeys = new Set<string>([candidateId, `ir5_${candidateId}`, ...rowIds]);
    const dropCustomization = (k: string) =>
      customizationKeys.has(k) || canonicalJourneyKey(k) === journeyKey;
    const dropTier = (k: string) => canonicalJourneyKey(k) === journeyKey;

    const storedHighWater = Number(profileDetails[CANDIDATE_ID_HIGH_WATER_KEY]) || 0;
    const updatedProfileDetails: Record<string, unknown> = {
      ...profileDetails,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
      // Remember the deleted id so it is never issued again.
      [CANDIDATE_ID_HIGH_WATER_KEY]: Math.max(
        storedHighWater,
        ...roster.map((c) => candidateIdNumber(c.id) ?? 0)
      ),
    };
    for (const [key, drop] of [
      ["journeyCustomizations", dropCustomization],
      ["journeyTiers", dropTier],
      ["journey_tiers", dropTier],
    ] as const) {
      const cleaned = withoutKeys(profileDetails[key], drop);
      if (cleaned) updatedProfileDetails[key] = cleaned;
    }

    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        profile_details: updatedProfileDetails,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[candidate/delete] Error updating profile:", updateError);
      return NextResponse.json({ error: "Failed to delete candidate." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Candidate ${candidateId} deleted successfully.`,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
    });
  } catch (error) {
    console.error("[candidate/delete] Unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
