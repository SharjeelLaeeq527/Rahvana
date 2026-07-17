//Evidence Gap Analysis Engine
// Analyzes document vault and case data against IR-1/CR-1 requirements

import type {
  EvidenceGapInput,
  EvidenceGapAnalysis,
  EvidenceCategory,
  EvidenceCategoryAssessment,
  EvidenceItem,
  EvidenceRecommendation,
  EvidenceRequirement,
  EvidenceType,
  RequiredDocumentsSummary,
  CoverageLevel,
  EvidenceQuestion,
} from "./types";

// Evidence Requirements by Category
// Based on IR-1/CR-1 (spouse) and IR-5 (parent) visa requirements from NVC,
// USCIS, and Department of State.
//
// The engine used to hardcode ONE spouse-shaped `EVIDENCE_REQUIREMENTS`. To make
// it visa-category-aware without duplicating logic, the requirements are now
// broken into per-category building blocks and assembled into one config per
// category (IR-1 spouse, IR-5 parent). Categories that are identical across
// visa types (FINANCIAL, IMMIGRATION_HISTORY) are shared — declared once, reused
// in both configs. Categories that differ (IDENTITY drops the marriage
// certificates for a parent; FAMILY_INTEGRATION drops "children together") get a
// per-category override. Spouse-only bona-fide-marriage categories
// (RELATIONSHIP / COHABITATION / COMMUNICATION) simply aren't listed for IR-5.

// ── Shared building blocks (identical for every visa category) ────────────────

// FINANCIAL - Mix of REQUIRED and SUPPORTING
// Required: I-864, Tax Returns (NVC requirement)
// Supporting: W2, Pay Stubs, Employment Letter, Bank Statements
const FINANCIAL_REQUIREMENT: EvidenceRequirement = {
  category: "FINANCIAL",
  label: "Financial Evidence",
  description: "Proof of financial support and sponsorship",
  items: [
    {
      id: "i864_affidavit",
      name: "I-864 Affidavit of Support",
      evidenceType: "REQUIRED",
      weight: 3,
    },
    { id: "tax_returns", name: "Tax Returns (3 years)", evidenceType: "REQUIRED", weight: 3 },
    { id: "w2_forms", name: "W-2 Forms", evidenceType: "SUPPORTING", weight: 2 },
    { id: "pay_stubs", name: "Pay Stubs (6 months)", evidenceType: "SUPPORTING", weight: 2 },
    {
      id: "employment_letter",
      name: "Employment Verification Letter",
      evidenceType: "SUPPORTING",
      weight: 2,
    },
    { id: "bank_statements", name: "Bank Statements", evidenceType: "SUPPORTING", weight: 1 },
  ],
};

// IMMIGRATION HISTORY - Mix of REQUIRED and SUPPORTING
// Required: Police Certificate (for applicants 16+)
// Supporting: I-94, Prior Visas, Prior Petitions
const IMMIGRATION_HISTORY_REQUIREMENT: EvidenceRequirement = {
  category: "IMMIGRATION_HISTORY",
  label: "Immigration History",
  description: "Prior immigration interactions and compliance",
  items: [
    {
      id: "police_certificate",
      name: "Police Character Certificate",
      evidenceType: "REQUIRED",
      weight: 3,
    },
    {
      id: "prior_visa_approvals",
      name: "Prior Visa Approvals",
      evidenceType: "SUPPORTING",
      weight: 2,
    },
    { id: "i94_records", name: "I-94 Travel History", evidenceType: "SUPPORTING", weight: 1 },
  ],
};

// ── Spouse-only building blocks (bona-fide-marriage evidence) ─────────────────

// RELATIONSHIP - All SUPPORTING (bona fide marriage evidence)
// USCIS does not mandate these, but they prove genuine relationship
const RELATIONSHIP_REQUIREMENT: EvidenceRequirement = {
  category: "RELATIONSHIP",
  label: "Relationship Evidence",
  description: "Proof of bona fide marriage and genuine relationship",
  items: [
    { id: "wedding_photos", name: "Wedding Photos", evidenceType: "SUPPORTING", weight: 2 },
    { id: "engagement_photos", name: "Engagement Photos", evidenceType: "SUPPORTING", weight: 1 },
    {
      id: "travel_together",
      name: "Travel Records Together",
      evidenceType: "SUPPORTING",
      weight: 2,
    },
    {
      id: "affidavits_from_friends",
      name: "Affidavits from Friends/Family",
      evidenceType: "SUPPORTING",
      weight: 1,
    },
    {
      id: "social_media_evidence",
      name: "Social Media Evidence",
      evidenceType: "SUPPORTING",
      weight: 1,
    },
  ],
};

// COHABITATION - All SUPPORTING (strong marriage evidence but not required)
const COHABITATION_REQUIREMENT: EvidenceRequirement = {
  category: "COHABITATION",
  label: "Cohabitation Evidence",
  description: "Proof of shared residence and living together",
  items: [
    {
      id: "lease_agreement",
      name: "Joint Lease Agreement",
      evidenceType: "SUPPORTING",
      weight: 3,
    },
    {
      id: "mortgage_document",
      name: "Joint Mortgage Document",
      evidenceType: "SUPPORTING",
      weight: 3,
    },
    {
      id: "utility_bills",
      name: "Utility Bills (shared)",
      evidenceType: "SUPPORTING",
      weight: 2,
    },
    {
      id: "mail_same_address",
      name: "Mail to Same Address",
      evidenceType: "SUPPORTING",
      weight: 1,
    },
  ],
};

// COMMUNICATION - All SUPPORTING (never required by USCIS)
const COMMUNICATION_REQUIREMENT: EvidenceRequirement = {
  category: "COMMUNICATION",
  label: "Communication Records",
  description: "Evidence of ongoing communication",
  items: [
    { id: "phone_records", name: "Phone Call Records", evidenceType: "SUPPORTING", weight: 1 },
    { id: "chat_logs", name: "Chat/Messaging Logs", evidenceType: "SUPPORTING", weight: 1 },
    { id: "email_exchanges", name: "Email Exchanges", evidenceType: "SUPPORTING", weight: 1 },
    {
      id: "video_call_records",
      name: "Video Call Records",
      evidenceType: "SUPPORTING",
      weight: 1,
    },
  ],
};

// ── Category-specific building blocks (same category, different items) ─────────

