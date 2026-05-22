/**
 * Analytics Engine for Mock Interview Sessions
 *
 * Single source of truth for all session analytics.
 * Enforces PRD constraints:
 * - Context-aware evaluation
 * - No false positives in feedback
 * - Canonical data model
 */

export type SessionEndReason = "completed" | "aborted_focus" | "aborted_manual" | "aborted_time";

export interface SessionEvent {
  id: string;
  type: "question" | "opening" | "closing";
  questionId?: string;
  transcript: string;
  durationSeconds: number;
  skipped: boolean;
  timestamp: number;
}

export interface InterviewSession {
  sessionId: string;
  events: SessionEvent[];
  focusWarnings: number;
  sessionEndReason: SessionEndReason;
  startedAt: number;
  endedAt: number;
}

export interface SessionMetrics {
  totalQuestions: number;
  attemptedQuestions: number;
  skippedQuestions: number;
  completionRate: number;
  avgResponseTime: number;
  responseVariance: number;
  focusWarningsCount: number;
  isFullSession: boolean;
  isStatisticallyValid: boolean;
}

export interface SessionInsights {
  strengths: string[];
  improvements: string[];
  nextFocus: string[];
  snapshot: string;
}

export interface SessionReport {
  sessionEndReason: SessionEndReason;
  metrics: SessionMetrics;
  insights: SessionInsights;
  validity: {
    isFullSession: boolean;
    isStatisticallyValid: boolean;
  };
}

const MIN_VALID_TRANSCRIPT_LENGTH = 3; // eslint-disable-line @typescript-eslint/no-unused-vars
const MIN_QUESTIONS_FOR_PARTIAL_EVAL = 8;

/**
 * Compute metrics from canonical session log
 */
export function computeSessionMetrics(
  session: InterviewSession,
  totalQuestionsAvailable: number
): SessionMetrics {
  const questionEvents = session.events.filter((e) => e.type === "question");

  const attemptedQuestions = questionEvents.length;
  const skippedQuestions = questionEvents.filter((e) => e.skipped).length;
  const answeredQuestions = attemptedQuestions - skippedQuestions;

  // Only compute completion rate for COMPLETED sessions
  const completionRate =
    session.sessionEndReason === "completed"
      ? totalQuestionsAvailable > 0
        ? (answeredQuestions / totalQuestionsAvailable) * 100
        : 0
      : 0;

  // Compute avg/variance only from non-skipped questions
  const validDurations = questionEvents.filter((e) => !e.skipped).map((e) => e.durationSeconds);

  const avgResponseTime =
    validDurations.length > 0
      ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
      : 0;

  const responseVariance =
    validDurations.length > 1
      ? Math.sqrt(
          validDurations.reduce((sum, d) => sum + Math.pow(d - avgResponseTime, 2), 0) /
            validDurations.length
        )
      : 0;

  // Validity checks
  const isFullSession = session.sessionEndReason === "completed";
  const isStatisticallyValid =
    isFullSession || attemptedQuestions >= MIN_QUESTIONS_FOR_PARTIAL_EVAL;

  return {
    totalQuestions: totalQuestionsAvailable,
    attemptedQuestions,
    skippedQuestions,
    completionRate,
    avgResponseTime,
    responseVariance,
    focusWarningsCount: session.focusWarnings,
    isFullSession,
    isStatisticallyValid,
  };
}

/**
 * Generate context-aware insights
 *
 * CRITICAL: Feedback rules MUST respect session end reason
 */
