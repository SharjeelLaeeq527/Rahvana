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

// Function to trigger notification when appointment status changes
export async function triggerAppointmentNotification(appointmentId: string) {
  try {
    // Use admin client to bypass RLS and fetch the record details
    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error || !appointment) {
      console.error("Error fetching appointment:", error);
      return { error: Errors.msg(Errors.E.APPOINTMENT_NOT_FOUND) };
    }

    // Send notification based on status
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

export async function triggerConsultationNotification(bookingId: string) {
  try {
    // Use admin client to bypass RLS and fetch the record details
    const { data: booking, error } = await supabaseAdmin
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
 * Triggered when a user submits a document for translation.
 */
export async function triggerTranslationNotification(
  documentId: string,
  journeyId: string | null | undefined,
  docLabel: string,
  userName?: string
) {
  try {
    return await notifyAdmins(
      "admin_new_translation",
      journeyId || undefined,
      userName
        ? `${userName} requested translation for: ${docLabel}`
        : `Translation needed for: ${docLabel}`,
      undefined,
      "Document Translation Request"
    );
  } catch (error) {
    console.error("Error triggering translation notification:", error);
    return { error: "Failed to notify admins of translation request" };
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
