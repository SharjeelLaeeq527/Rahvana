// Rules Loader - Dynamically loads question selection rules based on category slug
export interface RuleCondition {
  field: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value: string | number | boolean;
}

export interface RuleConditionGroup {
  type: "AND" | "OR";
  conditions: RuleCondition[];
}

export interface QuestionSelectionRule {
  id: string;
  name: string;
  description: string;
  condition: RuleConditionGroup;
  actions: {
    includeCategories: string[];
    priorityBoost: ("high" | "medium" | "low")[];
    reason: string;
  };
}

export interface RulesConfig {
  categorySlug: string;
  version: string;
  questionSelectionRules: QuestionSelectionRule[];
}

// Load rules.json file for a specific category
export async function loadRulesForCategory(categorySlug: string): Promise<RulesConfig | null> {
  try {
    const response = await import(
      `@/data/interview-categories/${categorySlug}/rules.json`
    );
    return response.default as RulesConfig;
  } catch (error) {
    console.warn(`No rules found for category ${categorySlug}:`, error);
    return null;
  }
}

// Evaluate a condition against user answers
function evaluateCondition(
  condition: RuleCondition,
  answers: Record<string, unknown>,
): boolean {
  const answerValue = answers[condition.field];

  switch (condition.operator) {
    case "equals":
      return answerValue === condition.value;
    case "notEquals":
      return answerValue !== condition.value;
    case "contains":
      return String(answerValue).includes(String(condition.value));
    case "greaterThan":
      return Number(answerValue) > Number(condition.value);
    case "lessThan":
      return Number(answerValue) < Number(condition.value);
    default:
      return false;
  }
}

// Evaluate a condition group (AND/OR) against user answers
export function evaluateConditionGroup(
  group: RuleConditionGroup,
  answers: Record<string, unknown>,
): boolean {
  if (group.type === "AND") {
    return group.conditions.every((cond) =>
      evaluateCondition(cond, answers),
    );
  } else {
    // OR
    return group.conditions.some((cond) => evaluateCondition(cond, answers));
  }
}

// Check if a question matches any applied rules
export function getAppliedRules(
  questionCategory: string,
  answers: Record<string, unknown>,
  rules: QuestionSelectionRule[],
): QuestionSelectionRule[] {
  return rules.filter((rule) => {
    const ruleMatches = evaluateConditionGroup(rule.condition, answers);
    const categoryMatches = rule.actions.includeCategories.includes(
      questionCategory,
    );
    return ruleMatches && categoryMatches;
  });
}
