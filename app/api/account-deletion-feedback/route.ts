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

const VALID_FOLLOW_UP_OPTIONS: Record<
  Exclude<DeletionReason, "other">,
  Record<string, string[]>
> = {
  journey_completed: {
    journey_stage: [
      "visa_received",
      "immigration_process_completed",
      "no_longer_need_assistance",
      "other",
    ],
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

  missing_features: {
    feature_needed: [
      "better_journey_tracking",
      "more_visa_categories",
      "document_assistance",
      "case_status_tracking",
      "notifications_reminders",
      "more_personalized_guidance",
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
      "community_social_media",
      "personal_research",
      "someone_helping_directly",
      "other",
    ],
  },
};

function isValidReason(value: unknown): value is DeletionReason {
  return typeof value === "string" && VALID_REASONS.includes(value as DeletionReason);
}

const FOLLOW_UP_ANSWER_KEYS: Record<
  Exclude<DeletionReason, "other">,
  string
> = {
  journey_completed: "journey_stage",
  couldnt_find_needed: "information_needed",
  missing_features: "feature_needed",
  technical_problem: "problem_type",
  privacy_security_concern: "concern_type",
  found_alternative: "alternative_type",
};

const OPTIONAL_TEXT_KEYS: Partial<
  Record<Exclude<DeletionReason, "other">, string>
> = {
  technical_problem: "what_were_you_trying_to_do",
  found_alternative: "additional_context",
};

function validateFollowUpAnswers(
  reason: DeletionReason,
  answers: unknown
): boolean {
  // "Other" does not have a structured follow-up question.
  if (reason === "other") {
    if (answers === undefined || answers === null) {
      return true;
    }

    return typeof answers === "object" && !Array.isArray(answers);
  }

  // All other reasons require a follow-up answer.
  if (
    answers === undefined ||
    answers === null ||
    typeof answers !== "object" ||
    Array.isArray(answers)
  ) {
    return false;
  }

  const followUpAnswers = answers as Record<string, unknown>;

  const answerKey = FOLLOW_UP_ANSWER_KEYS[reason];
  const answer = followUpAnswers[answerKey];

  // Required dropdown answer.
  if (typeof answer !== "string" || !answer.trim()) {
    return false;
  }

  // Must be one of the configured options.
  const allowedOptions = VALID_FOLLOW_UP_OPTIONS[reason][answerKey];

  if (!allowedOptions?.includes(answer)) {
    return false;
  }

  // Optional text follow-up.
  const optionalTextKey = OPTIONAL_TEXT_KEYS[reason];

  if (optionalTextKey) {
    const optionalText = followUpAnswers[optionalTextKey];

    if (
      optionalText !== undefined &&
      optionalText !== null &&
      typeof optionalText !== "string"
    ) {
      return false;
    }

    if (
      typeof optionalText === "string" &&
      optionalText.length > 1000
    ) {
      return false;
    }
  }

  // Reject unexpected keys.
  const allowedKeys = new Set([
    answerKey,
    ...(optionalTextKey ? [optionalTextKey] : []),
  ]);

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await request.json();

    const { reason, follow_up_answers, additional_comments } = body;

    // Validate reason
    if (!isValidReason(reason)) {
      return NextResponse.json(
        {
          error: "Please select a valid reason for deleting your account.",
        },
        { status: 400 }
      );
    }

    // Validate follow-up answers
    if (!validateFollowUpAnswers(reason, follow_up_answers)) {
      return NextResponse.json(
        {
          error: "Invalid follow-up response.",
        },
        { status: 400 }
      );
    }

    // Validate optional comments
    if (
      additional_comments !== undefined &&
      additional_comments !== null &&
      typeof additional_comments !== "string"
    ) {
      return NextResponse.json({ error: "Invalid additional comments." }, { status: 400 });
    }

    // Prevent excessively large comments
    if (typeof additional_comments === "string" && additional_comments.length > 1000) {
      return NextResponse.json(
        {
          error: "Additional comments cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    const cleanedComments =
      typeof additional_comments === "string" ? additional_comments.trim() : "";

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

    const { error: insertError } = await supabase.from("account_deletion_feedback").insert({
      user_id: user.id,
      reason,
      follow_up_answers: cleanedFollowUpAnswers,
      additional_comments: cleanedComments || null,
    });

    if (insertError) {
      console.error("[account-deletion-feedback] Insert error:", insertError);

      return NextResponse.json(
        { error: "Failed to save account deletion feedback." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account-deletion-feedback] Unexpected error:", err);

    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
