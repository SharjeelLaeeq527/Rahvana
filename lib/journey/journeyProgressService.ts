import { createClient } from "@/lib/supabase/client";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

export interface JourneyProgressRecord {
  id: string;
  user_id: string;
  journey_id: string;
  current_stage: number;
  current_step: number;
  scenario_type_ir2?: "bio" | "step" | "adopted";
  completed_steps: string[];
  completed_steps_count?: number;
  total_steps_count?: number;
  collapsed_steps: Record<string, boolean>;
  role: "both" | "petitioner" | "beneficiary";
  filing_type: "online" | "paper" | "both";
  document_checklist: Record<string, boolean>;
  notes: Record<string, string>;
  started: boolean;
  started_at: string;
  last_updated_at: string;
  updated_at?: string;
  doc_uploads: Record<string, { name: string; size: number; lastModified: number }>;
  // New Journey Engine fields
  answers?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Helper to wrap thenable actions with a timeout to prevent infinite hangs in the UI.
 * Default timeout is 10 seconds.
 */
async function withTimeout<T>(
  promiseLike: Promise<T> | PromiseLike<T>,
  timeoutMs: number = 10000
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result as T;
  } catch (err) {
    clearTimeout(timeoutId!);
    throw err;
  }
}

function getFallbackTotalSteps(filingMethod?: string) {
  if (filingMethod === "online") return 31;
  if (filingMethod === "paper") return 27;
  return 34;
}

function resolveTotalSteps(record: { total_steps_count?: number | null; filing_method?: string }) {
  return record.total_steps_count && record.total_steps_count > 0
    ? record.total_steps_count
    : getFallbackTotalSteps(record.filing_method);
}

function caseDataRowsToValues(rows: Array<{ data_key: string; data_value: unknown }> = []) {
  return rows.reduce(
    (acc, item) => {
      acc[item.data_key] = item.data_value;
      return acc;
    },
    {} as Record<string, unknown>
  );
}

function isStepActiveForJourney(
  step: { visible_when?: Record<string, unknown> | null },
  filingMethod: string,
  caseData: Record<string, unknown>
) {
  const visibleWhen = (step.visible_when || {}) as Record<string, unknown>;
  const methodCondition = visibleWhen.filingMethod ?? visibleWhen.filing_method;

  if (Array.isArray(methodCondition) && !methodCondition.includes(filingMethod)) {
    return false;
  }

  if (typeof methodCondition === "string" && methodCondition !== filingMethod) {
    return false;
  }

  for (const [key, expectedValue] of Object.entries(visibleWhen)) {
    if (key === "filingMethod" || key === "filing_method" || key === "filingMethodConfirmed") {
      continue;
    }

    const actualValue = caseData[key];

    if (Array.isArray(expectedValue)) {
      if (!expectedValue.includes(actualValue)) return false;
      continue;
    }

    if (actualValue !== expectedValue) return false;
  }

  return true;
}

async function calculateActiveProgressFromSteps(
  supabase: ReturnType<typeof createClient>,
  journeyId: string,
  filingMethod: string
) {
  const [{ data: steps, error: stepsError }, { data: caseData, error: caseDataError }] =
    await Promise.all([
      supabase
        .from("steps")
        .select("id, status, visible_when, chapters!inner(journey_id)")
        .eq("chapters.journey_id", journeyId),
      supabase.from("case_data").select("data_key, data_value").eq("journey_id", journeyId),
    ]);

  if (stepsError || caseDataError) {
    throw stepsError || caseDataError;
  }

  const caseDataValues = caseDataRowsToValues(caseData || []);
  const activeSteps = (steps || []).filter((step: any) =>
    isStepActiveForJourney(step, filingMethod, caseDataValues)
  );

  return {
    completed_steps_count: activeSteps.filter((step: any) => step.status === "completed").length,
    total_steps_count: activeSteps.length,
  };
}

/**
 * Load journey progress from Supabase for a logged-in user.
 * Returns null if no progress exists yet.
 */
