// lib/notifications.ts
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

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
      return { error: "Invalid notification data" };
    }

    const { error } = await resend.emails.send({
      from: "onboarding@arachnie.com",
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { error };
    }

    console.log("Notification email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in sendAppointmentNotification:", error);
    return { error: "Failed to send notification" };
  }
}

// Function to trigger notification when appointment status changes
export async function triggerAppointmentNotification(appointmentId: string) {
  try {
    const supabase = await createClient();

    // Get appointment details
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error || !appointment) {
      console.error("Error fetching appointment:", error);
      return { error: "Appointment not found" };
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

    return await sendAppointmentNotification(notificationData);
  } catch (error) {
    console.error("Error triggering notification:", error);
    return { error: "Failed to trigger notification" };
  }
}
