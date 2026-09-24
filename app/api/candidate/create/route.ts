// app/api/candidate/create/route.ts
// ============================================================================
// Create / Upsert Candidate Profile API
// Saves candidate profile directly to user_profiles.profile_details.candidates
// and ensures corresponding candidate journey row is initialized in Supabase.
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import type { CandidateProfile } from "@/types/candidate";
import { getCandidateJourneyKey, getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { journeyService } from "@/lib/journey/service";

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

    const body = await request.json().catch(() => ({}));
    const { candidate, activeCandidateId } = body;

    if (!candidate || !candidate.id || !candidate.relation) {
      return NextResponse.json(
        { error: "Candidate data with id and relation is required." },
        { status: 400 }
      );
    }

    // 2. Fetch current profile from user_profiles
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
    const currentCandidates = (profileDetails.candidates || []) as CandidateProfile[];

    // 3. Upsert candidate into candidates array
    const existingIndex = currentCandidates.findIndex((c) => c.id === candidate.id);
    let updatedCandidates: CandidateProfile[];
    if (existingIndex >= 0) {
      updatedCandidates = [...currentCandidates];
      updatedCandidates[existingIndex] = { ...updatedCandidates[existingIndex], ...candidate };
    } else {
      updatedCandidates = [...currentCandidates, candidate];
    }

    const nextActiveId = activeCandidateId || candidate.id;

    const updatedProfileDetails = {
      ...profileDetails,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
    };

    // 4. Update / Insert user_profiles in database
    if (profileRow) {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          profile_details: updatedProfileDetails,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("[candidate/create] Error updating profile:", updateError);
        return NextResponse.json({ error: "Failed to save candidate to profile." }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          subscription_tier: "core",
          subscription_status: "active",
          profile_details: updatedProfileDetails,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[candidate/create] Error inserting profile:", insertError);
        return NextResponse.json({ error: "Failed to save candidate to profile." }, { status: 500 });
      }
    }

    // 5. Ensure journey record exists with full chapters and steps for candidate (if candidate-2+)
    try {
      const baseVisa = getBaseVisaCategory(candidate.visaCategory || "IR-5");
      const configType = baseVisa.toLowerCase();
      const journeyKey = getCandidateJourneyKey(candidate.visaCategory || "IR-5", candidate.id);
      if (candidate.id !== "candidate-1") {
        const { data: existingJourney } = await supabase
          .from("journeys")
          .select("id")
          .eq("user_id", user.id)
          .eq("journey_type", journeyKey)
          .maybeSingle();

        if (!existingJourney) {
          const configPath = `data/visa-category/${configType}.json`;
          await journeyService.createJourneyFromConfig(
            configPath,
            {
              journey_type: journeyKey,
            },
            { supabase, user }
          );
        }
      }
    } catch (err) {
      console.warn("[candidate/create] Non-fatal journey row creation warning:", err);
    }

    return NextResponse.json({
      success: true,
      candidate,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
    });
  } catch (error) {
    console.error("[candidate/create] Unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
