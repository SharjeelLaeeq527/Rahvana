import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

const VALID_REASONS = [
  "journey_completed",
  "couldnt_find_needed",
  "missing_features",
  "technical_problem",
  "privacy_security_concern",
  "found_alternative",
  "other",
] as const;

type DeletionReason = (typeof VALID_REASONS)[number];

/**
 * Structured dropdown options.
 *
 * `missing_features` is intentionally excluded because it uses
 * a required text-only follow-up question.
 *
 * `other` is also excluded because it has no follow-up question.
 */
const VALID_FOLLOW_UP_OPTIONS: Record<
  Exclude<DeletionReason, "other" | "missing_features">,
  Record<string, string[]>
> = {
  journey_completed: {
    journey_stage: ["visa_approved", "visa_denied", "visa_refused", "other"],
  },

  couldnt_find_needed: {
    information_needed: [
      "journey_guidance",
      "visa_information",
      "document_checklists",
      "forms_assistance",
      "case_status_information",
      "other",
    ],
  },

  technical_problem: {
    problem_type: [
      "something_didnt_work",
      "encountered_error",
      "page_too_slow",
      "couldnt_complete_action",
      "information_not_displaying",
      "other",
    ],
  },

  privacy_security_concern: {
    concern_type: [
      "personal_information_storage",
      "document_handling",
      "account_security",
      "data_sharing",
      "uncomfortable_providing_information",
      "other",
    ],
  },

  found_alternative: {
    alternative_type: [
      "immigration_attorney",
      "another_immigration_platform",
      "government_official_resources",
      "family_friends_or_helper",
      "personal_research",
      "other",
    ],
  },
};

function isValidReason(value: unknown): value is DeletionReason {
  return typeof value === "string" && VALID_REASONS.includes(value as DeletionReason);
}

// Required dropdown answer key for each reason that has a structured follow-up question.
const FOLLOW_UP_ANSWER_KEYS: Record<
  Exclude<DeletionReason, "other" | "missing_features">,
  string
> = {
  journey_completed: "journey_stage",
  couldnt_find_needed: "information_needed",
  technical_problem: "problem_type",
  privacy_security_concern: "concern_type",
  found_alternative: "alternative_type",
};

// Required text-only follow-up fields.
const REQUIRED_TEXT_KEYS: Partial<Record<DeletionReason, string>> = {
  missing_features: "feature_needed_details",
};

// Optional text fields that can accompany structured dropdown follow-up questions.
const OPTIONAL_TEXT_KEYS: Partial<Record<Exclude<DeletionReason, "other">, string>> = {
  technical_problem: "what_were_you_trying_to_do",
  found_alternative: "additional_context",
};

// Maximum length for all free-text survey responses.
const MAX_TEXT_LENGTH = 1000;

/**
 * Validates the follow-up answers according to the selected
 * deletion reason.
 *
 * Rules:
 *
 * - other:
 *   No structured follow-up is required.
 *
 * - missing_features:
 *   Requires `feature_needed_details` as non-empty text.
 *
 * - all other reasons:
 *   Require the appropriate dropdown answer.
 *   Some reasons may additionally contain optional text.
 *
 * - Unexpected keys are rejected.
 */
