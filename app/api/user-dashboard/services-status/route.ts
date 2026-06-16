import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { E, msg } from "@/lib/errors";

export async function GET() {
  try {
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
    const sindhPccRequests = (pccData || []).filter(
      (req: any) =>
        !req.province ||
        req.province.toLowerCase() === "sindh" ||
        req.province.toLowerCase() === "unknown"
    );

    return NextResponse.json({
      pccRequests: sindhPccRequests,
      medicalAppointments: appointmentsData || [],
      consultationBookings: consultationData || [],
      translationDocuments: translationsData || [],
    });
  } catch (error) {
    console.error("Services status fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch services status" }, { status: 500 });
  }
}
