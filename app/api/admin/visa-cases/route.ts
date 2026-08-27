import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decrypt } from "@/lib/encryption";
import { E, msg } from "@/lib/errors";

export const dynamic = "force-dynamic";

// Helper: Create Supabase client with service role (bypasses RLS)
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}

/**
 * GET /api/admin/visa-cases
 * Query params:
 *   - journey_type: Filter by journey type (default: 'IR1')
 *   - status: Filter by journey status
 *   - search: Search by user_id
 * Returns: All journeys with user info for admin view
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const journeyType = searchParams.get("journey_type") || "IR1";
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Fetch journeys first
    let query = supabase
      .from("journeys")
      .select("*")
      .eq("journey_type", journeyType)
      .order("admin_last_checked_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: rawJourneys, error } = await query;

    if (error) {
      console.error("Error fetching visa cases:", error);
      return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
    }

    if (!rawJourneys || rawJourneys.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Extract unique IDs
    const userIds = [...new Set(rawJourneys.map((j) => j.user_id).filter(Boolean))];
    const journeyIds = rawJourneys.map((j) => j.id);

    // Fetch related profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    // Fetch related case data (only NVC data needed for table)
    const { data: caseData } = await supabase
      .from("case_data")
      .select("journey_id, data_key, data_value")
      .in("journey_id", journeyIds)
      .in("data_key", [
        "nvcCaseNum",
        "nvc_case_num",
        "nvcInvoice",
        "nvc_invoice_id",
        "passportNumber",
        "surname",
      ]);

    console.log(
      `[Admin API] Fetched ${caseData?.length || 0} case_data rows for ${journeyIds.length} journeys`
    );
    if (caseData && caseData.length > 0) {
      console.log(`[Admin API] Sample keys found:`, [...new Set(caseData.map((d) => d.data_key))]);
    }

    // Map the shape for the frontend
    const journeys = rawJourneys.map((j: any) => {
      // Extract profile and nvc case number
      const profile = profiles?.find((p) => p.id === j.user_id);
      const jCaseData = (caseData?.filter((cd) => cd.journey_id === j.id) || []).map((cd) => ({
        ...cd,
        data_value:
          typeof cd.data_value === "string" && cd.data_value.startsWith("gcm:")
            ? decrypt(cd.data_value)
            : cd.data_value,
      }));
      const nvcCaseData = jCaseData.find(
        (cd) => cd.data_key === "nvcCaseNum" || cd.data_key === "nvc_case_num"
      );
      const invoiceData = jCaseData.find(
        (cd) => cd.data_key === "nvcInvoice" || cd.data_key === "nvc_invoice_id"
      );
      const passportData = jCaseData.find((cd) => cd.data_key === "passportNumber");
      const surnameData = jCaseData.find((cd) => cd.data_key === "surname");

      return {
        ...j,
        user_email: profile?.email || "No email found",
        nvc_case_number: nvcCaseData?.data_value || "",
        nvc_invoice: invoiceData?.data_value || "",
        passport_number: passportData?.data_value || "",
        surname: surnameData?.data_value || "",
      };
    });

    // Client-side search filter
    let filtered = journeys;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((j: any) => {
        return (
          j.user_id?.toLowerCase().includes(searchLower) ||
          j.id.toLowerCase().includes(searchLower) ||
          j.user_email.toLowerCase().includes(searchLower) ||
          j.nvc_case_number.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({ data: filtered });
  } catch (error: any) {
    console.error("Unexpected error fetching visa cases:", error);
    return NextResponse.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/visa-cases
 * Body:
 *   - id: Journey UUID (required)
 *   - tracking_status: JSONB object with tracking updates
 *   - admin_notes: Text notes
 *   - admin_last_checked_at: Auto-set to now if not provided
 * Updates: Admin tracking fields on a journey
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, tracking_status, admin_notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing journey ID" }, { status: 400 });
    }

    // Build update object
    const updateData: any = {
      admin_last_checked_at: new Date().toISOString(),
    };

    if (body.clear_tracking) {
      updateData.tracking_status = {}; // Clear completely
    } else if (tracking_status) {
      // Fetch current tracking_status first
      const { data: current } = await supabase
        .from("journeys")
        .select("tracking_status")
        .eq("id", id)
        .single();

      const currentTracking = current?.tracking_status || {};
      updateData.tracking_status = { ...currentTracking, ...tracking_status };
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from("journeys")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tracking status:", error);
      return NextResponse.json({ error: msg(E.ADMIN_TRACKING_CLEAR_FAILED) }, { status: 500 });
    }

    // Write admin fields to case_data so they appear in user's wizard state
    const checkDate = body.check_date || new Date().toISOString();
    const upsertOps: any[] = [
      {
        journey_id: id,
        data_key: "admin_last_check_date",
        data_value: checkDate,
        label: "Admin Last Check Date",
        source: "admin",
        source_reference: "visa_cases_panel",
      },
    ];
    if (body.case_status) {
      upsertOps.push({
        journey_id: id,
        data_key: "admin_case_status",
        data_value: body.case_status,
        label: "Admin Case Status",
        source: "admin",
        source_reference: "visa_cases_panel",
      });
    }
    if (body.check_notes) {
      upsertOps.push({
        journey_id: id,
        data_key: "admin_check_notes",
        data_value: body.check_notes,
        label: "Admin Check Notes",
        source: "admin",
        source_reference: "visa_cases_panel",
      });
    }
    await supabase.from("case_data").upsert(upsertOps, { onConflict: "journey_id,data_key" });

    // TODO: Trigger notification to user if important status changed
    // This will be implemented in Phase C
    // Important triggers:
    // - nvc_review_complete changed to true
    // - dq_status changed to "qualified"
    // - interview_date set
    // - ap_status changed

    const trackingChanged = tracking_status && Object.keys(tracking_status).length > 0;
    if (trackingChanged) {
      // Check if this is an important status change
      const importantFields = ["nvc_review_complete", "dq_status", "interview_date", "ap_status"];
      const hasImportantChange = importantFields.some(
        (field) => tracking_status[field] !== undefined
      );

      if (hasImportantChange) {
        // Trigger notification (will be implemented with Resend/Supabase Edge Function)
        console.log("[Admin API] Important status change detected, triggering notification:", {
          journeyId: id,
          changes: tracking_status,
        });

        // TODO: Call notification service
        // await fetch('/api/notifications/trigger', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     journey_id: id,
        //     type: 'admin_status_update',
        //     data: tracking_status,
        //   }),
        // });
      }
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error in PATCH:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/visa-cases
 * Body:
 *   - id: Journey UUID (required)
 * Deletes: A journey (admin only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing journey ID" }, { status: 400 });
    }

    const { error } = await supabase.from("journeys").delete().eq("id", id);

    if (error) {
      console.error("Error deleting journey:", error);
      return NextResponse.json({ error: msg(E.JOURNEYS_DELETE_FAILED) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE:", error);
    return NextResponse.json({ error: msg(E.JOURNEYS_DELETE_FAILED) }, { status: 500 });
  }
}
