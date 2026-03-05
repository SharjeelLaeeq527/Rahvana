import {
  createInterviewSessionDB,
  getInterviewSessionDB,
  updateInterviewSessionDB,
  saveInterviewAnswersDB,
  getSessionAnswersDB,
  saveInterviewResultsDB,
  getInterviewResultsDB,
} from "./data-access";
import {
  InterviewSession,
  InterviewSessionInput,
  InterviewPrepOutput,
  IntakeQuestionnaire,
  QuestionBank,
  GeneratedQuestion,
} from "./types";

import { readFile } from "fs/promises";
import path from "path";

// Implementation of QuestionSelectionEngine
interface QuestionCriteria {
  condition: (answers: Record<string, unknown>) => boolean;
  priority: "high" | "medium" | "low";
  reason: string;
}

class QuestionSelectionEngine {
  private questionnaire: IntakeQuestionnaire;
  private questionBank: QuestionBank;
  private criteriaMap: Map<string, QuestionCriteria>;

  constructor(questionnaire: IntakeQuestionnaire, questionBank: QuestionBank) {
    this.questionnaire = questionnaire;
    this.questionBank = questionBank;
    this.criteriaMap = new Map();

    // Initialized criteria based on actual questionnaire data
    this.initializeProductionCriteria();
  }

