// lib/notifications.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Resend } from "resend";
import * as Errors from "@/lib/errors";
import { Notification } from "@/types/notifications";
import {
  NotificationType,
  NOTIFICATION_TEMPLATES,
  CreateNotificationBody,
} from "@/types/notifications";

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
          
          <p>Best regards,<br/>The Rahvana Team</p>
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
          
          <p>Best regards,<br/>The Rahvana Team</p>
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
          
          <p>Best regards,<br/>The Rahvana Team</p>
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
        `[InAppNotif] Created in-app notification for user ${userId} (status: ${appointment.status})`
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

    // Create in-app notification (non-blocking — don't let it fail the email)
    createInAppNotification(appointmentId, appointment).catch((err) => {
      console.error("[InAppNotif] Background error:", err);
    });

    const result = await sendAppointmentNotification(notificationData);

    // Admin Connection: Notify admin specifically WHO booked WHAT
    if (
      appointment.status === "scheduled" ||
      appointment.status === "pending_confirmation" ||
      appointment.status === "pending"
    ) {
      await notifyAdmins(
        "admin_new_appointment",
        appointment.journey_id || undefined, // Handle potential null journey_id
        `${appointment.full_name} has booked a ${appointment.appointment_type} medical appointment.`,
        undefined,
        "New Medical Appointment"
      );
    }

    return result;
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
      <div style="background-color: #0d7377; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: white;">Rahvana Consultation</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: white;">Appointment Status Update</p>
      </div>
    `;

    const footerHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated notification from Rahvana. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} Rahvana. All rights reserved.</p>
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
              <p style="margin: 8px 0;"><strong>Confirmed Date & Time:</strong> <span style="color: #0d7377; font-weight: 600;">${formatSlotDate(selectedSlot)}</span></p>
              <p style="margin: 8px 0;"><strong>Issue Category:</strong> ${issueCategory}</p>
            </div>
            
            <p>Our consultation experts look forward to speaking with you. Please ensure you are online and ready at the scheduled time.</p>
            
            ${
              adminNotes
                ? `
            <div style="background-color: #f3f4f6; border-left: 4px solid #0d7377; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
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
                  `<li style="margin: 8px 0; font-weight: 600; color: #0d7377;">${formatSlotDate(slot)}</li>`
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
          <div style="background-color: #0d7377; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
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
            
            <p>Best regards,<br/>The Rahvana Team</p>
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
        `[ConsultationInAppNotif] Created in-app notification for user ${userId} (status: ${booking.status})`
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

    const result = await sendConsultationNotification(notificationData);

    // Admin Connection: Notify admin of new consultation requests
    if (booking.status === "pending_approval") {
      await notifyAdmins(
        "admin_new_consultation",
        undefined,
        `${booking.full_name} has requested a consultation regarding ${booking.issue_category}.`,
        undefined,
        "New Consultation Request"
      );
    }

    return result;
  } catch (error) {
    console.error("Error triggering consultation notification:", error);
    return { error: "Failed to trigger consultation notification" };
  }
}

/**
 * Triggered when a user confirms and accepts a completed translation.
 */
export async function triggerTranslationConfirmedNotification(
  journeyId: string | null | undefined,
  userName: string,
  docLabel: string
) {
  try {
    return await notifyAdmins(
      "admin_new_translation",
      journeyId || undefined,
      `${userName} has confirmed and accepted the translation for: ${docLabel}`,
      undefined,
      "Translation Accepted"
    );
  } catch (error) {
    console.error("Error triggering translation confirmation notification:", error);
    return { error: "Failed to notify admins of translation confirmation" };
  }
}

/**
 * Triggered when a user requests a Police Clearance Certificate verification.
 */
export async function triggerPCCNotification(
  requestId: string,
  journeyId: string | null | undefined, // Allow null or undefined journeyId
  userName: string,
  customBody?: string
) {
  try {
    return await notifyAdmins(
      "admin_new_pcc",
      journeyId || undefined, // Pass undefined if journeyId is null
      customBody || `PCC verification request from ${userName}`,
      undefined,
      "PCC Verification Request"
    );
  } catch (error) {
    console.error("Error triggering PCC notification:", error);
    return { error: "Failed to notify admins of PCC request" };
  }
}

