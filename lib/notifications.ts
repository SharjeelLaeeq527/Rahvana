// lib/notifications.ts
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import * as Errors from "@/lib/errors";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AppointmentNotificationData {
  email: string;
  fullName: string;
  medicalWebsite: string;
  appointmentType: string;
  bookingReference?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: string;
  message?: string;
}

export async function sendAppointmentNotification(data: AppointmentNotificationData) {
  try {
    const {
      email,
      fullName,
      medicalWebsite,
      appointmentType,
      bookingReference,
      appointmentDate,
      appointmentTime,
      status,
      message,
    } = data;

    let subject = "";
    let htmlContent = "";

    if (status === "confirmed") {
      subject = "Your Appointment Has Been Confirmed!";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Appointment Confirmed!</h1>
          <p>Dear ${fullName},</p>
          <p>Your appointment request has been processed successfully. Here are the details:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Appointment Details</h2>
            <p><strong>Medical Website:</strong> ${medicalWebsite}</p>
            <p><strong>Appointment Type:</strong> ${appointmentType}</p>
            <p><strong>Booking Reference:</strong> ${bookingReference || "N/A"}</p>
            <p><strong>Date:</strong> ${appointmentDate || "To be scheduled"}</p>
            <p><strong>Time:</strong> ${appointmentTime || "To be scheduled"}</p>
          </div>
          
          <p>Our team has successfully booked your appointment. Please make sure to arrive on time with all required documents.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br/>The Arachnie Team</p>
        </div>
      `;
    } else if (status === "in_progress") {
      subject = "Your Appointment Request is Being Processed";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Appointment in Progress</h1>
          <p>Dear ${fullName},</p>
          <p>Your appointment request is currently being processed by our team.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Request Details</h2>
            <p><strong>Medical Website:</strong> ${medicalWebsite}</p>
            <p><strong>Appointment Type:</strong> ${appointmentType}</p>
          </div>
          
          <p>You will receive another email once your appointment is confirmed with the exact date and time.</p>
          
          <p>Thank you for your patience.</p>
          
          <p>Best regards,<br/>The Arachnie Team</p>
        </div>
      `;
    } else if (status === "cancelled") {
      subject = "Your Appointment Request Has Been Cancelled";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Appointment Cancelled</h1>
          <p>Dear ${fullName},</p>
          <p>Your appointment request has been cancelled.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Request Details</h2>
            <p><strong>Medical Website:</strong> ${medicalWebsite}</p>
            <p><strong>Appointment Type:</strong> ${appointmentType}</p>
          </div>
          
          <p>${message || "If you believe this was done in error, please contact our support team."}</p>
          
          <p>Best regards,<br/>The Arachnie Team</p>
        </div>
      `;
    }

    if (!subject || !htmlContent) {
      console.error("Invalid notification data");
      return { error: Errors.msg(Errors.E.APPOINTMENT_NOTIFICATION_INVALID) };
    }

    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { error: Errors.msg(Errors.E.APPOINTMENT_NOTIFICATION_SEND_FAILED) };
    }

    console.log("Notification email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in sendAppointmentNotification:", error);
    return { error: Errors.msg(Errors.E.APPOINTMENT_NOTIFICATION_SEND_FAILED) };
  }
}

// ---------------------------------------------------------------------------
//  In-App Notification Helpers
// ---------------------------------------------------------------------------

interface InAppNotificationContent {
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "critical";
  actionLabel?: string;
  actionUrl?: string;
}

/**
 * Build user-facing notification content based on appointment status.
 */
function getAppointmentNotificationContent(
  status: string,
  appointmentType: string,
  medicalWebsite: string
): InAppNotificationContent | null {
  const service = appointmentType ? `${appointmentType} (${medicalWebsite})` : medicalWebsite;

  switch (status) {
    case "in_progress":
      return {
        title: "Appointment In Progress",
        body: `Your ${service} appointment request is now being processed by our team. You'll be notified once it's confirmed.`,
        priority: "normal",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "confirmed":
    case "completed":
      return {
        title: "Appointment Confirmed",
        body: `Great news! Your ${service} appointment has been confirmed. Please check your email for full details and make sure to arrive on time with all required documents.`,
        priority: "high",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "cancelled":
      return {
        title: "Appointment Cancelled",
        body: `Your ${service} appointment request has been cancelled. If you believe this was an error, please contact our support team.`,
        priority: "critical",
        actionLabel: "Contact Support",
        actionUrl: "/#contact",
      };
    default:
      return null;
  }
}

/**
 * Create an in-app notification for the user who owns the appointment.
 * Looks up user_id from the appointment row, or falls back to email-based lookup.
 */
async function createInAppNotification(appointmentId: string, appointment: Record<string, any>) {
  try {
    const { createServerClient } = await import("@supabase/ssr");

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

    // Resolve the user_id
    let userId: string | null = appointment.user_id ?? null;

    if (!userId && appointment.email) {
      // Fallback: look up the user by email in the profiles table
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", appointment.email)
        .maybeSingle();

      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.warn(
        `[InAppNotif] No user_id found for appointment ${appointmentId} (email: ${appointment.email}). Skipping in-app notification.`
      );
      return;
    }

    const content = getAppointmentNotificationContent(
      appointment.status,
      appointment.appointment_type || "",
      appointment.medical_website || ""
    );

    if (!content) {
      console.warn(`[InAppNotif] No notification content for status: ${appointment.status}`);
      return;
    }

    const { error } = await supabaseAdmin.from("app_notifications").insert({
      user_id: userId,
      type: "appointment_status",
      title: content.title,
      body: content.body,
      priority: content.priority,
      action_label: content.actionLabel || null,
      action_url: content.actionUrl || null,
      metadata: {
        appointment_id: appointmentId,
        status: appointment.status,
        appointment_type: appointment.appointment_type,
        medical_website: appointment.medical_website,
      },
    });

    if (error) {
      console.error("[InAppNotif] Error inserting notification:", error);
    } else {
      console.log(
        `[InAppNotif] ✅ Created in-app notification for user ${userId} (status: ${appointment.status})`
      );
    }
  } catch (err) {
    console.error("[InAppNotif] Unexpected error creating in-app notification:", err);
  }
}

// Function to trigger notification when appointment status changes
export async function triggerAppointmentNotification(appointmentId: string) {
  try {
    const { createServerClient } = await import("@supabase/ssr");
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

    // Get appointment details
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error || !appointment) {
      console.error("Error fetching appointment:", error);
      return { error: Errors.msg(Errors.E.APPOINTMENT_NOT_FOUND) };
    }

    // Send email notification based on status
    const notificationData: AppointmentNotificationData = {
      email: appointment.email,
      fullName: appointment.full_name,
      medicalWebsite: appointment.medical_website,
      appointmentType: appointment.appointment_type,
      bookingReference: appointment.booking_reference,
      appointmentDate: appointment.preferred_date,
      appointmentTime: appointment.preferred_time,
      status: appointment.status,
    };

    // Create in-app notification (non-blocking — don't let it fail the email)
    createInAppNotification(appointmentId, appointment).catch((err) => {
      console.error("[InAppNotif] Background error:", err);
    });

    return await sendAppointmentNotification(notificationData);
  } catch (error) {
    console.error("Error triggering notification:", error);
    return { error: Errors.msg(Errors.E.APPOINTMENT_TRIGGER_FAILED) };
  }
}

interface ConsultationNotificationData {
  email: string;
  fullName: string;
  referenceId: string;
  issueCategory: string;
  visaCategory: string;
  selectedSlot: Date | string;
  alternateSlots?: (Date | string)[];
  status: string;
  adminNotes?: string;
}

export async function sendConsultationNotification(data: ConsultationNotificationData) {
  try {
    const {
      email,
      fullName,
      referenceId,
      issueCategory,
      visaCategory,
      selectedSlot,
      alternateSlots,
      status,
      adminNotes,
    } = data;

    const formatSlotDate = (date: Date | string) => {
      try {
        const d = new Date(date);
        return (
          d.toLocaleString("en-US", {
            timeZone: "America/New_York",
            dateStyle: "medium",
            timeStyle: "short",
          }) + " (ET)"
        );
      } catch (err) {
        return String(date);
      }
    };

    let subject = "";
    let htmlContent = "";

    const headerHtml = `
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: white;">Arachnie Consultation</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: white;">Appointment Status Update</p>
      </div>
    `;

    const footerHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated notification from Arachnie. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} Arachnie. All rights reserved.</p>
      </div>
    `;

    const cardStyles = `background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;`;

    if (status === "confirmed") {
      subject = `Consultation Confirmed - Ref: ${referenceId}`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Consultation Confirmed!</h2>
            <p>Dear ${fullName},</p>
            <p>We are pleased to inform you that your consultation request has been approved and confirmed. Please find the finalized details below:</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Booking Summary</h3>
              <p style="margin: 8px 0;"><strong>Reference ID:</strong> <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${referenceId}</span></p>
              <p style="margin: 8px 0;"><strong>Confirmed Date & Time:</strong> <span style="color: #4f46e5; font-weight: 600;">${formatSlotDate(selectedSlot)}</span></p>
              <p style="margin: 8px 0;"><strong>Issue Category:</strong> ${issueCategory}</p>
              <p style="margin: 8px 0;"><strong>Visa Category:</strong> ${visaCategory}</p>
            </div>
            
            <p>Our consultation experts look forward to speaking with you. Please ensure you are online and ready at the scheduled time.</p>
            
            ${
              adminNotes
                ? `
            <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <strong style="display: block; color: #374151; font-size: 14px; margin-bottom: 5px;">Important Notes:</strong>
              <p style="margin: 0; font-style: italic; color: #4b5563;">${adminNotes}</p>
            </div>
            `
                : ""
            }
            
            <p>If you need to make changes or have any urgent questions, please feel free to reach out to us.</p>
            ${footerHtml}
          </div>
        </div>
      `;
    } else if (status === "alternatives_proposed") {
      subject = `Alternative Consultation Slots Proposed - Ref: ${referenceId}`;

      const slotsList =
        alternateSlots && alternateSlots.length > 0
          ? alternateSlots
              .map(
                (slot) =>
                  `<li style="margin: 8px 0; font-weight: 600; color: #4f46e5;">${formatSlotDate(slot)}</li>`
              )
              .join("")
          : `<li style="margin: 8px 0; font-style: italic; color: #6b7280;">No explicit alternative slots proposed</li>`;

      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Alternative Slots Proposed</h2>
            <p>Dear ${fullName},</p>
            <p>Your requested time slot is currently unavailable. However, our admin team has proposed the following alternative slot options for your consultation:</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Proposed Alternative Slots</h3>
              <ul style="margin: 12px 0; padding-left: 20px;">
                ${slotsList}
              </ul>
            </div>

            ${
              adminNotes
                ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; color: #92400e;">
              <strong style="display: block; font-size: 14px; margin-bottom: 5px;">Message from Admin:</strong>
              <p style="margin: 0; font-style: italic;">${adminNotes}</p>
            </div>
            `
                : ""
            }
            
            <p>Please visit your booking portal to select one of these preferred slots or propose different times.</p>
            ${footerHtml}
          </div>
        </div>
      `;
    } else if (status === "needs_more_info") {
      subject = `Information Requested for Consultation - Ref: ${referenceId}`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Action Required: More Info Needed</h2>
            <p>Dear ${fullName},</p>
            <p>To properly review and prepare for your consultation, our team requires some additional details regarding your case.</p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0; color: #1e3a8a;">
              <strong style="display: block; font-size: 14px; margin-bottom: 8px;">Details Requested:</strong>
              <p style="margin: 0; font-style: italic; line-height: 1.6;">${adminNotes || "Please check your portal/dashboard for more details or contact support."}</p>
            </div>
            
            <p>Please log in to your account or visit the consultation portal to provide this information so we can finalize your booking.</p>
            ${footerHtml}
          </div>
        </div>
      `;
    } else if (status === "canceled") {
      subject = `Consultation Request Cancelled - Ref: ${referenceId}`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: white;">Consultation Cancelled</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: white;">Appointment Status Update</p>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Consultation Request Cancelled</h2>
            <p>Dear ${fullName},</p>
            <p>We are writing to let you know that your consultation request with reference <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${referenceId}</span> has been cancelled.</p>
            
            ${
              adminNotes
                ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; color: #991b1b;">
              <strong style="display: block; font-size: 14px; margin-bottom: 5px;">Cancellation Note:</strong>
              <p style="margin: 0; font-style: italic;">${adminNotes}</p>
            </div>
            `
                : `
            <p>If you believe this was done in error or if you would like to reschedule, please visit our website and submit a new request.</p>
            `
            }
            
            <p>Best regards,<br/>The Arachnie Team</p>
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (!subject || !htmlContent) {
      console.warn(`No notification email layout implemented for status: ${status}`);
      return { error: `No layout for status ${status}` };
    }

    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending consultation email via Resend:", error);
      return { error };
    }

    console.log("Consultation status notification email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in sendConsultationNotification:", error);
    return { error: "Failed to send notification" };
  }
}

/**
 * Build user-facing notification content based on consultation booking status.
 */
function getConsultationNotificationContent(
  status: string,
  issueCategory: string,
  adminNotes?: string
): InAppNotificationContent | null {
  const category = issueCategory || "General Consultation";

  switch (status) {
    case "confirmed":
      return {
        title: "Consultation Confirmed",
        body: `Your consultation for "${category}" has been confirmed! Please check your email for full details and schedule.`,
        priority: "high",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "alternatives_proposed":
      return {
        title: "New Slots Proposed",
        body: `Alternative slots have been proposed for your "${category}" consultation. Please check your email to review and select a slot.`,
        priority: "normal",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "needs_more_info":
      return {
        title: "Consultation Info Required",
        body: `More information is needed for your "${category}" consultation. Details: ${adminNotes || "Please check your email or contact support."}`,
        priority: "high",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "canceled":
      return {
        title: "Consultation Cancelled",
        body: `Your consultation request for "${category}" has been cancelled. ${adminNotes ? `Reason: ${adminNotes}` : "Please contact support for details."}`,
        priority: "critical",
        actionLabel: "Contact Support",
        actionUrl: "/#contact",
      };
    default:
      return null;
  }
}

/**
 * Create an in-app notification for the user who owns the consultation.
 * Looks up user_id by matching the booking email to profiles.
 */
async function createConsultationInAppNotification(
  bookingId: string,
  booking: Record<string, any>
) {
  try {
    const { createServerClient } = await import("@supabase/ssr");

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

    // Resolve the user_id by looking up the email in profiles
    let userId: string | null = null;
    if (booking.email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", booking.email)
        .maybeSingle();

      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.warn(
        `[ConsultationInAppNotif] No user profile found for email ${booking.email}. Skipping in-app notification.`
      );
      return;
    }

    const content = getConsultationNotificationContent(
      booking.status,
      booking.issue_category || "",
      booking.admin_notes || ""
    );

    if (!content) {
      console.warn(
        `[ConsultationInAppNotif] No notification content for status: ${booking.status}`
      );
      return;
    }

    const { error } = await supabaseAdmin.from("app_notifications").insert({
      user_id: userId,
      type: "consultation_status",
      title: content.title,
      body: content.body,
      priority: content.priority,
      action_label: content.actionLabel || null,
      action_url: content.actionUrl || null,
      metadata: {
        booking_id: bookingId,
        reference_id: booking.reference_id,
        status: booking.status,
        issue_category: booking.issue_category,
        visa_category: booking.visa_category,
      },
    });

    if (error) {
      console.error("[ConsultationInAppNotif] Error inserting notification:", error);
    } else {
      console.log(
        `[ConsultationInAppNotif] ✅ Created in-app notification for user ${userId} (status: ${booking.status})`
      );
    }
  } catch (err) {
    console.error("[ConsultationInAppNotif] Unexpected error creating in-app notification:", err);
  }
}

export async function triggerConsultationNotification(bookingId: string) {
  try {
    const { createServerClient } = await import("@supabase/ssr");
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

    // Get consultation booking details
    const { data: booking, error } = await supabase
      .from("consultation_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error("Error fetching consultation booking:", error);
      return { error: "Consultation booking not found" };
    }

    const notificationData: ConsultationNotificationData = {
      email: booking.email,
      fullName: booking.full_name,
      referenceId: booking.reference_id,
      issueCategory: booking.issue_category,
      visaCategory: booking.visa_category,
      selectedSlot: booking.selected_slot,
      alternateSlots: booking.alternate_slots,
      status: booking.status,
      adminNotes: booking.admin_notes,
    };

    // Create in-app notification (non-blocking)
    createConsultationInAppNotification(bookingId, booking).catch((err) => {
      console.error("[ConsultationInAppNotif] Background error:", err);
    });

    return await sendConsultationNotification(notificationData);
  } catch (error) {
    console.error("Error triggering consultation notification:", error);
    return { error: "Failed to trigger consultation notification" };
  }
}