// IDENTITY (IR-1 spouse) - includes the marriage certificates (Nikah Nama, MRC)
// Required: Passports, Birth Certificate, Marriage Certificates (NVC requirement)
const IR1_IDENTITY_REQUIREMENT: EvidenceRequirement = {
  category: "IDENTITY",
  label: "Identity & Civil Documents",
  description: "Core identity and civil documentation",
  items: [
    {
      id: "passport_beneficiary",
      name: "Beneficiary Passport",
      evidenceType: "REQUIRED",
      weight: 3,
    },
    {
      id: "passport_petitioner",
      name: "Petitioner Passport/US Citizenship",
      evidenceType: "REQUIRED",
      weight: 3,
    },
    { id: "birth_certificate", name: "Birth Certificate", evidenceType: "REQUIRED", weight: 3 },
    { id: "nikah_nama", name: "Nikah Nama", evidenceType: "REQUIRED", weight: 3 },
    { id: "nadra_mrc", name: "NADRA MRC", evidenceType: "REQUIRED", weight: 3 },
  ],
};

// IDENTITY (IR-5 parent) - NO marriage certificates. The parent-child link is
// proven by the birth certificates, so those stay REQUIRED; Nikah Nama / MRC are
// dropped entirely (a parent case has no marriage to document).
const IR5_IDENTITY_REQUIREMENT: EvidenceRequirement = {
  category: "IDENTITY",
  label: "Identity & Civil Documents",
  description: "Core identity and civil documents that establish the parent–child link",
  items: [
    {
      id: "passport_beneficiary",
      name: "Parent's Passport",
      evidenceType: "REQUIRED",
      weight: 3,
    },
    {
      id: "passport_petitioner",
      name: "Petitioner Passport/US Citizenship",
      evidenceType: "REQUIRED",
      weight: 3,
    },
    {
      id: "birth_certificate",
      name: "Birth Certificate (names the parent)",
      evidenceType: "REQUIRED",
      weight: 3,
    },
  ],
};

// FAMILY INTEGRATION (IR-1 spouse) - children the couple share + family photos
const IR1_FAMILY_INTEGRATION_REQUIREMENT: EvidenceRequirement = {
  category: "FAMILY_INTEGRATION",
  label: "Family Integration",
  description: "Evidence of family ties and integration",
  items: [
    {
      id: "children_birth_certs",
      name: "Children's Birth Certificates",
      evidenceType: "SUPPORTING",
      weight: 3,
    },
    {
      id: "family_photos",
      name: "Family Photos Together",
      evidenceType: "SUPPORTING",
      weight: 2,
    },
  ],
};

// FAMILY INTEGRATION (IR-5 parent) - "children together" makes no sense for a
// parent case; the supporting bond evidence is family photos with the parent.
const IR5_FAMILY_INTEGRATION_REQUIREMENT: EvidenceRequirement = {
  category: "FAMILY_INTEGRATION",
  label: "Family Integration",
  description: "Evidence of the ongoing parent–child bond",
  items: [
    {
      id: "family_photos",
      name: "Family Photos with Parent",
      evidenceType: "SUPPORTING",
      weight: 2,
    },
  ],
};

// ── Assembled per-category configs ────────────────────────────────────────────

// IR-1 / CR-1 (spouse): the full original set — unchanged behavior.
export const IR1_EVIDENCE_REQUIREMENTS: Record<EvidenceCategory, EvidenceRequirement> = {
  RELATIONSHIP: RELATIONSHIP_REQUIREMENT,
  FINANCIAL: FINANCIAL_REQUIREMENT,
  COHABITATION: COHABITATION_REQUIREMENT,
  FAMILY_INTEGRATION: IR1_FAMILY_INTEGRATION_REQUIREMENT,
  COMMUNICATION: COMMUNICATION_REQUIREMENT,
  IDENTITY: IR1_IDENTITY_REQUIREMENT,
  IMMIGRATION_HISTORY: IMMIGRATION_HISTORY_REQUIREMENT,
};

// IR-5 (parent): reuses FINANCIAL + IMMIGRATION_HISTORY verbatim, overrides
// IDENTITY (no marriage docs) and FAMILY_INTEGRATION (no "children together"),
// and OMITS the three spouse-only bona-fide-marriage categories entirely. Being
// a Partial means those categories never render on a parent's dashboard.
export const IR5_EVIDENCE_REQUIREMENTS: Partial<Record<EvidenceCategory, EvidenceRequirement>> = {
  IDENTITY: IR5_IDENTITY_REQUIREMENT,
  FINANCIAL: FINANCIAL_REQUIREMENT,
  FAMILY_INTEGRATION: IR5_FAMILY_INTEGRATION_REQUIREMENT,
  IMMIGRATION_HISTORY: IMMIGRATION_HISTORY_REQUIREMENT,
};

/** Requirements config the engine runs against. IR-1 is the safe default. */
export type EvidenceRequirementsConfig = Partial<
  Record<EvidenceCategory, EvidenceRequirement>
>;

/**
 * The complete per-category evidence config a `CaseStrengthProfile` carries.
 *   - `requirements`: what the engine assesses (drives the dashboard cards/score).
 *   - `questionnaire`: which optional "do you have…?" questions the modal SHOWS.
 * Both must agree on categories so we never ask about evidence we don't score
 * (and never score a category we never asked about). IR-1 = full spouse set;
 * IR-5 = marriage-free parent set.
 */
export interface EvidenceGapConfig {
  requirements: EvidenceRequirementsConfig;
  questionnaire: EvidenceQuestion[];
}