/**
 * Triggered when a user submits feedback or a feature request.
 */
export async function triggerFeedbackNotification(userName: string, feedbackType: string) {
  try {
    return await notifyAdmins(
      "admin_feedback_received",
      undefined,
      `New ${feedbackType} received from ${userName}`,
      undefined,
      "New User Feedback"
    );
  } catch (error) {
    console.error("Error triggering feedback notification:", error);
    return { error: "Failed to notify admins of feedback" };
  }
}

/**
 * Broadcasts an in-app notification to all users with the 'admin' role.
 * Used for events like new consultation bookings, document translations, etc.
 */
export async function notifyAdmins(
  type: NotificationType,
  journeyId?: string,
  customBody?: string,
  customUrl?: string,
  customTitle?: string
) {
  try {
    console.log(`🔔 notifyAdmins triggered for type: ${type}`);
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) throw new Error(`Template not found for type: ${type}`);

    // 1. Fetch all admin users from the profiles table
    const { data: admins, error: adminError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminError || !admins) {
      console.error("Error fetching admin users:", adminError);
      return { error: "Failed to fetch admin users" };
    }

    console.log(`👥 Found ${admins.length} admin(s) to notify.`);

    if (admins.length === 0) {
      console.warn("⚠️ No admin users found in profiles table with role='admin'");
      return { success: true, count: 0 };
    }

    // 2. Prepare the notification records
    // journeyId is optional as some events (like feedback) aren't tied to a specific journey
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      journey_id: journeyId || null,
      type,
      priority: template.priority,
      title: customTitle || template.title,
      body: customBody || template.body,
      action_url: customUrl || template.action_url,
      action_label: template.action_label,
      status: "unread",
      created_at: new Date().toISOString(),
    }));

    // 3. Batch insert into the notifications table
    const { error: insertError } = await supabaseAdmin.from("notifications").insert(notifications);

    if (insertError) {
      console.error("Error inserting admin notifications:", insertError);
      return { error: "Failed to create admin notifications" };
    }

    console.log(`✅ Successfully created ${notifications.length} notification records.`);
    return { success: true, count: admins.length };
  } catch (error) {
    console.error("Error in notifyAdmins:", error);
    return { error: "Failed to broadcast notification to admins" };
  }
}

/**
 * Fetches admin notifications for a specific user.
 * @param adminUserId The ID of the admin user.
 */
export async function fetchAdminNotifications(adminUserId: string): Promise<{
  notifications: Notification[];
  unreadCount: number;
  error: string | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", adminUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin notifications:", error);
      return { notifications: [], unreadCount: 0, error: error.message };
    }

    const unreadCount = data.filter((n) => n.status === "unread").length;
    return { notifications: data as Notification[], unreadCount, error: null };
  } catch (err) {
    console.error("Exception in fetchAdminNotifications:", err);
    return { notifications: [], unreadCount: 0, error: "An unexpected error occurred." };
  }
}

/**
 * Marks a specific notification as read.
 * @param notificationId The ID of the notification to mark as read.
 * @param adminUserId The ID of the admin user (for authorization).
 */