  //   Initialized criteria map for determining question applicability. Based on the actual 30-question intake questionnaire and 19-question bank
  private initializeProductionCriteria(): void {
    // Criteria for long-distance relationship questions
    this.criteriaMap.set("How do you communicate when you are apart?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["current_living_arrangement"] === "No – Living apart";
      },
      priority: "high",
      reason:
        "Long-distance relationships require more scrutiny on communication patterns",
    });

    // Criteria for previous marriage questions
    this.criteriaMap.set("Have you ever been married before?", {
      condition: (answers: Record<string, unknown>) => {
        const prevMarriage = answers["previous_marriages"] as string;
        return !!prevMarriage && prevMarriage !== "No";
      },
      priority: "high",
      reason: "Previous marriages require detailed background verification",
    });

    // Criteria for employment-related questions
    this.criteriaMap.set("Where does your spouse work?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["sponsor_employment"] &&
          (answers["sponsor_employment"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Employment verification is critical for sponsorship assessment",
    });

    // Criteria for financial questions
    this.criteriaMap.set("Do you share finances?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["joint_finances"] === true;
      },
      priority: "high",
      reason: "Financial interdependency demonstrates genuine relationship",
    });

    // Criteria for military/security background questions
    this.criteriaMap.set(
      "Have you ever worked in the military, defense, or law enforcement?",
      {
        condition: (answers: Record<string, unknown>) => {
          return answers["military_or_defense_background"] === true;
        },
        priority: "high",
        reason: "Security background requires additional verification",
      },
    );

    // Criteria for visa history questions
    this.criteriaMap.set("Have you ever been refused a US visa?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["previous_visa_refusal"] === true;
      },
      priority: "high",
      reason: "Visa refusal history requires detailed explanation",
    });

    // Criteria for US visit questions
    this.criteriaMap.set("Have you ever visited the United States?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["previous_us_visits"] === true;
      },
      priority: "medium",
      reason: "US visit history affects credibility assessment",
    });

    // Criteria for wedding-related questions
    this.criteriaMap.set("Tell me about your wedding.", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["wedding_attendees"] &&
          (answers["wedding_attendees"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Wedding details verify relationship authenticity",
    });

    // Criteria for meeting questions
    this.criteriaMap.set("How and where did you first meet your spouse?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["how_did_you_meet"] &&
          (answers["how_did_you_meet"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Meeting story establishes relationship foundation",
    });

    // Criteria for proposal questions
    this.criteriaMap.set("How and when did the proposal happen?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["proposal_details"] &&
          (answers["proposal_details"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Proposal story shows relationship progression",
    });

    // Criteria for family meeting questions
    this.criteriaMap.set("Have you met your spouse's family?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["met_spouse_family"] === true;
      },
      priority: "medium",
      reason: "Family integration shows relationship depth",
    });

    // Criteria for mutual friends questions
    this.criteriaMap.set("What holidays do you celebrate together?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["mutual_friends"] === true;
      },
      priority: "medium",
      reason: "Shared social circles demonstrate relationship integration",
    });

    // Criteria for daily activities questions
    this.criteriaMap.set("What do you do together as a couple?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["shared_activities"] &&
          (answers["shared_activities"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Shared activities show relationship routine",
    });

    // Criteria for future plans questions
    this.criteriaMap.set("Where will you live in the United States?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["intended_us_state"] &&
          (answers["intended_us_state"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Living arrangements verify post-immigration plans",
    });

    // Criteria for communication questions
    this.criteriaMap.set("How do you communicate when you are apart?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["daily_communication"] &&
          (answers["daily_communication"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Communication patterns prove ongoing relationship",
    });

    // Criteria for marriage decision questions
    this.criteriaMap.set("Why did you decide to get married?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["courtship_duration"] &&
          (answers["courtship_duration"] as string)?.toString().trim() !== ""
        );
      },
      priority: "high",
      reason: "Courtship duration supports marriage decision rationale",
    });

    // Criteria for family reaction questions
    this.criteriaMap.set("How did both families react to your marriage?", {
      condition: (answers: Record<string, unknown>) => {
        return (
          !!answers["family_reaction_to_marriage"] &&
          (answers["family_reaction_to_marriage"] as string)
            ?.toString()
            .trim() !== ""
        );
      },
      priority: "medium",
      reason: "Family acceptance indicates relationship stability",
    });

    // Criteria for age range questions
    this.criteriaMap.set("What is your age difference with your spouse?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["age_range"];
      },
      priority: "medium",
      reason: "Age difference may affect relationship dynamics",
    });

    // Criteria for education level questions
    this.criteriaMap.set("What is your educational background?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["highest_education"];
      },
      priority: "medium",
      reason: "Education level may influence relationship expectations",
    });

    // Criteria for household size questions
    this.criteriaMap.set("How will you be financially supported in the US?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["household_size"];
      },
      priority: "high",
      reason: "Household size affects financial support requirements",
    });

    // Criteria for petitioner status questions
    this.criteriaMap.set("What is your petitioner immigration status?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["petitioner_status"];
      },
      priority: "high",
      reason: "Petitioner status affects visa eligibility",
    });

    // Criteria for income level questions
    this.criteriaMap.set("How will you be financially supported in the US?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["petitioner_income_level"];
      },
      priority: "high",
      reason: "Income level affects financial support capability",
    });

    // Criteria for time together questions
    this.criteriaMap.set("How long have you been in a relationship?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["total_time_spent_together"];
      },
      priority: "high",
      reason: "Time spent together affects relationship authenticity",
    });

    // Criteria for communication frequency questions
    this.criteriaMap.set("How do you communicate with your spouse when apart?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["communication_frequency"];
      },
      priority: "high",
      reason: "Communication patterns show relationship maintenance",
    });

    // Criteria for marriage timing questions
    this.criteriaMap.set("When did you get married?", {
      condition: (answers: Record<string, unknown>) => {
        return !!answers["months_since_marriage"];
      },
      priority: "medium",
      reason: "Timing of marriage affects relationship timeline",
    });

    // Criteria for visa overstay history questions
    this.criteriaMap.set("Have you ever overstayed a visa in any country?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["visa_overstay_history"] === true;
      },
      priority: "high",
      reason: "Visa overstay history requires detailed explanation",
    });

    // Criteria for criminal history questions
    this.criteriaMap.set("Have you ever been arrested or charged with a crime?", {
      condition: (answers: Record<string, unknown>) => {
        return answers["criminal_history"] === true;
      },
      priority: "high",
      reason: "Criminal history requires detailed disclosure",
    });
  }

  //   Selects applicable questions based on user answers
  public selectQuestions(
    answers: Record<string, unknown>,
  ): GeneratedQuestion[] {
    const applicableQuestions: GeneratedQuestion[] = [];
    const answeredKeys = Object.keys(answers).filter(
      (key) =>
        answers[key] !== null &&
        answers[key] !== undefined &&
        answers[key] !== "" &&
        !(
          typeof answers[key] === "string" &&
          (answers[key] as string).trim() === ""
        ),
    );

    for (const questionEntry of this.questionBank.questions) {
      // Check if there's specific criteria for this question
      const criteria = this.criteriaMap.get(questionEntry.question);

      // By default, questions are not applicable unless they meet specific criteria
      let isApplicable = false;
      let priority: "high" | "medium" | "low" = "low";
      let reason = "Question not directly relevant to provided information";

      if (criteria) {
        isApplicable = criteria.condition(answers);
        priority = criteria.priority;
        reason = criteria.reason;
      }

      // Questions about answered topics should be higher priority
      const questionKeywords = this.extractKeywords(questionEntry.question);
      const hasRelevantAnswer = answeredKeys.some((key) =>
        questionKeywords.some(
          (keyword) =>
            key.toLowerCase().includes(keyword) ||
            keyword.includes(key.toLowerCase()),
        ),
      );

      if (hasRelevantAnswer && isApplicable) {
        priority = "high";
        reason = `Question directly relates to user-provided information`;
      }

      applicableQuestions.push({
        id: this.generateQuestionId(
          questionEntry.category,
          questionEntry.question,
        ),
        category: questionEntry.category,
        question: questionEntry.question,
        suggestedAnswer: questionEntry.suggestedAnswer,
        guidance: questionEntry.guidance,
        tooltip: questionEntry.tooltip,
        applicable: isApplicable,
        priority,
        reason,
      });
    }

    // Sort by priority (high, medium, then low)
    const sortedQuestions = applicableQuestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const stats = this.getSelectionStats(answers, sortedQuestions);

    return sortedQuestions;
  }

  // Extracts keywords from a question for matching with answer keys
  private extractKeywords(question: string): string[] {
    // Remove common question words and extract meaningful keywords
    const stopWords = [
      "do",
      "you",
      "your",
      "have",
      "been",
      "ever",
      "will",
      "where",
      "when",
      "how",
      "what",
      "tell",
      "me",
      "about",
      "the",
      "to",
      "in",
      "of",
      "and",
      "or",
      "is",
      "are",
      "was",
      "were",
    ];
    const words = question
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));

    return words;
  }

  // Generates a unique ID for a question
  private generateQuestionId(category: string, question: string): string {
    return `${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")}`;
  }

  // Adds a custom selection criterion
  public addCriterion(questionText: string, criteria: QuestionCriteria): void {
    this.criteriaMap.set(questionText, criteria);
  }

  // Gets statistics about question selection
  public getSelectionStats(
    answers: Record<string, unknown>,
    questions: GeneratedQuestion[],
  ): {
    total: number;
    applicable: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    answeredFields: number;
  } {
    const applicable = questions.filter((q) => q.applicable);

    const byPriority = {
      high: questions.filter((q) => q.priority === "high" && q.applicable)
        .length,
      medium: questions.filter((q) => q.priority === "medium" && q.applicable)
        .length,
      low: questions.filter((q) => q.priority === "low" && q.applicable).length,
    };

    const byCategory: Record<string, number> = {};
    applicable.forEach((q) => {
      byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    });

    const answeredFields = Object.keys(answers).filter(
      (key) =>
        answers[key] !== null &&
        answers[key] !== undefined &&
        answers[key] !== "" &&
        !(
          typeof answers[key] === "string" &&
          (answers[key] as string).trim() === ""
        ),
    ).length;

    return {
      total: questions.length,
      applicable: applicable.length,
      byPriority,
      byCategory,
      answeredFields,
    };
  }
}