export async function loadJourneyProgress(
  userId: string,
  journeyId: string
): Promise<JourneyProgressRecord | null> {
  if (!userId) return null;

  try {
    const supabase = createClient();
    const { data, error } = await withTimeout<any>(
      supabase
        .from("journeys")
        .select("*")
        .eq("user_id", userId)
        .eq("journey_type", journeyId)
        .maybeSingle()
    );

    if (error) {
      console.error("[Journey] Failed to load progress:", error.message);
      return null;
    }

    if (!data) return null;

    let activeProgress = {
      completed_steps_count: data.completed_steps_count || 0,
      total_steps_count: resolveTotalSteps(data),
    };

    try {
      activeProgress = await calculateActiveProgressFromSteps(
        supabase,
        data.id,
        data.filing_method || "online"
      );
    } catch (progressError) {
      console.warn("[Journey] Failed to calculate active progress, using stored counts:", progressError);
    }

    // Map new table structure to JourneyProgressRecord interface
    const mapped: JourneyProgressRecord = {
      id: data.id,
      user_id: data.user_id,
      journey_id: data.journey_type, // Map journey_type to journey_id
      current_stage: 0,
      current_step: 0,
      completed_steps: Array(activeProgress.completed_steps_count || 0).fill(""),
      completed_steps_count: activeProgress.completed_steps_count || 0,
      total_steps_count: activeProgress.total_steps_count || resolveTotalSteps(data),
      collapsed_steps: {},
      role: "both",
      filing_type: data.filing_method || "online",
      document_checklist: {},
      notes: {},
      started: data.status !== "not_started",
      started_at: data.started_at || new Date().toISOString(),
      last_updated_at: data.updated_at,
      updated_at: data.updated_at,
      doc_uploads: {},
    };

    return mapped;
  } catch (error) {
    console.error("[Journey] loadJourneyProgress timed out or failed:", error);
    return null;
  }
}

/**
 * List all journey progress records for a user with minimal fields for performance.
 */
export async function listUserJourneys(userId: string): Promise<JourneyProgressRecord[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await withTimeout<any>(
      supabase
        .from("journeys")
        .select(
          "id, journey_type, completed_steps_count, total_steps_count, updated_at, filing_method"
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
    );

    if (error) {
      console.error("[Journey] Failed to list journeys:", error.message);
      return [];
    }

    // Map new table structure to JourneyProgressRecord interface
    const mappedData = await Promise.all(
      (data || []).map(async (record: any) => {
        let activeProgress = {
          completed_steps_count: record.completed_steps_count || 0,
          total_steps_count: resolveTotalSteps(record),
        };

        try {
          activeProgress = await calculateActiveProgressFromSteps(
            supabase,
            record.id,
            record.filing_method || "online"
          );
        } catch (progressError) {
          console.warn(
            "[Journey] Failed to calculate active progress, using stored counts:",
            progressError
          );
        }

        return {
          id: record.id,
          user_id: userId,
          journey_id: record.journey_type, // Map journey_type to journey_id for backward compatibility
          current_stage: 0,
          current_step: 0,
          completed_steps: Array(activeProgress.completed_steps_count || 0).fill(""), // Create array of appropriate length
          completed_steps_count: activeProgress.completed_steps_count || 0, // Include actual count
          total_steps_count: activeProgress.total_steps_count || resolveTotalSteps(record),
          collapsed_steps: {},
          role: "both" as const,
          filing_type: (record.filing_method || "online") as JourneyProgressRecord["filing_type"],
          document_checklist: {},
          notes: {},
          started: true,
          started_at: new Date().toISOString(),
          last_updated_at: record.updated_at, // Map updated_at to last_updated_at for compatibility
          updated_at: record.updated_at,
          doc_uploads: {},
        };
      })
    );

    return mappedData as JourneyProgressRecord[];
  } catch (error) {
    console.error("[Journey] listUserJourneys timed out or failed:", error);
    return [];
  }
}

