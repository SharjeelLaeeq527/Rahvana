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
  originalLabel?: string;
  /** Nested sub-questions (e.g., 4a, 4b, 4c) rendered in same card */
  subQuestions?: (Omit<Field, 'section'> & { condition?: (data: Record<string, string>) => boolean })[];
  pattern?: string;
  inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
};

// ✅ Add this: FormConfig type
export type FormConfig = {
  formTitle?: string;
  formSubtitle?: string;
  formFields: Field[];
  getInitialFormData: () => Record<string, string>;
  sectionIntroMessages?: Record<string, { greeting: string; message: string }>;
};
