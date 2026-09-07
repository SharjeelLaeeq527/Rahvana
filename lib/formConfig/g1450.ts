import type { Field } from "./types";

// Form G-1450: Authorization for Credit Card Transactions (single page).
// IMPORTANT: every `pdfKey` below must exactly match a key in the backend field map
// backend/app/core/form_configs/g1450_config.py -- that is the frontend<->backend
// contract. buildPdfPayload() sends { [pdfKey]: value } to /fill-pdf, and the Python
// PDFFillerService resolves each pdfKey to the real PDF AcroForm field.

export const formId = "g1450";
export const formTitle = "Form G-1450";
export const formSubtitle = "Authorization for Credit Card Transactions";

export const formFields: Field[] = [
  // ========================
  // Applicant / Petitioner / Requester (Full Legal Name)
  // ========================
  {
    key: "family_name",
    pdfKey: "family_name",
    label: "Family Name (Last Name)",
    type: "text",
    section: "Applicant Information",
  },
  {
    key: "given_name",
    pdfKey: "given_name",
    label: "Given Name (First Name)",
    type: "text",
    section: "Applicant Information",
  },
  {
    key: "middle_name",
    pdfKey: "middle_name",
    label: "Middle Name (if any)",
    type: "text",
    section: "Applicant Information",
  },

  // ========================
  // Credit Card Billing Information (Card Holder's Name as it appears on the card)
  // ========================
  {
    key: "cc_holder_family_name",
    pdfKey: "cc_holder_family_name",
    label: "Card Holder's Family Name (Last Name)",
    type: "text",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_given_name",
    pdfKey: "cc_holder_given_name",
    label: "Card Holder's Given Name (First Name)",
    type: "text",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_middle_name",
    pdfKey: "cc_holder_middle_name",
    label: "Card Holder's Middle Name (if any)",
    type: "text",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_street",
    pdfKey: "cc_holder_street",
    label: "Street Number and Name",
    type: "text",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_unit",
    label: "Unit Type",
    type: "radio",
    section: "Credit Card Billing Information",
    options: [
      { label: "Apt", value: "apt", pdfKey: "cc_holder_unit_apt" },
      { label: "Ste", value: "ste", pdfKey: "cc_holder_unit_ste" },
      { label: "Flr", value: "flr", pdfKey: "cc_holder_unit_flr" },
    ],
    subQuestions: [
      {
        key: "cc_holder_unit_number",
        pdfKey: "cc_holder_unit_number",
        label: "Unit Number",
        type: "text",
      },
    ],
  },
  {
    key: "cc_holder_city",
    pdfKey: "cc_holder_city",
    label: "City or Town",
    type: "text",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_state",
    pdfKey: "cc_holder_state",
    label: "State",
    type: "combo",
    isState: true,
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_zip",
    pdfKey: "cc_holder_zip",
    label: "ZIP Code",
    type: "text",
    inputMode: "numeric",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_phone",
    pdfKey: "cc_holder_phone",
    label: "Card Holder's Daytime Telephone Number",
    type: "text",
    inputMode: "tel",
    section: "Credit Card Billing Information",
  },
  {
    key: "cc_holder_email",
    pdfKey: "cc_holder_email",
    label: "Card Holder's Email Address",
    type: "text",
    inputMode: "email",
    section: "Credit Card Billing Information",
  },
  {
    key: "applicant_signature",
    pdfKey: "applicant_signature",
    label: "Card Holder's Signature (type full name)",
    type: "text",
    section: "Credit Card Billing Information",
  },

  // ========================
  // Credit Card Information
  // ========================
  {
    key: "cc_type",
    label: "Credit Card Type",
    type: "radio",
    section: "Credit Card Information",
    options: [
      { label: "Visa", value: "visa", pdfKey: "cc_type_visa" },
      { label: "MasterCard", value: "mastercard", pdfKey: "cc_type_mastercard" },
      { label: "American Express", value: "amex", pdfKey: "cc_type_amex" },
      { label: "Discover", value: "discover", pdfKey: "cc_type_discover" },
    ],
  },
  {
    key: "cc_number_1",
    pdfKey: "cc_number_1",
    label: "Credit Card Number (digits 1-4)",
    type: "text",
    maxLength: 4,
    inputMode: "numeric",
    section: "Credit Card Information",
  },
  {
    key: "cc_number_2",
    pdfKey: "cc_number_2",
    label: "Credit Card Number (digits 5-8)",
    type: "text",
    maxLength: 4,
    inputMode: "numeric",
    section: "Credit Card Information",
  },
  {
    key: "cc_number_3",
    pdfKey: "cc_number_3",
    label: "Credit Card Number (digits 9-12)",
    type: "text",
    maxLength: 4,
    inputMode: "numeric",
    section: "Credit Card Information",
  },
  {
    key: "cc_number_4",
    pdfKey: "cc_number_4",
    label: "Credit Card Number (digits 13-16)",
    type: "text",
    maxLength: 4,
    inputMode: "numeric",
    section: "Credit Card Information",
  },
  {
    key: "cc_expiration_date",
    pdfKey: "cc_expiration_date",
    label: "Credit Card Expiration Date (mm/yyyy)",
    type: "text",
    placeholder: "mm/yyyy",
    section: "Credit Card Information",
  },
  {
    key: "cc_cvv",
    pdfKey: "cc_cvv",
    label: "CVV Code",
    type: "text",
    maxLength: 4,
    inputMode: "numeric",
    section: "Credit Card Information",
  },
  {
    key: "authorized_payment_amount",
    pdfKey: "authorized_payment_amount",
    label: "Authorized Payment Amount (USD)",
    type: "text",
    inputMode: "decimal",
    section: "Credit Card Information",
  },
];

export const getInitialFormData = (): Record<string, string> => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => {
    data[f.key] = "";
    f.subQuestions?.forEach((sq) => (data[sq.key] = ""));
  });
  return data;
};

export const sectionIntroMessages = {
  "Applicant Information": {
    greeting: "Who is this payment for?",
    message:
      "Enter the full legal name of the applicant, petitioner, or requester exactly as it appears on the form you are filing with USCIS.",
  },
  "Credit Card Billing Information": {
    greeting: "Card holder and billing details",
    message:
      "Enter the card holder's name exactly as it appears on the card, along with the billing address and contact information.",
  },
  "Credit Card Information": {
    greeting: "Card details",
    message:
      "Enter the card type, card number, expiration date, CVV, and the total amount you are authorizing USCIS to charge.",
  },
};

export const g1450Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  getInitialFormData,
  sectionIntroMessages,
};

export default g1450Config;