// Vault Document Key to Evidence Category Mapping
const VAULT_KEY_TO_EVIDENCE: Record<string, EvidenceCategory> = {
  // Identity documents - handle various key formats from document-definitions
  PASSPORT_BENEFICIARY: "IDENTITY",
  PASSPORT_PETITIONER: "IDENTITY",
  PASSPORT: "IDENTITY", // Key used for passport-beneficiary in document-definitions
  BIRTH_CERTIFICATE_BENEFICIARY: "IDENTITY",
  BIRTH_CERTIFICATE_PETITIONER: "IDENTITY",
  BIRTH_CERTIFICATE: "IDENTITY",
  BIRTH_CERT: "IDENTITY", // Key used for birth-cert-beneficiary in document-definitions
  BIRTH_CERT_BENEFICIARY: "IDENTITY", // From documentDefId "birth-cert-beneficiary"
  BIRTH_CERT_PETITIONER: "IDENTITY",
  BIRTH_CERT_TRANSLATION: "IDENTITY",
  CITIZENSHIP_PROOF_PETITIONER: "IDENTITY",
  CITIZENSHIP_PROOF: "IDENTITY",
  PASSPORT_PHOTOS: "IDENTITY",

  // Marriage documents
  NIKAH_NAMA: "IDENTITY",
  NIKAH_NAMA_TRANSLATION: "IDENTITY",
  NADRA_MRC: "IDENTITY",
  NADRA_MRC_TRANSLATION: "IDENTITY",
  MARRIAGE_CERTIFICATE: "IDENTITY",
  MRC: "IDENTITY",

  // Relationship evidence
  WEDDING_PHOTOS: "RELATIONSHIP",
  ENGAGEMENT_PHOTOS: "RELATIONSHIP",
  RELATIONSHIP_EVIDENCE: "RELATIONSHIP",
  RELATIONSHIP_TIMELINE: "RELATIONSHIP",
  AFFIDAVITS_FRIENDS_FAMILY: "RELATIONSHIP",
  SOCIAL_MEDIA_EVIDENCE: "RELATIONSHIP",
  GIFTS_EXCHANGES: "RELATIONSHIP",

  // Travel together
  TRAVEL_RECORDS: "RELATIONSHIP",
  TRAVEL_HISTORY: "RELATIONSHIP",
  TRAVEL_ITINERARY: "RELATIONSHIP",

  // Financial documents - enhanced tax return matching
  PAY_STUBS: "FINANCIAL",
  PAYSTUBS: "FINANCIAL",
  TAX_RETURNS: "FINANCIAL", // Key used for tax-returns-petitioner
  TAX_RETURNS_PETITIONER: "FINANCIAL",
  FEDERAL_TAX_RETURN: "FINANCIAL",
  FEDERAL_TAX_RETURN_PETITIONER: "FINANCIAL",
  FBR_TAX_RETURNS: "FINANCIAL",
  IRS_TAX_TRANSCRIPT: "FINANCIAL",
  TAX_TRANSCRIPT: "FINANCIAL",
  W2_FORMS: "FINANCIAL",
  EMPLOYMENT_LETTER: "FINANCIAL",
  BANK_STATEMENTS: "FINANCIAL",
  I864_AFFIDAVIT: "FINANCIAL",

  // Cohabitation
  LEASE_AGREEMENT: "COHABITATION",
  MORTGAGE_DOCUMENT: "COHABITATION",
  UTILITY_BILLS: "COHABITATION",
  MAIL_SAME_ADDRESS: "COHABITATION",

  // Communication
  COMMUNICATION_EVIDENCE: "COMMUNICATION",
  PHONE_RECORDS: "COMMUNICATION",
  CHAT_LOGS: "COMMUNICATION",

  // Immigration history
  POLICE_CERT_PK: "IMMIGRATION_HISTORY",
  POLICE_CERTIFICATE: "IMMIGRATION_HISTORY",
  POLICE_CERTIFICATE_PAKISTAN: "IMMIGRATION_HISTORY", // From documentDefId "police-certificate-pakistan"
  POLICE_CHARACTER_CERTIFICATE: "IMMIGRATION_HISTORY",
  PRIOR_VISA_APPROVALS: "IMMIGRATION_HISTORY",
  I94_RECORDS: "IMMIGRATION_HISTORY",
  PRIOR_PETITIONS: "IMMIGRATION_HISTORY",
  OLD_PASSPORT: "IMMIGRATION_HISTORY",
  OLD_PASSPORT_COPIES: "IMMIGRATION_HISTORY",
};

// Journey Document ID to Evidence Category Mapping
const JOURNEY_DOC_ID_TO_EVIDENCE: Record<string, EvidenceCategory> = {
  // Chapter 1 Step 2 documents
  doc_citizenship: "IDENTITY",
  doc_passport_ben: "IDENTITY",
  doc_nikah_nama: "IDENTITY",
  doc_mrc: "IDENTITY",
  doc_relationship: "RELATIONSHIP",
  doc_prior_marriage: "IDENTITY",
  doc_translations: "IDENTITY",
  doc_birth_cert: "IDENTITY",
  doc_police_cert: "IMMIGRATION_HISTORY",
  doc_passport_photos: "IDENTITY",

  // Chapter 2 Step 4 documents
  passport: "IDENTITY",
  birth: "IDENTITY",
  marriage: "IDENTITY",
  police: "IMMIGRATION_HISTORY",
  translations: "IDENTITY",
  "prior-marriage": "IDENTITY",
  "death-cert": "IDENTITY",
  namechange: "IDENTITY",

  // ── IR-5 (parent) journey documents ──────────────────────────────────────
  // Ids come from data/visa-category/ir-5.json. Without these, the map's default
  // keyword fallback dropped a few: "photos" matched no keyword, and the
  // parent-legitimacy "marriage" docs contain "marriage" but not "marriage_cert"
  // so they fell through to null. Explicit entries fix that.
  //
  // NOTE: for a parent case the marriage documents are the PETITIONER's parents'
  // (or a step-parent's) marriage — they establish the parent-child legitimacy
  // link, so they are IDENTITY (civil documents), NOT spouse RELATIONSHIP
  // evidence. Family photos / children's birth certs are the parent-child bond →
  // FAMILY_INTEGRATION.
  doc_petitioner_birth_cert: "IDENTITY",
  doc_parent_passport: "IDENTITY",
  doc_parent_birth_cert: "IDENTITY",
  doc_parents_marriage: "IDENTITY",
  doc_stepparent_marriage: "IDENTITY",
  doc_stepparent_prior_marriages: "IDENTITY",
  doc_parent_marriage_history: "IDENTITY",
  "parent-birth": "IDENTITY",
  "petitioner-birth": "IDENTITY",
  "parent-birth-cert": "IDENTITY",
  "petitioner-birth-cert": "IDENTITY",
  "parent-marriage": "IDENTITY",
  "parent-marriage-cert": "IDENTITY",
  "prior-marriage-termination": "IDENTITY",
  "children-birth-certs": "FAMILY_INTEGRATION",
  "i864-petitioner": "FINANCIAL",
  "tax-docs-petitioner": "FINANCIAL",
  photos: "FAMILY_INTEGRATION",
};

// Vault Category to Evidence Category Mapping
const VAULT_CATEGORY_TO_EVIDENCE: Record<string, EvidenceCategory> = {
  IDENTITY: "IDENTITY",
  CIVIL_DOCUMENTS: "IDENTITY",
  MARRIAGE_DOCUMENTS: "IDENTITY",
  RELATIONSHIP_EVIDENCE: "RELATIONSHIP",
  FINANCIAL: "FINANCIAL",
  COHABITATION: "COHABITATION",
  COMMUNICATION: "COMMUNICATION",
  IMMIGRATION_HISTORY: "IMMIGRATION_HISTORY",
};

// Main Engine Class
export class EvidenceGapEngine {
  /**
   * The requirement set this engine assesses against. Injected so the same
   * engine serves every visa category: IR-1 (spouse) passes the full set (the
   * default), IR-5 (parent) passes a marriage-free subset. Only the categories
   * present here are ever assessed or rendered — so a parent never sees
   * "Cohabitation Evidence: Missing".
   */
  private readonly requirements: EvidenceRequirementsConfig;