/**
 * Delete all journey progress for a specific user.
 */
export async function deleteAllUserJourneys(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();

    // Fetch journey IDs before deletion to clean up interview sessions
    const { data: journeys } = await supabase.from("journeys").select("id").eq("user_id", userId);

    // Delete associated interview sessions BEFORE deleting journeys
    if (journeys && journeys.length > 0) {
      for (const j of journeys) {
        await supabase
          .from("interview_prep_sessions")
          .delete()
          .eq("journey_id", j.id)
          .eq("source", "journey");
      }
    }

    const { error } = await withTimeout<any>(
      supabase.from("journeys").delete().eq("user_id", userId)
    );

    if (error) {
      console.error("[Journey] Failed to delete all journeys:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Journey] deleteAllUserJourneys timed out or failed:", error);
    return false;
  }
}

/**
 * Save (upsert) journey progress to Supabase.
 * Uses ON CONFLICT (user_id, journey_type) to update existing record.
 * The new journeys table only tracks core progress fields.
 */
export async function saveJourneyProgress(
  userId: string,
  journeyId: string,
  state: WizardState
): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();

    // Calculate progress metrics
    const completedCount = state.completedSteps.size || 0;
    const totalCount = getFallbackTotalSteps(state.filingType);
    const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const payload = {
      user_id: userId,
      journey_type: journeyId,
      filing_method: state.filingType || "online",
      sponsor_structure: "individual", // Default, can be updated based on state if needed
      status: state.started ? "in_progress" : "not_started",
      completed_steps_count: completedCount,
      total_steps_count: totalCount,
      completion_percentage: completionPercentage,
      updated_at: new Date().toISOString(),
    };

    const { error } = await withTimeout<any>(
      supabase.from("journeys").upsert(payload, {
        onConflict: "user_id,journey_type",
      })
    );

    if (error) {
      console.error("[Journey] Failed to save progress:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Journey] saveJourneyProgress timed out or failed:", error);
    return false;
  }
}

/**
 * Delete journey progress (for "Start Fresh" functionality).
 * The journeyId can be either the UUID id or the journey_type (e.g., 'IR1', 'F1').
 */
export async function deleteJourneyProgress(userId: string, journeyId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();

    // Check if journeyId is a UUID (36 chars with dashes) or a journey type string
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      journeyId
    );

    // Fetch journey IDs before deletion to clean up interview sessions
    const fetchQuery = supabase.from("journeys").select("id").eq("user_id", userId);

    const { data: journeys } = await withTimeout<any>(
      isUUID ? fetchQuery.eq("id", journeyId) : fetchQuery.eq("journey_type", journeyId)
    );

    if (journeys && journeys.length > 0) {
      for (const j of journeys) {
        await supabase
          .from("interview_prep_sessions")
          .delete()
          .eq("journey_id", j.id)
          .eq("source", "journey");
      }
    }

    let query = supabase.from("journeys").delete().eq("user_id", userId);

    if (isUUID) {
      query = query.eq("id", journeyId);
    } else {
      query = query.eq("journey_type", journeyId);
    }

    const { error } = await withTimeout<any>(query);

    if (error) {
      console.error("[Journey] Failed to delete progress:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Journey] deleteJourneyProgress timed out or failed:", error);
    return false;
  }
}

/**
 * Convert a DB record back to WizardState format.
 */
export function recordToWizardState(record: JourneyProgressRecord): Partial<WizardState> {
  return {
    currentStage: record.current_stage,
    currentStep: record.current_step,
    scenarioType: record.scenario_type_ir2,
    completedSteps: new Set(record.completed_steps),
    collapsedSteps: record.collapsed_steps,
    role: record.role,
    filingType: record.filing_type,
    documentChecklist: record.document_checklist,
    notes: record.notes,
    started: record.started,
    docUploads: record.doc_uploads || {},
    answers: record.answers || {},
    metadata: record.metadata || {},
  };
}
