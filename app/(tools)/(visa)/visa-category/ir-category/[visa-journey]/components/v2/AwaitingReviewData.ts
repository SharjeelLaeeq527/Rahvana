export const AWAITING_REVIEW_DATA = {
  eyebrow: {
    chapter: "Chapter 2 · NVC / CEAC Processing",
    step: "Step 9 — Awaiting NVC Document Review",
  },
  title: "Awaiting NVC Document Review",
  description:
    "Your documents have been submitted. NVC is now reviewing your package for completeness and consistency before issuing a documentary qualification decision.",
  chips: [
    { label: "NVC Review", type: "nvc" },
    { label: "Status", type: "status" },
    { label: "Waiting Period", type: "wait" },
  ],
  statusCard: {
    label: "Current Case Status",
    heading: "Documents under NVC review",
    grid: [
      { label: "Documents submitted", value: "✓ Confirmed" },
      { label: "Current stage", value: "NVC document review" },
      { label: "Next event", value: "DQ notification" },
    ],
  },
  reviewItems: {
    title: "What NVC is reviewing",
    items: [
      "DS-260 — immigrant visa application accuracy and completeness",
      "Civil documents — passport, birth certificate, marriage records, police certificate",
      "Financial forms — Affidavit of Support and supporting evidence",
      "Translation pairing and document legibility across all files",
      "Overall package consistency with DS-260 answers and other filings",
    ],
  },
  whileYouWait: {
    title: "While you wait",
    items: [
      "Monitor the email address registered with CEAC",
      "Check CEAC messages periodically for any NVC correspondence",
      "Keep organized copies of everything you uploaded",
      "Avoid re-uploading documents unless NVC specifically requests it",
    ],
  },
  timeline: {
    title: "Where you are in the process",
    steps: [
      { label: "Documents uploaded to CEAC", status: "completed" },
      { label: "Submitted to NVC", status: "completed" },
      { label: "NVC document review", status: "current" },
      { label: "Documentary Qualification (DQ)", status: "future" },
      { label: "Interview scheduling", status: "future" },
    ],
  },
  correctionsAlert: {
    title: "If NVC requests corrections or additional documents",
    items: [
      "Read the checklist notice carefully — NVC will specify exactly what is missing or incorrect",
      "Replace only the specific document(s) flagged — do not re-upload your entire package",
      "Upload the corrected file under the same person and document type slot",
      "Resubmit promptly — delay in responding extends the overall timeline",
    ],
  },
  disclaimer:
    "Rahvana provides structured guidance only. NVC review timelines vary. Monitor your registered email and CEAC messages directly.",
};