// Implementation of AnswerGenerationEngine
class AnswerGenerationEngine {
  private questionBank: QuestionBank;

  constructor(questionBank: QuestionBank) {
    this.questionBank = questionBank;
  }

  // Generates personalized answers based on user inputs and question templates
  public generateAnswers(
    questions: GeneratedQuestion[],
    answersMap: Record<string, unknown>,
  ): GeneratedQuestion[] {
    return questions.map((question) => {
      // Only process templates for applicable questions
      if (!question.applicable) {
        return question;
      }

      // Process the suggested answer template by injecting user-specific data
      const personalizedAnswer = this.processTemplate(
        question.suggestedAnswer,
        answersMap,
      );

      // Process guidance to include case-specific context
      const personalizedGuidance = this.processTemplate(
        question.guidance,
        answersMap,
      );

      // Process tooltip to include case-specific context
      const personalizedTooltip = this.processTemplate(
        question.tooltip,
        answersMap,
      );

      // Enhance with case-specific context
      const enhancedQuestion = this.enhanceAnswerWithCaseContext(
        question,
        answersMap,
      );

      return {
        ...enhancedQuestion,
        suggestedAnswer: personalizedAnswer,
        guidance: personalizedGuidance,
        tooltip: personalizedTooltip,
      };
    });
  }