  constructor(requirements: EvidenceRequirementsConfig = IR1_EVIDENCE_REQUIREMENTS) {
    this.requirements = requirements;
  }

  /**
   * Run the evidence gap analysis
   */
  analyze(input: EvidenceGapInput): EvidenceGapAnalysis {
    const items = this.collectEvidenceItems(input);
    const assessments = this.assessCategories(items, input.questionnaireResponses);
    const requiredDocsSummary = this.calculateRequiredDocumentsSummary(assessments);
    const recommendations = this.generateRecommendations(assessments);
    const stats = this.calculateStats(assessments, requiredDocsSummary);
    const gapSummary = this.generateGapSummary(requiredDocsSummary, assessments);

    return {
      categories: assessments,
      requiredDocuments: requiredDocsSummary,
      recommendations,
      overallScore: this.calculateOverallScore(assessments, requiredDocsSummary),
      analyzedAt: new Date(),
      stats,
      gapSummary,
    };
  }

  // Evidence Collection
  private collectEvidenceItems(input: EvidenceGapInput): EvidenceItem[] {
    const itemsMap = new Map<string, EvidenceItem>();

    // 1. Process vault documents (primary source)
    for (const doc of input.vaultDocuments) {
      if (doc.status === "UPLOADED") {
        const vaultKey = doc.documentDefId?.toUpperCase().replace(/-/g, "_");
        let evidenceCategory: EvidenceCategory | null | undefined;

        if (vaultKey && VAULT_KEY_TO_EVIDENCE[vaultKey]) {
          evidenceCategory = VAULT_KEY_TO_EVIDENCE[vaultKey];
        } else {
          evidenceCategory = this.mapDocDefKeyToEvidence(doc.documentDefId);
        }

        if (!evidenceCategory && doc.category) {
          evidenceCategory = VAULT_CATEGORY_TO_EVIDENCE[doc.category as string];
        }

        if (evidenceCategory) {
          const evidenceType = this.getEvidenceType(doc.documentDefId, evidenceCategory);
          const dedupeKey = this.getDedupeKey(doc.documentDefId, evidenceCategory);

          if (!itemsMap.has(dedupeKey)) {
            itemsMap.set(dedupeKey, {
              id: `vault_${doc.id}`,
              name: this.formatDocumentName(doc.documentDefId),
              category: evidenceCategory,
              evidenceType,
              uploaded: true,
              uploadedAt: doc.uploadedAt,
              source: "vault",
            });
          }
        }
      }
    }

    // 2. Process journey documents
    for (const doc of input.journeyDocuments || []) {
      if (doc.status === "uploaded" || doc.status === "received") {
        const category =
          JOURNEY_DOC_ID_TO_EVIDENCE[doc.document_type] ||
          this.mapDocumentTypeToEvidence(doc.document_type);

        if (category) {
          const evidenceType = this.getEvidenceType(doc.document_type, category);
          const dedupeKey = this.getDedupeKey(doc.document_type, category);

          if (!itemsMap.has(dedupeKey)) {
            itemsMap.set(dedupeKey, {
              id: `journey_${doc.document_type}`,
              name: doc.document_label || this.formatDocumentName(doc.document_type),
              category,
              evidenceType,
              uploaded: true,
              uploadedAt: doc.uploaded_date ? new Date(doc.uploaded_date) : undefined,
              source: "journey",
            });
          }
        }
      }
    }

    // 3. Process case data
    for (const [key, value] of Object.entries(input.caseData || {})) {
      const category = this.mapCaseDataKeyToEvidence(key);
      if (category && this.isMeaningfulEvidence(value.data_value)) {
        const evidenceType = this.getEvidenceType(key, category);
        const dedupeKey = `case_${key}`;
        itemsMap.set(dedupeKey, {
          id: `case_data_${key}`,
          name: this.formatCaseDataLabel(key),
          category,
          evidenceType,
          uploaded: true,
          verified: value.is_verified,
          source: "case_data",
        });
      }
    }

    return Array.from(itemsMap.values());
  }

  /**
   * Get evidence type (REQUIRED or SUPPORTING) for an item
   */
  private getEvidenceType(docId: string, category: EvidenceCategory): EvidenceType {
    const requirement = this.requirements[category];
    if (!requirement) return "SUPPORTING";

    const normalizedId = docId.toLowerCase().replace(/[-_\s]/g, "");

    for (const item of requirement.items) {
      const normalizedItemId = item.id.toLowerCase().replace(/[-_\s]/g, "");
      if (normalizedId.includes(normalizedItemId) || normalizedItemId.includes(normalizedId)) {
        return item.evidenceType;
      }
    }

    // Check name matchers
    const nameMatchers: Record<string, Record<string, EvidenceType>> = {
      FINANCIAL: {
        i864: "REQUIRED",
        affidavit: "REQUIRED",
        tax: "REQUIRED",
        w2: "SUPPORTING",
        paystub: "SUPPORTING",
        employment: "SUPPORTING",
        bank: "SUPPORTING",
      },
      IDENTITY: {
        // Note: "passport" must be checked but exclude "photos" which is supporting
        birth: "REQUIRED",
        nikah: "REQUIRED",
        nadra: "REQUIRED",
        mrc: "REQUIRED",
        marriage: "REQUIRED",
      },
      IMMIGRATION_HISTORY: {
        police: "REQUIRED",
        pcc: "REQUIRED",
        visa: "SUPPORTING",
        i94: "SUPPORTING",
        petition: "SUPPORTING",
      },
    };

    const categoryMatchers = nameMatchers[category] || {};
    for (const [matcher, type] of Object.entries(categoryMatchers)) {
      if (normalizedId.includes(matcher)) {
        return type;
      }
    }

    // Special handling for IDENTITY category - passport needs special check
    if (category === "IDENTITY") {
      // "passport_photos" or "passport-photos" should be SUPPORTING
      if (normalizedId.includes("passportphoto") || normalizedId.includes("passport_photo")) {
        return "SUPPORTING";
      }
      // Regular passport documents are REQUIRED
      if (normalizedId.includes("passport")) {
        return "REQUIRED";
      }
    }

    return "SUPPORTING";
  }

