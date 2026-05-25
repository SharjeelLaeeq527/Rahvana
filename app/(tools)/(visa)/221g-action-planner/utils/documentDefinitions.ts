import { FormSelections } from "../types/221g";
import { DocumentType } from "./documentValidation";

export type DocumentStatus = "missing" | "in-progress" | "ready" | "submitted";

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  required: boolean;
  status: DocumentStatus;
  filePath?: string;
  notes?: string;
}

export const generateRequiredDocumentsList = (selectedItems: FormSelections): DocumentItem[] => {
  const newDocuments: DocumentItem[] = [];

  // Passport
  if (selectedItems.passport) {
    newDocuments.push({
      id: "passport",
      name: "Passport",
      type: "passport",
      required: true,
      status: "missing",
    });
  }

  // Medical examination
  if (selectedItems.medical_examination) {
    newDocuments.push({
      id: "medical_examination",
      name: "Medical Examination",
      type: "medical_examination",
      required: true,
      status: "missing",
    });
  }

  // NADRA Family Registration Certificate
  if (selectedItems.nadra_family_reg) {
    newDocuments.push({
      id: "nadra_family_reg",
      name: "NADRA Family Registration Certificate",
      type: "marriage_certificate", // Using marriage certificate validation as closest match
      required: true,
      status: "missing",
    });
  }

  // Birth certificates
  if (selectedItems.nadra_birth_cert) {
    if (selectedItems.nadra_birth_cert_petitioner) {
      newDocuments.push({
        id: "birth_cert_petitioner",
        name: "Birth Certificate (Petitioner)",
        type: "birth_certificate",
        required: true,
        status: "missing",
      });
    }
    if (selectedItems.nadra_birth_cert_beneficiary) {
      newDocuments.push({
        id: "birth_cert_beneficiary",
        name: "Birth Certificate (Beneficiary)",
        type: "birth_certificate",
        required: true,
        status: "missing",
      });
    }
    // If neither petitioner nor beneficiary is specified, add generic one
    if (!selectedItems.nadra_birth_cert_petitioner && !selectedItems.nadra_birth_cert_beneficiary) {
      newDocuments.push({
        id: "birth_cert_generic",
        name: "Birth Certificate",
        type: "birth_certificate",
        required: true,
        status: "missing",
      });
    }
  }

  // Marriage certificates
  if (selectedItems.nadra_marriage_cert) {
    newDocuments.push({
      id: "nadra_marriage_cert",
      name: "NADRA Marriage Certificate",
      type: "marriage_certificate",
      required: true,
      status: "missing",
    });
  }

  // Nikah Nama
  if (selectedItems.nikah_nama) {
    newDocuments.push({
      id: "nikah_nama",
      name: "Nikah Nama",
      type: "nikah_nama",
      required: true,
      status: "missing",
    });
  }

  // Divorce certificates
  if (selectedItems.nadra_divorce_cert) {
    if (selectedItems.nadra_divorce_cert_petitioner) {
      newDocuments.push({
        id: "divorce_cert_petitioner",
        name: "Divorce Certificate (Petitioner)",
        type: "divorce_certificate",
        required: true,
        status: "missing",
      });
    }
    if (selectedItems.nadra_divorce_cert_beneficiary) {
      newDocuments.push({
        id: "divorce_cert_beneficiary",
        name: "Divorce Certificate (Beneficiary)",
        type: "divorce_certificate",
        required: true,
        status: "missing",
      });
    }
    // If neither petitioner nor beneficiary is specified, add generic one
    if (
      !selectedItems.nadra_divorce_cert_petitioner &&
      !selectedItems.nadra_divorce_cert_beneficiary
    ) {
      newDocuments.push({
        id: "divorce_cert_generic",
        name: "Divorce Certificate",
        type: "divorce_certificate",
        required: true,
        status: "missing",
      });
    }
  }

  // US Divorce Decree
  if (selectedItems.us_divorce_decree) {
    newDocuments.push({
      id: "us_divorce_decree",
      name: "US Divorce Decree",
      type: "divorce_certificate",
      required: true,
      status: "missing",
    });
  }

  // Death Certificate
  if (selectedItems.death_certificate) {
    newDocuments.push({
      id: "death_certificate",
      name: `Death Certificate (${selectedItems.death_certificate_name || "Unspecified"})`,
      type: "death_certificate",
      required: true,
      status: "missing",
    });
  }

  // Police Certificate
  if (selectedItems.police_certificate) {
    newDocuments.push({
      id: "police_certificate",
      name: `Police Certificate (${selectedItems.police_certificate_country || "Unspecified Country"})`,
      type: "police_certificate",
      required: true,
      status: "missing",
    });
  }

  // English Translation
  if (selectedItems.english_translation) {
    newDocuments.push({
      id: "english_translation",
      name: `English Translation (${selectedItems.english_translation_document || "Unspecified Document"})`,
      type: "translation",
      required: true,
      status: "missing",
    });
  }

  // I-864 Affidavit of Support and related documents
  if (selectedItems.i864_affidavit) {
    newDocuments.push({
      id: "i864_affidavit",
      name: "I-864 Affidavit of Support",
      type: "i864_affidavit",
      required: true,
      status: "missing",
    });

    if (selectedItems.i864a) {
      newDocuments.push({
        id: "i864a",
        name: "I-864A Contract Between Sponsor and Household Member",
        type: "i864_affidavit",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.i134) {
      newDocuments.push({
        id: "i134",
        name: "I-134 Affidavit of Support",
        type: "i864_affidavit",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.i864w) {
      newDocuments.push({
        id: "i864w",
        name: "I-864W Request for Exemption",
        type: "i864_affidavit",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.tax_1040) {
      newDocuments.push({
        id: "tax_1040",
        name: "Tax Return (Form 1040)",
        type: "form_1040",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.w2) {
      newDocuments.push({
        id: "w2",
        name: "W-2 Forms",
        type: "w2",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.irs_transcript) {
      newDocuments.push({
        id: "irs_transcript",
        name: "IRS Tax Transcript",
        type: "irs_transcript",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.proof_citizenship) {
      newDocuments.push({
        id: "proof_citizenship",
        name: "Proof of U.S. Citizenship or LPR Status",
        type: "i864_affidavit",
        required: false,
        status: "missing",
      });
    }

    if (selectedItems.domicile) {
      newDocuments.push({
        id: "domicile",
        name: "Domicile Evidence",
        type: "i864_affidavit",
        required: false,
        status: "missing",
      });
    }
  }

  // DNA test
  if (selectedItems.dna_test) {
    newDocuments.push({
      id: "dna_test",
      name: `DNA Test Recommended (${selectedItems.dna_test_name || "Unspecified"})`,
      type: "birth_certificate", // Using birth certificate validation as closest match
      required: false,
      status: "missing",
    });
  }

  // Other
  if (selectedItems.other) {
    newDocuments.push({
      id: "other",
      name: `Other: ${selectedItems.other_details || "Unspecified"}`,
      type: "birth_certificate", // Using birth certificate validation as generic fallback
      required: false,
      status: "missing",
    });
  }

  return newDocuments;
};
