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
  tag: "petitioner" | "beneficiary" | "both" | "joint_sponsor";
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
 * Each config is fully self-contained — questions, base documents, decision
 * rules, AND the optional mapping that pre-fills answers derived from the
 * Step 1 eligibility questionnaire so users don't answer duplicate questions.
 */
export interface QuestionnaireConfig {
  /** Identifier for this config (e.g., "ir1-doc-questionnaire") */
  id: string;
  /** Display title shown on the summary screen (e.g. "IR-1 / CR-1") */
  title: string;
  /** Display subtitle */
  subtitle: string;
  /** Ordered list of questions */
  questions: QuestionnaireQuestion[];
  /** Documents always included (hard-coded base list) */
  baseDocuments: ConditionalDocument[];
  /** Rules mapping answers to conditional documents */
  decisionRules: DocumentDecisionRule[];
  /**
   * Optional: maps Step 1 eligibility answers → document-questionnaire
   * pre-filled answers so duplicate questions are skipped automatically.
   * Each category defines its own mapping; no engine changes are needed.
   */
  eligibilityDerivationMap?: EligibilityDerivationMap;
}

// ============================================================================
// Eligibility → Document Questionnaire Derivation
// ============================================================================

/**
 * User's answers to the questionnaire.
 */
export type QuestionnaireAnswers = Record<string, string>;

/**
 * A single mapping rule that translates one eligibility-suite screen answer
 * into one or more document-questionnaire pre-filled answers.
 *
 * Lives inside QuestionnaireConfig so each category is entirely self-contained.
 */
export interface EligibilityDerivationEntry {
  /**
   * The top-level quest ID inside eligibility-suite answers.
   * e.g. "q3"
   */
  eligibilityQuestId: string;
  /**
   * The screen ID within that quest.
   * e.g. "q3s1"
   */
  eligibilityScreenId: string;
  /**
   * Given the raw screen value, return a partial answers map to merge into
   * the document-questionnaire pre-filled answers.
   * Return {} (empty) when the value should produce no derivation.
   */
  derive: (value: string) => QuestionnaireAnswers;
}

/** Ordered list of derivation entries for a category. */
export type EligibilityDerivationMap = EligibilityDerivationEntry[];

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
