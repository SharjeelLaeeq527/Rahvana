"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPOINTMENT_RECEIVED_DATA = void 0;
exports.APPOINTMENT_RECEIVED_DATA = {
    // eyebrow: {
    //   chapter: "Chapter 2 · NVC / CEAC Processing",
    //   step: "Step 13 — Interview Appointment"
    // },
    title: "Interview Appointment Received",
    description: "Your consular interview has been scheduled. Record your appointment details to update your dashboard and unlock interview preparation.",
    chips: [
        { label: "Major Milestone", type: "gold" },
        { label: "Dashboard Updated", type: "green" },
        { label: "Chapter 3 Unlocked", type: "purple" },
    ],
    heroBanner: {
        eyebrow: "Consular Interview Scheduled",
        title: "Your interview appointment has arrived",
        sub: "This marks the end of NVC processing and the beginning of your consular interview preparation. Record the details below to continue.",
    },
    form: {
        title: "Record your interview appointment",
        sub: "Saves to your dashboard and unlocks interview preparation",
        fields: {
            interviewDate: { label: "Interview Date", placeholder: "" },
            letterDate: { label: "Date Letter Received", placeholder: "" },
            embassy: {
                label: "Embassy / Consulate Location",
                placeholder: "e.g. U.S. Embassy Islamabad, Pakistan",
            },
        },
        hint: "Keep your interview letter accessible. You will need to bring the original to the consulate. Store a copy in Rahvana's Document Vault for easy reference during preparation.",
        button: "Save Appointment & Unlock Preparation",
    },
    savedView: {
        title: "✓ Interview Appointment Saved",
        button: "Edit",
    },
    dashboardUpdate: {
        title: "Dashboard updated — interview scheduled",
        sub: "Your interview date is now pinned to your Rahvana dashboard. The DQ tracking card has been replaced with your interview-scheduled status.",
    },
    nextChapter: {
        title: "Chapter 3 — Interview Preparation unlocked",
        sub: "Your next preparation phase is now active",
        phases: [
            {
                num: "1",
                label: "Medical Exam",
                sub: "Schedule and complete the required medical exam before the interview",
            },
            {
                num: "2",
                label: "Original Documents",
                sub: "Gather and organize the originals required at the consular window",
            },
            {
                num: "3",
                label: "Interview Preparation",
                sub: "Review likely interview questions and prepare confident answers",
            },
            {
                num: "4",
                label: "Embassy-Specific Instructions",
                sub: "Review the specific requirements and logistics for your post",
            },
        ],
    },
    disclaimer: "Rahvana provides structured guidance only. Always confirm interview details directly from your appointment letter. Contact the embassy or NVC for any discrepancies.",
};
