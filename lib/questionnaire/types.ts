// ============================================================================
// Document Questionnaire Types
// Reusable type definitions for the questionnaire engine
// ============================================================================

/**
 * Represents a single option within a questionnaire question.
 */
export interface QuestionOption {
  /** The display label shown to the user */
  label: string;
  /** The stored value (used in answers map) */
  value: string;
  /** Optional helper text shown below the label */
  helper?: string;
}

/**
 * Condition that determines if a question should be visible.
 * All conditions must be met (AND logic).
 */
export interface VisibilityCondition {
  /** The question ID whose answer this condition depends on */
  questionId: string;
  /** The answer value(s) that make this question visible */
  requiredValue: string | string[];
}

/**
 * A single question in the questionnaire.
 */
export interface QuestionnaireQuestion {
  /** Unique identifier for this question */
  id: string;
  /** The question text shown to the user */
  question: string;
  /** Helper text providing context */
  helper: string;
  /** Available answer options */
  options: QuestionOption[];
  /** Conditions that must be met for this question to be visible */
  visibleWhen?: VisibilityCondition[];
}

/**
 * A document that can be conditionally added to the final list.
 */
export interface ConditionalDocument {
  /** Unique document identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  subtitle: string;
  /** Who provides this document */
  tag: "petitioner" | "beneficiary" | "both" | "third party" | "joint_sponsor";
  /** Guide URL for the document */
  guideUrl: string;
  /** Icon name (Lucide icon) */
  icon: string;
  /** Group category for display sorting */
  group: "Required Now" | "Required if Applicable" | "Gather Now for Later";
  /** Whether this document is hard-required when triggered */
  required: boolean;
}

/**
 * Rule mapping questionnaire answers to documents.
 */
export interface DocumentDecisionRule {
  /** Which question this rule evaluates */
  questionId: string;
  /** 
   * The answer value(s) that trigger this rule.
   * If array, any match triggers the rule (OR logic).
   */
  triggerValue: string | string[];
  /** Additional condition on another question's answer (AND with triggerValue) */
  additionalCondition?: {
    questionId: string;
    requiredValue: string | string[];
  };
  /** Documents to add when rule matches */
  documents: ConditionalDocument[];
  /** If true, documents are added as optional/recommended rather than required */
  asOptional?: boolean;
}

/**
 * Full configuration for a questionnaire (one per visa category).
 */
export interface QuestionnaireConfig {
  /** Identifier for this config (e.g., "IR-1") */
  id: string;
  /** Display title */
  title: string;
  /** Display subtitle */
  subtitle: string;
  /** Ordered list of questions */
  questions: QuestionnaireQuestion[];
  /** Documents always included (hard-coded base list) */
  baseDocuments: ConditionalDocument[];
  /** Rules mapping answers to conditional documents */
  decisionRules: DocumentDecisionRule[];
}

/**
 * User's answers to the questionnaire.
 */
export type QuestionnaireAnswers = Record<string, string>;

/**
 * Final result after completing the questionnaire.
 */
export interface QuestionnaireResult {
  /** Raw answers keyed by question ID */
  answers: QuestionnaireAnswers;
  /** The finalized document list (base + conditional) */
  documentList: ConditionalDocument[];
  /** Timestamp of completion */
  completedAt: string;
}
