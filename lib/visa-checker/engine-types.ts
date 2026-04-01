export type Operator = "equals" | "notEquals" | "greaterThan" | "lessThan" | "contains" | "exists" | "notExists";

export interface Condition {
  fact: string;
  operator: Operator;
  value?: unknown;
  when?: string; // Optional dynamic expression
}

export interface Action {
  type: "addFlag" | "deductPoints" | "addPoints";
  flagCode?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH";
  pointsDeducted?: number;
  pointsAdded?: number;
  explanation?: string;
  improvementSuggestions?: string;
}

export interface Rule {
  id: string;
  description?: string;
  conditions: Condition[];
  action: Action;
}

export interface ComputedFact {
  id: string;
  logic: string; // Dynamic expression
}

export interface CategoryRules {
  category: string;
  baseScore: number;
  componentWeights: Record<string, number>;
  computedFacts: ComputedFact[];
  rules: Rule[];
}

export interface Question {
  id: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "date" | "textarea";
  options?: string[];
  risk_tag?: string;
  visible_if?: string;
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface Questionnaire {
  category: string;
  title: string;
  sections: Section[];
}