  /**
   * Generate a deduplication key for evidence items
   */
  private getDedupeKey(docId: string, category: EvidenceCategory): string {
    const normalized = docId.toLowerCase().replace(/[-_\s]/g, "_");

    const canonicalMap: Record<string, string> = {
      // Identity - handle document-definitions.ts IDs
      passport_beneficiary: "identity_passport_ben",
      passport_ben: "identity_passport_ben",
      doc_passport_ben: "identity_passport_ben",
      applicant_passport: "identity_passport_ben",
      passport: "identity_passport_ben", // Key from document-definitions
      passport_petitioner: "identity_passport_pet",
      passport_pet: "identity_passport_pet",
      doc_passport_pet: "identity_passport_pet",
      us_passport: "identity_passport_pet",
      birth_certificate_beneficiary: "identity_birth_cert",
      birth_certificate: "identity_birth_cert",
      birth_cert: "identity_birth_cert", // Key from document-definitions
      birth_cert_beneficiary: "identity_birth_cert", // ID from document-definitions
      birth: "identity_birth_cert",
      doc_birth_cert: "identity_birth_cert",
      beneficiary_birth: "identity_birth_cert",
      birth_cert_translation: "identity_birth_cert",
      nikah_nama: "identity_nikah",
      doc_nikah_nama: "identity_nikah",
      nikah: "identity_nikah",
      nadra_mrc: "identity_mrc",
      doc_mrc: "identity_mrc",
      marriage: "identity_mrc",
      mrc: "identity_mrc",
      citizenship_proof: "identity_citizenship",
      citizenship_proof_petitioner: "identity_citizenship",

      // Immigration
      police_cert_pk: "immigration_police",
      police_certificate: "immigration_police",
      police: "immigration_police",
      doc_police_cert: "immigration_police",
      police_character: "immigration_police",
      police_character_certificate: "immigration_police",
      pcc: "immigration_police",
      i94_records: "immigration_i94",
      i94: "immigration_i94",

      // Financial - enhanced tax return deduplication (handles document-definitions IDs)
      tax_returns: "financial_tax",
      tax_returns_petitioner: "financial_tax", // ID from document-definitions
      fbr_tax_returns: "financial_tax",
      federal_tax_return: "financial_tax",
      federal_tax_return_petitioner: "financial_tax",
      irs_tax_transcript: "financial_tax",
      tax_transcript: "financial_tax",
      petitioner_tax: "financial_tax",
      tax: "financial_tax",
      pay_stubs: "financial_paystubs",
      paystubs: "financial_paystubs",
      w2_forms: "financial_w2",
      w2: "financial_w2",
      employment_letter: "financial_employment",
      bank_statements: "financial_bank",
      i864_affidavit: "financial_i864",
      i864: "financial_i864",

      // Relationship
      wedding_photos: "relationship_wedding",
      engagement_photos: "relationship_engagement",
      travel_together: "relationship_travel",
      travel_records: "relationship_travel",
    };

    return canonicalMap[normalized] || `${category}_${normalized}`;
  }

  private mapDocDefKeyToEvidence(docDefId: string): EvidenceCategory | null {
    if (!docDefId) return null;

    const upperKey = docDefId.toUpperCase().replace(/-/g, "_");

    const directMatch = VAULT_KEY_TO_EVIDENCE[upperKey];
    if (directMatch) return directMatch;

    // Handle dynamic documents
    if (upperKey.startsWith("DYNAMIC_")) {
      const categoryMatch = upperKey.match(/^DYNAMIC_([A-Z_]+)_\d+$/);
      if (categoryMatch) {
        const category = categoryMatch[1];
        const dynamicCategoryMap: Record<string, EvidenceCategory> = {
          RELATIONSHIP: "RELATIONSHIP",
          FINANCIAL: "FINANCIAL",
          COHABITATION: "COHABITATION",
          FAMILY: "FAMILY_INTEGRATION",
          COMMUNICATION: "COMMUNICATION",
          IDENTITY: "IDENTITY",
          IMMIGRATION: "IMMIGRATION_HISTORY",
        };
        return dynamicCategoryMap[category] || null;
      }
    }

    return null;
  }

  // Category Assessment
  private assessCategories(
    items: EvidenceItem[],
    questionnaireResponses?: Record<string, boolean>
  ): Record<EvidenceCategory, EvidenceCategoryAssessment> {
    const assessments = {} as Record<EvidenceCategory, EvidenceCategoryAssessment>;

    // Only iterate the categories present in THIS category's config. For IR-5
    // that's 4 categories; the spouse-only ones are absent, so no empty
    // "marriage" cards are ever produced.
    for (const [categoryKey, requirement] of Object.entries(this.requirements)) {
      if (!requirement) continue;
      const category = categoryKey as EvidenceCategory;
      const categoryItems = items.filter((item) => item.category === category);

      // Get questionnaire responses for this category
      const questionnaireItems = this.getQuestionnaireItems(category, questionnaireResponses);

      // Combine uploaded items with questionnaire-confirmed items
      const allItems = [...categoryItems, ...questionnaireItems];

      // Separate by evidence type
      const requiredItems = allItems.filter((item) => item.evidenceType === "REQUIRED");
      const supportingItems = allItems.filter((item) => item.evidenceType === "SUPPORTING");

      // Get required items from requirements
      const requiredReqItems = requirement.items.filter((r) => r.evidenceType === "REQUIRED");
      const supportingReqItems = requirement.items.filter((r) => r.evidenceType === "SUPPORTING");

      // Find missing required items
      const missingRequired = requiredReqItems
        .filter((reqItem) => !allItems.some((item) => this.matchesRequirement(item, reqItem.id)))
        .map((req) => ({
          item: req.name,
          description: `Required: ${req.name}`,
        }));

      // Find missing supporting items
      const missingSupporting = supportingReqItems
        .filter((reqItem) => !allItems.some((item) => this.matchesRequirement(item, reqItem.id)))
        .map((req) => ({
          item: req.name,
          description: `Supporting: ${req.name}`,
        }));

      // Calculate coverage level based on supporting evidence strength
      const level = this.calculateCoverageLevel(allItems.length, requirement.items.length);

      assessments[category] = {
        category,
        label: requirement.label,
        level,
        itemCount: allItems.length,
        totalItems: requirement.items.length,
        totalRequiredItems: requiredReqItems.length, // Store expected required count
        items: allItems,
        requiredItems,
        supportingItems,
        missingRequired,
        missingSupporting,
        lastUpdated: allItems.reduce(
          (latest, item) =>
            item.uploadedAt && item.uploadedAt > latest ? item.uploadedAt : latest,
          new Date(0)
        ),
      };
    }

    return assessments;
  }

