import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

    // Get form data from request
    const formData = await req.json();
    console.log("Received form data:", {
      location: formData.location,
      numberOfApplicants: formData.numberOfApplicants,
      hasApplicants: !!formData.applicants,
      applicantsLength: formData.applicants?.length,
    });

    // Extract the full name from given name and surname
    const fullName = `${formData.givenName} ${formData.surname}`;

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
    }

    // Prepare appointment data for database insertion
    const appointmentData: AppointmentData = {
      full_name: fullName,
      email: formData.email,
      phone_number: formData.primaryContact, // ✅ Correct column name
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
      surname: formData.surname,
      given_name: formData.givenName,
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
      return Response.json(
        {
          error: "Failed to save appointment",
          details: appointmentError.message,
          code: appointmentError.code,
          hint: appointmentError.hint,
        },
        { status: 500 }
      );
    }

    if (!appointment) {
      console.error("❌ No appointment data returned");
      return Response.json(
        {
          error: "Failed to create appointment - no data returned",
        },
        { status: 500 }
      );
    }

    console.log("✅ Appointment created successfully:", appointment.id);

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
