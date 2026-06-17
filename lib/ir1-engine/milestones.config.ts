// ─────────────────────────────────────────────────────────────────────────────
// IR-1 Engine · Milestone System + Stage Detection
// ─────────────────────────────────────────────────────────────────────────────

// ─── Milestone IDs (ordered) ──────────────────────────────────────────────────

export type MilestoneId =
  | "FILED"
  | "NOA1"
  | "ACTIVE_REVIEW"
  | "APPROVED"
  | "NVC_RECEIVED"
  | "FEES_PAID"
  | "DS260_SUBMITTED"
  | "DOCS_SUBMITTED"
  | "DQ"
  | "INTERVIEW_WAIT"
  | "INTERVIEW_SCHEDULED"
  | "VISA_ISSUED";

// Ordered list — used for progress calculation
export const MILESTONE_ORDER: MilestoneId[] = [
  "FILED",
  "NOA1",
  "ACTIVE_REVIEW",
  "APPROVED",
  "NVC_RECEIVED",
  "FEES_PAID",
  "DS260_SUBMITTED",
  "DOCS_SUBMITTED",
  "DQ",
  "INTERVIEW_WAIT",
  "INTERVIEW_SCHEDULED",
  "VISA_ISSUED",
];

// ─── Milestone Metadata ───────────────────────────────────────────────────────

export interface MilestoneConfig {
  id: MilestoneId;
  label: string;
  description: string;
  phase: "uscis" | "nvc" | "embassy";
  // Personalized messages for each state
  messages: {
    reached: string;      // user just hit this milestone
    waiting: string;      // user is currently at this stage, waiting
    upcoming: string;     // this milestone is next
    delayed: string;      // user seems stuck here longer than typical
  };
  // Urgency/action guidance
  actionGuidance?: string;
  // Typical days to next milestone (used in delay propagation)
  typicalDaysToNext: number | null; // null = highly variable
}

