import React from "react";
import { Stethoscope, ClipboardList } from "lucide-react";

export const MEDICAL_EXAM_DATA = {
  eyebrow: {
    chapter: "Chapter 3 · Medical & Interview",
    step: "Step 1 — Schedule Medical Exam"
  },
  title: "Schedule Medical Exam",
  description: "Book your consular medical exam with an embassy-approved physician. You can use Rahvana's booking service or schedule it yourself with the guide.",
  chips: [
    { label: "Medical", type: "med" },
    { label: "Booking", type: "book" },
    { label: "Reminder Active", type: "remind" }
  ],
  decisionModule: {
    eyebrow: "Medical Exam Scheduling",
    heading: "How would you like to schedule your medical exam?",
    paths: [
      {
        id: "service",
        icon: <Stethoscope size={28} className="text-teal-400" />,
        title: "Use Rahvana's booking service",
        sub: "Rahvana assists with booking an embassy-approved physician for your location"
      },
      {
        id: "guide",
        icon: <ClipboardList size={28} className="text-blue-400" />,
        title: "I'll book it myself",
        sub: "Follow the step-by-step guide to find and book an approved physician yourself"
      }
    ]
  },
  serviceSteps: [
    {
      label: "Step 1 of 3 — Rahvana Booking Service",
      heading: "Book your medical exam through Rahvana",
      sub: "Rahvana will connect you with an embassy-approved physician in your area. Click below to open the booking service.",
      card: {
        title: "Rahvana Medical Booking Service",
        description: "Rahvana's booking service helps you find and schedule an appointment with a physician approved by your consulate. The service is available for Pakistan-based applicants.",
        buttonLabel: "Open Booking Service",
        href: "/book-appointment"
      },
      nav: { next: "I've requested my appointment →" }
    },
    {
      label: "Step 2 of 3 — Confirm booking details",
      heading: "Confirm your appointment was requested",
      sub: "After submitting your request through the booking service, Rahvana will follow up to confirm the appointment time. Proceed once you have received confirmation.",
      info: "After submitting your request, check your registered email for a booking confirmation. Your appointment details will be sent once confirmed by the physician's office.",
      nav: { back: true, next: "Save my appointment details →" }
    },
    {
      label: "Step 3 of 3 — Save appointment details",
      heading: "Save your appointment details",
      sub: "Record your confirmed appointment so Rahvana can set a reminder and keep it on your dashboard.",
      form: true,
      nav: { back: true, save: true }
    }
  ],
  guideSteps: [
    {
      label: "Step 1 of 4 — Find an approved physician",
      heading: "Find an embassy-approved physician",
      sub: "Your consulate maintains a list of approved panel physicians. You must book with a physician on that specific list.",
      info: "For U.S. Embassy Islamabad, Karachi, and Lahore, the approved physician list is available on the embassy's official website. Search \"U.S. Embassy [city] panel physician list\" to find current approved physicians.",
      nav: { next: "Next →" }
    },
    {
      label: "Step 2 of 4 — Contact and book the appointment",
      heading: "Contact the physician and book directly",
      sub: "Call or visit the approved physician's office to schedule your immigrant visa medical examination. Bring your appointment letter and passport.",
      info: "Most approved physicians in Pakistan accept walk-ins or appointments by phone. Confirm the medical exam fee before attending. The fee is typically paid directly to the physician — not to the embassy.",
      nav: { back: true, next: "Next →" }
    },
    {
      label: "Step 3 of 4 — Confirm your appointment",
      heading: "Confirm the appointment date and location",
      sub: "Verify the appointment date and location directly with the physician's office before proceeding.",
      alert: "Ensure the physician is currently active on the approved list — lists are updated periodically. A medical exam from a removed physician will not be accepted.",
      nav: { back: true, next: "Save my appointment details →" }
    },
    {
      label: "Step 4 of 4 — Save appointment details",
      heading: "Save your appointment details",
      sub: "Record your appointment so Rahvana can set a reminder and keep it visible on your dashboard.",
      form: true,
      nav: { back: true, save: true }
    }
  ],
  savedView: {
    title: "✓ Medical Appointment Saved",
    button: "Edit"
  },
  reminderSync: {
    title: "Reminder active on your dashboard",
    sub: "Your medical appointment is pinned to your dashboard. You'll be reminded as the date approaches."
  },
  disclaimer: "Rahvana provides scheduling assistance only. Always confirm approved physician status with your embassy directly."
};
