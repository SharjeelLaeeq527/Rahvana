import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { E, msg } from "@/lib/errors";
import { triggerAppointmentNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  console.log("=== Starting appointment submission ===");

  try {
    // Use the service role client to bypass RLS policies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // Do nothing for server-side operations
          },
        },
      }
    );

    // Try to get the authenticated user's ID (optional — booking can work without auth)
    let currentUserId: string | null = null;
    try {
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll() {},
          },
        }
      );
      const {
        data: { user },
      } = await authClient.auth.getUser();
      currentUserId = user?.id ?? null;
    } catch {
      // Auth is optional for appointment booking
    }

    // Get form data from request
    const formData = await req.json();
    console.log("Received form data:", {
      location: formData.location,
      numberOfApplicants: formData.numberOfApplicants,
      hasApplicants: !!formData.applicants,
      applicantsLength: formData.applicants?.length,
    });

    // Validate preferred appointment date
    if (formData.preferredAppointmentDate) {
      const selectedDateString = String(formData.preferredAppointmentDate);

      // Expected format: YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDateString)) {
        return Response.json(
          { error: "Please provide a valid preferred appointment date." },
          { status: 400 }
        );
      }

      // Get today's date in Pakistan (YYYY-MM-DD)
      const pakistanToday = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      // Date must be tomorrow or later
      const today = new Date(`${pakistanToday}T00:00:00`);
      const selectedDate = new Date(`${selectedDateString}T00:00:00`);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (selectedDate < tomorrow) {
        return Response.json(
          {
            error: "Preferred appointment date must be tomorrow or a future date.",
          },
          { status: 400 }
        );
      }
    }

    // Extract the full name from given name, surname, or direct fullName
    const fullName =
      formData.fullName?.trim() ||
      `${formData.givenName || ""} ${formData.surname || ""}`.trim() ||
      "Applicant";
    const nameParts = fullName.split(" ");
    const givenName = formData.givenName || nameParts[0] || fullName;
    const surname = formData.surname || nameParts.slice(1).join(" ") || nameParts[0] || fullName;
    const phoneNumber = formData.primaryContact || formData.contactNumber || "";

    // Define types for our data structures
    interface AppointmentData {
      full_name: string;
      email: string;
      phone_number: string;
      medical_website: string;
      location: string;
      provider: string | null;
      appointment_type: string | null;
      visa_type: string | null;
      medical_type: string | null;
      surname: string;
      given_name: string;
      gender: string | null;
      date_of_birth: string | null;
      passport_number: string | null;
      passport_issue_date: string | null;
      passport_expiry_date: string | null;
      preferred_date: string | null;
      preferred_time: string | null;
      estimated_charges: string | null;
      interview_date: string | null;
      visa_category: string | null;
      had_medical_before: string | null;
      city: string | null;
      case_ref: string | null;
      number_of_applicants: number | null;
      original_passport: string | null;
      status: string;
      case_number?: string;
      admin_notes?: string;
      user_id?: string | null;
      candidate_id?: string | null;
      candidate_role?: string | null;
      candidate_name?: string | null;
      source?: string | null;
      journey_slug?: string | null;
      awaiting_payment?: boolean;
    }

    // Prepare appointment data for database insertion
    const appointmentData: AppointmentData = {
      full_name: fullName,
      email: formData.email,
      phone_number: phoneNumber, // ✅ Uses primaryContact or contactNumber
      medical_website:
        formData.location === "islamabad"
          ? formData.islamabadProvider === "amc"
            ? "AMC"
            : "IOM"
          : `${formData.location.charAt(0).toUpperCase() + formData.location.slice(1)} - Wilcare Medical`,
      location: formData.location,
      provider: formData.islamabadProvider || null,
      appointment_type: formData.appointmentType || null,
      visa_type: formData.visaType || null,
      medical_type: formData.medicalType || null,
      surname: surname,
      given_name: givenName,
      gender: formData.gender || null,
      date_of_birth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      passport_number: formData.passportNumber || null,
      passport_issue_date: formData.passportIssueDate
        ? new Date(formData.passportIssueDate).toISOString()
        : null,
      passport_expiry_date: formData.passportExpiryDate
        ? new Date(formData.passportExpiryDate).toISOString()
        : null,
      preferred_date: formData.preferredAppointmentDate
        ? new Date(formData.preferredAppointmentDate).toISOString()
        : null,
      preferred_time: formData.preferredTime || null,
      estimated_charges: formData.estimatedCharges || null,
      interview_date: formData.interviewDate
        ? new Date(formData.interviewDate).toISOString()
        : null,
      visa_category: formData.visaCategory || null,
      had_medical_before: formData.hadMedicalBefore || null,
      city: formData.city || null,
      case_ref: formData.caseRef || null,
      number_of_applicants: formData.numberOfApplicants
        ? parseInt(formData.numberOfApplicants)
        : null,
      original_passport: formData.originalPassport || null,
      status: "pending",
      user_id: currentUserId,
      admin_notes: formData.candidate_id
        ? `[Candidate: ${formData.candidate_id}] ${formData.candidate_name || ""}`.trim()
        : "",
      candidate_id: formData.candidateId || formData.candidate_id || null,
      candidate_role: formData.candidateRole || formData.candidate_role || null,
      candidate_name: formData.candidateName || formData.candidate_name || null,
      // Origin tagging: 'journey' rows are hidden from standalone My Resources.
      source: formData.source === "journey" ? "journey" : "standalone",
      journey_slug: formData.journey_slug || null,
      // Draft flag: standalone must-pay bookings are created hidden and revealed by the
      // Stripe webhook / verify-session once paid. Credit/journey/plan rows stay false.
      awaiting_payment: formData.awaitingPayment === true,
    };

    // Only add case_number if it exists
    if (formData.caseNumber && formData.caseNumber.trim() !== "") {
      appointmentData.case_number = formData.caseNumber;
    }

    console.log("Inserting appointment data...");

    // Insert appointment into database
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select()
      .single();

    if (appointmentError) {
      console.error("❌ Error saving appointment:", appointmentError);
      console.error("Error details:", {
        message: appointmentError.message,
        details: appointmentError.details,
        hint: appointmentError.hint,
        code: appointmentError.code,
      });
      return Response.json({ error: msg(E.BOOKING_SUBMIT_FAILED) }, { status: 500 });
    }

    if (!appointment) {
      console.error("❌ No appointment data returned");
      return Response.json({ error: msg(E.BOOKING_SUBMIT_FAILED) }, { status: 500 });
    }

    console.log("✅ Appointment created successfully:", appointment.id);

    // Trigger admin notification only if not awaiting payment (e.g. journey mode)
    if (!appointmentData.awaiting_payment) {
      try {
        await triggerAppointmentNotification(appointment.id);
      } catch (notifError) {
        console.error("Failed to trigger appointment notification:", notifError);
      }
    }

    // If there are additional applicants, save them to the database
    if (
      formData.applicants &&
      Array.isArray(formData.applicants) &&
      formData.applicants.length > 0
    ) {
      console.log(`Processing ${formData.applicants.length} additional applicants...`);

      try {
        // Define type for applicant data
        interface ApplicantData {
          surname: string;
          givenName: string;
          gender?: string;
          dateOfBirth?: string;
          passportNumber: string;
          passportIssueDate?: string;
          passportExpiryDate?: string;
          caseNumber?: string;
          caseRef?: string;
        }

        // Filter out any applicants without required data
        const validApplicants = formData.applicants.filter(
          (applicant: ApplicantData) =>
            applicant.surname && applicant.givenName && applicant.passportNumber
        );

        if (validApplicants.length > 0) {
          const applicantsData = validApplicants.map((applicant: ApplicantData) => ({
            appointment_id: appointment.id,
            surname: applicant.surname,
            given_name: applicant.givenName,
            gender: applicant.gender || null,
            date_of_birth: applicant.dateOfBirth
              ? new Date(applicant.dateOfBirth).toISOString()
              : null,
            passport_number: applicant.passportNumber,
            passport_issue_date: applicant.passportIssueDate
              ? new Date(applicant.passportIssueDate).toISOString()
              : null,
            passport_expiry_date: applicant.passportExpiryDate
              ? new Date(applicant.passportExpiryDate).toISOString()
              : null,
            case_number: applicant.caseNumber || null,
            case_ref: applicant.caseRef || null,
          }));

          console.log("Inserting applicants data:", applicantsData);

          const { data: insertedApplicants, error: applicantsError } = await supabase
            .from("applicants")
            .insert(applicantsData)
            .select();

          if (applicantsError) {
            console.error("❌ Error saving applicants:", applicantsError);
            console.error("Applicants error details:", {
              message: applicantsError.message,
              details: applicantsError.details,
              hint: applicantsError.hint,
              code: applicantsError.code,
            });
            // Don't fail the entire request - appointment was saved successfully
            console.warn("⚠️ Continuing despite applicants error");
          } else {
            console.log(`✅ Successfully saved ${insertedApplicants?.length || 0} applicants`);
          }
        } else {
          console.warn("⚠️ No valid applicants to insert");
        }
      } catch (error) {
        console.error("❌ Error processing applicants:", error);
        // Continue without saving applicants if there's an error
      }
    } else {
      console.log("No additional applicants to process");
    }

    console.log("=== Appointment submission completed successfully ===");

    return Response.json({
      success: true,
      id: appointment.id,
      message: "Appointment request submitted successfully",
    });
  } catch (error) {
    console.error("❌ Unexpected error in appointment submission:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
