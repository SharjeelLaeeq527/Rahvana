// Evidence Gap Analysis Types
// Core types for analyzing evidence coverage across visa case categories

/**
 * Evidence categories for visa case strength analysis
 */
export type EvidenceCategory =
  | "RELATIONSHIP"
  | "FINANCIAL"
  | "COHABITATION"
  | "FAMILY_INTEGRATION"
  | "COMMUNICATION"
  | "IDENTITY"
  | "IMMIGRATION_HISTORY";

/**
 * Evidence type classification
 * - REQUIRED: Legally required for IR-1/CR-1 processing
 * - SUPPORTING: Strengthens case but not legally mandated
 */
export type EvidenceType = "REQUIRED" | "SUPPORTING";

// Coverage level for each evidence category
export type CoverageLevel = "STRONG" | "MODERATE" | "WEAK" | "MISSING";

// Evidence Item Types
// Represents a single piece of evidence
export interface EvidenceItem {
  id: string;
  name: string;
  category: EvidenceCategory;
  evidenceType: EvidenceType;
  uploaded: boolean;
  verified?: boolean;
  uploadedAt?: Date;
  source: "vault" | "journey" | "case_data" | "questionnaire";
}

// Evidence category with its assessment
export interface EvidenceCategoryAssessment {
  category: EvidenceCategory;
  label: string;
  level: CoverageLevel;
  itemCount: number;
  totalItems: number;
  totalRequiredItems: number; // Total required items expected from requirements
  items: EvidenceItem[];
  requiredItems: EvidenceItem[];
  supportingItems: EvidenceItem[];
  missingRequired: Array<{
    item: string;
    description: string;
  }>;
  missingSupporting: Array<{
    item: string;
    description: string;
  }>;
  lastUpdated?: Date;
}

// Recommendation for improving evidence coverage
export interface EvidenceRecommendation {
  category: EvidenceCategory;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: number;
  deadline?: Date;
}

// Analysis Result Types
// Required documents summary
export interface RequiredDocumentsSummary {
  total: number;
  found: number;
  missing: Array<{
    id: string;
    name: string;
    category: EvidenceCategory;
  }>;
  completionPercentage: number;
}

// Complete evidence gap analysis result
export interface EvidenceGapAnalysis {
  analyzedAt: Date;

  // Overall assessment
  overallScore: number; // 0-100

  // Required documents summary (across all categories)
  requiredDocuments: RequiredDocumentsSummary;

  // Category breakdowns (as Record for easy access)
  categories: Record<EvidenceCategory, EvidenceCategoryAssessment>;

  // Aggregated recommendations (prioritized)
  recommendations: EvidenceRecommendation[];

  // Summary statistics
  stats: {
    totalEvidenceItems: number;
    totalRequired: number;
    totalSupporting: number;
    strongCategories: number;
    moderateCategories: number;
    weakCategories: number;
    missingCategories: number;
  };

  // Gap summary for display
  gapSummary: string;
}

// Configuration Types
// Evidence requirement item definition
export interface EvidenceRequirementItem {
  id: string;
  name: string;
  evidenceType: EvidenceType;
  weight: number;
}

// Configuration for evidence category requirements
export interface EvidenceRequirement {
  category: EvidenceCategory;
  label: string;
  description: string;
  items: EvidenceRequirementItem[];
}

// Configuration for supplemental questions
export interface SupplementalQuestion {
  id: string;
  question: string;
  category: EvidenceCategory;
  answerType: "boolean" | "select" | "text";
  options?: string[];
  impact: "HIGH" | "MEDIUM" | "LOW";
  group: string;
}

// Input Types
// Input data for evidence gap analysis
export interface EvidenceGapInput {
  journeyId?: string;

  // Journey documents (from journey_documents table)
  journeyDocuments?: Array<{
    document_type: string;
    document_label?: string;
    status: string;
    is_required: boolean;
    vault_file_id?: string;
    uploaded_date?: string;
  }>;

  // Vault documents (from document vault store)
  vaultDocuments: Array<{
    id: string;
    documentDefId: string;
    category?: string;
    uploadedAt: Date;
    status: string;
  }>;

  // Case data (from case_data table)
  caseData?: Record<
    string,
    {
      data_value: unknown;
      is_verified: boolean;
      source: string;
    }
  >;

  // Questionnaire responses for non-upload evidence
  questionnaireResponses?: Record<string, boolean>;

  // Optional: supplemental answers
  supplementalAnswers?: Record<string, unknown>;
}

// Questionnaire Types
// Question for the evidence questionnaire
export interface EvidenceQuestion {
  id: string;
  question: string;
  description?: string;
  category: EvidenceCategory;
  evidenceType: EvidenceType;
  group: string;
}