export const MILESTONE_CONFIGS: Record<MilestoneId, MilestoneConfig> = {
  FILED: {
    id: "FILED",
    label: "Petition Filed",
    description: "I-130 petition submitted to USCIS",
    phase: "uscis",
    typicalDaysToNext: 30,
    messages: {
      reached: "Your petition has been filed. The clock has started.",
      waiting: "Your petition has been submitted and is awaiting USCIS receipt.",
      upcoming: "File your I-130 petition to begin the process.",
      delayed:
        "Your petition was filed some time ago — a receipt notice (NOA1) typically arrives within 2–4 weeks.",
    },
    actionGuidance:
      "Keep your receipt notice safe. It will contain your case number.",
  },

  NOA1: {
    id: "NOA1",
    label: "Receipt Notice (NOA1)",
    description: "USCIS has received your petition",
    phase: "uscis",
    typicalDaysToNext: 60,
    messages: {
      reached:
        "USCIS has received your petition. Your case number is now active.",
      waiting: "Waiting for USCIS to confirm receipt of your petition.",
      upcoming:
        "Once filed, you will receive a receipt notice (NOA1) within a few weeks.",
      delayed:
        "NOA1 can take up to 4–6 weeks after filing. If it's been longer, consider checking USCIS case status online.",
    },
    actionGuidance:
      "Your NOA1 contains your receipt number — use it to track your case on the USCIS website.",
  },

  ACTIVE_REVIEW: {
    id: "ACTIVE_REVIEW",
    label: "Under Review",
    description: "USCIS is actively reviewing your petition",
    phase: "uscis",
    typicalDaysToNext: null, // highly variable
    messages: {
      reached: "USCIS is now reviewing your petition.",
      waiting:
        "Your petition is in active review at USCIS. This is the longest phase.",
      upcoming:
        "After NOA1, your case enters USCIS review — the primary processing stage.",
      delayed:
        "Extended review periods are common. USCIS processing times fluctuate based on workload and staffing.",
    },
    actionGuidance:
      "Avoid unnecessary inquiries during this phase — it can slow things down. Check USCIS online tools for status updates.",
  },

  APPROVED: {
    id: "APPROVED",
    label: "USCIS Approved",
    description: "Petition approved — case transfers to NVC",
    phase: "uscis",
    typicalDaysToNext: 45,
    messages: {
      reached:
        "Your petition has been approved. Your case will now transfer to the National Visa Center (NVC).",
      waiting: "Waiting for USCIS approval.",
      upcoming: "USCIS will approve your petition and transfer it to the NVC.",
      delayed:
        "Approval is overdue based on your filing date. Consider contacting USCIS if it has been significantly beyond the typical range.",
    },
    actionGuidance:
      "After approval, allow 4–8 weeks for your case to appear in the NVC system.",
  },

  NVC_RECEIVED: {
    id: "NVC_RECEIVED",
    label: "NVC Case Created",
    description: "National Visa Center has created your case",
    phase: "nvc",
    typicalDaysToNext: 14,
    messages: {
      reached:
        "The NVC has received your case and assigned a case number. You can now begin NVC processing.",
      waiting: "Waiting for NVC to create your case after USCIS approval.",
      upcoming: "Your case will appear in the NVC system a few weeks after approval.",
      delayed:
        "NVC creation can take 4–8 weeks after USCIS approval. If it has been longer, use the NVC inquiry portal.",
    },
    actionGuidance:
      "Log in to the Consular Electronic Application Center (CEAC) to access your NVC case.",
  },

  FEES_PAID: {
    id: "FEES_PAID",
    label: "NVC Fees Paid",
    description: "Affidavit of Support and IV fees paid",
    phase: "nvc",
    typicalDaysToNext: 30,
    messages: {
      reached: "NVC fees have been paid. You can now submit your DS-260.",
      waiting:
        "Pay your NVC fees as soon as possible to avoid delaying your case.",
      upcoming:
        "Once your NVC case is created, pay the Affidavit of Support and IV application fees.",
      delayed:
        "Delaying NVC fee payment directly pushes back your interview timeline. Act promptly.",
    },
    actionGuidance:
      "Pay fees through the NVC's online portal. Processing confirmation takes a few days.",
  },

  DS260_SUBMITTED: {
    id: "DS260_SUBMITTED",
    label: "DS-260 Submitted",
    description: "Immigrant visa application submitted online",
    phase: "nvc",
    typicalDaysToNext: 30,
    messages: {
      reached:
        "Your DS-260 has been submitted. Now prepare and submit your civil documents.",
      waiting: "Submit your DS-260 application as soon as fees are confirmed.",
      upcoming:
        "After paying fees, you will complete and submit the DS-260 immigrant visa application online.",
      delayed:
        "Completing your DS-260 earlier preserves your position in the scheduling queue.",
    },
    actionGuidance:
      "Complete the DS-260 carefully — errors can cause delays at the interview stage.",
  },

  DOCS_SUBMITTED: {
    id: "DOCS_SUBMITTED",
    label: "Civil Documents Uploaded",
    description: "Supporting documents submitted to NVC",
    phase: "nvc",
    typicalDaysToNext: 60,
    messages: {
      reached:
        "Civil documents have been submitted. NVC will now review them for documentary qualification.",
      waiting:
        "Gather and upload all required civil documents to the NVC as soon as possible.",
      upcoming:
        "After submitting DS-260, upload all required civil documents to the NVC.",
      delayed:
        "Missing documents are one of the most common causes of DQ delays. Review the NVC checklist carefully.",
    },
    actionGuidance:
      "Ensure all documents are translated, notarized, and match NVC requirements before uploading.",
  },

  DQ: {
    id: "DQ",
    label: "Documentarily Qualified",
    description: "NVC has cleared your case for embassy scheduling",
    phase: "nvc",
    typicalDaysToNext: null, // depends on embassy queue
    messages: {
      reached:
        "You are documentarily qualified. Your case is now cleared for embassy scheduling at Islamabad.",
      waiting:
        "NVC is reviewing your documents for documentary qualification (DQ).",
      upcoming:
        "Once all documents are accepted, your case will be marked as DQ — ready for embassy scheduling.",
      delayed:
        "DQ review typically takes 2–3 months after document submission. If it has been longer, contact NVC.",
    },
    actionGuidance:
      "After DQ, wait for Islamabad embassy to schedule your interview. This queue is the primary variable.",
  },

  INTERVIEW_WAIT: {
    id: "INTERVIEW_WAIT",
    label: "Waiting for Interview",
    description: "DQ complete — waiting for Islamabad to schedule",
    phase: "embassy",
    typicalDaysToNext: null, // Islamabad queue is unpredictable
    messages: {
      reached:
        "Your case is DQ and in the Islamabad interview queue. Interview scheduling depends on embassy capacity.",
      waiting:
        "Your case is waiting for Islamabad to schedule an interview. This is the most uncertain phase.",
      upcoming:
        "Once DQ, your case enters the Islamabad interview queue.",
      delayed:
        "Islamabad interview wait times are highly variable. This stage has the most uncertainty in the entire process.",
    },
    actionGuidance:
      "Ensure your contact information with NVC is current so you receive scheduling notices promptly.",
  },

  INTERVIEW_SCHEDULED: {
    id: "INTERVIEW_SCHEDULED",
    label: "Interview Scheduled",
    description: "Embassy has assigned an interview date",
    phase: "embassy",
    typicalDaysToNext: 30,
    messages: {
      reached:
        "Your interview has been scheduled at the Islamabad embassy. Begin preparing your documents immediately.",
      waiting: "Waiting for the embassy to assign an interview date.",
      upcoming:
        "Islamabad will notify you when an interview date has been assigned.",
      delayed:
        "Interview wait times at Islamabad can be unpredictable. Continue monitoring NVC and CEAC for updates.",
    },
    actionGuidance:
      "Prepare all original documents, photos, and medical examination results well before your interview date.",
  },

  VISA_ISSUED: {
    id: "VISA_ISSUED",
    label: "Visa Issued",
    description: "IR-1 visa approved",
    phase: "embassy",
    typicalDaysToNext: null,
    messages: {
      reached:
        "Your IR-1 visa has been issued. Your immigrant visa packet will be mailed to you shortly.",
      waiting: "Waiting for visa issuance after the interview.",
      upcoming: "After a successful interview, your visa will be issued.",
      delayed:
        "Visa issuance after a successful interview is usually quick. If delayed, the consulate may require additional documents.",
    },
    actionGuidance:
      "Your visa packet is sealed — do not open it. Present it to CBP upon entry to the United States.",
  },
};