  // Processes a template string by replacing placeholders with actual values. Supports both simple and complex placeholder replacement
  private processTemplate(
    template: string,
    answersMap: Record<string, unknown>,
  ): string {
    if (!template) return template;

    let processedTemplate = template;

    // Find all placeholders in the template ({{placeholder_name}})
    const placeholderRegex = /{{(\w+)}}/g;
    let match;

    while ((match = placeholderRegex.exec(processedTemplate)) !== null) {
      const fullMatch = match[0]; // e.g., "{{beneficiary_country}}"
      const placeholderKey = match[1]; // e.g., "beneficiary_country"

      // Replace placeholder with actual value from answers map
      const value = answersMap[placeholderKey];

      if (value !== undefined && value !== null && value !== "") {
        // Handle different value types appropriately
        let replacement: string;

        if (typeof value === "object") {
          replacement = JSON.stringify(value);
        } else if (typeof value === "boolean") {
          replacement = value ? "Yes" : "No";
        } else {
          replacement = String(value);
          
          // Special handling for daily_communication "All of the above"
          if (placeholderKey === "daily_communication" && replacement === "All of the above") {
            replacement = "phone calls, video calls, and text messages";
          }
        }

        // Escape special regex characters in the replacement
        replacement = replacement.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

        // Replace all occurrences of the placeholder
        processedTemplate = processedTemplate
          .split(fullMatch)
          .join(replacement);
      } else {
        // If no value found, replace with a placeholder indicating missing info
        const replacement = `[${placeholderKey}]`;
        processedTemplate = processedTemplate
          .split(fullMatch)
          .join(replacement);
      }

      // Reset regex index to avoid infinite loops
      placeholderRegex.lastIndex = 0;
    }

    return processedTemplate;
  }

