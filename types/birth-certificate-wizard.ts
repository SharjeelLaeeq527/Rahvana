export type BirthStepId =
  | "document_need"
  | "age_category"
  | "birth_setting"
  | "location"
  | "parental_details"
  | "office_finder"
  | "roadmap";


export interface BirthWizardState {
  documentNeed: string | null;
  ageCategory: "0-3" | "3-10" | "10-18" | "18+" | null;
  timing: "timely" | "late" | "very_late" | null;
  birthSetting: string | null;
  province: string | null;
  district: string | null;
  city: string | null;
  parentalStatus: {
    hasCNICs: boolean;
    hasNikahNama: boolean;
    isSingleParent: boolean;
    hasOldRecords: boolean;
    hasSchoolRecord: boolean;
    hasResidenceProof: boolean;
  };
  savedOffice: {
    name: string;
    address: string;
    timings: string;
  } | null;
  checkedDocuments: string[];
}