  /**
   * Get items confirmed via questionnaire
   */
  private getQuestionnaireItems(
    category: EvidenceCategory,
    responses?: Record<string, boolean>
  ): EvidenceItem[] {
    if (!responses) return [];

    const items: EvidenceItem[] = [];
    const questionnaireMap: Record<
      string,
      { questionKey: string; itemId: string; evidenceType: EvidenceType }[]
    > = {
      FINANCIAL: [
        { questionKey: "has_i864", itemId: "i864_affidavit", evidenceType: "REQUIRED" },
        { questionKey: "has_tax_returns", itemId: "tax_returns", evidenceType: "REQUIRED" },
        {
          questionKey: "has_bank_statements",
          itemId: "bank_statements",
          evidenceType: "SUPPORTING",
        },
      ],
      RELATIONSHIP: [
        { questionKey: "has_wedding_photos", itemId: "wedding_photos", evidenceType: "SUPPORTING" },
        {
          questionKey: "has_engagement_photos",
          itemId: "engagement_photos",
          evidenceType: "SUPPORTING",
        },
        {
          questionKey: "has_travel_together",
          itemId: "travel_together",
          evidenceType: "SUPPORTING",
        },
        {
          questionKey: "has_social_media",
          itemId: "social_media_evidence",
          evidenceType: "SUPPORTING",
        },
        {
          questionKey: "has_affidavits",
          itemId: "affidavits_from_friends",
          evidenceType: "SUPPORTING",
        },
      ],
      COHABITATION: [
        { questionKey: "has_lease", itemId: "lease_agreement", evidenceType: "SUPPORTING" },
        { questionKey: "has_mortgage", itemId: "mortgage_document", evidenceType: "SUPPORTING" },
        { questionKey: "has_utility_bills", itemId: "utility_bills", evidenceType: "SUPPORTING" },
        {
          questionKey: "has_mail_same_address",
          itemId: "mail_same_address",
          evidenceType: "SUPPORTING",
        },
      ],
      COMMUNICATION: [
        { questionKey: "has_phone_records", itemId: "phone_records", evidenceType: "SUPPORTING" },
        { questionKey: "has_chat_logs", itemId: "chat_logs", evidenceType: "SUPPORTING" },
        {
          questionKey: "has_email_exchanges",
          itemId: "email_exchanges",
          evidenceType: "SUPPORTING",
        },
        {
          questionKey: "has_video_calls",
          itemId: "video_call_records",
          evidenceType: "SUPPORTING",
        },
      ],
      FAMILY_INTEGRATION: [
        { questionKey: "has_children", itemId: "children_birth_certs", evidenceType: "SUPPORTING" },
        { questionKey: "has_family_photos", itemId: "family_photos", evidenceType: "SUPPORTING" },
      ],
      IMMIGRATION_HISTORY: [
        {
          questionKey: "has_prior_visas",
          itemId: "prior_visa_approvals",
          evidenceType: "SUPPORTING",
        },
        { questionKey: "has_i94", itemId: "i94_records", evidenceType: "SUPPORTING" },
      ],
    };

    const categoryQuestions = questionnaireMap[category] || [];
    for (const { questionKey, itemId, evidenceType } of categoryQuestions) {
      if (responses[questionKey]) {
        items.push({
          id: `questionnaire_${itemId}`,
          name: this.formatItemName(itemId),
          category,
          evidenceType,
          uploaded: false,
          source: "questionnaire",
        });
      }
    }

    return items;
  }

