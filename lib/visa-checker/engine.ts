import { 
  CategoryRules, 
  Rule, 
  Condition, 
  Action, 
  ComputedFact 
} from "./engine-types";
import { RiskLevel } from "./types";
export interface RiskFlagResponse {
  flagCode: string;
  severity: RiskSeverity;
  pointsDeducted: number;
  pointsAdded?: number;
  explanation: string;
  improvementSuggestions: string;
}

export class ScoringEngine {
  private categoryRules: CategoryRules;

  constructor(rules: CategoryRules) {
    this.categoryRules = rules;
  }

  /**
   * Main entry point for scoring a set of answers
   */
  public async evaluate(answers: Record<string, unknown>): Promise<ScoringResultsResponse> {
    const computedAnswers = this.computeFacts(answers);
    const riskFlags: RiskFlagResponse[] = [];
    let totalDeductions = 0;
    let totalBonuses = 0;

    for (const rule of this.categoryRules.rules) {
      if (this.evaluateRule(rule, computedAnswers)) {
        const flag = this.applyAction(rule.action, rule);
        if (flag) {
          riskFlags.push(flag);
          totalDeductions += flag.pointsDeducted || 0;
          totalBonuses += flag.pointsAdded || 0;
        }
      }
    }

    const rawScore = this.categoryRules.baseScore - totalDeductions + totalBonuses;
    const overallScore = Math.min(99.99, Math.max(0, rawScore));
    const riskLevel = this.determineRiskLevel(overallScore);

    return {
      sessionId: "", // To be filled by caller
      overallScore,
      riskLevel,
      totalPossiblePoints: this.categoryRules.baseScore,
      totalDeductedPoints: totalDeductions,
      riskFlags,
      summaryReasons: riskFlags.map(f => f.explanation),
      improvementSuggestions: riskFlags.map(f => f.improvementSuggestions).filter(Boolean) as string[],
    };
  }

  /**
   * Computes dynamic facts (e.g., poverty thresholds, income ratios)
   * Note: This is currently a simplified implementation. In a real environment,
   * we would use an expression evaluator.
   */
  private computeFacts(answers: Record<string, unknown>): Record<string, unknown> {
    const computed = { ...answers };
    const now = new Date();

    // Helper for months diff
    const monthDiff = (d1: Date, d2: Date) => {
      let months = (d1.getFullYear() - d2.getFullYear()) * 12;
      months -= d2.getMonth();
      months += d1.getMonth();
      return Math.max(0, months);
    };

    // Helper for age gap
    const calculateAge = (dob: Date) => {
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
      return age;
    };

    if (answers.marriage_date) {
      computed.marriageMonths = monthDiff(now, new Date(String(answers.marriage_date)));
    }
    if (answers.relationship_start_date) {
      computed.relationshipMonths = monthDiff(now, new Date(String(answers.relationship_start_date)));
    }
    if (answers.sponsor_dob && answers.beneficiary_dob) {
      const sAge = calculateAge(new Date(String(answers.sponsor_dob)));
      const bAge = calculateAge(new Date(String(answers.beneficiary_dob)));
      computed.ageGap = Math.abs(sAge - bAge);
    }

    // Process computed facts from config
    for (const fact of this.categoryRules.computedFacts) {
      if (fact.id === "povertyThreshold") {
        const hhSize = Number(answers.household_size) || 2;
        computed[fact.id] = 15960 + 5680 * Math.max(0, hhSize - 1);
      } else if (fact.id === "incomeRatio") {
        const income = Number(answers.sponsor_annual_income) || 0;
        const threshold = Number(computed.povertyThreshold) || 1;
        computed[fact.id] = income / threshold;
      } else if (fact.id === "isMilitary") {
        computed[fact.id] = answers.industry_sector === 'Military/Defense' || answers.prior_military_service === true;
      }
    }

    return computed;
  }

  private evaluateRule(rule: Rule, answers: Record<string, unknown>): boolean {
    const applicableConditions = rule.conditions.filter(condition => {
      if (!condition.when) return true;
      return this.evaluateExpression(condition.when, answers);
    });

    if (applicableConditions.length === 0) return false;

    // Rule matches if ALL applicable conditions are met
    return applicableConditions.every(condition => this.evaluateCondition(condition, answers));
  }

  private evaluateCondition(condition: Condition, answers: Record<string, unknown>): boolean {
    const value = answers[condition.fact];
    const target = condition.value;

    let normalizedValue = value;
    if (normalizedValue === undefined || normalizedValue === null || normalizedValue === "") {
      if (typeof target === "boolean") {
        normalizedValue = false;
      }
    }

    switch (condition.operator) {
      case "equals":
        return String(normalizedValue) === String(target);
      case "notEquals":
        return String(normalizedValue) !== String(target);
      case "greaterThan":
        return Number(normalizedValue) > Number(target);
      case "lessThan":
        return Number(normalizedValue) < Number(target);
      case "contains":
        return String(normalizedValue).toLowerCase().includes(String(target).toLowerCase());
      case "exists":
        return normalizedValue !== undefined && normalizedValue !== null && normalizedValue !== "";
      case "notExists":
        return normalizedValue === undefined || normalizedValue === null || normalizedValue === "";
      default:
        return false;
    }
  }

  /**
   * Extremely basic expression evaluator for 'when' clauses.
   * Supports: 'prop == true', 'prop == false', 'prop != val', 'prop == val'
   */
  private evaluateExpression(expression: string, answers: Record<string, unknown>): boolean {
    const parts = expression.trim().split(/\s+/);
    if (parts.length === 1) {
      // Just a property check (e.g., 'isMilitary')
      return !!answers[parts[0]];
    }

    if (parts.length === 3) {
      const [prop, op, val] = parts;
      const left = answers[prop];
      
      let right: unknown = val;
      if (val === "true") right = true;
      else if (val === "false") right = false;
      else if (val === "null") right = null;
      else if (!isNaN(Number(val))) right = Number(val);

      let leftValue = left;
      if (leftValue === undefined || leftValue === null || leftValue === "") {
        if (typeof right === "boolean") {
          leftValue = false;
        }
      }

      switch (op) {
        case "==": return String(leftValue) === String(right);
        case "!=": return String(leftValue) !== String(right);
        case ">": return Number(leftValue) > Number(right);
        case "<": return Number(leftValue) < Number(right);
        case ">=": return Number(leftValue) >= Number(right);
        case "<=": return Number(leftValue) <= Number(right);
      }
    }

    return false;
  }

  private applyAction(action: Action, rule: Rule): RiskFlagResponse | null {
    if (action.type === "addFlag") {
      const pointsAdded = action.pointsAdded || 0;
      const pointsDeducted = action.pointsDeducted || 0;
      
      return {
        flagCode: action.flagCode || rule.id.toUpperCase(),
        severity: action.severity || "LOW",
        pointsDeducted,
        pointsAdded,
        explanation: action.explanation || rule.description || `Detected risk: ${action.flagCode}`,
        improvementSuggestions: action.improvementSuggestions || `Address issues related to ${action.flagCode}`,
      };
    }
    return null;
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return "STRONG";
    if (score >= 60) return "MODERATE";
    return "WEAK";
  }
}