function validateFollowUpAnswers(reason: DeletionReason, answers: unknown): boolean {
  /**
   * OTHER
   *
   * There is no follow-up question for "Other".
   * The frontend normally sends `{}`, but null/undefined
   * are also accepted.
   */
  if (reason === "other") {
    if (answers === undefined || answers === null) {
      return true;
    }

    return typeof answers === "object" && !Array.isArray(answers);
  }

  // All remaining reasons must provide an object.
  if (
    answers === undefined ||
    answers === null ||
    typeof answers !== "object" ||
    Array.isArray(answers)
  ) {
    return false;
  }

  const followUpAnswers = answers as Record<string, unknown>;

  /**
   * MISSING FEATURES
   *
   * Text-only follow-up.
   */
  if (reason === "missing_features") {
    const requiredTextKey = REQUIRED_TEXT_KEYS[reason];

    if (!requiredTextKey) {
      return false;
    }

    const textValue = followUpAnswers[requiredTextKey];

    if (typeof textValue !== "string" || !textValue.trim()) {
      return false;
    }

    if (textValue.length > MAX_TEXT_LENGTH) {
      return false;
    }

    // Only feature_needed_details is allowed for this reason.
    for (const key of Object.keys(followUpAnswers)) {
      if (key !== requiredTextKey) {
        return false;
      }
    }

    return true;
  }

  // All other non-"other" reasons have a required dropdown answer.
  const answerKey = FOLLOW_UP_ANSWER_KEYS[reason];

  if (!answerKey) {
    return false;
  }

  const answer = followUpAnswers[answerKey];

  // Dropdown answer must be a non-empty string.
  if (typeof answer !== "string" || !answer.trim()) {
    return false;
  }

  // Dropdown answer must be one of the configured options.
  const allowedOptions = VALID_FOLLOW_UP_OPTIONS[reason][answerKey];

  if (!allowedOptions?.includes(answer)) {
    return false;
  }

  // Validate optional text field if this reason supports one.
  const optionalTextKey = OPTIONAL_TEXT_KEYS[reason];

  if (optionalTextKey) {
    const optionalText = followUpAnswers[optionalTextKey];

    if (optionalText !== undefined && optionalText !== null && typeof optionalText !== "string") {
      return false;
    }

    if (typeof optionalText === "string" && optionalText.length > MAX_TEXT_LENGTH) {
      return false;
    }
  }

  // Reject unexpected keys.
  const allowedKeys = new Set([answerKey, ...(optionalTextKey ? [optionalTextKey] : [])]);

  for (const key of Object.keys(followUpAnswers)) {
    if (!allowedKeys.has(key)) {
      return false;
    }
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate the user.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    // Parse request body.
    const body = await request.json();

    const { reason, follow_up_answers, additional_comments } = body;

    // Validate deletion reason.
    if (!isValidReason(reason)) {
      return NextResponse.json(
        {
          error: "Please select a valid reason for deleting your account.",
        },
        { status: 400 }
      );
    }

    // Validate follow-up answers.
    if (!validateFollowUpAnswers(reason, follow_up_answers)) {
      return NextResponse.json(
        {
          error: "Invalid follow-up response.",
        },
        { status: 400 }
      );
    }

    // Validate optional additional comments.
    if (
      additional_comments !== undefined &&
      additional_comments !== null &&
      typeof additional_comments !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Invalid additional comments.",
        },
        { status: 400 }
      );
    }

    // Prevent excessively large comments.
    if (typeof additional_comments === "string" && additional_comments.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: "Additional comments cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    // Clean additional comments.
    const cleanedComments =
      typeof additional_comments === "string" ? additional_comments.trim() : "";

    // Clean follow-up answers.
    //
    // All string values are trimmed before storage.
    const cleanedFollowUpAnswers =
      follow_up_answers &&
      typeof follow_up_answers === "object" &&
      !Array.isArray(follow_up_answers)
        ? Object.fromEntries(
            Object.entries(follow_up_answers).map(([key, value]) => [
              key,
              typeof value === "string" ? value.trim() : value,
            ])
          )
        : {};

    /**
     * Save feedback.
     *
     * `user_id` should remain nullable in the database so the
     * feedback survives account deletion via ON DELETE SET NULL.
     */
    const { error: insertError } = await supabase.from("account_deletion_feedback").insert({
      user_id: user.id,
      reason,
      follow_up_answers: cleanedFollowUpAnswers,
      additional_comments: cleanedComments || null,
    });

    if (insertError) {
      console.error("[account-deletion-feedback] Insert error:", insertError);

      return NextResponse.json(
        {
          error: "Failed to save account deletion feedback.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("[account-deletion-feedback] Unexpected error:", err);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}
