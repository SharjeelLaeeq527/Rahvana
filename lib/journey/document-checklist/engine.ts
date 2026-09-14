import { createClient } from "@/lib/supabase/server";
import { DocumentChecklistItem, GroupedDocuments, ExpirationStatus } from "./types";

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

    const documentDefs = this.getDocumentDefinitions(journeyType);

    const ceac_required: DocumentChecklistItem[] = [];
    const needs_attention: DocumentChecklistItem[] = [];
    const post_appointment: DocumentChecklistItem[] = [];

    documentDefs.forEach((def: any) => {
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
        is_required: def.is_required,
        is_expirable: def.is_expirable,
        expiry_date: expiryDate,
        expiration_status: expirationStatus,
        days_until_expiry: daysUntilExpiry,
        source_steps: def.source_steps || sourceSteps,
        vault_file_id: uploaded?.id,
        help_url: def.help_url,
        notes: def.notes,
        tags: def.tags || [],
        category: def.category,
        needs_attention: needsAttention,
        attention_reason: attentionReason,
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
    const upperJourneyType = journeyType.toUpperCase();

    // CEAC / NVC & Interview Documents
    const ceacDocuments = [
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
        subtitle: "Police certificate required for applicants over age 16",
        icon: "ShieldCheck",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_4", "step_3_6"],
        category: "ceac_required",
        notes:
          "Provide the required Pakistan Police Character Certificate. Certificate freshness requirements can depend on when it was submitted to NVC and your circumstances. Obtain an updated certificate if the Embassy or NVC requires one.",
        tags: ["bene", "govt"],
      },

      {
        document_key: "i864-affidavit-support",
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
        document_key: "tax-transcripts-petitioner",
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
        document_key: "w2-forms-petitioner",
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
    const postAppointmentDocuments = [
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
        document_key: "nvc-interview-letter",
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
    if (upperJourneyType === "IR1" || upperJourneyType === "IR-1") {
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

    // Journey-specific documents for IR-5
    if (upperJourneyType === "IR5" || upperJourneyType === "IR-5") {
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
