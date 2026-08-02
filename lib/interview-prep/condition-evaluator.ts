export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "in"
  | "notIn"
  | "exists"
  | "notExists"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual";

export interface ConditionPredicate {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  values?: unknown[];
}

export interface ConditionGroup {
  allOf?: ConditionExpression[];
  anyOf?: ConditionExpression[];
  not?: ConditionExpression;
}

export type ConditionExpression = ConditionPredicate | ConditionGroup;

export interface QuestionConditions {
  requireIntake?: string[];
  requireCaseTypes?: string[];
  requireIntakeValues?: Record<string, unknown>;
  allOf?: ConditionExpression[];
  anyOf?: ConditionExpression[];
  not?: ConditionExpression;
}

export type SkipIfInput = ConditionExpression | ConditionExpression[] | null | undefined;

export interface ConditionEvaluationContext {
  caseType?: string;
  fallbackCaseType?: string;
}

const CASE_TYPE_FIELDS = [
  "caseType",
  "case_type",
  "visaCategory",
  "visa_category",
  "journeyType",
  "journey_type",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
}

function hasMeaningfulValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return true;
  }

  return value !== undefined && value !== null && value !== "";
}

function normalizeComparable(value: unknown): unknown {
  return typeof value === "string" ? normalizeText(value) : value;
}

function valuesMatch(expected: unknown, actual: unknown): boolean {
  const expectedValues = toArray(expected);
  const actualValues = toArray(actual);

  return expectedValues.some((expectedValue) =>
    actualValues.some((actualValue) => {
      if (typeof expectedValue === "string" && typeof actualValue === "string") {
        return normalizeText(expectedValue) === normalizeText(actualValue);
      }

      return normalizeComparable(expectedValue) === normalizeComparable(actualValue);
    })
  );
}

function compareNumeric(
  actual: unknown,
  expected: unknown,
  comparator: (actualNumber: number, expectedNumber: number) => boolean
): boolean {
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);

  if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) {
    return false;
  }

  return comparator(actualNumber, expectedNumber);
}

export function inferCaseTypeFromCategorySlug(categorySlug: string): string {
  const parts = categorySlug.split("-").filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return normalizeText(parts[parts.length - 1]);
}

export function resolveCaseType(
  answers: Record<string, unknown>,
  fallbackCaseType?: string
): string {
  for (const field of CASE_TYPE_FIELDS) {
    const candidate = answers[field];
    if (typeof candidate === "string" && candidate.trim()) {
      return normalizeText(candidate);
    }
  }

  return normalizeText(fallbackCaseType);
}

function resolveExpectedValues(predicate: ConditionPredicate): unknown[] {
  if (predicate.values && predicate.values.length > 0) {
    return predicate.values;
  }

  if (Array.isArray(predicate.value)) {
    return predicate.value;
  }

  if (predicate.value === undefined) {
    return [];
  }

  return [predicate.value];
}

export function evaluateConditionPredicate(
  predicate: ConditionPredicate,
  answers: Record<string, unknown>,
  context: ConditionEvaluationContext = {}
): boolean {
  const actualValue = predicate.field === "caseType"
    ? resolveCaseType(answers, context.caseType ?? context.fallbackCaseType)
    : answers[predicate.field];

  switch (predicate.operator) {
    case "equals":
      return valuesMatch(predicate.value, actualValue);
    case "notEquals":
      return !valuesMatch(predicate.value, actualValue);
    case "contains": {
      const expectedValues = resolveExpectedValues(predicate);

      if (Array.isArray(actualValue)) {
        return expectedValues.some((expectedValue) =>
          actualValue.some((item) => valuesMatch(expectedValue, item))
        );
      }

      const actualText = normalizeText(actualValue);
      return expectedValues.some((expectedValue) =>
        actualText.includes(normalizeText(expectedValue))
      );
    }
    case "in": {
      const expectedValues = resolveExpectedValues(predicate);
      return expectedValues.some((expectedValue) => valuesMatch(expectedValue, actualValue));
    }
    case "notIn": {
      const expectedValues = resolveExpectedValues(predicate);
      return !expectedValues.some((expectedValue) => valuesMatch(expectedValue, actualValue));
    }
    case "exists":
      return hasMeaningfulValue(actualValue);
    case "notExists":
      return !hasMeaningfulValue(actualValue);
    case "greaterThan":
      return compareNumeric(actualValue, predicate.value, (actual, expected) => actual > expected);
    case "greaterThanOrEqual":
      return compareNumeric(actualValue, predicate.value, (actual, expected) => actual >= expected);
    case "lessThan":
      return compareNumeric(actualValue, predicate.value, (actual, expected) => actual < expected);
    case "lessThanOrEqual":
      return compareNumeric(actualValue, predicate.value, (actual, expected) => actual <= expected);
    default:
      return false;
  }
}

