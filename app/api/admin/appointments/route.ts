// app/api/admin/appointments/route.ts
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Specific admin emails - ONLY these emails can access admin panel
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "hammadnooralam@gmail.com")
  .split(",")
  .map((email) => email.trim());

async function checkAdminRole(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isAdmin: false, error: "Authentication required" };
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return { isAdmin: false, error: "Admin access required" };
  }

  const supabaseAdmin = createServerClient(
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { isAdmin: false, error: "Profile verification failed" };
  }

  if (!profile || profile.role !== "admin") {
    return { isAdmin: false, error: "Admin role required" };
  }

  return { isAdmin: true, error: null };
}

export async function GET(req: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(req);

    if (!isAdmin) {
      return Response.json({ error: authError || "Admin access required" }, { status: 403 });
    }

    const supabase = createServerClient(
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

    console.log("📋 Fetching appointments...");

    // Fetch appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      console.error("❌ Error fetching appointments:", appointmentsError);
      return Response.json({ error: appointmentsError.message }, { status: 500 });
    }

    console.log(`✅ Found ${appointments?.length || 0} appointments`);

    // Fetch all applicants
    const { data: applicants, error: applicantsError } = await supabase
      .from("applicants")
      .select("*")
      .order("created_at", { ascending: true });

    if (applicantsError) {
      console.error("⚠️ Error fetching applicants:", applicantsError);
      // Continue without applicants if there's an error
      return Response.json({ data: appointments || [] });
    }

    console.log(`✅ Found ${applicants?.length || 0} total applicants`);

    // Define type for applicants
    type ApplicantData = typeof applicants extends (infer U)[] ? U : never;

    // Group applicants by appointment_id
    const applicantsByAppointment: Record<string, ApplicantData[]> = {};
    if (applicants) {
      applicants.forEach((applicant) => {
        if (!applicantsByAppointment[applicant.appointment_id]) {
          applicantsByAppointment[applicant.appointment_id] = [];
        }
        applicantsByAppointment[applicant.appointment_id].push(applicant);
      });
    }

    // Attach applicants to their appointments
    const data = (appointments || []).map((appointment) => {
      const appointmentApplicants = applicantsByAppointment[appointment.id] || [];
      console.log(
        `📎 Appointment ${appointment.id} has ${appointmentApplicants.length} applicants`
      );

      return {
        ...appointment,
        applicants: appointmentApplicants,
      };
    });

    console.log("✅ Successfully prepared appointments with applicants");
    return Response.json({ data });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(req);

    if (!isAdmin) {
      return Response.json({ error: authError || "Admin access required" }, { status: 403 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerClient(
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

    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);

    if (error) {
      console.error("Error updating appointment status:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in updating appointment:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
