import { describe, expect, it } from "@jest/globals";
import {
  DynamicQuestionSelectionEngine,
} from "@/lib/interview-prep/question-selection-engine";
import {
  evaluateQuestionConditions,
  evaluateSkipIf,
} from "@/lib/interview-prep/condition-evaluator";
import type { RulesConfig } from "@/lib/interview-prep/rules-loader";
import type { InterviewQuestion } from "@/data/interview-categories/schema";

const rules: RulesConfig = {
  categorySlug: "ir-5-parent",
  version: "test",
  questionSelectionRules: [
    {
      id: "active-parent-category",
      name: "Active parent category",
      description: "Marks the parent category as active for the test answers.",
      condition: {
        type: "AND",
        conditions: [{ field: "caseType", operator: "equals", value: "parent" }],
      },
      actions: {
        includeCategories: ["Family & Marital History"],
        priorityBoost: ["high"],
        reason: "Parent category is active",
      },
    },
  ],
};

const questionBank: InterviewQuestion[] = [
  {
    id: "q-1",
    category: "Family & Marital History",
    question: "Always ask this",
    sampleAnswer: "Always included.",
    guidance: "Guidance",
    tooltip: "Tooltip",
    priority: "high",
    mockInterviewOrder: 10,
    variations: [],
    conditions: {
      requireIntake: ["parent_relationship_type"],
      requireCaseTypes: ["parent"],
    },
  },
  {
    id: "q-2",
    category: "Family & Marital History",
    question: "Only ask when a value is true",
    sampleAnswer: "Conditional.",
    guidance: "Guidance",
    tooltip: "Tooltip",
    priority: "high",
    mockInterviewOrder: 20,
    variations: [],
    conditions: {
      requireIntake: ["foreign_residence_history"],
      requireIntakeValues: {
        foreign_residence_history: true,
      },
    },
  },
  {
    id: "q-3",
    category: "Family & Marital History",
    question: "No conditions question",
    sampleAnswer: "Always included.",
    guidance: "Guidance",
    tooltip: "Tooltip",
    priority: "high",
    mockInterviewOrder: 5,
    variations: [],
  },
  {
    id: "q-4",
    category: "Family & Marital History",
    question: "Skipped for retired applicants",
    sampleAnswer: "Skip me.",
    guidance: "Guidance",
    tooltip: "Tooltip",
    priority: "high",
    mockInterviewOrder: 15,
    variations: [],
    skipIf: {
      field: "parent_employment_status",
      operator: "in",
      values: ["Retired"],
    },
  },
];

describe("condition evaluator", () => {
  it("supports legacy question conditions and resolved case type fallback", () => {
    const answers = {
      parent_relationship_type: "Stepparent",
    };

    expect(
      evaluateQuestionConditions(
        {
          requireIntake: ["parent_relationship_type"],
          requireCaseTypes: ["parent"],
        },
        answers,
        { fallbackCaseType: "parent" }
      )
    ).toBe(true);
  });

  it("supports richer anyOf / not logic on question conditions", () => {
    const answers = {
      civil_record_issue: "Late-Registered Birth Record",
      parent_employment_status: "Retired",
      foreign_residence_history: false,
    };

    expect(
      evaluateQuestionConditions(
        {
          anyOf: [
            { field: "civil_record_issue", operator: "equals", value: "Late-Registered Birth Record" },
            { field: "parent_employment_status", operator: "equals", value: "Not Currently Employed" },
          ],
          not: { field: "foreign_residence_history", operator: "equals", value: true },
        },
        answers,
        { fallbackCaseType: "parent" }
      )
    ).toBe(true);
  });

  it("treats boolean false as a populated intake answer", () => {
    expect(
      evaluateQuestionConditions(
        {
          requireIntake: ["military_service"],
          requireCaseTypes: ["parent"],
        },
        {
          military_service: false,
          caseType: "parent",
        },
        { fallbackCaseType: "parent" }
      )
    ).toBe(true);
  });

  it("supports OR skipIf arrays and richer operators", () => {
    const answers = {
      parent_employment_status: "Retired",
      civil_record_issue: "Late-Registered Birth Record",
    };

    expect(
      evaluateSkipIf(
        [
          { field: "parent_employment_status", operator: "notIn", values: ["Retired"] },
          { field: "civil_record_issue", operator: "equals", value: "Late-Registered Birth Record" },
        ],
        answers,
        { fallbackCaseType: "parent" }
      )
    ).toBe(true);
  });
});

describe("DynamicQuestionSelectionEngine", () => {
  it("filters questions at question level before applying category rules", () => {
    const engine = new DynamicQuestionSelectionEngine("ir-5-parent", rules);
    const selected = engine.selectQuestions(
      {
        parent_relationship_type: "Stepparent",
        foreign_residence_history: false,
        parent_employment_status: "Retired",
      },
      questionBank
    );

    expect(selected.map((question) => question.id)).toEqual(["q-3", "q-1"]);
  });

  it("uses fallback case type from the category slug when the answer map has no caseType", () => {
    const engine = new DynamicQuestionSelectionEngine("ir-5-parent", rules);
    const selected = engine.selectQuestions(
      {
        parent_relationship_type: "Stepparent",
        foreign_residence_history: true,
        parent_employment_status: "Retired",
      },
      questionBank
    );

    expect(selected.map((question) => question.id)).toContain("q-2");
  });
});
