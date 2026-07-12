"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERVIEW_SCHEDULING_DATA = void 0;
exports.INTERVIEW_SCHEDULING_DATA = {
    // eyebrow: {
    //   chapter: "Chapter 2 · NVC / CEAC Processing",
    //   step: "Step 12 — Interview Scheduling Queue"
    // },
    title: "Waiting for Interview Scheduling",
    description: "Your case is documentarily qualified and in the queue for interview scheduling at your post. This step tracks your position and monitors scheduling progress.",
    chips: [
        { label: "DQ Received", type: "green" },
        { label: "Queue Tracking", type: "sky" },
        { label: "Awaiting Appointment", type: "gold" },
    ],
    queueStatus: {
        heading: "In queue — awaiting interview letter",
    },
    schedulingData: {
        Islamabad: {
            official: "March 2024",
            trend: "Steady movement",
            detail: "Islamabad has been scheduling approximately 1–2 months of DQ dates per month recently. If your DQ is from mid-2024, you are still ahead in the queue.",
        },
        Karachi: {
            official: "February 2024",
            trend: "Moderate movement",
            detail: "Karachi scheduling has been moving at a moderate pace. Cases from early 2024 are approaching the scheduling window.",
        },
        Lahore: {
            official: "April 2024",
            trend: "Steady movement",
            detail: "Lahore scheduling pace has been consistent. Cases from Q2 2024 are in the approaching range.",
        },
        Other: {
            official: "Varies by post",
            trend: "Check your post",
            detail: "Scheduling pace varies significantly by post. Use the State Department immigrant visa bulletin for authoritative data.",
        },
    },
    whileYouWait: [
        "Watch your registered email for the interview letter",
        "Ensure your passport stays valid beyond the expected interview window",
        "Keep civil documents organized and ready for quick access",
        "Begin reviewing the interview preparation checklist (next chapter)",
        "Check back on Rahvana dashboard for any scheduling movement updates",
    ],
    milestones: [
        { label: "CEAC access & fee payment", status: "done" },
        { label: "DS-260 & civil documents", status: "done" },
        { label: "Affidavit of Support submitted", status: "done" },
        { label: "Documents submitted to NVC", status: "done" },
        { label: "Documentary Qualification (DQ) received", status: "done" },
        { label: "Waiting for interview scheduling", status: "active" },
        { label: "Interview letter received", status: "pending" },
    ],
    howItWorks: [
        "NVC schedules interviews based on the post's appointment capacity and the applicant's DQ month",
        "Cases with earlier DQ dates are generally scheduled before cases with later DQ dates in the same category",
        "The State Department publishes a monthly immigrant visa bulletin showing which DQ months are being scheduled — this is the authoritative source",
        "Once your DQ month is reached, NVC will issue an interview appointment letter to the petitioner's address",
    ],
    disclaimer: "Official scheduling status is sourced from the U.S. State Department. Rahvana estimates are trend projections only and carry no guarantee of accuracy. Always verify at travel.state.gov.",
};
