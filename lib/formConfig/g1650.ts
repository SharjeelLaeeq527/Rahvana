import type { Field } from "./types";

// Form G-1650: Authorization for ACH Transactions (single page).
// Every `pdfKey` must exactly match a key in the backend field map
// backend/app/core/form_configs/g1650_config.py (frontend<->backend contract).

export const formId = "g1650";
export const formTitle = "Form G-1650";
export const formSubtitle = "Authorization for ACH Transactions";

export const formFields: Field[] = [
  // ========================
  // Applicant / Petitioner / Requester (Full Legal Name)
  // ========================
  {
    key: "applicant_family",
    pdfKey: "applicant_family",
    label: "Family Name (Last Name)",
    type: "text",
    section: "Applicant Information",
  },
  {
    key: "applicant_given",
    pdfKey: "applicant_given",
    label: "Given Name (First Name)",
    type: "text",
    section: "Applicant Information",
  },
  {
    key: "applicant_middle",
    pdfKey: "applicant_middle",
    label: "Middle Name (if any)",
    type: "text",
    section: "Applicant Information",
  },

  // ========================
  // Bank Account Holder Information (Name as it appears on the account)
  // ========================
  {
    key: "bank_holder_family",
    pdfKey: "bank_holder_family",
    label: "Account Holder's Family Name (Last Name)",
    type: "text",
    section: "Bank Account Holder Information",
  },
  {
    key: "bank_holder_given",
    pdfKey: "bank_holder_given",
    label: "Account Holder's Given Name (First Name)",
    type: "text",
    section: "Bank Account Holder Information",
  },
  {
    key: "bank_holder_middle",
    pdfKey: "bank_holder_middle",
    label: "Account Holder's Middle Name (if any)",
    type: "text",
    section: "Bank Account Holder Information",
  },
  {
    key: "account_holder_type",
    label: "Account Holder Type",
    type: "radio",
    section: "Bank Account Holder Information",
    options: [
      { label: "Business Account", value: "business", pdfKey: "account_holder_business" },
      { label: "Personal Account", value: "personal", pdfKey: "account_holder_personal" },
    ],
  },

  // ========================
  // Bank Account Information
  // ========================
  {
    key: "account_type",
    label: "Account Type",
    type: "radio",
    section: "Bank Account Information",
    options: [
      { label: "Checking Account", value: "checking", pdfKey: "account_type_checking" },
      { label: "Savings Account", value: "savings", pdfKey: "account_type_savings" },
    ],
  },
  {
    key: "bank_name",
    pdfKey: "bank_name",
    label: "Bank Name",
    type: "text",
    section: "Bank Account Information",
  },
  {
    key: "routing_number",
    pdfKey: "routing_number",
    label: "Routing Number (9 digits)",
    type: "text",
    maxLength: 9,
    inputMode: "numeric",
    section: "Bank Account Information",
  },
  {
    key: "account_number",
    pdfKey: "account_number",
    label: "Account Number",
    type: "text",
    inputMode: "numeric",
    section: "Bank Account Information",
  },
  {
    key: "business_name",
    pdfKey: "business_name",
    label: "Business Name (if a business account)",
    type: "text",
    section: "Bank Account Information",
  },
  {
    key: "authorized_payment_amount",
    pdfKey: "authorized_payment_amount",
    label: "Authorized Payment Amount (USD)",
    type: "text",
    inputMode: "decimal",
    section: "Bank Account Information",
  },
  {
    key: "applicant_signature",
    pdfKey: "applicant_signature",
    label: "Signature of Applicant (type full name)",
    type: "text",
    section: "Bank Account Information",
  },
];

export const getInitialFormData = (): Record<string, string> => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => (data[f.key] = ""));
  return data;
};

export const sectionIntroMessages = {
  "Applicant Information": {
    greeting: "Who is this payment for?",
    message:
      "Enter the full legal name of the applicant, petitioner, or requester exactly as it appears on the form you are filing with USCIS.",
  },
  "Bank Account Holder Information": {
    greeting: "Whose bank account is this?",
    message:
      "Enter the account holder's name exactly as it appears on the account, and whether it is a business or personal account.",
  },
  "Bank Account Information": {
    greeting: "Bank account details",
    message:
      "Enter the bank name, routing and account numbers, account type, and the total amount you are authorizing USCIS to debit.",
  },
};

export const g1650Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  getInitialFormData,
  sectionIntroMessages,
};

export default g1650Config;