  /**
   * Check if an evidence item matches a requirement
   */
  private matchesRequirement(item: EvidenceItem, requirementId: string): boolean {
    const normalizedItemId = item.id.toLowerCase().replace(/[-_\s]/g, "");
    const normalizedItemName = item.name.toLowerCase().replace(/[-_\s]/g, "");
    const normalizedReqId = requirementId.toLowerCase().replace(/[-_\s]/g, "");

    // Direct ID match
    if (normalizedItemId.includes(normalizedReqId) || normalizedReqId.includes(normalizedItemId)) {
      return true;
    }

    // Name-based matching with comprehensive matchers
    const nameMatchers: Record<string, string[]> = {
      // Financial - enhanced matching for tax returns
      pay_stubs: ["paystub", "paystubs", "payslip", "payslips", "pay_stub", "salary"],
      tax_returns: [
        "taxreturn",
        "taxreturns",
        "fbr",
        "irs",
        "tax",
        "federaltax",
        "1040",
        "taxtranscript",
        "federaltaxreturn",
        "petitionertax",
        "tax_return",
        "federal_tax",
        "petitioner_tax",
      ],
      w2_forms: ["w2", "w2form", "w2forms", "wage"],
      employment_letter: ["employment", "employmentletter", "verificationletter", "jobletter"],
      bank_statements: ["bank", "bankstatement", "bankstatements", "accounts"],
      i864_affidavit: ["i864", "affidavit", "affidavitofsupport", "sponsorform"],

      // Identity - enhanced matching for birth certificate and passports
      passport_beneficiary: [
        "passportben",
        "beneficiarypassport",
        "passport",
        "passport_beneficiary",
        "applicant_passport",
      ],
      passport_petitioner: [
        "passportpet",
        "petitionerpassport",
        "passportpetitioner",
        "uscitizenship",
        "petitioner_passport",
        "us_passport",
      ],
      birth_certificate: [
        "birthcert",
        "birthrecord",
        "birth",
        "birth_certificate",
        "beneficiarybirth",
        "beneficiary_birth",
        "birthcertbeneficiary",
        "birth_certificate_beneficiary",
        "applicant_birth",
      ],
      nikah_nama: ["nikah", "nikahnama", "marriagecontract", "nikkah", "nikah_nama"],
      nadra_mrc: ["mrc", "nadra", "nadramrc", "marriagecertificate", "nadra_mrc"],

      // Relationship
      wedding_photos: ["wedding", "marriagephotos", "nikahphotos", "wedding_photos"],
      engagement_photos: ["engagement", "engagementphotos", "engagement_photos"],
      travel_together: ["travel", "travelrecords", "trips", "traveltogether", "travel_together"],
      communication_records: ["communication", "communicationhistory"],
      relationship_timeline: ["timeline", "relationshiptimeline"],
      affidavits_from_friends: ["affidavit", "affidavits", "friends", "family"],
      social_media_evidence: ["socialmedia", "social"],
      gifts_exchanges: ["gift", "gifts", "exchange"],

      // Cohabitation
      lease_agreement: ["lease", "leaseagreement", "jointlease", "lease_agreement"],
      mortgage_document: ["mortgage", "mortgagedocument", "mortgage_document"],
      utility_bills: ["utility", "utilitybills", "bills", "utility_bills"],
      mail_same_address: ["mail", "mailaddress", "sameaddress", "mail_same_address"],

      // Family
      children_birth_certs: ["children", "childrenbirth", "birthcerts", "children_birth"],
      family_photos: ["familyphotos", "family", "family_photos", "photos"],
      school_records: ["school", "schoolrecords", "school_records"],
      medical_records: ["medical", "medicalrecords", "medical_records"],

      // Communication
      phone_records: ["phone", "phonerecords", "callrecords", "phone_records"],
      chat_logs: ["chat", "chatlogs", "messaging", "whatsapp", "chat_logs"],
      email_exchanges: ["email", "emailexchanges", "email_exchanges"],
      video_call_records: ["video", "videocall", "facetime", "zoom", "skype", "video_call"],

      // Immigration
      police_certificate: [
        "police",
        "policecert",
        "pcc",
        "policecharacter",
        "policecertpk",
        "police_certificate",
        "police_character",
        "character_certificate",
      ],
      prior_visa_approvals: ["visa", "visaapprovals", "priorvisa", "prior_visa"],
      i94_records: ["i94", "travelhistory", "i94records", "i94_records"],
      prior_petitions: ["petition", "priorpetitions", "immigrationpetitions", "prior_petitions"],
    };

    const matchers = nameMatchers[requirementId] || [];
    for (const matcher of matchers) {
      const normalizedMatcher = matcher.toLowerCase().replace(/[-_\s]/g, "");
      if (
        normalizedItemId.includes(normalizedMatcher) ||
        normalizedItemName.includes(normalizedMatcher)
      ) {
        return true;
      }
    }

    // Special case for tax returns - check for "petitioner" and "tax" in name
    if (requirementId === "tax_returns") {
      if (normalizedItemName.includes("tax") || normalizedItemId.includes("tax")) {
        return true;
      }
    }

    // Special case for birth certificate - check for "birth" in name
    if (requirementId === "birth_certificate") {
      if (normalizedItemName.includes("birth") || normalizedItemId.includes("birth")) {
        return true;
      }
    }

    // Special case for passport_beneficiary - check for "passport" in name (but not petitioner)
    if (requirementId === "passport_beneficiary") {
      if (
        (normalizedItemName.includes("passport") || normalizedItemId.includes("passport")) &&
        !normalizedItemName.includes("petitioner") &&
        !normalizedItemId.includes("petitioner") &&
        !normalizedItemName.includes("us") &&
        !normalizedItemId.includes("us")
      ) {
        return true;
      }
    }

    // Special case for passport_petitioner - check for "petitioner" or "us" with passport
    if (requirementId === "passport_petitioner") {
      if (normalizedItemName.includes("passport") || normalizedItemId.includes("passport")) {
        if (
          normalizedItemName.includes("petitioner") ||
          normalizedItemId.includes("petitioner") ||
          normalizedItemName.includes("us") ||
          normalizedItemId.includes("us")
        ) {
          return true;
        }
      }
    }

    // Special case for nikah_nama - check for "nikah" in name
    if (requirementId === "nikah_nama") {
      if (normalizedItemName.includes("nikah") || normalizedItemId.includes("nikah")) {
        return true;
      }
    }

    // Special case for nadra_mrc - check for "nadra" or "mrc" in name
    if (requirementId === "nadra_mrc") {
      if (
        normalizedItemName.includes("nadra") ||
        normalizedItemId.includes("nadra") ||
        normalizedItemName.includes("mrc") ||
        normalizedItemId.includes("mrc")
      ) {
        return true;
      }
    }

    // Special case for police_certificate - check for "police" or "pcc" in name
    if (requirementId === "police_certificate") {
      if (
        normalizedItemName.includes("police") ||
        normalizedItemId.includes("police") ||
        normalizedItemName.includes("pcc") ||
        normalizedItemId.includes("pcc") ||
        normalizedItemName.includes("character") ||
        normalizedItemId.includes("character")
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate coverage level based on item count ratio
   */
  private calculateCoverageLevel(itemCount: number, totalItems: number): CoverageLevel {
    if (totalItems === 0) return "STRONG";
    const ratio = itemCount / totalItems;
    if (ratio >= 0.75) return "STRONG";
    if (ratio >= 0.5) return "MODERATE";
    if (ratio > 0) return "WEAK";
    return "MISSING";
  }

  // Required Documents Summary
  private calculateRequiredDocumentsSummary(
    assessments: Record<EvidenceCategory, EvidenceCategoryAssessment>
  ): RequiredDocumentsSummary {
    const allRequired: Array<{ id: string; name: string; category: EvidenceCategory }> = [];
    let found = 0;

    for (const [category, assessment] of Object.entries(assessments)) {
      const requirement = this.requirements[category as EvidenceCategory];
      if (!requirement) continue;
      const requiredReqItems = requirement.items.filter((r) => r.evidenceType === "REQUIRED");

      for (const reqItem of requiredReqItems) {
        allRequired.push({
          id: reqItem.id,
          name: reqItem.name,
          category: category as EvidenceCategory,
        });

        // Check if found
        if (assessment.items.some((item) => this.matchesRequirement(item, reqItem.id))) {
          found++;
        }
      }
    }

    const missing = allRequired.filter(
      (req) =>
        !Object.values(assessments).some((a) =>
          a.items.some((item) => this.matchesRequirement(item, req.id))
        )
    );

    return {
      total: allRequired.length,
      found,
      missing,
      completionPercentage:
        allRequired.length > 0 ? Math.round((found / allRequired.length) * 100) : 100,
    };
  }

  // Recommendations
  private generateRecommendations(
    assessments: Record<EvidenceCategory, EvidenceCategoryAssessment>
  ): EvidenceRecommendation[] {
    const recommendations: EvidenceRecommendation[] = [];

    for (const assessment of Object.values(assessments)) {
      // Prioritize missing required items
      for (const missing of assessment.missingRequired) {
        recommendations.push({
          category: assessment.category,
          priority: "HIGH",
          title: `Add ${missing.item}`,
          description: this.getRecommendationDescription(assessment.category, missing.item),
          actionItems: this.getActionItems(assessment.category, missing.item),
          estimatedImpact: 15,
        });
      }

      // Add recommendations for weak/missing categories
      if (assessment.level === "MISSING" || assessment.level === "WEAK") {
        if (assessment.missingSupporting.length > 0) {
          recommendations.push({
            category: assessment.category,
            priority: assessment.level === "MISSING" ? "MEDIUM" : "LOW",
            title: `Strengthen ${assessment.label}`,
            description: `Add supporting evidence to strengthen your ${assessment.label.toLowerCase()}.`,
            actionItems: assessment.missingSupporting.slice(0, 3).map((m) => `Add ${m.item}`),
            estimatedImpact: 8,
          });
        }
      }
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Helper Methods
  private mapDocumentTypeToEvidence(docType: string): EvidenceCategory | null {
    const normalized = docType.toLowerCase().replace(/[-_\s]/g, "");

    if (
      normalized.includes("passport") ||
      normalized.includes("birth") ||
      normalized.includes("nikah") ||
      normalized.includes("mrc") ||
      normalized.includes("marriage_cert")
    ) {
      return "IDENTITY";
    }
    if (
      normalized.includes("police") ||
      normalized.includes("visa") ||
      normalized.includes("i94")
    ) {
      return "IMMIGRATION_HISTORY";
    }
    if (
      normalized.includes("tax") ||
      normalized.includes("w2") ||
      normalized.includes("pay") ||
      normalized.includes("employment") ||
      normalized.includes("i864")
    ) {
      return "FINANCIAL";
    }
    if (
      normalized.includes("wedding") ||
      normalized.includes("relationship") ||
      normalized.includes("travel") ||
      normalized.includes("engagement")
    ) {
      return "RELATIONSHIP";
    }
    if (
      normalized.includes("lease") ||
      normalized.includes("mortgage") ||
      normalized.includes("utility")
    ) {
      return "COHABITATION";
    }
    if (
      normalized.includes("communication") ||
      normalized.includes("phone") ||
      normalized.includes("chat")
    ) {
      return "COMMUNICATION";
    }
    if (normalized.includes("family") || normalized.includes("children")) {
      return "FAMILY_INTEGRATION";
    }

    return null;
  }

  private mapCaseDataKeyToEvidence(key: string): EvidenceCategory | null {
    const normalized = key.toLowerCase();
    if (normalized.includes("marriage") || normalized.includes("spouse")) return "RELATIONSHIP";
    if (normalized.includes("passport") || normalized.includes("birth")) return "IDENTITY";
    if (
      normalized.includes("income") ||
      normalized.includes("employment") ||
      normalized.includes("tax")
    )
      return "FINANCIAL";
    return null;
  }

  private isMeaningfulEvidence(value: unknown): boolean {
    if (!value) return false;
    if (typeof value === "string" && value.trim().length < 3) return false;
    return true;
  }

  private formatDocumentName(docDefId: string): string {
    return docDefId
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private formatCaseDataLabel(key: string): string {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private formatItemName(itemId: string): string {
    return itemId
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Calculate overall score based on both required documents and supporting evidence
   */
  private calculateOverallScore(
    assessments: Record<EvidenceCategory, EvidenceCategoryAssessment>,
    requiredDocs: RequiredDocumentsSummary
  ): number {
    // Required documents completion (60% weight)
    const requiredScore = requiredDocs.completionPercentage;

    // Supporting evidence strength (40% weight)
    const categoryWeights: Record<EvidenceCategory, number> = {
      RELATIONSHIP: 25,
      FINANCIAL: 15,
      COHABITATION: 15,
      COMMUNICATION: 10,
      FAMILY_INTEGRATION: 15,
      IDENTITY: 10,
      IMMIGRATION_HISTORY: 10,
    };

    const levelScores: Record<CoverageLevel, number> = {
      STRONG: 100,
      MODERATE: 65,
      WEAK: 35,
      MISSING: 0,
    };

    let supportingScore = 0;
    let totalWeight = 0;

    for (const [category, assessment] of Object.entries(assessments)) {
      const weight = categoryWeights[category as EvidenceCategory] || 10;
      const score = levelScores[assessment.level] || 0;
      supportingScore += score * weight;
      totalWeight += weight;
    }

    const normalizedSupportingScore = totalWeight > 0 ? supportingScore / totalWeight : 0;

    // Combined score: 60% required, 40% supporting
    return Math.round(requiredScore * 0.6 + normalizedSupportingScore * 0.4);
  }

  private calculateStats(
    assessments: Record<EvidenceCategory, EvidenceCategoryAssessment>,
    requiredDocs: RequiredDocumentsSummary
  ): EvidenceGapAnalysis["stats"] {
    const categories = Object.values(assessments);

    return {
      totalEvidenceItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0),
      totalRequired: requiredDocs.total,
      totalSupporting: categories.reduce(
        (sum, cat) => sum + cat.totalItems - cat.requiredItems.length,
        0
      ),
      strongCategories: categories.filter((cat) => cat.level === "STRONG").length,
      moderateCategories: categories.filter((cat) => cat.level === "MODERATE").length,
      weakCategories: categories.filter((cat) => cat.level === "WEAK").length,
      missingCategories: categories.filter((cat) => cat.level === "MISSING").length,
    };
  }

  private generateGapSummary(
    requiredDocs: RequiredDocumentsSummary,
    assessments: Record<EvidenceCategory, EvidenceCategoryAssessment>
  ): string {
    const missingRequired = requiredDocs.missing.length;
    const weakCategories = Object.values(assessments).filter(
      (a) => a.level === "WEAK" || a.level === "MISSING"
    ).length;

    if (missingRequired === 0 && weakCategories === 0) {
      return "Excellent! All required documents are present and supporting evidence is strong.";
    }

    const parts: string[] = [];
    if (missingRequired > 0) {
      parts.push(`${missingRequired} required document${missingRequired > 1 ? "s" : ""} missing`);
    }
    if (weakCategories > 0) {
      parts.push(
        `${weakCategories} categor${weakCategories > 1 ? "ies" : "y"} needs strengthening`
      );
    }

    return parts.join(". ") + ". Focus on required documents first.";
  }

  private getRecommendationDescription(category: EvidenceCategory, item: string): string {
    const descriptions: Record<string, string> = {
      "I-864 Affidavit of Support":
        "Complete Form I-864 Affidavit of Support. This is required for all IR-1/CR-1 cases.",
      "Tax Returns (3 years)":
        "Gather federal tax returns for the past 3 years. This is a required document for NVC.",
      "Beneficiary Passport":
        "Obtain or renew the beneficiary's passport. Required for visa processing.",
      "Birth Certificate":
        "Obtain the beneficiary's birth certificate with certified translation if needed.",
      "Nikah Nama": "Obtain the original Nikah Nama (Islamic marriage contract).",
      "NADRA MRC": "Obtain the NADRA Marriage Registration Certificate (MRC).",
      "Police Character Certificate":
        "Apply for Pakistan Police Character Certificate. Required for applicants 16+.",
    };
    return descriptions[item] || `Gather ${item} to complete your evidence.`;
  }

  private getActionItems(category: EvidenceCategory, item: string): string[] {
    const actionItems: Record<string, string[]> = {
      "I-864 Affidavit of Support": [
        "Download Form I-864 from USCIS website",
        "Complete all sections with accurate financial information",
        "Sign and date the form",
      ],
      "Tax Returns (3 years)": [
        "Download tax transcripts from IRS.gov",
        "Include all schedules and attachments",
        "Ensure forms are signed and dated",
      ],
      "Police Character Certificate": [
        "Apply through local police station or online portal",
        "Processing takes 3-7 days in Punjab/Islamabad",
        "Ensure certificate is recent (within 6 months)",
      ],
    };
    return (
      actionItems[item] || [
        `Obtain ${item}`,
        "Ensure documents are clear and legible",
        "Upload to your document vault",
      ]
    );
  }
}

// Export singleton instance
export const evidenceGapEngine = new EvidenceGapEngine();
