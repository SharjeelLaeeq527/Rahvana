// app/api/candidate/delete/route.ts
// ============================================================================
// Delete Candidate Profile API
// Removes a candidate from user_profiles.profile_details.candidates,
// resets activeCandidateId if necessary, and cleans up candidate-scoped data.
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";
import type { CandidateProfile } from "@/types/candidate";

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

    const { candidateId } = await request.json();

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json(
        { error: "Candidate ID is required." },
        { status: 400 }
      );
    }

    if (candidateId === "candidate-1") {
      return NextResponse.json(
        { error: "Cannot delete the primary candidate profile." },
        { status: 400 }
      );
    }

    // 2. Fetch current profile from user_profiles
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
    const currentCandidates = (profileDetails.candidates || []) as CandidateProfile[];

    if (!Array.isArray(currentCandidates) || currentCandidates.length <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the only candidate profile." },
        { status: 400 }
      );
    }

    const targetIndex = currentCandidates.findIndex((c) => c.id === candidateId);
    if (targetIndex === -1) {
      return NextResponse.json(
        { error: "Candidate not found." },
        { status: 404 }
      );
    }

    // 3. Filter out the candidate
    const updatedCandidates = currentCandidates.filter((c) => c.id !== candidateId);
    let nextActiveId = profileDetails.activeCandidateId as string;
    if (nextActiveId === candidateId || !updatedCandidates.some((c) => c.id === nextActiveId)) {
      nextActiveId = updatedCandidates[0]?.id || "candidate-1";
    }

    const updatedProfileDetails = {
      ...profileDetails,
      candidates: updatedCandidates,
      activeCandidateId: nextActiveId,
    };

    // 4. Update user_profiles in database
    const { error: updateError } = await supabase
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

    // 5. Clean up candidate-scoped user_guides rows
    try {
      await supabase
        .from("user_guides")
        .delete()
        .eq("user_id", user.id)
        .eq("candidate_id", candidateId);
    } catch (err) {
      console.warn("[candidate/delete] Non-fatal cleanup warning for user_guides:", err);
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
        .eq("user_id", user.id)
        .or(`journey_type.ilike.%_${candidateId}%,journey_type.ilike.%_${cleanCandId}%`);
    } catch (err) {
      console.warn("[candidate/delete] Non-fatal cleanup warning for journeys:", err);
    }

    return NextResponse.json({
      success: true,
      message: `Candidate ${candidateId} deleted successfully.`,
      candidates: finalCandidates,
      activeCandidateId: nextActiveId,
    });
  } catch (error) {
    console.error("[candidate/delete] Unexpected error:", error);
    return NextResponse.json({ error: msg(E.AUTH_UNEXPECTED_ERROR) }, { status: 500 });
  }
}
