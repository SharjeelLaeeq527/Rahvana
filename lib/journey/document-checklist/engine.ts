import { createClient } from "@/lib/supabase/server";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { DocumentChecklistItem, GroupedDocuments, ExpirationStatus } from "./types";
import {
  ChecklistDocumentDefinition,
  evaluateDocumentVisibility,
  resolveJourneyVisibility,
} from "./visibility";

export class DocumentChecklistEngine {
  static calculateExpirationStatus(
    expiryDate: string | undefined,
    warningDays: number = 90
  ): { status: ExpirationStatus; daysUntilExpiry?: number } {
    if (!expiryDate) return { status: "valid" };

    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: "expired", daysUntilExpiry };
    } else if (daysUntilExpiry <= warningDays) {
      return { status: "expiring_soon", daysUntilExpiry };
    }
    return { status: "valid", daysUntilExpiry };
  }

  static async generateChecklist(
    journeyId: string,
    userId: string,
    journeyType: string,
    sourceSteps: string[]
  ): Promise<GroupedDocuments> {
    const supabase = await createClient();

    // Fetch documents uploaded to the Rahvana Document Vault
    const { data: vaultDocs, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("journey_id", journeyId)
      .eq("status", "UPLOADED");

    if (error) {
      console.error("Error fetching documents:", error);
    }

    // Row visibility follows the journey's own visible_when (see visibility.ts).
    const visibility = await resolveJourneyVisibility(journeyId, userId, journeyType);

    const documentDefs = this.getDocumentDefinitions(journeyType);

    const ceac_required: DocumentChecklistItem[] = [];
    const needs_attention: DocumentChecklistItem[] = [];
    const post_appointment: DocumentChecklistItem[] = [];

    documentDefs.forEach((def: ChecklistDocumentDefinition) => {
      const { include, confirmedRequired } = evaluateDocumentVisibility(def, visibility);

      // Skip rows whose owning step is hidden for this case.
      if (!include) return;

      const uploaded = vaultDocs?.find((doc) => doc.document_def_id === def.document_key);

      /*
       * Calculate expiration status.
       *
       * Only documents with an actual expiry date are evaluated.
       * A document is considered to need attention when:
       *
       * - It has already expired, OR
       * - It will expire within the next 90 days.
       *
       * Valid documents are NOT added to needs_attention.
       */
      let expirationStatus: ExpirationStatus = "valid";
      let daysUntilExpiry: number | undefined;
      let needsAttention = false;
      let attentionReason: string | undefined;

      const expiryDate = uploaded?.expiration_date || def.expiry_date;

      if (def.is_expirable && expiryDate) {
        const expInfo = this.calculateExpirationStatus(expiryDate, 90);

        expirationStatus = expInfo.status;
        daysUntilExpiry = expInfo.daysUntilExpiry;

        if (expirationStatus === "expired") {
          needsAttention = true;
          attentionReason = "Document has expired";
        } else if (expirationStatus === "expiring_soon" && daysUntilExpiry !== undefined) {
          if (daysUntilExpiry === 0) {
            attentionReason = "Document expires today";
          } else if (daysUntilExpiry === 1) {
            attentionReason = "Document expires tomorrow";
          } else {
            attentionReason = `Document expires in ${daysUntilExpiry} days`;
          }

          needsAttention = true;
        }
      }

      const item: DocumentChecklistItem = {
        id: uploaded?.id || def.document_key,
        document_key: def.document_key,
        title: def.title,
        subtitle: def.subtitle,
        icon: def.icon,
        is_uploaded: !!uploaded,
        is_required: def.is_required === true && confirmedRequired,
        is_expirable: def.is_expirable === true,
        expiry_date: expiryDate,
        expiration_status: expirationStatus,
        days_until_expiry: daysUntilExpiry,
        source_steps: def.source_steps || sourceSteps,
        vault_file_id: uploaded?.id,
        help_url: def.help_url,
        notes: def.notes,
        tags: def.tags || [],
        category: def.category as DocumentChecklistItem["category"],
        needs_attention: needsAttention,
        attention_reason: attentionReason,
        // Set when the requirement is conditional and case data has not settled it.
        visibility_note: confirmedRequired
          ? undefined
          : "Required only in some cases. This is not confirmed yet from your case details.",
      };

      /*
       * CEAC-required documents are split into two mutually exclusive groups:
       *
       * - Documents that are ready stay in the main CEAC checklist.
       * - Expired / expiring documents move to needs_attention.
       */
      if (def.category === "ceac_required") {
        if (needsAttention) {
          needs_attention.push(item);
        } else {
          ceac_required.push(item);
        }

        return;
      }

      /*
       * Appointment-triggered documents are kept separately.
       * These are not part of the main CEAC document checklist.
       */
      if (def.category === "post_appointment") {
        post_appointment.push(item);
      }
    });

    return {
      ceac_required,
      needs_attention,
      post_appointment,
    };
  }

  private static getDocumentDefinitions(journeyType: string) {
    // Base category, not the raw string: "ir2_candidate2" must still resolve.
    const baseVisa = getBaseVisaCategory(journeyType);
    const isIr1 = baseVisa === "IR-1";
    const isIr2 = baseVisa === "IR-2" || baseVisa === "CR-2";
    const isIr5 = baseVisa === "IR-5";

    // CEAC / NVC & Interview Documents
    const ceacDocuments: ChecklistDocumentDefinition[] = [
      {
        document_key: "passport-beneficiary",
        title: "Beneficiary Passport",
        subtitle:
          "Valid passport with at least 6 months of validity beyond your intended U.S. entry date",
        icon: "Passport",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_1_2", "step_2_4"],
        category: "ceac_required",
        notes:
          "Check the expiration date on your passport's biographical page. Your passport should remain valid for at least 6 months beyond your intended date of entry to the United States.",
        tags: ["bene", "govt"],
      },

      {
        document_key: "birth-cert-beneficiary",
        title: "Birth Certificate (Beneficiary)",
        subtitle: "Original or certified copy, with English translation and photocopy",
        icon: "FileText",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2", "step_2_4"],
        category: "ceac_required",
        tags: ["bene", "govt"],
      },

      {
        document_key: "police-certificate-pakistan",
        title: "Police Certificate (PCC)",
        subtitle:
          "Police certificate(s) for the applicant, if required based on age, nationality, residence history, and criminal history",
        icon: "ShieldCheck",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_4", "step_3_6"],
        // The age rule lives in step_3_3's visible_when, not here.
        gated_by_steps: ["step_3_3"],
        category: "ceac_required",
        notes:
          "Provide the required Pakistan Police Character Certificate. Certificate freshness requirements can depend on when it was submitted to NVC and your circumstances. Obtain an updated certificate if the Embassy or NVC requires one.",
        tags: ["bene", "govt"],
      },

      {
        document_key: "i-864-affidavit",
        title: "I-864 Affidavit of Support",
        subtitle: "Completed and signed Form I-864 from the petitioner or qualifying sponsor",
        icon: "FileText",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_2_6"],
        category: "ceac_required",
        tags: ["pet", "govt"],
      },

      {
        document_key: "tax-returns-petitioner",
        title: "Tax Transcripts (IRS)",
        subtitle: "Most recent IRS tax transcript or applicable federal tax evidence",
        icon: "FileText",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_6"],
        category: "ceac_required",
        notes:
          "Provide the petitioner's most recent IRS tax transcript or other required federal tax evidence. Additional tax-year documentation may be appropriate depending on the case and financial circumstances.",
        tags: ["pet", "3p"],
      },

      {
        document_key: "w2-forms",
        title: "W-2 Forms",
        subtitle: "Most recent W-2 forms, when applicable",
        icon: "FileText",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_2_6"],
        category: "ceac_required",
        tags: ["pet", "3p"],
      },

      {
        document_key: "citizenship-proof-petitioner",
        title: "U.S. Citizenship Proof",
        subtitle:
          "U.S. passport, birth certificate, naturalization certificate, or other accepted proof",
        icon: "Flag",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2"],
        category: "ceac_required",
        tags: ["pet", "govt"],
      },
    ];

    // Documents to Prepare After Interview Appointment
    const postAppointmentDocuments: ChecklistDocumentDefinition[] = [
      {
        document_key: "ds-260",
        title: "DS-260 Confirmation Page",
        subtitle: "Printed confirmation page for your completed online immigrant visa application",
        icon: "FileCheck",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        category: "post_appointment",
        notes:
          "After submitting your DS-260, print the confirmation page and bring it with you to your visa interview.",
        tags: ["bene"],
      },

      {
        document_key: "interview-letter",
        title: "NVC Interview Appointment Letter",
        subtitle: "Official interview appointment letter issued by the National Visa Center",
        icon: "Mail",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        category: "post_appointment",
        notes:
          "You will receive your interview appointment information from the National Visa Center once your interview has been scheduled.",
        tags: ["bene"],
      },

      {
        document_key: "passport-photos",
        title: "Passport Photos",
        subtitle: "Two recent, identical U.S. visa-compliant photographs",
        icon: "Camera",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        category: "post_appointment",
        notes:
          "Bring two recent, identical color photographs that meet the U.S. visa photo requirements. Photos should be 2 x 2 inches and taken within the required timeframe.",
        tags: ["bene"],
      },

      {
        document_key: "medical-exam-ds2019",
        title: "Medical Examination Results",
        subtitle: "Sealed report from an embassy-approved panel physician",
        icon: "Syringe",
        is_required: true,
        is_expirable: true,
        source_steps: [],
        category: "post_appointment",
        notes:
          "The child must complete the immigrant visa medical examination with a physician approved by U.S. Embassy Islamabad. Book it only once the interview date is known, because the sealed report is generally valid for six months. Do not open the envelope if the clinic hands it to you.",
        tags: ["bene", "medical"],
      },

      {
        document_key: "polio-vaccine-cert",
        title: "Polio Vaccination Certificate (PVC)",
        subtitle: "International polio vaccination certificate for travel from Pakistan",
        icon: "Syringe",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        category: "post_appointment",
        notes:
          "Pakistani travelers may need a valid polio vaccination certificate for international travel. Obtain the certificate through the appropriate government vaccination facility and keep it available for your travel and visa process.",
        tags: ["bene", "medical"],
      },
    ];

    // Journey-specific documents for IR-1
    if (isIr1) {
      ceacDocuments.push(
        {
          document_key: "marriage-cert",
          title: "Marriage Registration Certificate (MRC)",
          subtitle:
            "Original or certified copy of the official marriage registration certificate, with English translation and photocopy",
          icon: "Heart",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          tags: ["beneficiary", "govt"],
        },
        {
          document_key: "nikah-nama",
          title: "Nikah Nama",
          subtitle: "Original Nikah Nama with English translation and photocopy, where applicable",
          icon: "Heart",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          tags: ["beneficiary", "govt"],
        }
      );
    }

    // Journey-specific documents for IR-2 / CR-2 (the beneficiary is the child).
    // Relationship rows reuse the quest's own child_relationship_type vocabulary, so
    // an uncaptured value leaves them listed but not yet required.
    if (isIr2) {
      ceacDocuments.push(
        {
          document_key: "nadra-crc",
          title: "NADRA Children Registration Certificate (B-Form)",
          subtitle:
            "Child registration showing the child's name, date of birth and both parents' names",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          notes:
            "In Pakistan the B-Form is usually the first record linking the child to both parents. Keep the name spellings consistent with the birth certificate and passport, and add a certified English translation if the record is not in English.",
          tags: ["bene", "govt"],
        },
        {
          document_key: "family-registration-cert",
          title: "Family Registration Certificate (FRC)",
          subtitle: "NADRA family listing used to corroborate the child's relationship to you",
          icon: "FileText",
          is_required: false,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          notes:
            "Useful when the child's civil records show different spellings or when you need to evidence family composition. It supports the primary records rather than replacing them.",
          tags: ["bene", "govt"],
        },
        {
          document_key: "child-parents-marriage-cert",
          title: "Parents' Marriage Certificate",
          subtitle: "Nikah Nama / NADRA MRC evidencing the legitimating marriage",
          icon: "Heart",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { child_relationship_type: "bio_father_married" },
          tags: ["bene", "govt"],
        },
        {
          document_key: "child-father-relationship-evidence",
          title: "Evidence of a Bona Fide Father-Child Relationship",
          subtitle:
            "Financial support, shared residence, correspondence and photos where the parents were not married",
          icon: "Heart",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { child_relationship_type: "bio_father_unmarried" },
          notes:
            "A father petitioning for a child born outside of marriage must show a genuine parent-child relationship existed while the child was under 21.",
          tags: ["bene", "pet"],
        },
        {
          document_key: "child-stepparent-marriage-cert",
          title: "Marriage Certificate Creating the Step-Relationship",
          subtitle: "Proof the marriage to the child's parent took place before the child turned 18",
          icon: "Heart",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { child_relationship_type: "stepchild" },
          tags: ["bene", "pet", "govt"],
        },
        {
          document_key: "child-prior-marriage-terminations",
          title: "Termination of the Child's Prior Marriages",
          subtitle:
            "Death, divorce or annulment records for any marriage the child had before filing",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { child_prior_marriages: true },
          notes:
            "These are the child's own marriage records, not the parents'. An IR-2 or CR-2 beneficiary must be unmarried, so any earlier marriage has to be shown as legally terminated.",
          tags: ["bene", "govt"],
        },
        {
          document_key: "child-adoption-decree",
          title: "Final Adoption Decree",
          subtitle: "Court decree showing the adoption was completed before the child turned 16",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { child_relationship_type: "adopted" },
          notes:
            "A guardianship order (for example under the Guardians and Wards Act) is not an adoption for immigration purposes. Speak to a qualified U.S. immigration attorney before relying on a guardianship record. The general rule is a full and final adoption before the child turned 16; a narrow exception may apply where a sibling was adopted before 18.",
          tags: ["bene", "govt"],
        },
        {
          document_key: "child-custody-residence-evidence",
          title: "Legal Custody and Joint Residence Evidence",
          subtitle: "Two years of legal custody and two years of joint residence with the parent",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { child_relationship_type: "adopted" },
          tags: ["bene", "pet"],
        },
        {
          document_key: "child-custody-order-consent",
          title: "Custody Order and Non-Accompanying Parent Consent",
          subtitle:
            "Custody order plus the other parent's written consent, or the legal basis for proceeding without it",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_3_5"],
          category: "ceac_required",
          visible_when: { child_custody_or_consent_required: true },
          notes:
            "Bring the originals to the interview. Where a parent has died or their whereabouts are genuinely unknown, obtain the record that establishes that fact instead of leaving it blank.",
          tags: ["pet", "govt"],
        },
        {
          document_key: "child-marital-status-attestation",
          title: "Proof of the Child's Unmarried Status",
          subtitle:
            "Declared on the DS-260, with a local single-status record where the post asks for one",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_2_4"],
          category: "ceac_required",
          notes:
            "Unmarried status has to hold from filing until the visa is issued. If the child marries before issuance, the IR-2 or CR-2 basis ends, so tell USCIS or the National Visa Center before the interview rather than at the window.",
          tags: ["bene", "govt"],
        },
        {
          document_key: "parent-prior-marriage-terminations",
          title: "Termination of the Parents' Prior Marriages",
          subtitle:
            "Death, divorce or annulment records for earlier marriages of the petitioner or the child's other parent",
          icon: "FileText",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { parent_prior_marriages: true },
          notes:
            "The marriage relied on in the petition is only valid if any earlier marriage of either party had already ended legally. Bring the termination record with its certified English translation.",
          tags: ["bene", "pet", "govt"],
        },
        {
          document_key: "step-relationship-continuing-evidence",
          title: "Evidence of a Continuing Stepparent-Stepchild Relationship",
          subtitle:
            "Required where the marriage that created the step-relationship has since ended",
          icon: "Heart",
          is_required: true,
          is_expirable: false,
          source_steps: ["step_1_2", "step_2_4"],
          category: "ceac_required",
          visible_when: { step_relationship_ended: true },
          notes:
            "A step-relationship survives divorce or the death of the marrying parent only if a genuine stepparent-stepchild relationship continued. Letters, call and visit records and proof of support show that; Form I-864 on its own does not.",
          tags: ["bene", "pet"],
        }
      );
    }

    // Journey-specific documents for IR-5
    if (isIr5) {
      ceacDocuments.push({
        document_key: "birth-cert-petitioner",
        title: "Birth Certificate (Petitioner)",
        subtitle: "Original or certified copy, with English translation and photocopy",
        icon: "FileText",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2", "step_2_4"],
        category: "ceac_required",
        tags: ["pet", "govt"],
      });
    }

    return [...ceacDocuments, ...postAppointmentDocuments];
  }
}