export async function markNotificationAsRead(
  notificationId: string,
  adminUserId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", adminUserId); // Ensure only the owner can mark as read

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error("Exception in markNotificationAsRead:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Dismisses a specific notification.
 * @param notificationId The ID of the notification to dismiss.
 * @param adminUserId The ID of the admin user (for authorization).
 */
export async function dismissNotification(
  notificationId: string,
  adminUserId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", adminUserId); // Ensure only the owner can dismiss

    if (error) {
      console.error("Error dismissing notification:", error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error("Exception in dismissNotification:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Marks all unread notifications for a specific user as read.
 * @param adminUserId The ID of the admin user.
 */
export async function markAllNotificationsAsRead(
  adminUserId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("user_id", adminUserId)
      .eq("status", "unread");

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error("Exception in markAllNotificationsAsRead:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ---------------------------------------------------------------------------
//  Translation Notification Helpers & Triggers
// ---------------------------------------------------------------------------

interface TranslationNotificationData {
  email: string;
  fullName: string;
  documentId: string;
  documentType: string;
  version: number;
  status: string;
  adminNotes?: string;
  originalFilename?: string;
  translatedFilename?: string;
}

export async function sendTranslationNotification(data: TranslationNotificationData) {
  try {
    const {
      email,
      fullName,
      documentId,
      documentType,
      version,
      status,
      adminNotes,
      originalFilename,
      translatedFilename,
    } = data;

    let subject = "";
    let htmlContent = "";

    const headerHtml = `
      <div style="background-color: #0d7377; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: white;">Rahvana Translation</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: white;">Document Translation Status Update</p>
      </div>
    `;

    const footerHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated notification from Rahvana. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} Rahvana. All rights reserved.</p>
      </div>
    `;

    const cardStyles = `background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;`;

    // Map documentType key to pretty label
    const docTypeLabel = documentType.charAt(0).toUpperCase() + documentType.slice(1);

    if (status === "TRANSLATED") {
      subject = `Your Translation is Ready for Review - V${version}`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Translation Ready for Review</h2>
            <p>Dear ${fullName},</p>
            <p>Great news! The English translation for your Urdu document has been uploaded and is ready for your review. Please see details below:</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Document Details</h3>
              <p style="margin: 8px 0;"><strong>Request ID:</strong> <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${documentId}</span></p>
              <p style="margin: 8px 0;"><strong>Document Type:</strong> ${docTypeLabel}</p>
              <p style="margin: 8px 0;"><strong>Original File:</strong> ${originalFilename || "Urdu PDF"}</p>
              <p style="margin: 8px 0;"><strong>Translated Proof:</strong> <span style="color: #0d7377; font-weight: 600;">${translatedFilename || `Proof_V${version}.pdf`}</span></p>
              <p style="margin: 8px 0;"><strong>Version:</strong> V${version}</p>
            </div>
            
            ${
              adminNotes
                ? `
            <div style="background-color: #f3f4f6; border-left: 4px solid #0d7377; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <strong style="display: block; color: #374151; font-size: 14px; margin-bottom: 5px;">Admin Notes:</strong>
              <p style="margin: 0; font-style: italic; color: #4b5563;">${adminNotes}</p>
            </div>
            `
                : ""
            }
            
            <p>Please click the button below to view the request, download the proof, and either approve it or request modifications.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com"}/document-translation/request/${documentId}" 
                 style="background-color: #0d7377; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Review Translation Proof
              </a>
            </div>
            
            ${footerHtml}
          </div>
        </div>
      `;
    } else if (status === "VERIFIED") {
      subject = `Your Translation Has Been Certified and Verified!`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px; color: #16a34a;">Translation Certified & Verified!</h2>
            <p>Dear ${fullName},</p>
            <p>We are pleased to inform you that your Urdu to English document translation has been officially certified and verified by our team. It is now ready for use!</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Completed Request</h3>
              <p style="margin: 8px 0;"><strong>Request ID:</strong> <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${documentId}</span></p>
              <p style="margin: 8px 0;"><strong>Document Type:</strong> ${docTypeLabel}</p>
              <p style="margin: 8px 0;"><strong>Certified File:</strong> <span style="color: #16a34a; font-weight: 600;">${translatedFilename || `Certified_Translation.pdf`}</span></p>
            </div>
            
            ${
              adminNotes
                ? `
            <div style="background-color: #f3f4f6; border-left: 4px solid #16a34a; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <strong style="display: block; color: #374151; font-size: 14px; margin-bottom: 5px;">Verification Notes:</strong>
              <p style="margin: 0; font-style: italic; color: #4b5563;">${adminNotes}</p>
            </div>
            `
                : ""
            }
            
            <p>You can access and download your certified translation anytime by logging into your dashboard or clicking the link below.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://rahvana.com"}/document-translation/request/${documentId}" 
                 style="background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Download Certified Document
              </a>
            </div>
            
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
      console.error("Error sending translation email via Resend:", error);
      return { error };
    }

    console.log("Translation status notification email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in sendTranslationNotification:", error);
    return { error: "Failed to send notification" };
  }
}

/**
 * Build user-facing notification content based on translation status.
 */
function getTranslationNotificationContent(
  status: string,
  documentType: string,
  version: number,
  adminNotes?: string
): InAppNotificationContent | null {
  const docTypeLabel = documentType.charAt(0).toUpperCase() + documentType.slice(1);

  switch (status) {
    case "TRANSLATED":
      return {
        title: "Translation Ready for Review",
        body: `Your Urdu to English translation for "${docTypeLabel}" (Version ${version}) is ready. Please review and approve it.`,
        priority: "high",
        actionLabel: "Review Translation",
        actionUrl: `/document-translation/request`,
      };
    case "VERIFIED":
      return {
        title: "Translation Certified & Verified",
        body: `Great news! Your translation request for "${docTypeLabel}" has been verified and certified. You can now download the certified document.`,
        priority: "high",
        actionLabel: "Download Document",
        actionUrl: `/document-translation/request`,
      };
    case "IN_REVIEW":
      return {
        title: "Translation In Review",
        body: `Your translation request for "${docTypeLabel}" is now being processed by our admin team.`,
        priority: "normal",
        actionLabel: "View Request",
        actionUrl: `/document-translation/request`,
      };
    default:
      return null;
  }
}

/**
 * Create an in-app notification for the user who owns the translation document.
 * Looks up user_id from the document row, or falls back to email-based lookup.
 */
async function createTranslationInAppNotification(
  documentId: string,
  document: Record<string, any>
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

    // Resolve the user_id
    let userId: string | null = document.user_id ?? null;

    if (!userId && document.user_email) {
      // Fallback: look up the user by email in the profiles table
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", document.user_email)
        .maybeSingle();

      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.warn(
        `[TranslationInAppNotif] No user profile found for email ${document.user_email}. Skipping in-app notification.`
      );
      return;
    }

    const content = getTranslationNotificationContent(
      document.status,
      document.document_type || "document",
      Number(document.version) || 1.0,
      document.admin_notes || ""
    );

    if (!content) {
      console.warn(
        `[TranslationInAppNotif] No notification content for status: ${document.status}`
      );
      return;
    }

    const actionUrl = content.actionUrl ? `${content.actionUrl}/${documentId}` : null;

    const { error } = await supabaseAdmin.from("app_notifications").insert({
      user_id: userId,
      type: "translation_status",
      title: content.title,
      body: content.body,
      priority: content.priority,
      action_label: content.actionLabel || null,
      action_url: actionUrl,
      metadata: {
        document_id: documentId,
        status: document.status,
        document_type: document.document_type,
        version: document.version,
      },
    });

    if (error) {
      console.error("[TranslationInAppNotif] Error inserting notification:", error);
    } else {
      console.log(
        `[TranslationInAppNotif] Created in-app notification for user ${userId} (status: ${document.status})`
      );
    }
  } catch (err) {
    console.error("[TranslationInAppNotif] Unexpected error creating in-app notification:", err);
  }
}

export async function triggerTranslationNotification(documentId: string) {
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

    // Get document details
    const { data: document, error } = await supabase
      .from("translation_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error || !document) {
      console.error("Error fetching translation document:", error);
      return { error: Errors.msg(Errors.E.TRANSLATION_NOT_FOUND) };
    }

    // Attempt to lookup fullName if user_name is blank/User/generic
    let fullName = document.user_name || "Valued User";
    if ((!document.user_name || document.user_name === "User") && document.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", document.user_id)
        .single();
      if (profile?.full_name) {
        fullName = profile.full_name;
      }
    }

    const email = document.user_email;
    if (!email) {
      console.warn(
        `[TranslationNotif] No email found for translation document ${documentId}. Skipping notification email.`
      );
    } else {
      const notificationData: TranslationNotificationData = {
        email: email,
        fullName: fullName,
        documentId: documentId,
        documentType: document.document_type,
        version: Number(document.version) || 1.0,
        status: document.status,
        adminNotes: document.admin_notes,
        originalFilename: document.original_filename,
        translatedFilename: document.translated_filename,
      };

      // Send email notification (non-blocking)
      sendTranslationNotification(notificationData).catch((err) => {
        console.error("[TranslationNotif] Email sending error:", err);
      });
    }

    // Create in-app notification (non-blocking)
    createTranslationInAppNotification(documentId, document).catch((err) => {
      console.error("[TranslationInAppNotif] Background error:", err);
    });

    return { success: true };
  } catch (error) {
    console.error("Error triggering translation notification:", error);
    return { error: Errors.msg(Errors.E.TRANSLATION_TRIGGER_FAILED) };
  }
}

// ---------------------------------------------------------------------------
//  Police Verification (PCC Sindh Service) Notification Helpers & Triggers
// ---------------------------------------------------------------------------

interface PoliceVerificationNotificationData {
  email: string;
  fullName: string;
  id: string;
  requestId: string;
  status: string;
  province?: string;
  district?: string;
}

export async function sendPoliceVerificationNotification(data: PoliceVerificationNotificationData) {
  try {
    const { email, fullName, id, requestId, status, province, district } = data;

    let subject = "";
    let htmlContent = "";

    const headerHtml = `
      <div style="background-color: #0d7377; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: white;">Sindh Police Character Certificate</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: white;">Request Status Update</p>
      </div>
    `;

    const footerHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated notification from Arachnie. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} Arachnie. All rights reserved.</p>
      </div>
    `;

    const cardStyles = `background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;`;

    if (status === "completed") {
      subject = `Your Sindh PCC Request Has Been Completed!`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px; color: #0d7377;">Character Certificate Ready!</h2>
            <p>Dear ${fullName},</p>
            <p>We are pleased to inform you that your Sindh Police Character Certificate (PCC) request has been successfully processed and completed.</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Request Summary</h3>
              <p style="margin: 8px 0;"><strong>Tracking ID:</strong> <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${requestId || "N/A"}</span></p>
              <p style="margin: 8px 0;"><strong>Province:</strong> ${province || "Sindh"}</p>
              <p style="margin: 8px 0;"><strong>District:</strong> ${district || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #0d7377; font-weight: 600;">COMPLETED</span></p>
            </div>
            
            <p>You can retrieve and download your official Police Character Certificate from your user dashboard by clicking the button below.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://arachnie.com"}/user-dashboard" 
                 style="background-color: #0d7377; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            ${footerHtml}
          </div>
        </div>
      `;
    } else if (status === "in_progress") {
      subject = `Your Sindh PCC Request is Now In Progress`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          ${headerHtml}
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Filing Request In Progress</h2>
            <p>Dear ${fullName},</p>
            <p>Your Sindh Police Character Certificate (PCC) request is now actively being processed and filed by our admin team.</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Request Summary</h3>
              <p style="margin: 8px 0;"><strong>Tracking ID:</strong> <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${requestId || "N/A"}</span></p>
              <p style="margin: 8px 0;"><strong>Province:</strong> ${province || "Sindh"}</p>
              <p style="margin: 8px 0;"><strong>District:</strong> ${district || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #0284c7; font-weight: 600;">IN PROGRESS</span></p>
            </div>
            
            <p>Our team is handling the documentation and coordinating with the relevant department. We will notify you as soon as the certificate is finalized or if any further details are required.</p>
            
            <p>You can track the progress of your application on your user dashboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://arachnie.com"}/user-dashboard" 
                 style="background-color: #0d7377; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Track Request
              </a>
            </div>
            
            ${footerHtml}
          </div>
        </div>
      `;
    } else if (status === "cancelled") {
      subject = `Action Required: Sindh PCC Request Issue`;
      htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
          <div style="background-color: #0d7377; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: white;">Sindh Police Character Certificate</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: white;">Action Required</p>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px; color: #dc2626;">Request Discrepancy / Action Needed</h2>
            <p>Dear ${fullName},</p>
            <p>We encountered an issue while processing your Sindh Police Character Certificate (PCC) request.</p>
            
            <div style="${cardStyles}">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Request Summary</h3>
              <p style="margin: 8px 0;"><strong>Tracking ID:</strong> <span style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${requestId || "N/A"}</span></p>
              <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: 600;">ACTION REQUIRED / CANCELLED</span></p>
            </div>
            
            <p>Please log in to your user dashboard to review the specific notes from the admin, update any incorrect details or uploads, and re-submit the request for filing.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://arachnie.com"}/user-dashboard" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Review Request Details
              </a>
            </div>
            
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
      console.error("Error sending Sindh PCC email via Resend:", error);
      return { error };
    }

    console.log("Sindh PCC status notification email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in sendPoliceVerificationNotification:", error);
    return { error: "Failed to send notification" };
  }
}

function getPoliceVerificationNotificationContent(
  status: string,
  requestId: string
): InAppNotificationContent | null {
  const displayId = requestId || "PCC Request";

  switch (status) {
    case "pending":
      return {
        title: "PCC Sindh Request Received",
        body: `Your Sindh Police Character Certificate request (${displayId}) has been received and is pending admin review.`,
        priority: "normal",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "in_progress":
      return {
        title: "PCC Sindh In Progress",
        body: `Your Sindh Police Character Certificate request (${displayId}) is now in progress.`,
        priority: "high",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "completed":
      return {
        title: "PCC Sindh Completed",
        body: `Your Sindh Police Character Certificate request (${displayId}) has been successfully completed.`,
        priority: "high",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    case "cancelled":
      return {
        title: "PCC Sindh Action Required",
        body: `Action required: There is an issue with your Sindh Police Character Certificate request (${displayId}). Please review admin notes.`,
        priority: "critical",
        actionLabel: "View Dashboard",
        actionUrl: "/user-dashboard",
      };
    default:
      return null;
  }
}

async function createPoliceVerificationInAppNotification(id: string, request: Record<string, any>) {
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

    let userId: string | null = request.user_id ?? null;

    if (!userId && request.email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", request.email)
        .maybeSingle();

      userId = profile?.id ?? null;
    }

    if (!userId) {
      console.warn(
        `[PCCInAppNotif] No user profile found for email ${request.email}. Skipping in-app notification.`
      );
      return;
    }

    const content = getPoliceVerificationNotificationContent(request.status, request.request_id);

    if (!content) {
      console.warn(`[PCCInAppNotif] No notification content for status: ${request.status}`);
      return;
    }

    const { error } = await supabaseAdmin.from("app_notifications").insert({
      user_id: userId,
      type: "police_verification_status",
      title: content.title,
      body: content.body,
      priority: content.priority,
      action_label: content.actionLabel || null,
      action_url: content.actionUrl || null,
      metadata: {
        request_uuid: id,
        request_id: request.request_id,
        status: request.status,
      },
    });

    if (error) {
      console.error("[PCCInAppNotif] Error inserting notification:", error);
    } else {
      console.log(
        `[PCCInAppNotif] Created in-app notification for user ${userId} (status: ${request.status})`
      );
    }
  } catch (err) {
    console.error("[PCCInAppNotif] Unexpected error creating in-app notification:", err);
  }
}

export async function triggerPoliceVerificationNotification(id: string) {
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

    const { data: request, error } = await supabase
      .from("police_verification_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !request) {
      console.error("Error fetching police verification request:", error);
      return { error: Errors.msg(Errors.E.POLICE_VERIFICATION_NOT_FOUND) };
    }

    const email = request.email;
    if (!email) {
      console.warn(`[PCCNotif] No email found for request ${id}. Skipping email.`);
    } else {
      const notificationData: PoliceVerificationNotificationData = {
        email: email,
        fullName: request.full_name,
        id: id,
        requestId: request.request_id,
        status: request.status,
        province: request.province,
        district: request.district,
      };

      sendPoliceVerificationNotification(notificationData).catch((err) => {
        console.error("[PCCNotif] Email sending error:", err);
      });
    }

    createPoliceVerificationInAppNotification(id, request).catch((err) => {
      console.error("[PCCInAppNotif] Background error:", err);
    });

    return { success: true };
  } catch (error) {
    console.error("Error triggering police verification notification:", error);
    return { error: Errors.msg(Errors.E.POLICE_VERIFICATION_TRIGGER_FAILED) };
  }
}
