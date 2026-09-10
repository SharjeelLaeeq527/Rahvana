import type { Field } from "./types";

// Form G-1651: Exemption for Paper Fee Payment (single page attestation).
// The form body is a fixed attestation; only the payer's signature and date are
// fillable. Each `pdfKey` must match a key in the backend field map
// backend/app/core/form_configs/g1651_config.py (frontend<->backend contract).

export const formId = "g1651";
export const formTitle = "Form G-1651";
export const formSubtitle = "Exemption for Paper Fee Payment";

export const formFields: Field[] = [
  {
    key: "payer_signature",
    pdfKey: "payer_signature",
    label: "Signature of Payer (type full name)",
    type: "text",
    section: "Attestation",
  },
  {
    key: "payer_date",
    pdfKey: "payer_date",
    label: "Date (mm/dd/yyyy)",
    type: "date",
    section: "Attestation",
  },
];

export const getInitialFormData = (): Record<string, string> => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => (data[f.key] = ""));
  return data;
};

export const sectionIntroMessages = {
  Attestation: {
    greeting: "Sign and date your attestation",
    message:
      "By signing, you attest that a paper fee payment is required for one of the reasons listed on the form. Type the payer's full name and the date.",
  },
};

export const g1651Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  getInitialFormData,
  sectionIntroMessages,
};

export default g1651Config;