// ─── Stage Detection ──────────────────────────────────────────────────────────

/**
 * User's known milestone dates.
 * Provide a date string (ISO) or null for milestones not yet reached.
 */
export type MilestoneDates = Partial<Record<MilestoneId, string | null>>;

/**
 * Detect the user's current stage based on which milestones have dates.
 * Returns the LATEST milestone that has been reached.
 */
export function detectCurrentStage(dates: MilestoneDates): MilestoneId {
  // Walk from last to first, return the latest reached milestone
  for (let i = MILESTONE_ORDER.length - 1; i >= 0; i--) {
    const id = MILESTONE_ORDER[i];
    if (dates[id]) return id;
  }
  // Nothing filled in — treat as not yet filed
  return "FILED";
}

/**
 * Get the next milestone after the current one.
 */
export function getNextMilestone(current: MilestoneId): MilestoneId | null {
  const idx = MILESTONE_ORDER.indexOf(current);
  if (idx === -1 || idx === MILESTONE_ORDER.length - 1) return null;
  return MILESTONE_ORDER[idx + 1];
}

/**
 * Calculate progress percentage (0–100) based on current stage.
 */
export function calculateProgress(current: MilestoneId): number {
  const idx = MILESTONE_ORDER.indexOf(current);
  return Math.round((idx / (MILESTONE_ORDER.length - 1)) * 100);
}

/**
 * Determine if the user appears delayed at a milestone.
 * Compares how many days they've been at the current stage vs typicalDaysToNext.
 */
export function isDelayedAtStage(
  current: MilestoneId,
  dateReached: string
): boolean {
  const config = MILESTONE_CONFIGS[current];
  if (!config.typicalDaysToNext) return false; // can't determine

  const reached = new Date(dateReached).getTime();
  const now = Date.now();
  const daysElapsed = (now - reached) / (1000 * 60 * 60 * 24);

  // Flag as delayed if >1.5x the typical days
  return daysElapsed > config.typicalDaysToNext * 1.5;
}