  // Adds additional context to answers based on case specifics
  public enhanceAnswerWithCaseContext(
    question: GeneratedQuestion,
    answersMap: Record<string, unknown>,
  ): GeneratedQuestion {
    // Add specific enhancements based on case characteristics
    const enhancedQuestion = { ...question };

    // Add more detailed guidance for complex cases
    if (this.isComplexCase(answersMap)) {
      enhancedQuestion.guidance +=
        " NOTE: This is a complex case due to multiple factors. Be prepared for detailed follow-up questions and provide consistent, truthful answers. Do not elaborate unnecessarily.\n";
    }

    // Adjust guidance based on case type
    if (this.isLongDistanceRelationship(answersMap)) {
      enhancedQuestion.guidance +=
        " NOTE: Since you are in a long-distance relationship, expect extra scrutiny on relationship authenticity. Be prepared to provide evidence of ongoing communication and commitment.\n";
      enhancedQuestion.tooltip +=
        " Officers often ask more detailed questions about long-distance relationships to verify authenticity.\n";
    }

    if (this.hasPreviousMarriage(answersMap)) {
      enhancedQuestion.guidance +=
        " NOTE: With previous marriages involved, be ready to discuss how you met your current spouse and why your previous relationships ended.\n";
    }

    if (this.hasVisaIssues(answersMap)) {
      enhancedQuestion.guidance +=
        " NOTE: With previous visa refusals, be prepared to explain the circumstances truthfully and how your situation has changed.\n";
    }

    // Add category-specific guidance
    switch (enhancedQuestion.category) {
      case "Basic Case Information":
        enhancedQuestion.guidance +=
          " Keep answers factual and consistent with your application.\n";
        break;
      case "Relationship Origin":
        enhancedQuestion.guidance +=
          " Be specific with dates, places, and details that show genuine knowledge of your spouse.\n";
        break;
      case "Family":
        enhancedQuestion.guidance +=
          " Demonstrate genuine knowledge of your spouse's family relationships.\n";
        break;
      case "Finances":
        enhancedQuestion.guidance +=
          " Be ready to discuss financial arrangements truthfully.\n";
        break;
      case "Future Plans":
        enhancedQuestion.guidance +=
          " Keep answers realistic and consistent with your application.\n";
        break;
      default:
        enhancedQuestion.guidance +=
          " Provide honest, straightforward answers without unnecessary elaboration.\n";
    }

    return enhancedQuestion;
  }

  // Determines if the case is complex based on answers
  private isComplexCase(answersMap: Record<string, unknown>): boolean {
    // A complex case might involve previous marriages, long-distance, visa issues, etc.
    return (
      this.hasPreviousMarriage(answersMap) ||
      this.isLongDistanceRelationship(answersMap) ||
      this.hasVisaIssues(answersMap) ||
      this.hasSecurityBackground(answersMap)
    );
  }

  // Determines if it's a long-distance relationship
  private isLongDistanceRelationship(
    answersMap: Record<string, unknown>,
  ): boolean {
    return answersMap["current_living_arrangement"] === "No – Living apart";
  }

  // Checks if there are previous marriages
  private hasPreviousMarriage(answersMap: Record<string, unknown>): boolean {
    const prevMarriage = answersMap["previous_marriages"] as string;
    return !!prevMarriage && prevMarriage !== "No";
  }

  // Checks if there are visa issues
  private hasVisaIssues(answersMap: Record<string, unknown>): boolean {
    return answersMap["previous_visa_refusal"] === true;
  }

  // Checks if there's security background
  private hasSecurityBackground(answersMap: Record<string, unknown>): boolean {
    return answersMap["military_or_defense_background"] === true;
  }
}

// Async function to load data
async function loadData(): Promise<{
  questionnaire: IntakeQuestionnaire;
  questionBank: QuestionBank;
}> {
  // Load the JSON files using fs/promises
  const questionnaireResponse = path.join(
    process.cwd(),
    "data",
    "interview-intake-questionnaire.json",
  );
  const questionnaireData = JSON.parse(
    await readFile(questionnaireResponse, "utf-8"),
  );

  const questionBankResponse = path.join(
    process.cwd(),
    "data",
    "interview-question-bank.json",
  );
  const questionBankData = JSON.parse(
    await readFile(questionBankResponse, "utf-8"),
  );

  return {
    questionnaire: questionnaireData as IntakeQuestionnaire,
    questionBank: questionBankData as QuestionBank,
  };
}

