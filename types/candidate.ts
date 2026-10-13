// types/candidate.ts
// ============================================================================
// Multi-Candidate / Beneficiary Profile Type Definitions
// Supports IR-5 (Mother & Father) and IR-2 (N Children)
// ============================================================================

import type { PersonName } from "./profile";

export type CandidateRelation =
  | "Mother"
  | "Father"
  | "Stepparent"
  | "AdoptiveParent"
  | "Child"
  | "Spouse"
  | "Other";

export type CandidateTier = "free" | "basic" | "premium" | "executive";

export interface CandidateProfile {
  /** Unique identifier for the candidate (e.g. "candidate-1", "candidate-2", or uuid) */
  id: string;

  /** Display label (e.g. "Parent 1 (Mother)", "Parent 2 (Father)", "Child 1") */
  label: string;

  /** Relationship to the petitioner */
  relation: CandidateRelation;

  /** Candidate full name in single string format */
  fullName: string;

  /** Candidate structured name */
  name?: PersonName;

  /** Candidate Date of Birth (ISO YYYY-MM-DD) */
  dateOfBirth?: string;

  /** Candidate Place of Birth */
  placeOfBirth?: {
    city?: string;
    state?: string;
    country?: string;
  };

  /** Candidate national ID (e.g. CNIC for Pakistan) */
  cnic?: string;

  /** Candidate passport number */
  passportNumber?: string;

  /** Visa category (e.g. "IR-5", "IR-2", "IR-1") */
  visaCategory: string;

  /**
   * Subscription tier for this specific candidate.
   * If added as a free preview (e.g. user bought 1 plan and added 2nd parent for testing),
   * tier is 'free'. If covered under the account purchase, tier matches user's active tier.
   */
  tier: CandidateTier;

  /** Whether this is the primary candidate on the account */
  isPrimary: boolean;

  /** Whether this candidate is in free preview mode */
  isPreview?: boolean;

  /** USCIS Receipt Number for this candidate's I-130 (e.g. IOE1234567890) */
  receiptNumber?: string;

  /** NVC Case Number for this candidate (e.g. ISL1234567890) */
  caseNumber?: string;

  /** NVC Invoice ID */
  nvcInvoice?: string;

  /** Current case status */
  caseStatus?: string;

  /** Interview date */
  interviewDate?: string;

  /** Timestamp when candidate profile was created */
  createdAt: string;

  /** Custom notes or tags */
  notes?: string;

  /** Color accent for UI avatar badge */
  colorTag?: "teal" | "purple" | "blue" | "amber" | "rose" | "emerald";

  /** Custom candidate avatar / profile photo URL */
  avatarUrl?: string;

  /** Custom candidate display name */
  customName?: string;

  /** Optional custom journey name for this candidate */
  journeyName?: string;

  /** Optional custom journey cover image */
  journeyImage?: string;
}

export interface CandidateSyncConfig {
  /** Automatically sync petitioner/sponsor information to all candidates */
  autoSyncSponsor: boolean;

  /** ISO timestamp of last synchronization */
  lastSyncedAt?: string;
}
