export type NikahStepId =
  | "case_type"
  | "location"
  | "roadmap"
  | "office_finder"
  | "validation";

export interface NikahWizardState {
  caseType: string | null;
  province: string | null;
  district: string | null;
  city: string | null;
  checkedDocuments: string[];
  validationChecks: string[];
  uploadedFile: boolean;
}

export interface NikahOffice {
  name: string;
  badge: string;
  address: string;
  hours: string;
  tip: string;
}
