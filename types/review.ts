export type ReviewThemeName =
  | "rose"
  | "amber"
  | "sage"
  | "teal"
  | "purple";

export interface SectionUIConfig {
  icon: string;
  theme: string;
}

export interface QuestionnaireQuestion {
  key: string;
  label: string;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  ui?: SectionUIConfig;
  questions: QuestionnaireQuestion[];
}

export interface Questionnaire {
  categorySlug: string;
  version: string;
  lastUpdated: string;
  sections: QuestionnaireSection[];
}