// Questionnaire configuration
export const EVIDENCE_QUESTIONNAIRE: EvidenceQuestion[] = [
  // Required Documents (via questionnaire since not uploaded in journey)

  // Financial - Required
  {
    id: "has_i864",
    question: "Do you have the I-864 Affidavit of Support?",
    description: "Form I-864 completed by the petitioner (sponsor)",
    category: "FINANCIAL",
    evidenceType: "REQUIRED",
    group: "Required Financial Documents",
  },
  {
    id: "has_tax_returns",
    question: "Do you have Federal Tax Returns?",
    description: "Most recent 3 years of federal tax returns (Form 1040)",
    category: "FINANCIAL",
    evidenceType: "REQUIRED",
    group: "Required Financial Documents",
  },
  {
    id: "has_bank_statements",
    question: "Do you have bank statements?",
    description: "Recent bank statements showing financial stability (6 months)",
    category: "FINANCIAL",
    evidenceType: "SUPPORTING",
    group: "Supporting Financial Documents",
  },

  // Supporting Evidence (bona fide marriage proof)
  // ═══════════════════════════════════════════════════════════════════════════

  // Relationship Evidence (all supporting)
  {
    id: "has_wedding_photos",
    question: "Do you have wedding/ceremony photos?",
    description: "Photos from your wedding ceremony, reception, or Nikah",
    category: "RELATIONSHIP",
    evidenceType: "SUPPORTING",
    group: "Relationship Evidence",
  },
  {
    id: "has_engagement_photos",
    question: "Do you have engagement photos?",
    description: "Photos from engagement ceremony or pre-wedding events",
    category: "RELATIONSHIP",
    evidenceType: "SUPPORTING",
    group: "Relationship Evidence",
  },
  {
    id: "has_travel_together",
    question: "Have you traveled together?",
    description: "Trips taken together (boarding passes, hotel bookings, photos)",
    category: "RELATIONSHIP",
    evidenceType: "SUPPORTING",
    group: "Relationship Evidence",
  },
  {
    id: "has_social_media",
    question: "Are you connected on social media?",
    description: "Facebook, Instagram, or other platforms showing your relationship",
    category: "RELATIONSHIP",
    evidenceType: "SUPPORTING",
    group: "Relationship Evidence",
  },
  {
    id: "has_affidavits",
    question: "Can friends/family provide affidavits?",
    description: "Written statements from people who know your relationship is genuine",
    category: "RELATIONSHIP",
    evidenceType: "SUPPORTING",
    group: "Relationship Evidence",
  },

  // Cohabitation Evidence (all supporting)
  {
    id: "has_lease",
    question: "Do you have a joint lease agreement?",
    description: "Lease showing both names at the same address",
    category: "COHABITATION",
    evidenceType: "SUPPORTING",
    group: "Cohabitation Evidence",
  },
  {
    id: "has_mortgage",
    question: "Do you have a joint mortgage?",
    description: "Property owned together",
    category: "COHABITATION",
    evidenceType: "SUPPORTING",
    group: "Cohabitation Evidence",
  },
  {
    id: "has_utility_bills",
    question: "Do you have shared utility bills?",
    description: "Electricity, gas, water, or internet bills with both names",
    category: "COHABITATION",
    evidenceType: "SUPPORTING",
    group: "Cohabitation Evidence",
  },
  {
    id: "has_mail_same_address",
    question: "Do you receive mail at the same address?",
    description: "Bank statements, letters, or packages to the same address",
    category: "COHABITATION",
    evidenceType: "SUPPORTING",
    group: "Cohabitation Evidence",
  },

  // Communication Evidence (all supporting)
  {
    id: "has_phone_records",
    question: "Do you have phone call records?",
    description: "Call logs showing regular communication",
    category: "COMMUNICATION",
    evidenceType: "SUPPORTING",
    group: "Communication Evidence",
  },
  {
    id: "has_chat_logs",
    question: "Do you have chat/messaging logs?",
    description: "WhatsApp, Messenger, or other messaging app conversations",
    category: "COMMUNICATION",
    evidenceType: "SUPPORTING",
    group: "Communication Evidence",
  },
  {
    id: "has_email_exchanges",
    question: "Do you have email exchanges?",
    description: "Regular email communication between you",
    category: "COMMUNICATION",
    evidenceType: "SUPPORTING",
    group: "Communication Evidence",
  },
  {
    id: "has_video_calls",
    question: "Do you have video call records?",
    description: "Screenshots or logs from video calls (FaceTime, Zoom, etc.)",
    category: "COMMUNICATION",
    evidenceType: "SUPPORTING",
    group: "Communication Evidence",
  },

  // Family Integration (all supporting)
  {
    id: "has_children",
    question: "Do you have children together?",
    description: "Birth certificates showing both parents",
    category: "FAMILY_INTEGRATION",
    evidenceType: "SUPPORTING",
    group: "Family Integration",
  },
  {
    id: "has_family_photos",
    question: "Do you have family photos together?",
    description: "Photos with extended family, holidays, gatherings",
    category: "FAMILY_INTEGRATION",
    evidenceType: "SUPPORTING",
    group: "Family Integration",
  },

  // Immigration History (supporting)
  {
    id: "has_prior_visas",
    question: "Has the beneficiary been approved for visas before?",
    description: "Previous US or other country visa approvals",
    category: "IMMIGRATION_HISTORY",
    evidenceType: "SUPPORTING",
    group: "Immigration History",
  },
  {
    id: "has_i94",
    question: "Does the beneficiary have US travel history (I-94)?",
    description: "Previous visits to the United States",
    category: "IMMIGRATION_HISTORY",
    evidenceType: "SUPPORTING",
    group: "Immigration History",
  },
];

/**
 * IR-5 (parent) questionnaire. A parent case has no marriage, so every
 * bona-fide-marriage question (wedding photos, cohabitation, couple
 * communication, shared children) is irrelevant. We KEEP the category-agnostic
 * questions — financial documents and the beneficiary's immigration history —
 * plus the one parent–child bond question (family photos).
 *
 * Derived by filtering the full list (single source of truth) instead of
 * re-declaring the question objects, so wording/description edits made above
 * automatically flow through to IR-5.
 */
const IR5_QUESTION_IDS = new Set<string>([
  "has_i864",
  "has_tax_returns",
  "has_bank_statements",
  "has_family_photos",
  "has_prior_visas",
  "has_i94",
]);

export const IR5_EVIDENCE_QUESTIONNAIRE: EvidenceQuestion[] = EVIDENCE_QUESTIONNAIRE.filter((q) =>
  IR5_QUESTION_IDS.has(q.id)
);