function isConditionPredicate(value: unknown): value is ConditionPredicate {
  return isPlainObject(value) && typeof value.field === "string" && typeof value.operator === "string";
}

function isConditionGroup(value: unknown): value is ConditionGroup {
  return isPlainObject(value) && (Array.isArray(value.allOf) || Array.isArray(value.anyOf) || value.not !== undefined);
}

export function evaluateConditionExpression(
  expression: ConditionExpression,
  answers: Record<string, unknown>,
  context: ConditionEvaluationContext = {}
): boolean {
  if (isConditionPredicate(expression)) {
    return evaluateConditionPredicate(expression, answers, context);
  }

  if (!isConditionGroup(expression)) {
    return false;
  }

  if (expression.allOf && !expression.allOf.every((item) => evaluateConditionExpression(item, answers, context))) {
    return false;
  }

  if (expression.anyOf && expression.anyOf.length > 0 && !expression.anyOf.some((item) => evaluateConditionExpression(item, answers, context))) {
    return false;
  }

  if (expression.not && evaluateConditionExpression(expression.not, answers, context)) {
    return false;
  }

  return true;
}

export function evaluateQuestionConditions(
  conditions: QuestionConditions | ConditionExpression | null | undefined,
  answers: Record<string, unknown>,
  context: ConditionEvaluationContext = {}
): boolean {
  if (!conditions) {
    return true;
  }

  if (isConditionPredicate(conditions) || isConditionGroup(conditions)) {
    return evaluateConditionExpression(conditions, answers, context);
  }

  const legacyConditions = conditions as QuestionConditions;
  const resolvedCaseType = resolveCaseType(answers, context.caseType ?? context.fallbackCaseType);
  const composedConditions: ConditionExpression[] = [];

  if (legacyConditions.requireIntake?.length) {
    composedConditions.push(
      ...legacyConditions.requireIntake.map((field: string) => ({ field, operator: "exists" as const }))
    );
  }

  if (legacyConditions.requireCaseTypes?.length) {
    composedConditions.push({
      field: "caseType",
      operator: "in",
      values: legacyConditions.requireCaseTypes,
    });

    if (!resolvedCaseType) {
      return false;
    }
  }

  if (legacyConditions.requireIntakeValues) {
    composedConditions.push(
      ...Object.entries(legacyConditions.requireIntakeValues).map(([field, value]: [string, unknown]) => ({
        field,
        operator: "equals" as const,
        value,
      }))
    );
  }

  if (legacyConditions.allOf?.length) {
    composedConditions.push({ allOf: legacyConditions.allOf });
  }

  if (legacyConditions.anyOf?.length) {
    composedConditions.push({ anyOf: legacyConditions.anyOf });
  }

  if (legacyConditions.not) {
    composedConditions.push({ not: legacyConditions.not });
  }

  if (composedConditions.length === 0) {
    return true;
  }

  return composedConditions.every((expression) => evaluateConditionExpression(expression, answers, context));
}

export function evaluateSkipIf(
  skipIf: SkipIfInput,
  answers: Record<string, unknown>,
  context: ConditionEvaluationContext = {}
): boolean {
  if (!skipIf) {
    return false;
  }

  if (Array.isArray(skipIf)) {
    return skipIf.some((condition) => evaluateConditionExpression(condition, answers, context));
  }

  return evaluateConditionExpression(skipIf, answers, context);
}