// Creates a new interview prep session
export async function createInterviewSession(
  sessionData: Omit<InterviewSessionInput, "user_id">,
): Promise<InterviewSession> {
  return await createInterviewSessionDB(sessionData);
}

// Retrieves an interview prep session with its answers and output
export async function getInterviewSession(
  sessionId: string,
): Promise<InterviewSession | null> {
  const session = await getInterviewSessionDB(sessionId);
  if (!session) return null;

  const answers = await getSessionAnswersDB(sessionId);
  const results = await getInterviewResultsDB(sessionId);
  
  return {
    ...session,
    answers,
    output: results?.generated_questions || null,
  } as InterviewSession;
}

// Updates answers for an interview prep session
export async function updateInterviewSessionAnswers(
  sessionId: string,
  answers: Record<string, unknown>,
): Promise<InterviewSession> {
  // Validate session exists
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  // Prepare answers for saving
  const answersArray = Object.entries(answers).map(
    ([questionKey, answerValue]) => ({
      question_key: questionKey,
      answer_value: answerValue,
    }),
  );

  // Save answers to DB
  await saveInterviewAnswersDB(sessionId, answersArray);

  // Return updated session
  return (await getInterviewSession(sessionId)) as InterviewSession;
}

// Generates personalized interview prep questions based on user inputs
export async function generateInterviewPrepOutput(
  sessionId: string,
): Promise<InterviewPrepOutput> {
  // Get session and answers
  const session = await getInterviewSessionDB(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const answers = await getSessionAnswersDB(sessionId);

  // Load questionnaire and question bank
  const { questionnaire, questionBank } = await loadData();

  // Map answers to a key-value object
  const answersMap: Record<string, unknown> = {};
  answers.forEach((answer) => {
    answersMap[answer.question_key] = answer.answer_value;
  });

  // Use question selection engine to determine relevant questions
  const questionSelectionEngine = new QuestionSelectionEngine(
    questionnaire,
    questionBank,
  );
  const applicableQuestions =
    questionSelectionEngine.selectQuestions(answersMap);

  // Use answer generation engine to personalize answers
  const answerGenerationEngine = new AnswerGenerationEngine(questionBank);
  const generatedQuestions = answerGenerationEngine.generateAnswers(
    applicableQuestions,
    answersMap,
  );

  // Save results to DB
  await saveInterviewResultsDB(sessionId, generatedQuestions);

  // Prepare output
  const output: InterviewPrepOutput = {
    sessionId,
    questions: generatedQuestions,
    summary: {
      totalQuestions: questionBank.questions.length,
      applicableQuestions: generatedQuestions.filter(
        (q: GeneratedQuestion) => q.applicable,
      ).length,
      categories: Array.from(
        new Set(
          generatedQuestions.map(
            (q: GeneratedQuestion) => q.category as string,
          ),
        ),
      ),
    },
  };

  return output;
}

// Marks an interview session as completed
export async function completeInterviewSession(
  sessionId: string,
): Promise<InterviewSession> {
  const updatedSession = await updateInterviewSessionDB(sessionId, {
    completed: true,
  });
  return updatedSession;
}

// Gets the generated interview prep output for a session
export async function getInterviewPrepOutput(
  sessionId: string,
): Promise<InterviewPrepOutput | null> {
  const results = await getInterviewResultsDB(sessionId);
  if (!results) return null;

  return {
    sessionId,
    questions: results.generated_questions as GeneratedQuestion[],
    summary: {
      totalQuestions: (results.generated_questions as GeneratedQuestion[]).length,
      applicableQuestions: (results.generated_questions as GeneratedQuestion[]).filter(
        (q: GeneratedQuestion) => q.applicable,
      ).length,
      categories: Array.from(
        new Set(
          (results.generated_questions as GeneratedQuestion[]).map(
            (q: GeneratedQuestion) => q.category as string,
          ),
        ),
      ),
    },
  };
}