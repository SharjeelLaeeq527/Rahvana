// app/api/candidate/create/route.ts
// ============================================================================
// Create / Upsert Candidate Profile API
// Saves candidate profile directly to user_profiles.profile_details.candidates
// and ensures corresponding candidate journey row is initialized in Supabase.
//
// Business Rules:
//  - A petitioner can only have ONE active IR-1 (Spouse) journey at a time.
//  - Multiple IR-5 (Parent) journeys are allowed (e.g. Mother + Father).
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

    // 2b. Business rule: only ONE Spouse/IR-1 candidate allowed per petitioner.
    // Block a NEW Spouse candidate if one already exists (belt-and-suspenders with
    // the client-side guard in CandidateContext.addCandidate).
    const candidateVisaBase = getBaseVisaCategory(candidate.visaCategory);
    const isNewCandidate = !currentCandidates.some((c) => c.id === candidate.id);
    if (isNewCandidate && candidateVisaBase === "IR-1") {
      const existingSpouse = currentCandidates.find(
        (c) => c.relation === "Spouse" || getBaseVisaCategory(c.visaCategory) === "IR-1"
      );
      if (existingSpouse) {
        return NextResponse.json(
          { error: "Only one spouse (IR-1) can be sponsored at a time. A spouse candidate already exists." },
          { status: 409 }
        );
      }
    }

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

    // 5. Ensure a full journey (chapters + steps) exists for the candidate (candidate-2+ only).
    //    Business rule: IR-1 is strictly single — never create a second IR-1 journey row.
    try {
      const baseVisa = getBaseVisaCategory(candidate.visaCategory || "IR-5");
      const configType = baseVisa.toLowerCase();
      const journeyKey = getCandidateJourneyKey(candidate.visaCategory || "IR-5", candidate.id);
      const journeyVisaBase = getBaseVisaCategory(journeyKey);
      const configPath = `data/visa-category/${configType}.json`;

      // Only candidate-2+ needs a journey created here; candidate-1 owns the base journey,
      // which is seeded on its own dashboard route.
      if (candidate.id !== "candidate-1") {
        if (journeyVisaBase === "IR-1") {
          // IR-1 (Spouse) is strictly 1-per-petitioner; unlike IR-5 there is no "second
          // spouse". Never create a duplicate IR-1 journey row.
          const { data: existingIr1 } = await supabase
            .from("journeys")
            .select("id")
            .eq("user_id", user.id)
            .ilike("journey_type", "ir1%")
            .limit(1);

          if (existingIr1 && existingIr1.length > 0) {
            console.warn(
              `[candidate/create] Blocked duplicate IR-1 journey for user ${user.id}. Existing: ${existingIr1[0].id}`
            );
            // Skip journey creation but still return success (candidate profile was saved above)
          } else {
            // Seed a FULL journey (chapters + steps) from the JSON config, not a bare row.
            await journeyService.createJourneyFromConfig(
              configPath,
              { journey_type: journeyKey },
              { supabase, user }
            );
          }
        } else {
          // Non-IR-1 categories (IR-5, IR-2, etc.) — allow multiple journey rows.
          const { data: existingJourney } = await supabase
            .from("journeys")
            .select("id")
            .eq("user_id", user.id)
            .eq("journey_type", journeyKey)
            .maybeSingle();

          if (!existingJourney) {
            // Seed a FULL journey (chapters + steps) from the JSON config, not a bare row.
            await journeyService.createJourneyFromConfig(
              configPath,
              { journey_type: journeyKey },
              { supabase, user }
            );
          }
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
