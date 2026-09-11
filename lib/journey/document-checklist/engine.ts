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

    // Fetch uploaded documents for this journey
    const { data: vaultDocs, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("journey_id", journeyId)
      .eq("status", "UPLOADED");

    if (error) {
      console.error("Error fetching documents:", error);
    }

    // Document definitions
    const documentDefs = this.getDocumentDefinitions(journeyType);

    const already_uploaded: DocumentChecklistItem[] = [];
    const expirable: DocumentChecklistItem[] = [];
    const post_interview: DocumentChecklistItem[] = [];

    documentDefs.forEach((def: any) => {
      const uploaded = vaultDocs?.find((v) => v.document_def_id === def.document_key);

      const item: DocumentChecklistItem = {
        id: uploaded?.id || def.document_key,
        document_key: def.document_key,
        title: def.title,
        subtitle: def.subtitle,
        icon: def.icon,
        is_uploaded: !!uploaded,
        is_required: def.is_required,
        is_expirable: def.is_expirable,
        expiry_date: uploaded?.expiration_date || def.expiry_date,
        source_steps: def.source_steps,
        vault_file_id: uploaded?.id,
        notes: def.notes,
        tags: def.tags || [],
      };

      if (def.is_expirable) {
        const expInfo = this.calculateExpirationStatus(item.expiry_date, 90);
        item.expiration_status = expInfo.status;
        item.days_until_expiry = expInfo.daysUntilExpiry;
        expirable.push(item);
      } else if (def.post_interview) {
        post_interview.push(item);
      } else if (uploaded) {
        already_uploaded.push(item);
      }
    });

    return { already_uploaded, expirable, post_interview };
  }

  private static getDocumentDefinitions(journeyType: string) {
    const upperJourneyType = journeyType.toUpperCase();

    // Documents that can expire/become outdated
    const expirableDocuments = [
      {
        document_key: "passport-beneficiary",
        title: "Beneficiary Passport",
        subtitle: "Must be valid for 6+ months beyond US entry date",
        icon: "passport",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        notes: "Your passport must remain valid for at least 6 months after your planned entry date to the United States. Check the expiration date on your passport's biographical page.",
        tags: ["bene", "govt"],
      },
      {
        document_key: "passport-petitioner",
        title: "Petitioner U.S. Passport",
        subtitle: "Must be valid for 6+ months beyond travel date",
        icon: "passport",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        notes: "The petitioner's U.S. passport should be currently valid. Renew if expiring within 6 months.",
        tags: ["pet", "govt"],
      },
      {
        document_key: "cnic-beneficiary",
        title: "CNIC (National ID)",
        subtitle: "Pakistani national ID card",
        icon: "id-card",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        notes: "Ensure your CNIC (Computerized National Identity Card) is not expired. The expiration date is printed on the card.",
        tags: ["bene", "govt"],
      },
      {
        document_key: "police-certificate-pakistan",
        title: "Police Certificate (PCC)",
        subtitle: "Valid for 6 months from issuance",
        icon: "shield-check",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_4", "step_3_6"],
        post_interview: false,
        notes: "Pakistan Police Character Certificate is valid for 6 months from the date of issuance. If your interview is scheduled more than 6 months after issuance, you'll need a new certificate.",
        tags: ["bene", "govt"],
      },
      {
        document_key: "medical-exam-ds2019",
        title: "Medical Examination",
        subtitle: "Valid for 6 months from exam date",
        icon: "stethoscope",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_3_6"],
        post_interview: true,
        notes: "The medical examination report (Form DS-2019) is valid for 6 months from the date of your exam. Schedule your interview before this expires, or you'll need to repeat the medical exam.",
        tags: ["bene", "medical"],
      },
      {
        document_key: "tax-returns-petitioner",
        title: "IRS Tax Returns (Recent)",
        subtitle: "Submit most recent year's tax return",
        icon: "file-text",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_6"],
        post_interview: false,
        notes: "Submit your most recent tax return. For example, if your interview is in 2026, provide your 2025 tax return (filed by April 15, 2026). If not yet filed, provide 2024. The NVC/Embassy expects the most recent year available.",
        tags: ["pet", "3p"],
      },
      {
        document_key: "fbr-tax-returns",
        title: "FBR Tax Returns (Pakistan)",
        subtitle: "Submit most recent tax year",
        icon: "file-text",
        is_required: false,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_6"],
        post_interview: false,
        notes: "If applicable, provide your most recent FBR (Federal Board of Revenue) tax returns from Pakistan. This shows your income history in Pakistan.",
        tags: ["bene", "3p"],
      },
      {
        document_key: "employment-letter",
        title: "Employment Verification Letter",
        subtitle: "Should be dated within last 6 months",
        icon: "briefcase",
        is_required: true,
        is_expirable: true,
        expiry_date: undefined,
        source_steps: ["step_2_6"],
        post_interview: false,
        notes: "Request a recent employment letter from your employer (dated within the last 6 months) confirming your current employment, position, salary, and employment start date. Older letters may not be accepted.",
        tags: ["pet", "3p"],
      },
    ];

    // Documents that don't expire
    const nonExpirableDocuments = [
      {
        document_key: "birth-cert-beneficiary",
        title: "Birth Certificate (Beneficiary)",
        subtitle: "Official birth certificate",
        icon: "file-text",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        tags: ["bene", "govt"],
      },
      {
        document_key: "birth-cert-petitioner",
        title: "Birth Certificate (Petitioner)",
        subtitle: "Official birth certificate",
        icon: "file-text",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        tags: ["pet", "govt"],
      },
      {
        document_key: "birth-cert-translation",
        title: "Birth Certificate Translation",
        subtitle: "Certified English translation",
        icon: "languages",
        is_required: false,
        is_expirable: false,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        tags: ["bene", "3p"],
      },
      {
        document_key: "citizenship-proof-petitioner",
        title: "U.S. Citizenship Proof",
        subtitle: "Naturalization certificate, U.S. passport, or birth certificate",
        icon: "flag",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2"],
        post_interview: false,
        tags: ["pet", "govt"],
      },
      {
        document_key: "i797-approval-notice",
        title: "I-797 Approval Notice",
        subtitle: "USCIS Form I-130 approval notice",
        icon: "file-check",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2"],
        post_interview: false,
        tags: ["both", "govt"],
      },
    ];

    // Post-interview documents
    const postInterviewDocuments = [
      {
        document_key: "ds-260",
        title: "DS-260 Confirmation Page",
        subtitle: "Online immigrant visa application confirmation",
        icon: "file-check",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        post_interview: true,
        notes: "After completing your DS-260 form online, print and bring the confirmation page to your interview.",
        tags: ["bene"],
      },
      {
        document_key: "passport-photos",
        title: "Passport Photos",
        subtitle: "2 identical U.S. visa-compliant photos (2x2 inches)",
        icon: "camera",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        post_interview: true,
        notes: "Bring 2 recent, identical color passport photos taken within the last 6 months. Must meet U.S. visa photo requirements (2x2 inches, white background, no glasses).",
        tags: ["bene"],
      },
      {
        document_key: "polio-vaccine-cert",
        title: "Polio Vaccination Certificate",
        subtitle: "International vaccination certificate (valid 12 months)",
        icon: "syringe",
        is_required: true,
        is_expirable: false,
        source_steps: [],
        post_interview: true,
        notes: "Required for Pakistani nationals. Must be issued within 12 months before your interview date. Available at designated health centers.",
        tags: ["bene", "medical"],
      },
    ];

    // Journey-specific documents
    if (upperJourneyType === "IR1" || upperJourneyType === "IR-1") {
      nonExpirableDocuments.push({
        document_key: "marriage-cert",
        title: "Marriage Certificate",
        subtitle: "Official marriage certificate",
        icon: "heart",
        is_required: true,
        is_expirable: false,
        source_steps: ["step_1_2", "step_2_4"],
        post_interview: false,
        tags: ["both", "govt"],
      });
    }

    return [...expirableDocuments, ...nonExpirableDocuments, ...postInterviewDocuments];
  }
}