export function generateSessionInsights(
  session: InterviewSession,
  metrics: SessionMetrics
): SessionInsights {
  const questionEvents = session.events.filter((e) => e.type === "question");

  // ═══════════════════════════════════════════════════════════════
  // SESSION SNAPSHOT (context-aware)
  // ═══════════════════════════════════════════════════════════════

  let snapshot = "";

  switch (session.sessionEndReason) {
    case "completed":
      {
        const rate = Math.round(metrics.completionRate);
        if (rate >= 90) {
          snapshot = `You completed ${metrics.attemptedQuestions} of ${metrics.totalQuestions} questions with excellent participation. `;
        } else if (rate >= 70) {
          snapshot = `You completed ${metrics.attemptedQuestions} of ${metrics.totalQuestions} questions with strong engagement. `;
        } else if (rate >= 50) {
          snapshot = `You completed ${metrics.attemptedQuestions} of ${metrics.totalQuestions} questions. `;
        } else {
          snapshot = `You attempted ${metrics.attemptedQuestions} of ${metrics.totalQuestions} questions. `;
        }

        if (metrics.focusWarningsCount === 0) {
          snapshot += "Your focus remained strong throughout the session.";
        } else if (metrics.focusWarningsCount === 1) {
          snapshot += "You stayed focused for most of the session, with one brief attention lapse.";
        } else {
          snapshot += `You had ${metrics.focusWarningsCount} focus warnings—concentration dipped at times.`;
        }
      }
      break;

    case "aborted_focus":
      snapshot = `Session ended early due to ${metrics.focusWarningsCount} focus violations. You attempted ${metrics.attemptedQuestions} questions before the session terminated. Focus issues must be resolved before your next attempt.`;
      break;

    case "aborted_manual":
      snapshot = `You manually exited the interview after attempting ${metrics.attemptedQuestions} of ${metrics.totalQuestions} questions. Returning to a complete session can help you build interview stamina.`;
      break;

    case "aborted_time":
      snapshot = `Session ended due to time limit. You completed ${metrics.attemptedQuestions} of ${metrics.totalQuestions} questions. Work on answer brevity to cover more ground in future sessions.`;
      break;
  }

  // ═══════════════════════════════════════════════════════════════
  // STRENGTHS (only for valid sessions)
  // ═══════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (!metrics.isStatisticallyValid) {
    // Insufficient data for full evaluation
    strengths.push("Initiated a mock interview session");
  } else if (session.sessionEndReason === "completed") {
    // Full session evaluation only
    if (metrics.completionRate >= 90) {
      strengths.push("Answered virtually every question without skipping");
    } else if (metrics.completionRate >= 75) {
      strengths.push("Completed the majority of questions");
    }

    if (metrics.focusWarningsCount === 0) {
      strengths.push("Maintained focus throughout the entire 15-minute session");
    }

    const answeredQuestions = metrics.attemptedQuestions - metrics.skippedQuestions;
    const avgTranscriptLength =
      questionEvents
        .filter((e) => !e.skipped)
        .reduce((sum, e) => sum + e.transcript.split(/\s+/).length, 0) / (answeredQuestions || 1);

    if (avgTranscriptLength > 0 && avgTranscriptLength < 60) {
      strengths.push("Kept answers focused and concise");
    }

    if (metrics.responseVariance < 8) {
      strengths.push("Maintained consistent pacing across responses");
    }
  } else if (
    session.sessionEndReason === "aborted_time" ||
    session.sessionEndReason === "aborted_manual"
  ) {
    // Partial session: conservative strengths
    if (metrics.attemptedQuestions >= 5) {
      strengths.push("Engaged with multiple interview questions");
    }
    if (metrics.focusWarningsCount === 0) {
      strengths.push("Maintained focus during your attempt");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // IMPROVEMENTS (context-aware)
  // ═══════════════════════════════════════════════════════════════

  const improvements: string[] = [];

  switch (session.sessionEndReason) {
    case "completed":
      if (metrics.skippedQuestions > 0) {
        improvements.push(
          `${metrics.skippedQuestions} question(s) were skipped—aim to answer all questions, even if briefly`
        );
      }

      const answeredQuestions = metrics.attemptedQuestions - metrics.skippedQuestions;
      const avgTranscriptLength =
        questionEvents
          .filter((e) => !e.skipped)
          .reduce((sum, e) => sum + e.transcript.split(/\s+/).length, 0) / (answeredQuestions || 1);

      if (answeredQuestions > 0 && avgTranscriptLength > 80) {
        improvements.push(
          `Many responses were verbose (avg ${Math.round(avgTranscriptLength)} words)—tighten to key point + example`
        );
      }

      if (metrics.responseVariance > 12) {
        improvements.push(
          "Response pacing varied significantly—aim for more consistent answer lengths"
        );
      }

      if (metrics.focusWarningsCount > 1) {
        improvements.push(
          "You had multiple focus warnings—minimize distractions in your next attempt"
        );
      }
      break;

    case "aborted_focus":
      improvements.push(
        "Focus violations ended this session—you must eliminate distractions to proceed"
      );
      improvements.push("Find a quiet, isolated space for your next attempt");
      improvements.push("Ensure fullscreen remains active and avoid tab switching");
      break;

    case "aborted_manual":
      improvements.push(
        "Manual exit prevented completion—commit to the full session in your next attempt"
      );
      improvements.push("Build interview stamina by pushing through the full 15 minutes");
      break;

    case "aborted_time":
      improvements.push("Time ran out—you need to answer more quickly to cover all questions");
      improvements.push("Practice keeping responses to 1–2 minutes per question");
      break;
  }

  // ═══════════════════════════════════════════════════════════════
  // NEXT FOCUS (actionable)
  // ═══════════════════════════════════════════════════════════════

  const nextFocus: string[] = [];

  switch (session.sessionEndReason) {
    case "completed":
      if (metrics.focusWarningsCount > 0) {
        nextFocus.push("Eliminate distractions—maintain perfect focus next time");
      }
      if (metrics.skippedQuestions > 0) {
        nextFocus.push("Prepare answers for skipped categories before your next session");
      }
      if (metrics.responseVariance > 10) {
        nextFocus.push("Standardize your answer length to 60–90 seconds");
      }
      nextFocus.push("Take another mock interview to reinforce progress");
      break;

    case "aborted_focus":
      nextFocus.push("CRITICAL: Resolve all focus violations before attempting again");
      nextFocus.push("Move to a distraction-free environment");
      nextFocus.push("Eliminate all browser tabs except this one");
      break;

    case "aborted_manual":
      nextFocus.push("Commit to the full 15-minute session next time");
      nextFocus.push("Build interview endurance with consecutive full sessions");
      break;

    case "aborted_time":
      nextFocus.push("Practice time management—aim for 90 seconds per question");
      nextFocus.push("Rehearse concise, well-structured answers");
      break;
  }

  return {
    strengths: strengths.length > 0 ? strengths : ["Session initiated"],
    improvements,
    nextFocus,
    snapshot,
  };
}

/**
 * Generate final report
 */
export function generateSessionReport(
  session: InterviewSession,
  totalQuestionsAvailable: number
): SessionReport {
  const metrics = computeSessionMetrics(session, totalQuestionsAvailable);
  const insights = generateSessionInsights(session, metrics);

  return {
    sessionEndReason: session.sessionEndReason,
    metrics,
    insights,
    validity: {
      isFullSession: metrics.isFullSession,
      isStatisticallyValid: metrics.isStatisticallyValid,
    },
  };
}
