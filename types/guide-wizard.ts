export type WizardStepId =
  | "document_need"
  // | "location"
  | "roadmap"
  // | "office_finder"
  | "validation";

export interface WizardState {
  documentNeed: string | Record<string, string> | null;
  province: string | null;
  district: string | null;
  city: string | null;
  checkedDocuments: string[];
  validationChecks: string[];
  uploadedFile: boolean;
}
