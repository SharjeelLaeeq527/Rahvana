import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    // scope=journey → only requests created from inside a journey (for the journey step card /
    // embedded service views). Default → standalone only (My Resources), i.e. journey rows hidden.
    const scope = searchParams.get("scope");
    const journeySlug = searchParams.get("journeySlug");

    // 1. Authenticate user session
    const authClient = await createClient();

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error("[services-status] Unauthorized:", userError);
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const userId = user.id;

    // 2. Initialize service role client to bypass RLS select policies
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch PCC requests matching user_id strictly
    const { data: pccData, error: pccError } = await supabase
      .from("police_verification_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (pccError) {
      console.error("Error fetching PCC requests:", pccError);
    }

    // Fetch Medical Appointments matching user_id strictly
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      console.error("Error fetching medical appointments:", appointmentsError);
    }

    // Fetch Consultation Bookings matching user_id strictly
    const { data: consultationData, error: consultationError } = await supabase
      .from("consultation_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (consultationError) {
      console.error("Error fetching consultation bookings:", consultationError);
    }

    // Fetch Translation Documents matching user_id strictly
    const { data: translationsData, error: translationsError } = await supabase
      .from("translation_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (translationsError) {
      console.error("Error fetching translation documents:", translationsError);
    }

    // Filter PCC requests for Sindh specifically (allowing empty/Unknown for test data)
    // and hide unpaid "draft" rows (standalone must-pay bookings created before Stripe
    // checkout) so a failed/canceled payment never shows as submitted. Credit/journey/plan
    // rows have awaiting_payment = false and remain visible. JS-level check keeps this
    // safe even if the column hasn't been backfilled yet (undefined !== true → shown).
    let sindhPccRequests = (pccData || []).filter(
      (item: any) =>
        item.awaiting_payment !== true &&
        (!item.province ||
          item.province.toLowerCase() === "sindh" ||
          item.province.toLowerCase() === "unknown")
    );

    let medicalAppointments = (appointmentsData || []).filter(
      (item: any) => item.awaiting_payment !== true
    );
    let translationDocuments = translationsData || [];
    let consultationBookings = consultationData || [];

    // scope=all -> every request on the account, unfiltered by origin or candidate. Backs the
    // cross-journey "My Requests (all journeys)" directory, which labels each row with the
    // journey/candidate it belongs to (lib/services/serviceRequestDirectory.ts).
    if (scope === "all") {
      return NextResponse.json({
        pccRequests: sindhPccRequests,
        medicalAppointments,
        consultationBookings,
        translationDocuments,
      });
    }

    // Origin split: journey-scoped rows vs standalone rows. Legacy rows without a
    // source are treated as standalone so My Resources keeps showing them.

    if (scope === "journey") {
      sindhPccRequests = sindhPccRequests.filter(
        (item: any) =>
          item.source === "journey" && (!journeySlug || item.journey_slug === journeySlug)
      );

      medicalAppointments = medicalAppointments.filter(
        (item: any) =>
          item.source === "journey" && (!journeySlug || item.journey_slug === journeySlug)
      );

      consultationBookings = consultationBookings.filter(
        (item: any) =>
          item.source === "journey" && (!journeySlug || item.journey_slug === journeySlug)
      );

      translationDocuments = translationDocuments.filter(
        (item: any) =>
          (item.metadata?.source ?? item.source) === "journey" &&
          (!journeySlug || (item.metadata?.journey_slug ?? item.journey_slug) === journeySlug)
      );
    } else {
      sindhPccRequests = sindhPccRequests.filter((item: any) => item.source !== "journey");

      medicalAppointments = medicalAppointments.filter((item: any) => item.source !== "journey");

      consultationBookings = consultationBookings.filter((item: any) => item.source !== "journey");

      translationDocuments = translationDocuments.filter(
        (item: any) => (item.metadata?.source ?? item.source) !== "journey"
      );
    }

    // Filter by candidateId if provided
    if (candidateId) {
      sindhPccRequests = sindhPccRequests.filter((item: any) => {
        const directId = item.candidate_id;
        const metaId = item.metadata?.candidate_id;
        const notesTag =
          typeof item.admin_notes === "string" &&
          item.admin_notes.includes(`[Candidate: ${candidateId}]`);
        if (directId) return directId === candidateId;
        if (metaId) return metaId === candidateId;
        if (notesTag) return true;
        // Fallback for legacy items without candidate tagging -> assign to candidate-1
        if (
          candidateId === "candidate-1" &&
          !directId &&
          !metaId &&
          (!item.admin_notes || !item.admin_notes.includes("[Candidate: "))
        ) {
          return true;
        }
        return false;
      });

      medicalAppointments = medicalAppointments.filter((item: any) => {
        const directId = item.candidate_id;
        const metaId = item.metadata?.candidate_id;
        const notesTag =
          typeof item.admin_notes === "string" &&
          item.admin_notes.includes(`[Candidate: ${candidateId}]`);
        if (directId) return directId === candidateId;
        if (metaId) return metaId === candidateId;
        if (notesTag) return true;
        if (
          candidateId === "candidate-1" &&
          !directId &&
          !metaId &&
          (!item.admin_notes || !item.admin_notes.includes("[Candidate: "))
        ) {
          return true;
        }
        return false;
      });

      consultationBookings = consultationBookings.filter((item: any) => {
        const directId = item.candidate_id;
        const metaId = item.metadata?.candidate_id;
        const notesTag =
          typeof item.admin_notes === "string" &&
          item.admin_notes.includes(`[Candidate: ${candidateId}]`);
        if (directId) return directId === candidateId;
        if (metaId) return metaId === candidateId;
        if (notesTag) return true;
        if (
          candidateId === "candidate-1" &&
          !directId &&
          !metaId &&
          (!item.admin_notes || !item.admin_notes.includes("[Candidate: "))
        ) {
          return true;
        }
        return false;
      });

      translationDocuments = translationDocuments.filter((item: any) => {
        const directId = item.candidate_id;
        const metaId = item.metadata?.candidate_id;

        const notesTag =
          typeof item.admin_notes === "string" &&
          item.admin_notes.includes(`[Candidate: ${candidateId}]`);

        if (directId) return directId === candidateId;
        if (metaId) return metaId === candidateId;
        if (notesTag) return true;

        // Legacy requests without candidate tagging belong to candidate-1.
        if (
          candidateId === "candidate-1" &&
          !directId &&
          !metaId &&
          (!item.admin_notes || !item.admin_notes.includes("[Candidate: "))
        ) {
          return true;
        }

        return false;
      });
    }

    return NextResponse.json({
      pccRequests: sindhPccRequests,
      medicalAppointments,
      consultationBookings,
      translationDocuments,
    });
  } catch (error) {
    console.error("Services status fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch services status" }, { status: 500 });
  }
}
