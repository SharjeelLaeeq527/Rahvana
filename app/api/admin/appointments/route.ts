// app/api/admin/appointments/route.ts
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";
import { triggerAppointmentNotification } from "@/lib/notifications";

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

async function signAppointmentUrls(supabase: any, appointments: any[]) {
  if (!appointments || appointments.length === 0) return;

  const urlFields = [
    "scanned_passport_url",
    "k_one_letter_url",
    "appointment_confirmation_letter_url",
  ] as const;

  const pathsToSign: string[] = [];

  for (const row of appointments) {
    for (const field of urlFields) {
      const url = row[field];
      if (url && typeof url === "string") {
        const parts = url.split("/document-vault/");
        if (parts.length >= 2) {
          const storagePath = decodeURIComponent(parts[1]);
          pathsToSign.push(storagePath);
        }
      }
    }
  }

  if (pathsToSign.length === 0) return;

  const uniquePaths = Array.from(new Set(pathsToSign));

  try {
    const { data: signedData, error: signingError } = await supabase.storage
      .from("document-vault")
      .createSignedUrls(uniquePaths, 86400); // 24 hours

    if (signingError) {
      console.error("Error batch signing URLs:", signingError);
      return;
    }

    if (signedData) {
      const signedUrlMap = new Map<string, string>();
      for (const item of signedData) {
        if (item.signedUrl && !item.error) {
          signedUrlMap.set(item.path, item.signedUrl);
        }
      }

      for (const row of appointments) {
        for (const field of urlFields) {
          const url = row[field];
          if (url && typeof url === "string") {
            const parts = url.split("/document-vault/");
            if (parts.length >= 2) {
              const storagePath = decodeURIComponent(parts[1]);
              const signedUrl = signedUrlMap.get(storagePath);
              if (signedUrl) {
                row[field] = signedUrl;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to sign URLs:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(req);

    if (!isAdmin) {
      return Response.json({ error: msg(E.AUTH_UNAUTHORIZED_ADMIN) }, { status: 403 });
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

    // Fetch only confirmed appointments: paid bookings plus free executive bookings without a payment record
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .or("payment_status.eq.paid,payment_id.is.null")
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      console.error("❌ Error fetching appointments:", appointmentsError);
      return Response.json({ error: appointmentsError.message }, { status: 500 });
    }

    console.log(`Found ${appointments?.length || 0} appointments`);

    // Fetch all applicants
    const { data: applicants, error: applicantsError } = await supabase
      .from("applicants")
      .select("*")
      .order("created_at", { ascending: true });

    if (applicantsError) {
      console.error("Error fetching applicants:", applicantsError);
      // Continue without applicants if there's an error
      return Response.json({ data: appointments || [] });
    }

    console.log(`Found ${applicants?.length || 0} total applicants`);

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

    if (data) {
      await signAppointmentUrls(supabase, data);
    }

    console.log("Successfully prepared appointments with applicants");
    return Response.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { isAdmin, error: authError } = await checkAdminRole(req);

    if (!isAdmin) {
      return Response.json({ error: msg(E.AUTH_UNAUTHORIZED_ADMIN) }, { status: 403 });
    }

    const { id, status, adminNotes, preferredDate, preferredTime } = await req.json();

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

    const updateData: any = {
      status,
      admin_notes: adminNotes || "",
    };

    if (preferredDate !== undefined) {
      updateData.preferred_date = preferredDate || null;
    }
    if (preferredTime !== undefined) {
      updateData.preferred_time = preferredTime || null;
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating appointment status:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification when appointment status changes
    try {
      await triggerAppointmentNotification(id);
    } catch (notifError) {
      console.error("Failed to send appointment status update notification:", notifError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in updating appointment:", error);
    return Response.json({ error: msg(E.ADMIN_FETCH_FAILED) }, { status: 500 });
  }
}
