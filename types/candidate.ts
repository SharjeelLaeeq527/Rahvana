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

  /**
   * Number of this candidate inside its category pool (IR-5 | IR-2+CR-2 | IR-1+CR-1 |
   * other). Decides the journey key (slot 1 = base `ir2`, slot 2 = `ir2_candidate2`) and
   * the default label. Assigned by the server, never by the client. Missing on rosters
   * saved before it existed: the slot is then the number in `id`
   * (lib/candidate/candidateKeys.ts getCandidateSlot).
   */
  categorySlot?: number;

  /** Display label. Server-assigned default "Candidate {slot}"; customName wins in the UI. */
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
   * Server-owned mirror of this candidate's journey plan (written only by Stripe
   * provisioning / revocation). Access is decided by journeys.subscription_tier.
   * Subscription tier for this specific candidate.
   * If added as a free preview (e.g. user bought 1 plan and added 2nd parent for testing),
   * tier is 'free'. If covered under the account purchase, tier matches user's active tier.
   */
  tier: CandidateTier;

  /**
   * The account's FIRST candidate: owns legacy rows that carry no candidate tag. Not the
   * same as "slot 1 of its category" - use isCategoryPrimary() for that.
   */
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
