export type FieldType =
  | "text"
  | "radio"
  | "checkbox"
  | "date"
  | "hidden"
  | "select"
  | "combo"
  | "textarea"
  | "dropdown";

export type FieldCandidateScope =
  | "shared_petitioner"   // Auto-filled from petitioner / primary applicant across candidates
  | "shared_household"    // Shared family/household info across filings (with verification prompt)
  | "candidate_distinct"; // Unique to this candidate (names, DOB, passport, A#, medical, etc.)

export type Field = {
  key: string;
  pdfKey: string;
  label: string;
  type: FieldType;
  isState?: boolean; // Add this for automatic US_STATES dropdown
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  options?: { label: string; value: string; pdfKey?: string }[]; // pdfKey is optional for dropdowns
  condition?: (data: Record<string, string>) => boolean;
  section?: string;
  value?: string;
  repeatable?: boolean;
  groupId?: string;
  tooltip?: string;
  /** Short explanatory text shown beneath the question heading */
  hint?: string;
  /** Long-form help shown inside a collapsible "What does this mean?" panel */
  help?: string;
  /** "Where to find this" tip shown in a teal info box */
  find?: string;
  /** Concrete example shown in a green info box */
  example?: string;
  originalLabel?: string;
  /** Multi-candidate scoping classification */
  candidateScope?: FieldCandidateScope;
  /** High-attention verification tag (e.g. DOB, Passport #, Full Name) */
  criticalReason?: string;
  /** Nested sub-questions (e.g., 4a, 4b, 4c) rendered in same card */
  subQuestions?: (Omit<Field, "section"> & {
    condition?: (data: Record<string, string>) => boolean;
  })[];
  pattern?: string;
  inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
  keyboardType?: "urdu" | "arabic";
};

// ✅ Add this: FormConfig type
export type OverflowFieldConfig = {
  prefix: string;
  countKey: string;
  startIndex: number;
  maxIndex?: number;
  pageNumber: string;
  partNumber: string;
  itemNumber: string;
  labelPrefix: string;
  fields: { suffix: string; label: string }[];
  formatInfo: (index: number, data: Record<string, string>) => string;
};

export type FormConfig = {
  formTitle?: string;
  formSubtitle?: string;
  formFields: Field[];
  getInitialFormData: () => Record<string, string>;
  sectionIntroMessages?: Record<string, { greeting: string; message: string }>;
  overflowFields?: OverflowFieldConfig[];
};
