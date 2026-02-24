export type WizardStepId =
  | "document_need"
  | "age_category"
  | "birth_setting"
  | "location"
  | "roadmap"
  | "office_finder"
  | "validation";

export interface WizardState {
  documentNeed: string | Record<string, string> | null;
  ageCategory: string | null;
  birthSetting: string | null;
  province: string | null;
  district: string | null;
  city: string | null;
  checkedDocuments: string[];
  validationChecks: string[];
  uploadedFile: boolean;
  savedOffice: any;
}
